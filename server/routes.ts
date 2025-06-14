import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAgentSchema,
  insertWaitlistSchema,
  flowDataSchema,
} from "@shared/schema";
import { executeFlow } from "./agent-execution";
import { z } from "zod";
import { OAuth2Client } from 'google-auth-library';
import { stripe, PRICE_IDS } from './stripe';


// Helper to validate request body with Zod schema
function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Stripe webhook - MUST be defined BEFORE any JSON body parser middleware
  // This route needs raw body for signature verification
  app.post("/api/webhook/stripe", express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      return res.status(400).json({ message: 'Missing signature or webhook secret' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed:`, err.message);
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment was successful!', session);

        try {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId = parseInt(session.metadata?.userId || '0');

          if (userId > 0) {
            const priceId = subscription.items.data[0].price.id;

            // Map price ID to plan name
            let planName = 'Free';
            if (priceId === PRICE_IDS.PRO_MONTHLY) {
              planName = 'Pro Monthly';
            } else if (priceId === PRICE_IDS.PRO_YEARLY) {
              planName = 'Pro Yearly';
            } else if (priceId === PRICE_IDS.ENTERPRISE_MONTHLY) {
              planName = 'Enterprise Monthly';
            } else if (priceId === PRICE_IDS.ENTERPRISE_YEARLY) {
              planName = 'Enterprise Yearly';
            } else {
              // Fallback to nickname if available
              planName = subscription.items.data[0].price.nickname || 'Unknown Plan';
            }

            // Save subscription to database
            await storage.createSubscription({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              status: subscription.status,
              plan_name: planName,
              price_id: priceId,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
            });

            // Save payment history - use session amount if payment_intent is not available
            // Get plan name for payment description (reuse existing priceId variable)

            let paymentRecord = {
              user_id: userId,
              amount: session.amount_total || 0,
              currency: session.currency || 'usd',
              status: 'succeeded',
              description: `Subscription payment for ${planName}`,
            };

            if (session.payment_intent) {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
                paymentRecord = {
                  ...paymentRecord,
                  stripe_payment_intent_id: paymentIntent.id,
                  amount: paymentIntent.amount,
                  currency: paymentIntent.currency,
                  status: paymentIntent.status,
                };
              } catch (piError) {
                console.error('Error retrieving payment intent:', piError);
                // Use session ID as fallback
                paymentRecord.stripe_payment_intent_id = session.id;
              }
            } else {
              // Use session ID as payment reference when payment_intent is not available
              paymentRecord.stripe_payment_intent_id = session.id;
            }

            await storage.createPaymentHistory(paymentRecord);
            console.log('Payment history created:', paymentRecord);
          }
        } catch (error) {
          console.error('Error saving checkout session data:', error);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('Invoice payment succeeded!', invoice);

        try {
          // Try to get userId from subscription if not in metadata
          let userId = parseInt(invoice.metadata?.userId || '0');

          if (userId === 0 && invoice.subscription) {
            try {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              // Get user from subscription metadata or customer
              userId = parseInt(subscription.metadata?.userId || '0');
            } catch (subError) {
              console.error('Error retrieving subscription for user ID:', subError);
            }
          }

          if (userId > 0) {
            const paymentRecord = {
              user_id: userId,
              stripe_payment_intent_id: invoice.payment_intent as string || invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'succeeded',
              description: `Invoice payment for subscription ${invoice.subscription}`,
            };

            await storage.createPaymentHistory(paymentRecord);
            console.log('Invoice payment history created:', paymentRecord);
          } else {
            console.warn('Could not determine user ID for invoice:', invoice.id);
          }
        } catch (error) {
          console.error('Error saving invoice payment data:', error);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('Subscription updated webhook received:', {
          subscriptionId: updatedSubscription.id,
          status: updatedSubscription.status,
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
        });

        try {
          // Update subscription in database - ensure cancel_at_period_end is properly handled
          const updateData = {
            status: updatedSubscription.status,
            current_period_start: new Date(updatedSubscription.current_period_start * 1000),
            current_period_end: new Date(updatedSubscription.current_period_end * 1000),
            cancel_at_period_end: updatedSubscription.cancel_at_period_end === true,
          };
          
          console.log('Updating database with:', updateData);
          console.log('Subscription ID for update:', updatedSubscription.id);
          
          const dbUpdate = await storage.updateSubscription(updatedSubscription.id, updateData);
          
          console.log('Database subscription updated successfully:', {
            subscriptionId: updatedSubscription.id,
            cancelAtPeriodEnd: updateData.cancel_at_period_end,
            dbResult: dbUpdate
          });
          
          // Verify the update by fetching the subscription
          try {
            const verifyUpdate = await storage.getSubscriptionByUserId(parseInt(updatedSubscription.metadata?.userId || '0'));
            console.log('Verification check - subscription after update:', {
              cancel_at_period_end: verifyUpdate?.cancel_at_period_end,
              status: verifyUpdate?.status,
              updated_at: verifyUpdate?.updated_at
            });
          } catch (verifyError) {
            console.error('Error verifying update:', verifyError);
          }

          // If subscription is marked for cancellation, create a payment record
          if (updatedSubscription.cancel_at_period_end && !updatedSubscription.metadata?.cancellation_recorded) {
            let userId = parseInt(updatedSubscription.metadata?.userId || '0');
            
            if (userId > 0) {
              const planName = updatedSubscription.items.data[0].price.nickname || 'Current Plan';
              
              await storage.createPaymentHistory({
                user_id: userId,
                stripe_payment_intent_id: `cancel_scheduled_${updatedSubscription.id}_${Date.now()}`,
                amount: 0,
                currency: 'usd',
                status: 'pending_cancellation',
                description: `Subscription cancellation scheduled: ${planName} - Access continues until ${new Date(updatedSubscription.current_period_end * 1000).toLocaleDateString()}`,
              });
              
              console.log('Cancellation payment record created');
            }
          }

          // Check if this is a plan change and create payment record
          if (updatedSubscription.metadata?.plan_change === 'true') {
            const planName = updatedSubscription.items.data[0].price.nickname || 'Updated Plan';
            
            // Try to get userId from subscription metadata
            let userId = parseInt(updatedSubscription.metadata?.userId || '0');
            
            if (userId > 0) {
              await storage.createPaymentHistory({
                user_id: userId,
                stripe_payment_intent_id: `sub_update_${updatedSubscription.id}_${Date.now()}`,
                amount: 0, // Amount will be handled by separate invoice events
                currency: 'usd',
                status: 'succeeded',
                description: `Subscription updated to ${planName}`,
              });
            }
          }
        } catch (error) {
          console.error('Error updating subscription:', error);
          console.error('Error details:', error.message);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('Subscription deletion webhook received:', {
          subscriptionId: deletedSubscription.id,
          status: deletedSubscription.status,
          cancelAtPeriodEnd: deletedSubscription.cancel_at_period_end
        });

        try {
          // Update subscription status to canceled
          const updatedSub = await storage.updateSubscription(deletedSubscription.id, {
            status: 'canceled',
            cancel_at_period_end: false, // Reset since it's now actually canceled
          });
          
          console.log('Subscription updated in database:', updatedSub);
          
          // Create payment record for cancellation
          let userId = parseInt(deletedSubscription.metadata?.userId || '0');
          
          if (userId > 0) {
            const planName = deletedSubscription.items?.data?.[0]?.price?.nickname || 'Canceled Plan';
            
            const paymentRecord = await storage.createPaymentHistory({
              user_id: userId,
              stripe_payment_intent_id: `cancel_complete_${deletedSubscription.id}_${Date.now()}`,
              amount: 0,
              currency: 'usd',
              status: 'canceled',
              description: `Subscription fully canceled: ${planName}`,
            });
            
            console.log('Payment record created for cancellation:', paymentRecord);
          } else {
            console.warn('No user ID found in subscription metadata for cancellation tracking');
          }
        } catch (error) {
          console.error('Error updating cancelled subscription:', error);
          console.error('Error details:', error.message);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Save webhook event to prevent duplicate processing
    try {
      await storage.createWebhookEvent({
        stripe_event_id: event.id,
        event_type: event.type,
        processed: true,
      });
    } catch (error) {
      console.error('Error saving webhook event:', error);
    }

    res.json({ received: true });
  });

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = validateBody(insertUserSchema, req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const user = await storage.createUser(userData);

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google OAuth client initialization
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://aiagentstudio.ai/api/auth/google/callback'
  );

  // Google OAuth routes
  app.get("/api/auth/google", (req: Request, res: Response) => {

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to handle repeat sign-ins
    });

    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect('/?error=no_code');
      }

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect('/login?error=invalid_token');
      }

      const { email, name, picture } = payload;

      if (!email) {
        return res.redirect('/login?error=no_email');
      }

      // Check if user exists
      let existingUser = await storage.getUserByEmail(email);

      let user;
      if (!existingUser) {
        // Create new user
        user = await storage.createUser({
          email,
          username: email.split('@')[0],
          password: Math.random().toString(36).substring(2, 15), // Generate random password for OAuth users
        });
      } else {
        user = existingUser;
      }

      // Redirect to frontend with user data
      const userData = encodeURIComponent(JSON.stringify(user));
      res.redirect(`/?auth=success&user=${userData}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=oauth_failed');
    }
  });

  // Agent routes
  app.get("/api/agents", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const agents = await storage.getAgentsByUserId(userId);
      return res.status(200).json(agents);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid agent ID is required" });
      }

      const agent = await storage.getAgent(id);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      return res.status(200).json(agent);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/agents", async (req: Request, res: Response) => {
    try {
      const agentData = validateBody(insertAgentSchema, req.body);

      // Validate flow data
      try {
        flowDataSchema.parse(agentData.flow_data);
      } catch (error) {
        return res.status(400).json({ message: "Invalid flow data format" });
      }

      const agent = await storage.createAgent(agentData);
      return res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid agent ID is required" });
      }

      const updateData = req.body;

      // If flow_data is provided, validate it
      if (updateData.flow_data) {
        try {
          flowDataSchema.parse(updateData.flow_data);
        } catch (error) {
          return res.status(400).json({ message: "Invalid flow data format" });
        }
      }

      // If is_active is being set to true, generate a deployment URL
      if (updateData.is_active === true) {
        // Generate a unique ID for the deployment
        const deployId =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

        // Create a deploy URL using the hostname from the request
        const host = req.get("host") || "aiagent-studio.ai";
        const deployUrl = `https://${host}/agent/${deployId}`;

        // Add deploy information to update data
        updateData.deploy_id = deployId;
        updateData.deploy_url = deployUrl;
      }

      const updatedAgent = await storage.updateAgent(id, updateData);

      if (!updatedAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      return res.status(200).json(updatedAgent);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route to access a deployed agent
  app.get("/api/agent/:deployId", async (req: Request, res: Response) => {
    try {
      const { deployId } = req.params;

      if (!deployId) {
        return res
          .status(400)
          .json({ message: "Valid deployment ID is required" });
      }

      const agent = await storage.getAgentByDeployId(deployId);

      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      if (!agent.is_active) {
        return res
          .status(403)
          .json({ message: "Agent is not currently active" });
      }

      // Return a minimal version of the agent for public consumption
      return res.status(200).json({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        flow_data: agent.flow_data,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid agent ID is required" });
      }

      const success = await storage.deleteAgent(id);

      if (!success) {
        return res.status(404).json({ message: "Agent not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Execute agent with user input - this makes the AI agents real and functional
  app.post(
    "/api/agent/:deployId/execute",
    async (req: Request, res: Response) => {
      try {
        const { deployId } = req.params;
        const { input } = req.body;

        console.log(`Executing agent ${deployId} with input:`, input);

        if (!input) {
          return res.status(400).json({ message: "Input is required" });
        }

        const agent = await storage.getAgentByDeployId(deployId);

        if (!agent) {
          return res.status(404).json({ message: "Agent not found" });
        }

        if (!agent.is_active) {
          return res
            .status(403)
            .json({ message: "Agent is not currently active" });
        }

        // Parse and validate the flow data
        const flowData = flowDataSchema.parse(agent.flow_data);
        console.log(`Flow data parsed successfully for agent ${deployId}`);
        console.log(`Nodes: ${flowData.nodes.length}, Edges: ${flowData.edges.length}`);

        // Execute the agent's flow with the provided input
        const result = await executeFlow(flowData, input);

        console.log(`Agent execution completed:`, {
          success: !result.error,
          hasOutput: !!result.data,
          error: result.error
        });

        // Return the execution result
        return res.json({
          success: !result.error,
          output: result.data,
          error: result.error,
        });
      } catch (error) {
        console.error("Error executing agent:", error);
        return res.status(500).json({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error executing agent",
        });
      }
    },
  );

  // Direct test endpoint for OpenAI - a simplified way to test the AI integration
  app.post("/api/direct-test", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res
          .status(400)
          .json({ success: false, error: "Prompt is required" });
      }

      // Import the simplified test execution function
      const { testOpenAIExecution } = await import("./test-execution");

      // Execute the test directly
      const result = await testOpenAIExecution(prompt);
      return res.json(result);
    } catch (error) {
      console.error("Error in direct test:", error);
      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error in direct test",
      });
    }
  });

  // Generate and deploy a test agent (for demo purposes)
  app.post("/api/test-agent/create", async (req: Request, res: Response) => {
    try {
      // Import the test agent creation function
      const { createTestAgent } = await import("./test-agent");

      // Create a flow for the test agent
      const flow_data = createTestAgent();

      // Generate a readable deploy ID
      const deployId = "test-agent-" + Math.floor(1000 + Math.random() * 9000);

      // Create a deploy URL using the hostname from the request
      const host = req.get("host") || "aiagent-studio.ai";
      const deployUrl = `https://${host}/agent/${deployId}`;

      // Create a test agent in the database
      const agent = await storage.createAgent({
        user_id: 1, // Demo user ID
        name: "Reliable Content Assistant",
        description:
          "A helpful AI assistant using reliable Hugging Face models that can generate creative content based on your prompts.",
        flow_data,
        is_active: true,
        deploy_id: deployId,
        deploy_url: deployUrl,
      });

      return res.status(201).json({
        message: "Test agent created successfully",
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          deploy_id: deployId,
          deploy_url: deployUrl,
        },
      });
    } catch (error) {
      console.error("Error creating test agent:", error);
      return res.status(500).json({ message: "Failed to create test agent" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { priceId, userId, email } = req.body;

      if (!priceId || !userId || !email) {
        return res.status(400).json({ message: "Price ID, user ID, and email are required" });
      }

      // Validate price ID
      const validPriceIds = Object.values(PRICE_IDS).filter(Boolean);
      if (!validPriceIds.includes(priceId)) {
        return res.status(400).json({ message: "Invalid price ID" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.get('origin')}/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.get('origin')}/pricing`,
        customer_email: email,
        metadata: {
          userId: userId.toString(),
        },
      });

      res.json({ sessionId: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  app.post("/api/create-portal-session", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }

      // Check if customer exists first
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || customer.deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.get('origin')}/billing`,
        configuration: undefined, // Use default configuration
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      
      // Check if it's a configuration error
      if (error.message && error.message.includes('configuration')) {
        return res.status(400).json({ 
          message: 'Customer portal is not configured. Please configure your Stripe Customer Portal in the dashboard.',
          configurationRequired: true
        });
      }
      
      res.status(500).json({ message: 'Failed to create portal session' });
    }
  });

  // Update customer
  app.put("/api/customer/:customerId", async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const { invoice_settings } = req.body;

      const customer = await stripe.customers.update(customerId, {
        invoice_settings: invoice_settings || {}
      });

      res.json({ customer });
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Failed to update customer' });
    }
  });

  // Update subscription
  app.put("/api/subscription/:subscriptionId", async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      const { items, discounts, off_session, payment_behavior, proration_behavior, userId } = req.body;

      // Get current subscription before update
      const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const currentPlanName = currentSubscription.items.data[0].price.nickname || 'Current Plan';

      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items,
        discounts: discounts || [],
        off_session: off_session || false,
        payment_behavior: payment_behavior || 'error_if_incomplete',
        proration_behavior: proration_behavior || 'none'
      });

      // Create payment record for plan change
      if (userId && items && items.length > 0) {
        const newPriceId = items[0].price;
        const newPrice = await stripe.prices.retrieve(newPriceId);
        const newPlanName = newPrice.nickname || 'New Plan';
        
        // Calculate proration amount if applicable
        let prorationAmount = 0;
        if (proration_behavior === 'create_prorations') {
          // This would be calculated based on the difference in plan pricing
          // For now, we'll use 0 and let Stripe handle the actual billing
          prorationAmount = 0;
        }

        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          stripe_payment_intent_id: `plan_change_${subscriptionId}_${Date.now()}`,
          amount: prorationAmount,
          currency: subscription.currency || 'usd',
          status: 'succeeded',
          description: `Plan changed from ${currentPlanName} to ${newPlanName}`,
        });
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  });



  // Get user subscription
  app.get("/api/subscription/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const subscription = await storage.getSubscriptionByUserId(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user payment history
  app.get("/api/payment-history/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const paymentHistory = await storage.getPaymentHistoryByUserId(userId);
      return res.status(200).json(paymentHistory);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Waitlist route
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const { email } = validateBody(insertWaitlistSchema, req.body);

      // Check if email is already in waitlist
      const entries = await storage.getWaitlistEntries();
      const exists = entries.some((entry) => entry.email === email);

      if (exists) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const entry = await storage.addToWaitlist({ email });
      return res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update subscription
  app.put('/api/subscription/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const subscription = await stripe.subscriptions.update(id, updateData);

      res.json({ subscription });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Handle plan downgrades with payment tracking
  app.post('/api/subscription/:id/downgrade', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPriceId, userId } = req.body;

      if (!newPriceId || !userId) {
        return res.status(400).json({ error: 'New price ID and user ID are required' });
      }

      // Get current subscription details
      const currentSubscription = await stripe.subscriptions.retrieve(id);
      const currentPrice = currentSubscription.items.data[0].price;
      const currentPlanName = currentPrice.nickname || 'Current Plan';

      // Get new price details
      const newPrice = await stripe.prices.retrieve(newPriceId);
      
      // Map price ID to proper plan name
      let newPlanName = 'New Plan';
      if (newPriceId === PRICE_IDS.PRO_MONTHLY) {
        newPlanName = 'Pro Monthly';
      } else if (newPriceId === PRICE_IDS.PRO_YEARLY) {
        newPlanName = 'Pro Yearly';
      } else if (newPriceId === PRICE_IDS.ENTERPRISE_MONTHLY) {
        newPlanName = 'Enterprise Monthly';
      } else if (newPriceId === PRICE_IDS.ENTERPRISE_YEARLY) {
        newPlanName = 'Enterprise Yearly';
      } else if (newPrice.nickname) {
        newPlanName = newPrice.nickname;
      }

      // Update the subscription
      const subscription = await stripe.subscriptions.update(id, {
        items: [{
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update subscription in database
      await storage.updateSubscription(id, {
        status: subscription.status,
        plan_name: newPlanName,
        price_id: newPriceId,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      });

      // Create payment record for the downgrade
      await storage.createPaymentHistory({
        user_id: parseInt(userId),
        stripe_payment_intent_id: `downgrade_${id}_${Date.now()}`,
        amount: 0, // Proration will be handled in separate invoice
        currency: subscription.currency || 'usd',
        status: 'succeeded',
        description: `Plan downgraded from ${currentPlanName} to ${newPlanName}`,
      });

      res.json({
        success: true,
        subscription,
        message: `Successfully downgraded from ${currentPlanName} to ${newPlanName}`,
      });
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      res.status(500).json({ error: 'Failed to downgrade subscription' });
    }
  });

  // Cancel subscription (downgrade to free)
  app.post('/api/subscription/:id/cancel', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      console.log('Cancellation request received:', { subscriptionId: id, userId });

      // Get current subscription details before canceling
      const currentSubscription = await stripe.subscriptions.retrieve(id);
      console.log('Current subscription before cancellation:', {
        id: currentSubscription.id,
        status: currentSubscription.status,
        cancelAtPeriodEnd: currentSubscription.cancel_at_period_end
      });
      
      // Cancel the subscription at the end of the billing period
      const subscription = await stripe.subscriptions.update(id, {
        cancel_at_period_end: true,
        metadata: {
          ...currentSubscription.metadata,
          userId: userId?.toString() || currentSubscription.metadata?.userId,
          cancellation_requested: new Date().toISOString()
        }
      });

      console.log('Stripe subscription updated:', {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

      // Update the subscription status in your database
      const dbUpdate = await storage.updateSubscription(id, {
        status: subscription.status, // Keep current status, will be 'active' until period ends
        cancel_at_period_end: true,
        current_period_end: new Date(subscription.current_period_end * 1000),
      });
      
      console.log('Database update result:', dbUpdate);

      // Create a payment record for the cancellation
      if (userId) {
        const planName = currentSubscription.items.data[0].price.nickname || 'Unknown Plan';
        
        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          stripe_payment_intent_id: `cancel_scheduled_${id}_${Date.now()}`,
          amount: 0, // Cancellation doesn't involve a charge
          currency: 'usd',
          status: 'pending_cancellation',
          description: `Subscription cancellation scheduled: ${planName} - Access continues until ${new Date(currentSubscription.current_period_end * 1000).toLocaleDateString()}`,
        });
      }

      res.json({ 
        success: true, 
        subscription,
        message: 'Subscription cancelled successfully. Access will continue until the end of the billing period.' 
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}