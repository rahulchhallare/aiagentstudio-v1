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

// Helper function to map Razorpay plan ID to plan name
function getPlanNameFromId(planId: string): string {
  if (planId === PLAN_IDS.PRO_MONTHLY) {
    return 'Pro Monthly';
  } else if (planId === PLAN_IDS.PRO_YEARLY) {
    return 'Pro Yearly';
  } else if (planId === PLAN_IDS.ENTERPRISE_MONTHLY) {
    return 'Enterprise Monthly';
  } else if (planId === PLAN_IDS.ENTERPRISE_YEARLY) {
    return 'Enterprise Yearly';
  }
  return 'Unknown Plan';
}


import { razorpay, PLAN_IDS, PLAN_PRICING, getRazorpayPlanPricing } from './razorpay';
import { createPaymentLink, createPaymentOrder } from './payment-links';
import { createManualSubscriptionPayment, verifyManualPayment } from './manual-payment';
import crypto from 'crypto';
import axios from 'axios';


// Helper to validate request body with Zod schema
function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

// Function to fetch live plan pricing
async function getPlanPricing(): Promise<{
  PRO_MONTHLY: number;
  PRO_YEARLY: number;
  ENTERPRISE_MONTHLY: number;
  ENTERPRISE_YEARLY: number;
}> {
  try {
    // Fetch current exchange rates from a reliable API
    const response = await axios.get(
      `https://open.er-api.com/v6/latest/USD`
    );
    const exchangeRates = response.data.rates;
    const inrRate = exchangeRates.INR;

    // Adjust plan pricing based on current exchange rate (example)
    const PRO_MONTHLY = Math.round(29 * inrRate * 100); // $29 USD
    const PRO_YEARLY = Math.round(299 * inrRate * 100); // $299 USD
    const ENTERPRISE_MONTHLY = Math.round(99 * inrRate * 100); // $99 USD
    const ENTERPRISE_YEARLY = Math.round(999 * inrRate * 100); // $999 USD

    return {
      PRO_MONTHLY,
      PRO_YEARLY,
      ENTERPRISE_MONTHLY,
      ENTERPRISE_YEARLY,
    };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Return default pricing in case of API failure
    return PLAN_PRICING;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test webhook endpoint
  app.get('/api/webhook/test', (req: Request, res: Response) => {
    res.json({
      status: 'success',
      message: 'Webhook endpoint is working correctly',
      timestamp: new Date().toISOString(),
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhook/razorpay`
    });
  });

  // Razorpay webhook - MUST be defined BEFORE any JSON body parser middleware
  app.post("/api/webhook/razorpay", express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim().replace(/\s+/g, '');
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !signature) {
      return res.status(400).json({ message: 'Missing webhook secret or signature' });
    }

    try {
      // Verify webhook signature
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString)
        .digest('hex');

      if (expectedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }

      // Parse the webhook body - handle different body formats
      let event;
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString('utf8'));
      } else if (typeof req.body === 'string') {
        event = JSON.parse(req.body);
      } else if (typeof req.body === 'object' && req.body !== null) {
        event = req.body; // Already parsed object
      } else {
        throw new Error('Invalid webhook body format');
      }
      console.log('Razorpay webhook received:', event.event, 'Event ID:', event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id);

      // Check if this event was already processed
      const existingEvent = await storage.getWebhookEventById(event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || 'unknown');
      if (existingEvent) {
        console.log('Event already processed, skipping:', event.event);
        return res.json({ status: 'already_processed' });
      }

      // Handle the event
      switch (event.event) {
        case 'payment.authorized':
        case 'payment.captured':
          const payment = event.payload.payment.entity;
          console.log('Payment processed:', event.event, payment.id);

          try {
            // Try to get userId from payment notes first, then from order if available
            let userId = parseInt(payment.notes?.userId || '0');
            
            // If no userId in payment notes, try to get from order
            if (userId === 0 && payment.order_id) {
              try {
                const order = await razorpay.orders.fetch(payment.order_id);
                userId = parseInt(order.notes?.userId || '0');
                console.log('Retrieved userId from order:', userId);
              } catch (orderError) {
                console.error('Error fetching order for userId:', orderError);
              }
            }

            if (userId > 0) {
              // Create payment history record for both authorized and captured payments
              if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
                try {
                  await storage.createPaymentHistory({
                    user_id: userId,
                    razorpay_payment_id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: event.event === 'payment.captured' ? 'succeeded' : 'pending',
                    description: `Payment for ${payment.description || planName || 'subscription'}`,
                  });

                  console.log('Payment history created for payment:', payment.id, 'Event:', event.event);
                } catch (paymentHistoryError) {
                  console.error('Error creating payment history:', paymentHistoryError);
                  // Don't throw - continue with subscription processing
                }
              }

              // Handle subscription upgrade for both authorized and captured payments
              const existingSubscription = await storage.getSubscriptionByUserId(userId);
              let planName = '';
              let planId = '';
              
              // Determine plan based on payment amount with more flexible matching
              if (payment.amount >= 490000 && payment.amount <= 510000) { // ₹4900-5100 = Enterprise Monthly
                planName = 'Enterprise Monthly';
                planId = PLAN_IDS.ENTERPRISE_MONTHLY;
              } else if (payment.amount >= 99000 && payment.amount <= 101000) { // ₹990-1010 = Pro Monthly
                planName = 'Pro Monthly';
                planId = PLAN_IDS.PRO_MONTHLY;
              } else if (payment.amount >= 990000 && payment.amount <= 1010000) { // ₹9900-10100 = Pro Yearly
                planName = 'Pro Yearly';
                planId = PLAN_IDS.PRO_YEARLY;
              } else if (payment.amount >= 4990000 && payment.amount <= 5010000) { // ₹49900-50100 = Enterprise Yearly
                planName = 'Enterprise Yearly';
                planId = PLAN_IDS.ENTERPRISE_YEARLY;
              } else {
                // Fallback: check payment notes or description for plan details
                const notes = payment.notes || {};
                const description = payment.description || '';
                
                if (notes.planName) {
                  planName = notes.planName;
                  planId = notes.planId || '';
                } else if (description.toLowerCase().includes('enterprise monthly')) {
                  planName = 'Enterprise Monthly';
                  planId = PLAN_IDS.ENTERPRISE_MONTHLY;
                } else if (description.toLowerCase().includes('enterprise yearly')) {
                  planName = 'Enterprise Yearly';
                  planId = PLAN_IDS.ENTERPRISE_YEARLY;
                } else if (description.toLowerCase().includes('pro monthly')) {
                  planName = 'Pro Monthly';
                  planId = PLAN_IDS.PRO_MONTHLY;
                } else if (description.toLowerCase().includes('pro yearly')) {
                  planName = 'Pro Yearly';
                  planId = PLAN_IDS.PRO_YEARLY;
                }
              }
              
              if (planName && planId) {
                console.log('Processing payment for plan:', planName, 'Amount:', payment.amount, 'Event:', event.event, 'User ID:', userId);
                
                if (existingSubscription) {
                  // Update existing subscription
                  const updatedSub = await storage.updateSubscription(existingSubscription.razorpay_subscription_id || existingSubscription.stripe_subscription_id || `manual_${userId}`, {
                    status: 'active',
                    plan_name: planName,
                    plan_id: planId,
                    price_id: planId,
                    current_period_start: new Date(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    updated_at: new Date()
                  });
                  
                  console.log('Subscription updated to:', planName, 'for user:', userId);
                } else {
                  // Create new subscription
                  const newSubscription = await storage.createSubscription({
                    user_id: userId,
                    razorpay_subscription_id: `manual_${payment.id}`,
                    razorpay_customer_id: payment.customer_id || '',
                    status: 'active',
                    plan_name: planName,
                    plan_id: planId,
                    price_id: planId,
                    current_period_start: new Date(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                  });
                  
                  console.log('New subscription created:', planName, 'for user:', userId);
                }
              } else {
                console.log('Could not determine plan for payment amount:', payment.amount);
              }
            } else {
              console.error('No valid userId found for payment:', payment.id);
            }
          } catch (error) {
            console.error('Error processing payment:', error);
          }
          break;

        case 'subscription.charged':
          const subscription = event.payload.subscription.entity;
          const paymentEntity = event.payload.payment.entity;
          console.log('Subscription charged:', subscription.id, 'Payment:', paymentEntity.id);

          try {
            const userId = parseInt(subscription.notes?.userId || '0');

            if (userId > 0) {
              // Map plan ID to plan name
              const planName = getPlanNameFromId(subscription.plan_id);

              // Check if subscription already exists
              const existingSubscription = await storage.getSubscriptionByUserId(userId);

              if (existingSubscription && existingSubscription.razorpay_subscription_id === subscription.id) {
                console.log('Subscription already exists, updating payment history only');

                // Create payment record only
                await storage.createPaymentHistory({
                  user_id: userId,
                  razorpay_payment_id: paymentEntity.id,
                  amount: paymentEntity.amount,
                  currency: paymentEntity.currency,
                  status: 'succeeded',
                  description: `Subscription renewal payment for ${planName}`,
                });
              } else {
                // Create new subscription
                await storage.createSubscription({
                  user_id: userId,
                  razorpay_subscription_id: subscription.id,
                  razorpay_customer_id: subscription.customer_id,
                  status: subscription.status,
                  plan_name: planName,
                  plan_id: subscription.plan_id,
                  price_id: subscription.plan_id,
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
              }

              console.log('Subscription and payment processing completed for user:', userId);
            } else {
              console.error('Invalid userId in subscription notes:', subscription.notes?.userId);
            }
          } catch (error) {
            console.error('Error saving subscription charge data:', error);
            // Don't throw error - webhook should still succeed
          }
          break;

  // Debug endpoint for subscription troubleshooting
  app.get('/api/debug/subscription/:subscriptionId', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      
      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan_id: subscription.plan_id,
          customer_id: subscription.customer_id,
          short_url: subscription.short_url,
          authenticate_url: subscription.authenticate_url,
          current_start: subscription.current_start,
          current_end: subscription.current_end,
          charge_at: subscription.charge_at,
          created_at: subscription.created_at,
          start_at: subscription.start_at,
          customer_notify: subscription.customer_notify,
          total_count: subscription.total_count,
          paid_count: subscription.paid_count,
          remaining_count: subscription.remaining_count,
          has_scheduled_changes: subscription.has_scheduled_changes,
          offer_id: subscription.offer_id
        }
      });
    } catch (error: any) {
      console.error('Error fetching subscription for debug:', error);
      res.status(400).json({ 
        error: error.message,
        code: error.error?.code,
        description: error.error?.description
      });
    }
  });

  // Compare subscription creation methods
  app.post('/api/debug/create-subscription-like-manual', async (req: Request, res: Response) => {
    try {
      const { planId, userId, email } = req.body;

      if (!planId || !userId || !email) {
        return res.status(400).json({ message: "Plan ID, user ID, and email are required" });
      }

      // Map frontend plan IDs to actual Razorpay plan IDs (same as main endpoint)
      let actualRazorpayPlanId: string;
      switch (planId) {
        case 'pro-monthly':
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          break;
        case 'pro-yearly':
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          break;
        case 'enterprise-monthly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          break;
        case 'enterprise-yearly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Create customer first
      const customer = await razorpay.customers.create({
        name: email.split('@')[0],
        email: email,
        contact: '',
        notes: {
          userId: userId.toString()
        }
      });

      // Create subscription with minimal settings (like manual creation)
      const subscription = await razorpay.subscriptions.create({
        plan_id: actualRazorpayPlanId,
        customer_id: customer.id,
        quantity: 1,
        customer_notify: 1,
        notes: {
          userId: userId.toString(),
          email: email,
        }
      });

      res.json({
        subscription_id: subscription.id,
        status: subscription.status,
        short_url: subscription.short_url,
        authenticate_url: subscription.authenticate_url,
        created_via: 'minimal_api_call',
        comparison_note: 'This mimics manual dashboard creation with minimal parameters'
      });
    } catch (error: any) {
      console.error('Error creating minimal subscription:', error);
      res.status(400).json({ 
        error: error.message,
        code: error.error?.code,
        description: error.error?.description
      });
    }
  });

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

      // Map frontend plan IDs to actual Razorpay plan IDs
      let actualRazorpayPlanId: string;
      switch (planId) {
        case 'pro-monthly':
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          break;
        case 'pro-yearly':
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          break;
        case 'enterprise-monthly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          break;
        case 'enterprise-yearly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ message: "Invalid plan ID. Supported plans: pro-monthly, pro-yearly, enterprise-monthly, enterprise-yearly" });
      }

      // Validate that we have a valid Razorpay plan ID from environment
      if (!actualRazorpayPlanId) {
        console.error(`Missing Razorpay plan ID for ${planId}. Check your environment variables.`);
        return res.status(500).json({ message: "Plan configuration error. Please contact support." });
      }

      console.log(`Creating subscription for plan: ${planId} -> Razorpay ID: ${actualRazorpayPlanId}`);

      // Create or get customer
      let customer;
      try {
        // Try to find existing customer by email
        const customers = await razorpay.customers.all({ email: email });
        if (customers.items && customers.items.length > 0) {
          customer = customers.items[0];
          console.log('Found existing customer:', customer.id);
        } else {
          throw new Error('No existing customer found');
        }
      } catch (error) {
        // Create new customer if not found
        customer = await razorpay.customers.create({
          name: email.split('@')[0],
          email: email,
          contact: '',
          notes: {
            userId: userId.toString()
          }
        });
        console.log('Created new customer:', customer.id);
      }

      // Verify plan exists before creating subscription
      try {
        await razorpay.plans.fetch(actualRazorpayPlanId);
      } catch (planError: any) {
        console.error(`Plan ${actualRazorpayPlanId} not found:`, planError);
        return res.status(400).json({ 
          message: `Plan configuration error: ${planId}. Please contact support.`,
          error: 'PLAN_NOT_FOUND'
        });
      }

      // Create success and failure URLs
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("host")?.includes("replit.dev") ? "https" : "http";
      const successUrl = `${protocol}://${host}/billing?subscription_success=true`;
      const failureUrl = `${protocol}://${host}/pricing?subscription_failed=true`;

      // Create Razorpay subscription
      console.log('Creating subscription with plan ID:', actualRazorpayPlanId, 'for customer:', customer.id);
      
      const subscription = await razorpay.subscriptions.create({
        plan_id: actualRazorpayPlanId,
        customer_id: customer.id,
        quantity: 1,
        total_count: 120, // 10 years worth of billing cycles
        customer_notify: 1, // Enable customer notifications
        addons: [],
        notes: {
          userId: userId.toString(),
          planId: actualRazorpayPlanId,
          originalPlanId: planId,
          email: email,
        },
        offer_id: undefined, // Explicitly set to avoid issues
        start_at: Math.floor(Date.now() / 1000) + 300 // Start 5 minutes from now to allow processing
      });

      console.log('Created Razorpay subscription:', subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Subscription short_url:', subscription.short_url);
      console.log('Subscription authenticate_url:', subscription.authenticate_url);
      console.log('Subscription customer_id:', subscription.customer_id);
      console.log('Subscription plan_id:', subscription.plan_id);

      // Check if subscription needs authentication
      if (subscription.status === 'created' && !subscription.short_url) {
        console.warn('Subscription created but no hosted page URL available');
        // Try to fetch the subscription again to get updated URLs
        try {
          const fetchedSub = await razorpay.subscriptions.fetch(subscription.id);
          console.log('Fetched subscription short_url:', fetchedSub.short_url);
          console.log('Fetched subscription authenticate_url:', fetchedSub.authenticate_url);
          
          // If we got a URL from the refetch, use it
          if (fetchedSub.short_url) {
            subscription.short_url = fetchedSub.short_url;
          }
          if (fetchedSub.authenticate_url) {
            subscription.authenticate_url = fetchedSub.authenticate_url;
          }
        } catch (fetchError) {
          console.error('Error fetching subscription:', fetchError);
        }
      }

      // Check if hosted page is available and working by testing the URL
      let hostedPageWorking = false;
      if (subscription.short_url) {
        try {
          // Simple check - if we have a URL, assume it might work
          // But we'll implement fallback anyway due to the recurring issues
          hostedPageWorking = true;
          console.log('Hosted page URL available:', subscription.short_url);
        } catch (error) {
          console.error('Hosted page validation failed:', error);
          hostedPageWorking = false;
        }
      }

      // Force use of payment link fallback due to recurring hosted page issues
      if (!subscription.short_url || !hostedPageWorking) {
        console.error('No hosted page URL available for subscription:', subscription.id);
        console.log('Trying alternative subscription creation method...');
        
        try {
          // Cancel the problematic subscription
          await razorpay.subscriptions.cancel(subscription.id);
          
          // Create a new subscription with minimal parameters (like manual creation)
          const simpleSubscription = await razorpay.subscriptions.create({
            plan_id: actualRazorpayPlanId,
            customer_id: customer.id,
            customer_notify: 1,
            notes: {
              userId: userId.toString(),
              email: email,
            }
          });
          
          console.log('Alternative subscription created:', simpleSubscription.id);
          console.log('Alternative subscription short_url:', simpleSubscription.short_url);
          
          if (simpleSubscription.short_url || simpleSubscription.authenticate_url) {
            // Use the alternative subscription
            return res.json({ 
              subscriptionId: simpleSubscription.id,
              customerId: customer.id,
              amount: simpleSubscription.plan?.amount || 0,
              currency: 'INR',
              status: simpleSubscription.status,
              short_url: simpleSubscription.short_url || simpleSubscription.authenticate_url,
              authenticate_url: simpleSubscription.authenticate_url,
              success_url: `${protocol}://${host}/billing?subscription_success=true&subscription_id=${simpleSubscription.id}`,
              failure_url: failureUrl,
              method_used: 'alternative_creation',
              debug: {
                plan_id: actualRazorpayPlanId,
                has_short_url: !!simpleSubscription.short_url,
                has_authenticate_url: !!simpleSubscription.authenticate_url,
                original_failed: true
              }
            });
          }
        } catch (alternativeError) {
          console.error('Alternative subscription creation also failed:', alternativeError);
        }
        
        // Create a payment link as final fallback
        try {
          console.log('Creating payment link fallback...');
          const plan = await razorpay.plans.fetch(actualRazorpayPlanId);
          const planAmount = plan.item.amount; // Amount in paise
          
          const paymentLink = await createPaymentLink(
            actualRazorpayPlanId,
            customer.id,
            planAmount,
            'INR',
            `Subscription: ${getPlanNameFromId(actualRazorpayPlanId)}`,
            `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
            `${protocol}://${host}/pricing?subscription_failed=true`
          );
          
          console.log('Payment link created:', paymentLink.short_url);
          
          return res.json({
            subscriptionId: subscription.id,
            customerId: customer.id,
            amount: planAmount,
            currency: 'INR',
            status: subscription.status,
            short_url: paymentLink.short_url,
            payment_link_id: paymentLink.id,
            payment_method: 'payment_link_fallback',
            success_url: `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
            failure_url: failureUrl,
            message: 'Payment link created as fallback',
            debug: {
              plan_id: actualRazorpayPlanId,
              payment_link_used: true,
              fallback_used: true
            }
          });
        } catch (paymentLinkError) {
          console.error('Payment link creation failed:', paymentLinkError);
          
          // Final fallback - redirect to billing page with manual payment instructions
          const manualUrl = `${protocol}://${host}/billing?subscription_id=${subscription.id}&manual_payment=true`;
          
          return res.json({
            subscriptionId: subscription.id,
            customerId: customer.id,
            amount: subscription.plan?.amount || 0,
            currency: 'INR',
            status: subscription.status,
            short_url: manualUrl,
            payment_method: 'manual_instructions',
            success_url: `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
            failure_url: failureUrl,
            message: 'Please complete payment manually via billing page',
            debug: {
              plan_id: actualRazorpayPlanId,
              manual_payment_required: true,
              all_fallbacks_used: true
            }
          });
        }
      }

      // For Razorpay hosted checkout, we need to configure the success and failure URLs
      // This is done by updating the hosted checkout page configuration
      try {
        // Update the subscription with callback URLs if possible
        // Note: Razorpay hosted checkout redirects are configured in the dashboard
        // We'll rely on webhook for payment confirmation and URL params for success tracking
      } catch (updateError) {
        console.log('Note: Callback URLs should be configured in Razorpay dashboard');
      }

      // Always try payment link as primary method due to hosted page reliability issues
      try {
        console.log('Creating payment link as primary method...');
        const plan = await razorpay.plans.fetch(actualRazorpayPlanId);
        const planAmount = plan.item.amount; // Amount in paise
        
        const paymentLink = await createPaymentLink(
          actualRazorpayPlanId,
          customer.id,
          planAmount,
          'INR',
          `Subscription: ${getPlanNameFromId(actualRazorpayPlanId)}`,
          `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
          `${protocol}://${host}/pricing?subscription_failed=true`
        );
        
        console.log('Payment link created successfully:', paymentLink.short_url);
        
        return res.json({
          subscriptionId: subscription.id,
          customerId: customer.id,
          amount: planAmount,
          currency: 'INR',
          status: subscription.status,
          short_url: paymentLink.short_url,
          payment_link_id: paymentLink.id,
          payment_method: 'payment_link_primary',
          success_url: `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
          failure_url: failureUrl,
          message: 'Payment link created successfully',
          debug: {
            plan_id: actualRazorpayPlanId,
            payment_link_used: true,
            hosted_page_bypassed: true
          }
        });
      } catch (paymentLinkError) {
        console.error('Payment link creation failed, falling back to hosted page:', paymentLinkError);
        
        // Fallback to hosted page if payment link fails
        res.json({ 
          subscriptionId: subscription.id,
          customerId: customer.id,
          amount: subscription.plan?.amount || 0,
          currency: 'INR',
          status: subscription.status,
          short_url: subscription.short_url || subscription.authenticate_url,
          authenticate_url: subscription.authenticate_url,
          success_url: `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`,
          failure_url: failureUrl,
          payment_method: 'hosted_page_fallback',
          debug: {
            plan_id: actualRazorpayPlanId,
            has_short_url: !!subscription.short_url,
            has_authenticate_url: !!subscription.authenticate_url,
            payment_link_failed: true
          }
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Handle specific Razorpay errors
      if (error.error?.code === 'BAD_REQUEST_ERROR') {
        return res.status(400).json({ 
          message: 'Invalid request to Razorpay',
          error: error.error.description || 'Bad request error',
          code: 'RAZORPAY_BAD_REQUEST',
          planId: actualRazorpayPlanId,
          details: error.error
        });
      }

      if (error.error?.description?.includes('does not exist')) {
        return res.status(400).json({ 
          message: 'Plan or customer configuration error',
          error: 'Please check your plan configuration or contact support',
          code: 'RESOURCE_NOT_FOUND',
          planId: actualRazorpayPlanId
        });
      }

      // Log more details for debugging
      if (error.error?.description?.includes('not available') || 
          error.error?.description?.includes('hosted page')) {
        console.error('Hosted page error details:', {
          error: error.error,
          planId: actualRazorpayPlanId,
          customerId: customer?.id,
          customerEmail: email
        });
        
        return res.status(400).json({ 
          message: 'Subscription hosted page not available',
          error: 'The hosted payment page could not be generated. This might be due to plan configuration or customer verification requirements.',
          code: 'HOSTED_PAGE_ERROR',
          planId: actualRazorpayPlanId,
          customerId: customer?.id,
          suggestion: 'Please try again or contact support if the issue persists.'
        });
      }

      res.status(500).json({ 
        message: 'Failed to create checkout session',
        error: error.message || 'Unknown error',
        planId: actualRazorpayPlanId
      });
    }
  });

  // Manual payment creation endpoint
  app.post("/api/create-manual-payment", async (req: Request, res: Response) => {
    try {
      const { subscriptionId, planId, customerId, userId } = req.body;

      // Handle upgrade from Free plan - only need planId and userId
      if (!userId || !planId) {
        return res.status(400).json({ 
          message: "Missing required parameters: userId, planId" 
        });
      }

      // Get user details
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Map frontend plan ID to actual Razorpay plan ID
      let actualRazorpayPlanId: string;
      switch (planId) {
        case 'pro-monthly':
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          break;
        case 'pro-yearly':
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          break;
        case 'enterprise-monthly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          break;
        case 'enterprise-yearly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ message: "Invalid plan ID" });
      }

      console.log('Creating payment link for plan:', planId, 'mapped to:', actualRazorpayPlanId);

      // Use simplified fixed pricing in paise (₹999 = 99900 paise)
      let amount: number;
      let planName: string;

      switch (planId) {
        case 'pro-monthly':
          amount = 99900; // ₹999
          planName = 'Pro Monthly';
          break;
        case 'pro-yearly':
          amount = 999900; // ₹9999
          planName = 'Pro Yearly';
          break;
        case 'enterprise-monthly':
          amount = 499900; // ₹4999
          planName = 'Enterprise Monthly';
          break;
        case 'enterprise-yearly':
          amount = 4999900; // ₹49999
          planName = 'Enterprise Yearly';
          break;
        default:
          amount = 99900; // ₹999
          planName = 'Pro Monthly';
      }

      console.log('Creating payment for', planName, 'with amount:', amount, 'paise (₹' + (amount/100) + ')');

      // Create or get existing Razorpay customer
      let customer;
      try {
        // First try to find existing customer by email
        const existingCustomers = await razorpay.customers.all({
          email: user.email,
          count: 1
        });
        
        if (existingCustomers.items && existingCustomers.items.length > 0) {
          customer = existingCustomers.items[0];
          console.log('Using existing customer:', customer.id);
        } else {
          // Create new customer if none exists
          customer = await razorpay.customers.create({
            name: user.username,
            email: user.email,
            contact: '+919000000000', // Default contact
          });
          console.log('Created new customer:', customer.id);
        }
      } catch (error) {
        console.error('Error handling customer:', error);
        
        // If customer creation fails due to existing customer, try to fetch by email
        if (error.error && error.error.description && error.error.description.includes('already exists')) {
          try {
            const existingCustomers = await razorpay.customers.all({
              email: user.email,
              count: 1
            });
            
            if (existingCustomers.items && existingCustomers.items.length > 0) {
              customer = existingCustomers.items[0];
              console.log('Found existing customer after error:', customer.id);
            } else {
              throw new Error('Customer exists but could not be retrieved');
            }
          } catch (fetchError) {
            console.error('Error fetching existing customer:', fetchError);
            throw new Error('Failed to handle existing customer');
          }
        } else {
          throw new Error('Failed to create or retrieve customer');
        }
      }

      // Ensure amount is a whole number (should already be in paise)
      const amountInPaise = Math.round(Number(amount));
      
      console.log('Creating payment link with amount:', amountInPaise, 'paise');

      // Create payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Subscription to ${planName}`,
        customer: {
          id: customer.id
        },
        notify: {
          sms: false,
          email: true
        },
        reminder_enable: true,
        notes: {
          userId: userId.toString(),
          planId: actualRazorpayPlanId,
          planName: planName,
          upgradeType: 'manual_payment',
          originalAmount: amountInPaise.toString()
        },
        callback_url: `${req.protocol}://${req.get('host')}/billing?subscription_success=true`,
        callback_method: 'get'
      });

      res.json({ 
        paymentLink: paymentLink.short_url || paymentLink.payment_page_url,
        message: "Payment link created successfully"
      });
    } catch (error: any) {
      console.error('Error creating manual payment:', error);
      res.status(500).json({ 
        message: 'Failed to create manual payment',
        error: error.message 
      });
    }
  });

  // Verify manual payment endpoint
  app.post("/api/verify-manual-payment", async (req: Request, res: Response) => {
    try {
      const { orderId, paymentId, signature, subscriptionId } = req.body;

      if (!orderId || !paymentId || !signature || !subscriptionId) {
        return res.status(400).json({ 
          message: "Missing required parameters: orderId, paymentId, signature, subscriptionId" 
        });
      }

      const verificationResult = await verifyManualPayment(
        orderId, 
        paymentId, 
        signature, 
        subscriptionId
      );

      if (verificationResult.success) {
        // Save or update subscription in database if needed
        // This would be handled by webhook normally, but for manual payments we do it here
        res.json({
          success: true,
          message: verificationResult.message,
          payment_id: paymentId,
          subscription_id: subscriptionId
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment verification failed"
        });
      }
    } catch (error: any) {
      console.error('Error verifying manual payment:', error);
      res.status(400).json({ 
        success: false,
        message: 'Payment verification failed',
        error: error.message 
      });
    }
  });

  // Debug endpoint to check Razorpay account configuration
  app.get("/api/debug/razorpay-config", async (req: Request, res: Response) => {
    try {
      // Check plans
      const plans = await razorpay.plans.all({ count: 10 });
      
      // Check if hosted checkout is enabled (this might require specific API calls)
      const accountInfo = {
        plans_count: plans.count,
        plans: plans.items.map(plan => ({
          id: plan.id,
          name: plan.item.name,
          amount: plan.item.amount,
          currency: plan.item.currency,
          interval: plan.period,
          status: plan.notes || 'active'
        })),
        configured_plan_ids: {
          PRO_MONTHLY: PLAN_IDS.PRO_MONTHLY,
          PRO_YEARLY: PLAN_IDS.PRO_YEARLY,
          ENTERPRISE_MONTHLY: PLAN_IDS.ENTERPRISE_MONTHLY,
          ENTERPRISE_YEARLY: PLAN_IDS.ENTERPRISE_YEARLY
        }
      };

      res.json(accountInfo);
    } catch (error: any) {
      console.error('Error checking Razorpay config:', error);
      res.status(500).json({ 
        error: error.message,
        code: error.error?.code,
        description: error.error?.description
      });
    }
  });

  // Debug endpoint for subscription troubleshooting
  app.get('/api/debug/subscription/:subscriptionId', async (req: Request, res: Response) => {
    try {
      const { subscriptionId } = req.params;
      
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      
      res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan_id: subscription.plan_id,
          customer_id: subscription.customer_id,
          short_url: subscription.short_url,
          authenticate_url: subscription.authenticate_url,
          created_at: subscription.created_at,
          current_start: subscription.current_start,
          current_end: subscription.current_end,
          notes: subscription.notes,
        }
      });
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      res.status(400).json({ 
        error: error.message,
        code: error.error?.code,
        description: error.error?.description
      });
    }
  });

  // Manual subscription activation endpoint
  app.post("/api/activate-subscription", async (req: Request, res: Response) => {
    console.log('=== SUBSCRIPTION ACTIVATION DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    try {
      const { subscriptionId, userId } = req.body;
      
      if (!subscriptionId || !userId) {
        console.log('Missing required fields:', { subscriptionId, userId });
        return res.status(400).json({ message: 'Missing subscription ID or user ID' });
      }

      // Get subscription details from Razorpay
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      console.log('Razorpay subscription details:', {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id
      });
      
      // Get plan name from the provided planId parameter (for manual activation)
      const requestedPlanId = req.body.planId;
      const planName = requestedPlanId ? getPlanNameFromId(requestedPlanId) : getPlanNameFromId(subscription.plan_id);
      console.log('Plan name mapped:', planName, 'from planId:', requestedPlanId || subscription.plan_id);
      console.log('Using requested plan ID:', requestedPlanId, 'vs subscription plan ID:', subscription.plan_id);
      
      // Check if subscription already exists
      const existingSubscription = await storage.getSubscriptionByUserId(userId);
      console.log('Existing subscription check:', existingSubscription ? 'Found' : 'Not found');
      
      if (existingSubscription) {
        // Update existing subscription with new plan details
        console.log('Updating existing subscription...');
        const updatedSub = await storage.updateSubscription(existingSubscription.razorpay_subscription_id, {
          status: 'active',
          plan_name: planName,
          plan_id: requestedPlanId || subscription.plan_id,
          price_id: requestedPlanId || subscription.plan_id,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          updated_at: new Date()
        });
        console.log('Subscription updated:', updatedSub);
      } else {
        // Create new subscription
        console.log('Creating new subscription...');
        const newSubscription = {
          user_id: userId,
          razorpay_subscription_id: subscription.id,
          razorpay_customer_id: subscription.customer_id,
          status: 'active',
          plan_name: planName,
          plan_id: subscription.plan_id,
          price_id: subscription.plan_id,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };
        console.log('New subscription data:', newSubscription);
        
        const createdSub = await storage.createSubscription(newSubscription);
        console.log('Subscription created:', createdSub);
        
        // Create payment history record for manual activation
        try {
          const paymentRecord = await storage.createPaymentHistory({
            user_id: userId,
            razorpay_payment_id: `manual_${subscription.id}_${Date.now()}`, // Create unique payment ID
            amount: 2900, // ₹29 in paisa (Indian currency subunit)
            currency: 'INR',
            status: 'succeeded',
            description: `Manual activation: ${planName} subscription`,
          });
          console.log('Payment history created for manual activation:', paymentRecord);
        } catch (error) {
          console.error('Error creating payment history:', error);
        }
      }

      // Verify subscription was created/updated
      const verifySubscription = await storage.getSubscriptionByUserId(userId);
      console.log('Verification check:', verifySubscription ? 'Success' : 'Failed');
      console.log('=== END ACTIVATION DEBUG ===');

      res.json({ 
        success: true, 
        message: 'Subscription activated successfully',
        subscription: { ...subscription, status: 'active' },
        verified: !!verifySubscription
      });
    } catch (error) {
      console.error('Manual subscription activation error:', error);
      console.log('=== END ACTIVATION DEBUG (ERROR) ===');
      res.status(500).json({ 
        message: 'Subscription activation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/verify-payment", async (req: Request, res: Response) => {
    try {
      const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, userId } = req.body;

      // For subscriptions, we primarily rely on webhooks for payment processing
      // This endpoint is mainly for subscription status verification

      if (razorpay_subscription_id) {
        // Verify subscription status
        let subscription;
        try {
          subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
        } catch (fetchError: any) {
          console.error('Error fetching subscription:', fetchError);
          return res.status(400).json({ 
            message: 'Invalid subscription ID or subscription not found.',
            error: 'SUBSCRIPTION_NOT_FOUND'
          });
        }

        if (subscription.status === 'active' || subscription.status === 'authenticated') {
          // Map plan ID to plan name using helper function
          const planName = getPlanNameFromId(subscription.plan_id);

          // Check if subscription already exists in database
          const existingSubscription = await storage.getSubscriptionByUserId(parseInt(userId));

          if (!existingSubscription || existingSubscription.razorpay_subscription_id !== subscription.id) {
            // Save subscription to database
            await storage.createSubscription({
              user_id: parseInt(userId),
              razorpay_subscription_id: subscription.id,
              razorpay_customer_id: subscription.customer_id,
              status: subscription.status,
              plan_name: planName,
              plan_id: subscription.plan_id,
              price_id: subscription.plan_id,
              current_period_start: new Date(subscription.current_start * 1000),
              current_period_end: new Date(subscription.current_end * 1000),
            });

            console.log(`New subscription created for user ${userId}: ${planName}`);
          } else {
            console.log(`Subscription already exists for user ${userId}`);
          }

          res.json({ 
            success: true, 
            message: 'Subscription verified successfully',
            subscription: {
              id: subscription.id,
              status: subscription.status,
              plan_name: planName
            }
          });
        } else {
          res.status(400).json({ message: `Subscription status: ${subscription.status}. Please complete the payment.` });
        }
      } else {
        res.status(400).json({ message: 'Subscription ID required for verification' });
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      res.status(500).json({ message: 'Failed to verify subscription' });
    }
  });

  // Get current USD to INR exchange rate
  app.get('/api/exchange-rate', async (req: Request, res: Response) => {
    try {
      const livePricing = await getPlanPricing();
      // Calculate the current rate from live pricing
      const currentRate = livePricing.PRO_MONTHLY / (29 * 100); // Reverse calculate from pro monthly

      res.json({
        rate: currentRate,
        timestamp: Date.now(),
        message: 'Current USD to INR exchange rate'
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
  });

  // Get subscription by user ID
  app.get('/api/subscription/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      // Set cache headers to ensure fresh data
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const subscription = await storage.getSubscriptionByUserId(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }

      // Log for debugging
      console.log(`Subscription data for user ${userId}:`, {
        id: subscription.id,
        status: subscription.status,
        plan_name: subscription.plan_name,
        updated_at: subscription.updated_at
      });

      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create payment history record manually (for testing/admin use)
  app.post("/api/payment-history/create", async (req: Request, res: Response) => {
    try {
      const paymentData = req.body;
      const payment = await storage.createPaymentHistory(paymentData);
      return res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment history:', error);
      return res.status(500).json({ message: "Failed to create payment history" });
    }
  });

  // Fix missing payment history for a user (debug endpoint)
  app.post("/api/payment-history/fix/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { paymentId, amount, planName } = req.body;

      if (!paymentId || !amount || !planName) {
        return res.status(400).json({ message: "Missing required fields: paymentId, amount, planName" });
      }

      // Check if payment history already exists
      const existingHistory = await storage.getPaymentHistoryByUserId(userId);
      const exists = existingHistory.some(p => p.razorpay_payment_id === paymentId);

      if (exists) {
        return res.json({ message: "Payment history already exists", exists: true });
      }

      // Create the missing payment history
      const paymentHistory = await storage.createPaymentHistory({
        user_id: userId,
        razorpay_payment_id: paymentId,
        amount: amount,
        currency: 'INR',
        status: 'succeeded',
        description: `Subscription payment for ${planName} (manually added)`,
      });

      return res.status(201).json({ message: "Payment history created successfully", payment: paymentHistory });
    } catch (error) {
      console.error('Error fixing payment history:', error);
      return res.status(500).json({ message: "Failed to fix payment history" });
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

      // Update subscription in our database (not Stripe)
      const subscription = await storage.updateSubscription(id, updateData);

      res.json({ subscription });
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Handle plan downgrades without payment (e.g., Enterprise to Pro)
  app.post('/api/subscription/:id/downgrade', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPlanId, userId } = req.body;

      if (!newPlanId || !userId) {
        return res.status(400).json({ error: 'New plan ID and user ID are required' });
      }

      console.log('Downgrade request received:', { subscriptionId: id, newPlanId, userId });

      // Get current subscription details
      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Map frontend plan ID to plan name
      let newPlanName: string;
      let actualRazorpayPlanId: string;

      switch (newPlanId) {
        case 'pro-monthly':
          newPlanName = 'Pro Monthly';
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          break;
        case 'pro-yearly':
          newPlanName = 'Pro Yearly';
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          break;
        case 'enterprise-monthly':
          newPlanName = 'Enterprise Monthly';
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          break;
        case 'enterprise-yearly':
          newPlanName = 'Enterprise Yearly';
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ error: 'Invalid plan ID for downgrade' });
      }

      // Use the actual subscription ID from the database
      const subscriptionIdToUpdate = subscription.razorpay_subscription_id || subscription.stripe_subscription_id || id;

      // Update subscription in database (immediate downgrade)
      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: 'active',
        plan_name: newPlanName,
        plan_id: actualRazorpayPlanId,
        price_id: actualRazorpayPlanId,
        updated_at: new Date()
      });

      console.log('Database downgrade result:', dbUpdate);

      // Create a payment record for the downgrade (no charge)
      await storage.createPaymentHistory({
        user_id: parseInt(userId),
        razorpay_payment_id: `downgrade_${subscriptionIdToUpdate}_${Date.now()}`,
        amount: 0, // No charge for downgrades
        currency: 'INR',
        status: 'succeeded',
        description: `Plan downgraded from ${subscription.plan_name} to ${newPlanName}`,
      });

      res.json({
        success: true,
        subscription: dbUpdate,
        message: `Successfully downgraded from ${subscription.plan_name} to ${newPlanName}`,
      });
    } catch (error) {
      console.error('Error downgrading subscription:', error);
      res.status(500).json({ error: 'Failed to downgrade subscription' });
    }
  });

  // Upgrade subscription
  app.post('/api/subscription/:id/upgrade', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPlanId, userId } = req.body;

      if (!newPlanId || !userId) {
        return res.status(400).json({ error: 'New plan ID and user ID are required' });
      }

      console.log('Upgrade request received:', { subscriptionId: id, newPlanId, userId });

      // Get current subscription details
      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Map frontend plan ID to actual Razorpay plan ID and get pricing
      let actualRazorpayPlanId: string;
      let newPlanName: string;
      let newAmount: number;

      switch (newPlanId) {
        case 'pro-monthly':
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          newPlanName = 'Pro Monthly';
          newAmount = PLAN_PRICING.PRO_MONTHLY;
          break;
        case 'pro-yearly':
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          newPlanName = 'Pro Yearly';
          newAmount = PLAN_PRICING.PRO_YEARLY;
          break;
        case 'enterprise-monthly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          newPlanName = 'Enterprise Monthly';
          newAmount = PLAN_PRICING.ENTERPRISE_MONTHLY;
          break;
        case 'enterprise-yearly':
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          newPlanName = 'Enterprise Yearly';
          newAmount = PLAN_PRICING.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ error: 'Invalid plan ID for upgrade' });
      }

      if (!actualRazorpayPlanId) {
        return res.status(500).json({ error: 'Plan configuration error. Please contact support.' });
      }

      // Instead of automatic prorated charge, create payment link for proper upgrade flow
      try {
        // Get the correct amount for the new plan (in paise)
        let planAmount = 0;
        switch (newPlanId) {
          case 'pro-monthly':
            planAmount = 99900; // ₹999 in paise
            break;
          case 'pro-yearly':
            planAmount = 999900; // ₹9999 in paise  
            break;
          case 'enterprise-monthly':
            planAmount = 499900; // ₹4999 in paise
            break;
          case 'enterprise-yearly':
            planAmount = 4999900; // ₹49999 in paise
            break;
          default:
            planAmount = 99900; // Default to Pro Monthly
        }

        // Create or get existing Razorpay customer
        const user = await storage.getUser(parseInt(userId));
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Find existing customer or create new one
        let customer;
        try {
          const existingCustomers = await razorpay.customers.all({
            email: user.email,
            count: 1
          });
          
          if (existingCustomers.items && existingCustomers.items.length > 0) {
            customer = existingCustomers.items[0];
          } else {
            customer = await razorpay.customers.create({
              name: user.username,
              email: user.email,
              contact: '+919000000000',
            });
          }
        } catch (customerError) {
          console.error('Error handling customer:', customerError);
          return res.status(500).json({ error: 'Failed to handle customer' });
        }

        // Create payment link for upgrade
        const paymentLink = await razorpay.paymentLink.create({
          amount: planAmount,
          currency: 'INR',
          accept_partial: false,
          customer: {
            id: customer.id
          },
          description: `Upgrade to ${newPlanName}`,
          notes: {
            userId: userId,
            planId: actualRazorpayPlanId,
            upgradeFrom: subscription.plan_name,
            upgradeTo: newPlanName
          }
        });

        res.json({
          success: true,
          paymentRequired: true,
          paymentLink: paymentLink.short_url,
          message: `To upgrade to ${newPlanName}, please complete the payment`,
          upgradeDetails: {
            currentPlan: subscription.plan_name,
            newPlan: newPlanName,
            amount: planAmount / 100, // Show in rupees
            currency: 'INR'
          }
        });

      } catch (paymentError) {
        console.error('Error creating upgrade payment:', paymentError);
        res.status(500).json({ 
          error: 'Failed to create upgrade payment',
          message: 'Please try again or contact support'
        });
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      res.status(500).json({ error: 'Failed to upgrade subscription' });
    }
  });

  // Downgrade to free plan (bypass Razorpay)
  app.post('/api/subscription/:id/downgrade-to-free', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      console.log('Downgrade to free request received:', { subscriptionId: id, userId });

      // Get the subscription details
      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));

      if (!subscription) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      // Update subscription status in database to cancelled (immediate downgrade to free)
      const dbUpdate = await storage.updateSubscription(subscription.razorpay_subscription_id || subscription.stripe_subscription_id || id, {
        status: 'cancelled',
        cancel_at_period_end: false,
        updated_at: new Date()
      });

      console.log('Database downgrade result:', dbUpdate);

      // Create a payment record for the downgrade
      await storage.createPaymentHistory({
        user_id: parseInt(userId),
        razorpay_payment_id: `downgrade_to_free_${subscription.razorpay_subscription_id || id}_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        status: 'succeeded',
        description: `Downgraded to Free plan from ${subscription.plan_name}`,
      });

      res.json({ 
        success: true, 
        subscription: dbUpdate,
        message: 'Successfully downgraded to Free plan'
      });
    } catch (error) {
      console.error('Error downgrading to free plan:', error);
      res.status(500).json({ error: 'Failed to downgrade to free plan' });
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

      // Cancel the subscription in Razorpay
      try {
        const cancelledSubscription = await razorpay.subscriptions.cancel(subscriptionIdToUpdate, {
          cancel_at_cycle_end: 1 // Cancel at the end of current billing cycle
        });
        console.log('Razorpay subscription cancelled:', cancelledSubscription.status);
      } catch (razorpayError: any) {
        console.error('Error cancelling Razorpay subscription:', razorpayError);

        // If forceCancel is true (downgrade to free), continue regardless of Razorpay error
        if (forceCancel) {
          console.log('Force cancel enabled - proceeding with database update despite Razorpay error');
        } else if (razorpayError.error?.code === 'BAD_REQUEST_ERROR' && 
                   (razorpayError.error?.description?.includes('does not exist') ||
                    razorpayError.error?.description?.includes('expired status'))) {
          console.log('Subscription not cancellable in Razorpay (expired/not found), proceeding with database update');
        } else {
          // For other errors without force cancel, return early
          return res.status(400).json({ 
            error: 'Failed to cancel subscription in Razorpay',
            details: razorpayError.error?.description || razorpayError.message
          });
        }
      }

      // Update the subscription status in database - immediate cancellation for downgrade to free
      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: 'cancelled',
        cancel_at_period_end: false,
        updated_at: new Date()
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

  // Create subscription
  app.post('/api/subscription/create', async (req: Request, res: Response) => {
    const { userId, planId, customerEmail, customerName } = req.body;

    try {
      // Get live pricing based on plan
      const livePricing = await getPlanPricing();
      let amount: number;
      let planName: string;
      let interval: string;

      switch (planId) {
        case 'pro-monthly':
          amount = livePricing.PRO_MONTHLY;
          planName = 'Pro Monthly';
          interval = 'monthly';
          break;
        case 'pro-yearly':
          amount = livePricing.PRO_YEARLY;
          planName = 'Pro Yearly';
          interval = 'yearly';
          break;
        case 'enterprise-monthly':
          amount = livePricing.ENTERPRISE_MONTHLY;
          planName = 'Enterprise Monthly';
          interval = 'monthly';
          break;
        case 'enterprise-yearly':
          amount = livePricing.ENTERPRISE_YEARLY;
          planName = 'Enterprise Yearly';
          interval = 'yearly';
          break;
        default:
          return res.status(400).json({ error: 'Invalid plan ID' });
      }

      // // Create a customer in Stripe
      // const customer = await stripe.customers.create({
      //   email: customerEmail,
      //   name: customerName,
      // });

      // // Create a subscription in Stripe
      // const subscription = await stripe.subscriptions.create({
      //   customer: customer.id,
      //   items: [{ plan: planId }],
      //   payment_behavior: 'default_incomplete',
      //   expand: ['latest_invoice.payment_intent'],
      // });

      // // Save the subscription to the database
      // await storage.createSubscription({
      //   user_id: userId,

  // Validate Razorpay plan configuration
  app.get('/api/validate-plans', async (req: Request, res: Response) => {
    try {
      const validationResults = [];

      for (const [planKey, planId] of Object.entries(PLAN_IDS)) {
        try {
          if (!planId) {
            validationResults.push({
              plan: planKey,
              status: 'missing',
              error: 'Plan ID not set in environment variables'
            });
            continue;
          }

          const plan = await razorpay.plans.fetch(planId);
          validationResults.push({
            plan: planKey,
            planId: planId,
            status: 'valid',
            amount: plan.item.amount,
            currency: plan.item.currency,
            interval: plan.period,
            intervalCount: plan.interval
          });
        } catch (error: any) {
          validationResults.push({
            plan: planKey,
            planId: planId,
            status: 'invalid',
            error: error.message
          });
        }
      }

      const allValid = validationResults.every(result => result.status === 'valid');

      res.json({
        success: allValid,
        plans: validationResults,
        message: allValid ? 'All plans are properly configured' : 'Some plans need attention'
      });
    } catch (error) {
      console.error('Error validating plans:', error);
      res.status(500).json({ error: 'Failed to validate plans' });
    }
  });


      //   stripe_subscription_id: subscription.id,
      //   stripe_customer_id: customer.id,
      //   status: subscription.status,
      //   plan_name: planName,
      //   price_id: planId,
      //   current_period_start: new Date(subscription.current_period_start * 1000),
      //   current_period_end: new Date(subscription.current_period_end * 1000),
      // });

      // res.json({
      //   success: true,
      //   subscriptionId: subscription.id,
      //   clientSecret: (subscription.latest_invoice?.payment_intent as any)?.client_secret,
      //   message: `Successfully subscribed to ${planName}!`
      // });

      res.status(500).json({ message: 'This route is not implemented yet. Use /api/create-checkout-session and /api/verify-payment instead.' });
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}