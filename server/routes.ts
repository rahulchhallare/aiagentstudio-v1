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
import { razorpay, PLAN_IDS, PLAN_PRICING } from './razorpay';
import crypto from 'crypto';


// Helper to validate request body with Zod schema
function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Razorpay webhook - MUST be defined BEFORE any JSON body parser middleware
  app.post("/api/webhook/razorpay", express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !signature) {
      return res.status(400).json({ message: 'Missing webhook secret or signature' });
    }

    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }

      const event = JSON.parse(req.body.toString());
      console.log('Razorpay webhook received:', event.event);

      // Handle the event
      switch (event.event) {
        case 'payment.captured':
          const payment = event.payload.payment.entity;
          console.log('Payment captured:', payment);

          try {
            const userId = parseInt(payment.notes?.userId || '0');

            if (userId > 0) {
              // Create payment history record
              await storage.createPaymentHistory({
                user_id: userId,
                razorpay_payment_id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: 'succeeded',
                description: `Payment for ${payment.description || 'subscription'}`,
              });

              console.log('Payment history created for payment:', payment.id);
            }
          } catch (error) {
            console.error('Error saving payment data:', error);
          }
          break;

        case 'subscription.charged':
          const subscription = event.payload.subscription.entity;
          const paymentEntity = event.payload.payment.entity;
          console.log('Subscription charged:', subscription);

          try {
            const userId = parseInt(subscription.notes?.userId || '0');

            if (userId > 0) {
              // Map plan ID to plan name
              let planName = 'Unknown Plan';
              if (subscription.plan_id === PLAN_IDS.PRO_MONTHLY) {
                planName = 'Pro Monthly';
              } else if (subscription.plan_id === PLAN_IDS.PRO_YEARLY) {
                planName = 'Pro Yearly';
              } else if (subscription.plan_id === PLAN_IDS.ENTERPRISE_MONTHLY) {
                planName = 'Enterprise Monthly';
              } else if (subscription.plan_id === PLAN_IDS.ENTERPRISE_YEARLY) {
                planName = 'Enterprise Yearly';
              }

              // Update or create subscription record
              await storage.createSubscription({
                user_id: userId,
                razorpay_subscription_id: subscription.id,
                razorpay_customer_id: subscription.customer_id,
                status: subscription.status,
                plan_name: planName,
                plan_id: subscription.plan_id,
                price_id: subscription.plan_id, // Add price_id field
                current_period_start: new Date(subscription.current_start * 1000),
                current_period_end: new Date(subscription.current_end * 1000),
              });

              // Create payment record
              await storage.createPaymentHistory({
                user_id: userId,
                razorpay_payment_id: paymentEntity.id,
                amount: paymentEntity.amount,
                currency: paymentEntity.currency,
                status: 'succeeded',
                description: `Subscription payment for ${planName}`,
              });

              console.log('Subscription and payment records created');
            }
          } catch (error) {
            console.error('Error saving subscription charge data:', error);
          }
          break;

        case 'subscription.cancelled':
          const cancelledSub = event.payload.subscription.entity;
          console.log('Subscription cancelled:', cancelledSub);

          try {
            // Update subscription status
            await storage.updateSubscription(cancelledSub.id, {
              status: 'cancelled',
              cancel_at_period_end: false,
            });

            console.log('Subscription cancelled in database:', cancelledSub.id);
          } catch (error) {
            console.error('Error updating cancelled subscription:', error);
          }
          break;

        default:
          console.log(`Unhandled Razorpay event type: ${event.event}`);
      }

      // Save webhook event to prevent duplicate processing
      try {
        await storage.createWebhookEvent({
          razorpay_event_id: event.payload.payment?.entity?.id || event.payload.subscription?.entity?.id || 'unknown',
          event_type: event.event,
          processed: true,
        });
      } catch (error) {
        console.error('Error saving webhook event:', error);
      }

      res.json({ status: 'ok' });
    } catch (error: any) {
      console.error('Razorpay webhook error:', error);
      res.status(400).json({ message: 'Webhook processing failed' });
    }
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

  // Razorpay payment routes
  app.post("/api/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { planId, userId, email } = req.body;

      if (!planId || !userId || !email) {
        return res.status(400).json({ message: "Plan ID, user ID, and email are required" });
      }

      // Validate plan ID - accept actual Razorpay plan IDs and mapped formats
      const validPlanIds = [
        ...Object.values(PLAN_IDS).filter(Boolean),
        'plan_pro_monthly',
        'plan_pro_yearly', 
        'plan_enterprise_monthly',
        'plan_enterprise_yearly',
        'plan_QhReRFpIgKH7uT', // Actual pro monthly plan ID
        'pro-monthly',
        'pro-yearly',
        'enterprise-monthly', 
        'enterprise-yearly'
      ];
      
      if (!validPlanIds.includes(planId)) {
        console.log('Invalid plan ID received:', planId);
        console.log('Valid plan IDs:', validPlanIds);
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Get plan pricing - handle both original and mapped plan IDs
      let amount = 0;
      if (planId === PLAN_IDS.PRO_MONTHLY || planId === 'plan_pro_monthly' || planId === 'plan_QhReRFpIgKH7uT' || planId === 'pro-monthly') {
        amount = PLAN_PRICING.PRO_MONTHLY;
      } else if (planId === PLAN_IDS.PRO_YEARLY || planId === 'plan_pro_yearly' || planId === 'pro-yearly') {
        amount = PLAN_PRICING.PRO_YEARLY;
      } else if (planId === PLAN_IDS.ENTERPRISE_MONTHLY || planId === 'plan_enterprise_monthly' || planId === 'enterprise-monthly') {
        amount = PLAN_PRICING.ENTERPRISE_MONTHLY;
      } else if (planId === PLAN_IDS.ENTERPRISE_YEARLY || planId === 'plan_enterprise_yearly' || planId === 'enterprise-yearly') {
        amount = PLAN_PRICING.ENTERPRISE_YEARLY;
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount, // Amount in paise
        currency: 'INR',
        receipt: `order_${userId}_${Date.now()}`,
        notes: {
          userId: userId.toString(),
          planId: planId,
          email: email,
        },
      });

      res.json({ 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  // Verify payment
  app.post("/api/verify-payment", async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Get payment details
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      const order = await razorpay.orders.fetch(razorpay_order_id);

      if (payment.status === 'captured') {
        // Map plan ID to plan name
        let planName = 'Unknown Plan';
        const planId = order.notes.planId;
        if (planId === PLAN_IDS.PRO_MONTHLY) {
          planName = 'Pro Monthly';
        } else if (planId === PLAN_IDS.PRO_YEARLY) {
          planName = 'Pro Yearly';
        } else if (planId === PLAN_IDS.ENTERPRISE_MONTHLY) {
          planName = 'Enterprise Monthly';
        } else if (planId === PLAN_IDS.ENTERPRISE_YEARLY) {
          planName = 'Enterprise Yearly';
        }

        // Calculate subscription period
        const now = new Date();
        const periodEnd = new Date(now);
        if (planId?.includes('yearly')) {
          periodEnd.setFullYear(now.getFullYear() + 1);
        } else {
          periodEnd.setMonth(now.getMonth() + 1);
        }

        // Save subscription to database
        await storage.createSubscription({
          user_id: parseInt(userId),
          razorpay_subscription_id: payment.id, // Use payment ID as subscription ID for now
          razorpay_customer_id: payment.customer_id || 'unknown',
          status: 'active',
          plan_name: planName,
          plan_id: planId,
          price_id: planId, // Add price_id field (same as plan_id for Razorpay)
          current_period_start: now,
          current_period_end: periodEnd,
        });

        // Save payment history
        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          razorpay_payment_id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: 'succeeded',
          description: `Subscription payment for ${planName}`,
        });

        res.json({ success: true, message: 'Payment verified successfully' });
      } else {
        res.status(400).json({ message: 'Payment not captured' });
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ message: 'Failed to verify payment' });
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

      // First get the subscription details to find the correct ID
      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));
      
      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Use the actual subscription ID from the database
      const subscriptionIdToUpdate = subscription.razorpay_subscription_id || subscription.stripe_subscription_id || id;
      
      console.log('Using subscription ID for update:', subscriptionIdToUpdate);

      // Update the subscription status in database
      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: 'active', // Keep active until period ends
        cancel_at_period_end: true,
      });

      console.log('Database update result:', dbUpdate);

      // Create a payment record for the cancellation
      if (userId) {
        // Convert current_period_end to Date if it's a string
        let periodEndDate = subscription.current_period_end;
        if (typeof periodEndDate === 'string') {
          periodEndDate = new Date(periodEndDate);
        }
        
        const formattedEndDate = periodEndDate instanceof Date && !isNaN(periodEndDate.getTime()) 
          ? periodEndDate.toLocaleDateString() 
          : 'end of billing period';

        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          razorpay_payment_id: `cancel_scheduled_${subscriptionIdToUpdate}_${Date.now()}`,
          amount: 0, // Cancellation doesn't involve a charge
          currency: 'inr',
          status: 'pending_cancellation',
          description: `Subscription cancellation scheduled: ${subscription.plan_name} - Access continues until ${formattedEndDate}`,
        });
      }

      res.json({ 
        success: true, 
        subscription: dbUpdate,
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