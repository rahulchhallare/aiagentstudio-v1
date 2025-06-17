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
              const planName = getPlanNameFromId(subscription.plan_id);

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
      const subscription = await razorpay.subscriptions.create({
        plan_id: actualRazorpayPlanId,
        customer_id: customer.id,
        quantity: 1,
        total_count: 120, // 10 years worth of billing cycles
        addons: [],
        notes: {
          userId: userId.toString(),
          planId: actualRazorpayPlanId,
          originalPlanId: planId,
          email: email,
          success_url: successUrl,
          failure_url: failureUrl,
        }
      });

      console.log('Created Razorpay subscription:', subscription.id);

      // Create redirect URL with subscription ID for success tracking
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("host")?.includes("replit.dev") ? "https" : "http";
      const successUrl = `${protocol}://${host}/billing?subscription_success=true&subscription_id=${subscription.id}`;
      const failureUrl = `${protocol}://${host}/pricing?subscription_failed=true`;

      res.json({ 
        subscriptionId: subscription.id,
        customerId: customer.id,
        amount: subscription.plan?.amount || 0,
        currency: 'INR',
        status: subscription.status,
        short_url: subscription.short_url, // Razorpay hosted checkout page
        success_url: successUrl,
        failure_url: failureUrl
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      
      // Handle specific Razorpay errors
      if (error.error?.code === 'BAD_REQUEST_ERROR') {
        return res.status(400).json({ 
          message: 'Invalid request to Razorpay',
          error: error.error.description || 'Bad request error',
          code: 'RAZORPAY_BAD_REQUEST'
        });
      }
      
      if (error.error?.description?.includes('does not exist')) {
        return res.status(400).json({ 
          message: 'Plan or customer configuration error',
          error: 'Please check your plan configuration or contact support',
          code: 'RESOURCE_NOT_FOUND'
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to create checkout session',
        error: error.message || 'Unknown error'
      });
    }
  });

  // Verify subscription payment (activated via webhook mainly, this is for direct verification)
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

      // Calculate prorated amount
      const currentPeriodStart = new Date(subscription.current_period_start);
      const currentPeriodEnd = new Date(subscription.current_period_end);
      const now = new Date();

      // Calculate remaining days in current period
      const totalDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate current plan daily rate
      let currentAmount = 0;
      const currentPlanId = subscription.plan_id;
      if (currentPlanId === PLAN_IDS.PRO_MONTHLY) {
        currentAmount = PLAN_PRICING.PRO_MONTHLY;
      } else if (currentPlanId === PLAN_IDS.PRO_YEARLY) {
        currentAmount = PLAN_PRICING.PRO_YEARLY;
      } else if (currentPlanId === PLAN_IDS.ENTERPRISE_MONTHLY) {
        currentAmount = PLAN_PRICING.ENTERPRISE_MONTHLY;
      } else if (currentPlanId === PLAN_IDS.ENTERPRISE_YEARLY) {
        currentAmount = PLAN_PRICING.ENTERPRISE_YEARLY;
      }

      const currentDailyRate = currentAmount / totalDays;
      const newDailyRate = newAmount / totalDays; // Assuming same period type

      // Calculate prorated upgrade cost
      const unusedCredit = Math.round(currentDailyRate * remainingDays);
      const upgradeCharge = Math.round(newDailyRate * remainingDays);
      const proratedAmount = upgradeCharge - unusedCredit;

      // Update subscription in database immediately for instant access
      const updatedSubscription = await storage.updateSubscription(subscription.razorpay_subscription_id || subscription.stripe_subscription_id || id, {
        status: 'active',
        plan_name: newPlanName,
        plan_id: actualRazorpayPlanId,
        price_id: actualRazorpayPlanId,
        // Keep the same period dates for prorated upgrade
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
      });

      // Create payment record for the upgrade
      if (proratedAmount > 0) {
        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          razorpay_payment_id: `upgrade_${subscription.razorpay_subscription_id || id}_${Date.now()}`,
          amount: proratedAmount,
          currency: 'inr',
          status: 'succeeded',
          description: `Subscription upgraded from ${subscription.plan_name} to ${newPlanName} (prorated)`,
        });
      } else {
        // If downgrade, record as credit
        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          razorpay_payment_id: `upgrade_credit_${subscription.razorpay_subscription_id || id}_${Date.now()}`,
          amount: Math.abs(proratedAmount),
          currency: 'inr',
          status: 'succeeded',
          description: `Credit applied for upgrade from ${subscription.plan_name} to ${newPlanName}`,
        });
      }

      res.json({ 
        success: true, 
        subscription: updatedSubscription,
        prorationDetails: {
          currentPlan: subscription.plan_name,
          newPlan: newPlanName,
          remainingDays,
          unusedCredit: unusedCredit / 100, // Convert to rupees
          upgradeCharge: upgradeCharge / 100,
          netAmount: proratedAmount / 100,
        },
        message: `Successfully upgraded from ${subscription.plan_name} to ${newPlanName}. You now have immediate access to ${newPlanName} features!` 
      });
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      res.status(500).json({ error: 'Failed to upgrade subscription' });
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
        
        // If subscription doesn't exist in Razorpay, that's fine - continue with database update
        if (razorpayError.error?.code === 'BAD_REQUEST_ERROR' && 
            razorpayError.error?.description?.includes('does not exist')) {
          console.log('Subscription not found in Razorpay, proceeding with database update');
        } else {
          // For other errors, we might want to return early
          return res.status(400).json({ 
            error: 'Failed to cancel subscription in Razorpay',
            details: razorpayError.error?.description || razorpayError.message
          });
        }
      }

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