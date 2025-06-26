import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAgentSchema,
  insertWaitlistSchema,
  insertContactSchema,
  flowDataSchema,
} from "@shared/schema";
import { executeFlow } from "./agent-execution";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import {
  razorpay,
  PLAN_IDS,
  PLAN_PRICING,
  USD_PRICES,
  getINRAmountByPlanId,
  getUSDPriceByPlanId,
} from "./razorpay";
import { createPaymentLink } from "./payment-links";
import {
  createManualSubscriptionPayment,
  verifyManualPayment,
} from "./manual-payment";
import crypto from "crypto";
import axios from "axios";
import nodemailer from "nodemailer";

// Helper function to map Razorpay plan ID to plan name
function getPlanNameFromId(planId: string): string {
  if (planId === PLAN_IDS.PRO_MONTHLY) {
    return "Pro Monthly";
  } else if (planId === PLAN_IDS.PRO_YEARLY) {
    return "Pro Yearly";
  } else if (planId === PLAN_IDS.ENTERPRISE_MONTHLY) {
    return "Enterprise Monthly";
  } else if (planId === PLAN_IDS.ENTERPRISE_YEARLY) {
    return "Enterprise Yearly";
  }
  return "Unknown Plan";
}

// Helper to validate request body with Zod schema
function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

// Email notification function
async function sendContactFormNotifications(contactData: {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  inquiryType?: string;
}) {
  // Check if email credentials are available
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("Email credentials not configured");
  }

  // Create nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred email service
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your app password
    },
  });

  const timestamp = new Date().toLocaleString();

  // Email to your team (notification)
  const teamEmailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || 'info@aiagentstudio.ai',
    subject: `New Contact Form Submission: ${contactData.subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>Submitted:</strong> ${timestamp}</p>
      <p><strong>Name:</strong> ${contactData.name}</p>
      <p><strong>Email:</strong> ${contactData.email}</p>
      ${contactData.company ? `<p><strong>Company:</strong> ${contactData.company}</p>` : ''}
      ${contactData.inquiryType ? `<p><strong>Inquiry Type:</strong> ${contactData.inquiryType}</p>` : ''}
      <p><strong>Subject:</strong> ${contactData.subject}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
        ${contactData.message.replace(/\n/g, '<br>')}
      </div>
      <hr>
      <p><em>Reply to: ${contactData.email}</em></p>
    `,
  };

  // Auto-reply email to the user
  const userEmailOptions = {
    from: process.env.SMTP_USER,
    to: contactData.email,
    subject: 'Thank you for contacting AIAgentStudio.AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Thank you for reaching out!</h2>
        <p>Hi ${contactData.name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Your Message:</h3>
          <p><strong>Subject:</strong> ${contactData.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
            ${contactData.message.replace(/\n/g, '<br>')}
          </p>
        </div>

        <p>In the meantime, feel free to:</p>
        <ul>
          <li>Explore our <a href="https://aiagentstudio.ai/documentation" style="color: #2563eb;">documentation</a></li>
          <li>Check out our <a href="https://aiagentstudio.ai/templates" style="color: #2563eb;">AI agent templates</a></li>
          <li>Join our community for updates and tips</li>
        </ul>

        <p>Best regards,<br>
        The AIAgentStudio.AI Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated response. Please do not reply to this email.
        </p>
      </div>
    `,
  };

  // Send both emails
  await Promise.all([
    transporter.sendMail(teamEmailOptions),
    transporter.sendMail(userEmailOptions),
  ]);
}

// Function to fetch live plan pricing
async function getPlanPricing(): Promise<{
  PRO_MONTHLY: number;
  PRO_YEARLY: number;
  ENTERPRISE_MONTHLY: number;
  ENTERPRISE_YEARLY: number;
}> {
  try {
    const response = await axios.get(`https://open.er-api.com/v6/latest/USD`);
    const exchangeRates = response.data.rates;
    const inrRate = exchangeRates.INR;

    const PRO_MONTHLY = Math.round(29 * inrRate * 100);
    const PRO_YEARLY = Math.round(299 * inrRate * 100);
    const ENTERPRISE_MONTHLY = Math.round(99 * inrRate * 100);
    const ENTERPRISE_YEARLY = Math.round(999 * inrRate * 100);

    return {
      PRO_MONTHLY,
      PRO_YEARLY,
      ENTERPRISE_MONTHLY,
      ENTERPRISE_YEARLY,
    };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return PLAN_PRICING;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Razorpay webhook - MUST be defined BEFORE any JSON body parser middleware
  app.post(
    "/api/webhook/razorpay",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim().replace(
        /\s+/g,
        "",
      );
      const signature = req.headers["x-razorpay-signature"];

      if (!webhookSecret || !signature) {
        return res
          .status(400)
          .json({ message: "Missing webhook secret or signature" });
      }

      try {
        // Verify webhook signature
        const bodyString = Buffer.isBuffer(req.body)
          ? req.body.toString()
          : JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(bodyString)
          .digest("hex");

        if (expectedSignature !== signature) {
          return res.status(400).json({ message: "Invalid webhook signature" });
        }

        // Parse the webhook body
        let event;
        if (Buffer.isBuffer(req.body)) {
          event = JSON.parse(req.body.toString("utf8"));
        } else if (typeof req.body === "string") {
          event = JSON.parse(req.body);
        } else if (typeof req.body === "object" && req.body !== null) {
          event = req.body;
        } else {
          throw new Error("Invalid webhook body format");
        }

        console.log(
          "Razorpay webhook received:",
          event.event,
          "Event ID:",
          event.payload?.payment?.entity?.id ||
            event.payload?.subscription?.entity?.id,
        );

        // Create a unique event identifier
        const eventId = event.payload?.payment?.entity?.id ||
                       event.payload?.subscription?.entity?.id ||
                       "unknown";
        const uniqueEventKey = `${event.event}_${eventId}`;

        // Check if this specific event was already processed
        const existingEvent = await storage.getWebhookEventById(uniqueEventKey);
        if (existingEvent) {
          console.log("Event already processed, skipping:", event.event, "for entity:", eventId);
          return res.json({ status: "already_processed" });
        }

        // Handle the event
        switch (event.event) {
          case "payment.captured":
            const payment = event.payload.payment.entity;
            console.log("Payment captured:", payment.id);

            try {
              let userId = parseInt(payment.notes?.userId || "0");

              if (userId === 0 && payment.order_id) {
                try {
                  const order = await razorpay.orders.fetch(payment.order_id);
                  userId = parseInt(order.notes?.userId || "0");
                } catch (orderError) {
                  console.error("Error fetching order for userId:", orderError);
                }
              }

              if (userId > 0) {
                // Check if payment history already exists to prevent duplicates
                const existingPaymentHistory = await storage.getPaymentHistoryByUserId(userId);
                const paymentExists = existingPaymentHistory.some(
                  (p) => p.razorpay_payment_id === payment.id
                );

                if (paymentExists) {
                  console.log("Payment history already exists for payment:", payment.id);
                  break;
                }

                let planName = "";
                let planId = "";

                // Determine plan based on payment amount or notes
                if (payment.notes?.planName && payment.notes?.planId) {
                  planName = payment.notes.planName;
                  planId = payment.notes.planId;
                } else {
                  // Fallback to amount-based detection
                  if (payment.amount >= 499000 && payment.amount <= 501000) {
                    planName = "Enterprise Monthly";
                    planId = PLAN_IDS.ENTERPRISE_MONTHLY;
                  } else if (payment.amount >= 99000 && payment.amount <= 101000) {
                    planName = "Pro Monthly";
                    planId = PLAN_IDS.PRO_MONTHLY;
                  } else if (payment.amount >= 999000 && payment.amount <= 1001000) {
                    planName = "Pro Yearly";
                    planId = PLAN_IDS.PRO_YEARLY;
                  } else if (payment.amount >= 4999000 && payment.amount <= 5001000) {
                    planName = "Enterprise Yearly";
                    planId = PLAN_IDS.ENTERPRISE_YEARLY;
                  }
                }

                // Create payment history record
                if (planName) {
                  await storage.createPaymentHistory({
                    user_id: userId,
                    razorpay_payment_id: payment.id,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: "succeeded",
                    description: `Payment for ${planName}`,
                  });

                  // Try to find if this payment belongs to a subscription
                  let subscriptionId = null;
                  if (payment.subscription_id) {
                    subscriptionId = payment.subscription_id;
                  } else {
                    // For payment links, we create a manual subscription
                    subscriptionId = `manual_${payment.id}`;
                  }

                  const existingSubscription = await storage.getSubscriptionByUserId(userId);

                  if (existingSubscription) {
                    await storage.updateSubscription(
                      existingSubscription.razorpay_subscription_id ||
                        existingSubscription.stripe_subscription_id ||
                        `manual_${userId}`,
                      {
                        razorpay_subscription_id: subscriptionId,
                        status: "active",
                        plan_name: planName,
                        plan_id: planId,
                        price_id: planId,
                        current_period_start: new Date(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        updated_at: new Date(),
                      },
                    );
                  } else {
                    await storage.createSubscription({
                      user_id: userId,
                      razorpay_subscription_id: subscriptionId,
                      razorpay_customer_id: payment.customer_id || "",
                      status: "active",
                      plan_name: planName,
                      plan_id: planId,
                      price_id: planId,
                      current_period_start: new Date(),
                      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    });
                  }
                }
              }
            } catch (error) {
              console.error("Error processing payment:", error);
            }
            break;

          case "payment_link.paid":
            const paidPaymentEntity = event.payload.payment.entity;

            try {
              let userId = parseInt(paidPaymentEntity.notes?.userId || "0");

              if (userId > 0) {
                // Check if payment history already exists
                const existingPaymentHistory = await storage.getPaymentHistoryByUserId(userId);
                const paymentExists = existingPaymentHistory.some(
                  (p) => p.razorpay_payment_id === paidPaymentEntity.id
                );

                if (paymentExists) {
                  console.log("Payment history already exists for payment link payment:", paidPaymentEntity.id);
                  break;
                }

                const planName = paidPaymentEntity.notes?.planName || "Unknown Plan";
                const planId = paidPaymentEntity.notes?.planId || "";

                await storage.createPaymentHistory({
                  user_id: userId,
                  razorpay_payment_id: paidPaymentEntity.id,
                  amount: paidPaymentEntity.amount,
                  currency: paidPaymentEntity.currency,
                  status: "succeeded",
                  description: `Payment for ${planName}`,
                });

                const existingSubscription = await storage.getSubscriptionByUserId(userId);

                if (existingSubscription) {
                  await storage.updateSubscription(
                    existingSubscription.razorpay_subscription_id ||
                      existingSubscription.stripe_subscription_id ||
                      `manual_${userId}`,
                    {
                      status: "active",
                      plan_name: planName,
                      plan_id: planId,
                      price_id: planId,
                      current_period_start: new Date(),
                      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                      updated_at: new Date(),
                    },
                  );
                } else {
                  await storage.createSubscription({
                    user_id: userId,
                    razorpay_subscription_id: `manual_${paidPaymentEntity.id}`,
                    razorpay_customer_id: paidPaymentEntity.customer_id || "",
                    status: "active",
                    plan_name: planName,
                    plan_id: planId,
                    price_id: planId,
                    current_period_start: new Date(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  });
                }
              }
            } catch (error) {
              console.error("Error processing payment link payment:", error);
            }
            break;

          case "subscription.charged":
            const subscription = event.payload.subscription.entity;
            const paymentEntity = event.payload.payment.entity;

            try {
              const userId = parseInt(subscription.notes?.userId || "0");

              if (userId > 0) {
                // Check if payment history already exists to prevent duplicates
                const existingPaymentHistory = await storage.getPaymentHistoryByUserId(userId);
                const paymentExists = existingPaymentHistory.some(
                  (p) => p.razorpay_payment_id === paymentEntity.id
                );

                if (paymentExists) {
                  console.log("Payment history already exists for subscription charge:", paymentEntity.id);
                  break;
                }

                const planName = getPlanNameFromId(subscription.plan_id);
                const existingSubscription = await storage.getSubscriptionByUserId(userId);

                if (existingSubscription && existingSubscription.razorpay_subscription_id === subscription.id) {
                  await storage.createPaymentHistory({
                    user_id: userId,
                    razorpay_payment_id: paymentEntity.id,
                    amount: paymentEntity.amount,
                    currency: paymentEntity.currency,
                    status: "succeeded",
                    description: `Subscription renewal payment for ${planName}`,
                  });
                } else {
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

                  await storage.createPaymentHistory({
                    user_id: userId,
                    razorpay_payment_id: paymentEntity.id,
                    amount: paymentEntity.amount,
                    currency: paymentEntity.currency,
                    status: "succeeded",
                    description: `Subscription payment for ${planName}`,
                  });
                }
              }
            } catch (error) {
              console.error("Error saving subscription charge data:", error);
            }
            break;

          case "subscription.cancelled":
            const cancelledSub = event.payload.subscription.entity;

            try {
              await storage.updateSubscription(cancelledSub.id, {
                status: "cancelled",
                cancel_at_period_end: false,
              });
            } catch (error) {
              console.error("Error updating cancelled subscription:", error);
            }
            break;

          default:
            console.log(`Unhandled Razorpay event type: ${event.event}`);
        }

        // Save webhook event to prevent duplicate processing
        try {
          await storage.createWebhookEvent({
            razorpay_event_id: uniqueEventKey,
            event_type: event.event,
            processed: true,
          });
        } catch (error) {
          console.error("Error saving webhook event:", error);
        }

        res.json({ status: "ok" });
      } catch (error: any) {
        console.error("Razorpay webhook error:", error);
        res.status(400).json({ message: "Webhook processing failed" });
      }
    },
  );

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = validateBody(insertUserSchema, req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const user = await storage.createUser(userData);
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
    "https://aiagentstudio.ai/api/auth/google/callback",
  );

  // Google OAuth routes
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code } = req.query;

      if (!code) {
        return res.redirect("/?error=no_code");
      }

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect("/login?error=invalid_token");
      }

      const { email, name, picture } = payload;

      if (!email) {
        return res.redirect("/login?error=no_email");
      }

      let existingUser = await storage.getUserByEmail(email);

      let user;
      if (!existingUser) {
        user = await storage.createUser({
          email,
          username: email.split("@")[0],
          password: Math.random().toString(36).substring(2, 15),
        });
      } else {
        user = existingUser;
      }

      const userData = encodeURIComponent(JSON.stringify(user));
      res.redirect(`/?auth=success&user=${userData}`);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/login?error=oauth_failed");
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

      if (updateData.flow_data) {
        try {
          flowDataSchema.parse(updateData.flow_data);
        } catch (error) {
          return res.status(400).json({ message: "Invalid flow data format" });
        }
      }

      if (updateData.is_active === true) {
        const deployId =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

        const host = req.get("host") || "aiagent-studio.ai";
        const deployUrl = `https://${host}/agent/${deployId}`;

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

  app.post(
    "/api/agent/:deployId/execute",
    async (req: Request, res: Response) => {
      try {
        const { deployId } = req.params;
        const { input } = req.body;

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

        const flowData = flowDataSchema.parse(agent.flow_data);
        const result = await executeFlow(flowData, input);

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

  app.post("/api/direct-test", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res
          .status(400)
          .json({ success: false, error: "Prompt is required" });
      }

      const { testOpenAIExecution } = await import("./test-execution");
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

  app.post("/api/test-agent/create", async (req: Request, res: Response) => {
    try {
      const { createTestAgent } = await import("./test-agent");
      const flow_data = createTestAgent();
      const deployId = "test-agent-" + Math.floor(1000 + Math.random() * 9000);
      const host = req.get("host") || "aiagent-studio.ai";
      const deployUrl = `https://${host}/agent/${deployId}`;

      const agent = await storage.createAgent({
        user_id: 1,
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

  // Exchange rate endpoint
  app.get("/api/exchange-rate", async (req: Request, res: Response) => {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      const rate = response.data.rates.INR;
      res.json({ rate: rate || 83 });
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      res.json({ rate: 83 }); // Fallback rate
    }
  });

  // Create subscription
  app.post("/api/subscription/create", async (req: Request, res: Response) => {
    res.status(500).json({ message: "This route is not implemented" });
  });

  // Create manual payment endpoint
  app.post("/api/create-manual-payment", async (req: Request, res: Response) => {
    try {
      const { planId, userId, email, amount } = req.body;

      if (!planId || !userId || !email || !amount) {
        return res.status(400).json({ 
          message: "Plan ID, user ID, email, and amount are required" 
        });
      }

      // Get or create customer
      let customer;
      try {
        const customers = await razorpay.customers.all({ email: email });
        
        // Find exact email match
        const exactMatch = customers.items?.find(c => c.email === email);
        
        if (exactMatch) {
          customer = exactMatch;
          console.log("Found existing customer for manual payment:", customer.id, "email:", customer.email);
        } else {
          customer = await razorpay.customers.create({
            name: email.split("@")[0],
            email: email,
            contact: "",
            notes: {
              userId: userId.toString(),
            },
          });
          console.log("Created new customer for manual payment:", customer.id, "email:", customer.email);
        }
      } catch (customerError) {
        console.error("Failed to handle customer:", customerError);
        return res.status(500).json({
          message: "Failed to create or retrieve customer account",
        });
      }

      // Map plan ID to plan name and validate amount
      let planName: string;
      let expectedAmount: number;

      try {
        expectedAmount = await getINRAmountByPlanId(planId);

        switch (planId) {
          case "pro-monthly":
            planName = "Pro Monthly";
            break;
          case "pro-yearly":
            planName = "Pro Yearly";
            break;
          case "enterprise-monthly":
            planName = "Enterprise Monthly";
            break;
          case "enterprise-yearly":
            planName = "Enterprise Yearly";
            break;
          default:
            planName = `Plan ${planId}`;
        }

        // Validate the amount matches expected pricing (allow 5% variance for exchange rate fluctuations)
        const variance = Math.abs(amount - expectedAmount) / expectedAmount;
        if (variance > 0.05) {
          console.warn(`Amount mismatch for ${planId}: expected ${expectedAmount}, got ${amount}`);
        }
      } catch (error) {
        console.error("Error validating plan pricing:", error);
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Get proper host and protocol for callback URL
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("host")?.includes("replit.dev") ? "https" : "http";

      // Create payment link
      const paymentLink = await razorpay.paymentLink.create({
        amount: amount,
        currency: "INR",
        accept_partial: false,
        description: `Manual Payment for ${planName}`,
        customer: {
          id: customer.id
        },
        notify: {
          sms: false,
          email: true
        },
        reminder_enable: true,
        callback_url: `${protocol}://${host}/billing?payment_success=true&plan=${planId}&redirect=auto`,
        callback_method: 'get',
        notes: {
          planId: planId,
          planName: planName,
          userId: userId.toString(),
          paymentType: "manual"
        },
        // Force automatic redirection
        expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
        reference_id: `man_${userId}_${Date.now().toString().slice(-8)}`
      });

      res.json({
        success: true,
        paymentLink: paymentLink.short_url,
        paymentLinkId: paymentLink.id,
        customerId: customer.id,
        amount: amount,
        currency: "INR"
      });

    } catch (error: any) {
      console.error("Error creating manual payment:", error);
      res.status(500).json({
        message: "Failed to create manual payment",
        error: error.message
      });
    }
  });

  // Payment and subscription routes
  app.post(
    "/api/create-checkout-session",
    async (req: Request, res: Response) => {
      console.log("Create checkout session request received:", { body: req.body });

      try {
        const { planId, userId, email } = req.body;

        console.log("Processing checkout session for:", { planId, userId, email });

        if (!planId || !userId || !email) {
          console.log("Missing required fields");
          return res
            .status(400)
            .json({ message: "Plan ID, user ID, and email are required" });
        }

        // Get plan pricing from centralized configuration
        let planAmount: number;
        let planName: string;

        try {
          planAmount = await getINRAmountByPlanId(planId);

          switch (planId) {
            case "pro-monthly":
              planName = "Pro Monthly";
              break;
            case "pro-yearly":
              planName = "Pro Yearly";
              break;
            case "enterprise-monthly":
              planName = "Enterprise Monthly";
              break;
            case "enterprise-yearly":
              planName = "Enterprise Yearly";
              break;
            default:
              console.log("Invalid plan ID:", planId);
              return res.status(400).json({ message: "Invalid plan ID" });
          }

          if (planAmount === 0) {
            console.log("No pricing found for plan ID:", planId);
            return res.status(400).json({ message: "Invalid plan ID" });
          }
        } catch (error) {
          console.error("Error getting plan pricing:", error);
          return res.status(500).json({ message: "Failed to get plan pricing" });
        }

        console.log("Plan details:", { planAmount, planAmount, planName });

        let customer;
        try {
          console.log("Looking for existing customer with email:", email);
          const customers = await razorpay.customers.all({ email: email });
          
          // Properly filter to find exact email match
          const exactMatch = customers.items?.find(c => c.email === email);
          
          if (exactMatch) {
            customer = exactMatch;
            console.log("Found existing customer:", customer.id, "for email:", customer.email);
          } else {
            console.log("No exact email match found. Creating new customer.");
            throw new Error("No existing customer found");
          }
        } catch (customerError) {
          console.log("Creating new customer for email:", email);
          try {
            customer = await razorpay.customers.create({
              name: email.split("@")[0],
              email: email,
              contact: "",
              notes: {
                userId: userId.toString(),
              },
            });
            console.log("Created new customer:", customer.id, "for email:", customer.email);
          } catch (createError) {
            console.error("Failed to create customer:", createError);
            return res.status(500).json({
              message: "Failed to create customer account",
              error: createError.message,
            });
          }
        }

        const host = req.get("host") || "localhost:5000";
        const protocol = req.get("host")?.includes("replit.dev") ? "https" : "http";

        console.log("Creating payment link with:", {
          planAmount,
          customerId: customer.id,
          planName,
          host,
          protocol
        });

        // Try to create a proper Razorpay subscription first
        try {
          let razorpayPlanId: string;
          
          switch (planId) {
            case "pro-monthly":
              razorpayPlanId = PLAN_IDS.PRO_MONTHLY;
              break;
            case "pro-yearly":
              razorpayPlanId = PLAN_IDS.PRO_YEARLY;
              break;
            case "enterprise-monthly":
              razorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
              break;
            case "enterprise-yearly":
              razorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
              break;
            default:
              throw new Error("Invalid plan ID");
          }

          if (razorpayPlanId) {
            // Create actual Razorpay subscription
            const subscription = await razorpay.subscriptions.create({
              plan_id: razorpayPlanId,
              customer_id: customer.id,
              quantity: 1,
              total_count: 120, // 10 years
              notes: {
                userId: userId.toString(),
                planId: planId,
                planName: planName
              }
            });

            console.log("Razorpay subscription created:", subscription.id);

            return res.json({
              subscriptionId: subscription.id,
              customerId: customer.id,
              amount: planAmount,
              currency: "INR",
              status: subscription.status,
              short_url: subscription.short_url,
              success_url: `${protocol}://${host}/billing?subscription_success=true`,
              failure_url: `${protocol}://${host}/pricing?subscription_failed=true`,
            });
          }
        } catch (subscriptionError) {
          console.log("Subscription creation failed, falling back to payment link:", subscriptionError.message);
          
          // Fallback to payment link
          try {
            const paymentLink = await razorpay.paymentLink.create({
              amount: planAmount,
              currency: "INR",
              accept_partial: false,
              description: `Subscription: ${planName}`,
              customer: {
                id: customer.id
              },
              notify: {
                sms: false,
                email: true
              },
              reminder_enable: true,
              callback_url: `${protocol}://${host}/billing?payment_success=true&plan=${planId}&redirect=auto`,
              callback_method: 'get',
              notes: {
                planId: planId,
                planName: planName,
                userId: userId.toString()
              },
              expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
              reference_id: `chk_${userId}_${Date.now().toString().slice(-8)}`
            });

            console.log("Payment link created successfully:", paymentLink.short_url);

            return res.json({
              subscriptionId: `payment_link_${paymentLink.id}`,
              customerId: customer.id,
              amount: planAmount,
              currency: "INR",
              status: "created",
              short_url: paymentLink.short_url,
              payment_link_id: paymentLink.id,
              success_url: `${protocol}://${host}/billing?subscription_success=true`,
              failure_url: `${protocol}://${host}/pricing?subscription_failed=true`,
            });
          } catch (paymentLinkError) {
            console.error("Payment link creation also failed:", paymentLinkError);
            return res.status(500).json({
              message: "Failed to create subscription or payment link",
              error: paymentLinkError.message,
              details: "Unable to generate payment URL. Please try again.",
            });
          }
        }
      } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return res.status(500).json({
          message: "Failed to create checkout session",
          error: error.message || "Unknown error",
          details: "Server error occurred while processing payment request",
        });
      }
    },
  );

  app.post("/api/verify-payment", async (req: Request, res: Response) => {
    try {
      const { razorpay_subscription_id, userId } = req.body;

      if (razorpay_subscription_id) {
        let subscription;
        try {
          subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);
        } catch (fetchError: any) {
          return res.status(400).json({
            message: "Invalid subscription ID or subscription not found.",
            error: "SUBSCRIPTION_NOT_FOUND",
          });
        }

        if (subscription.status === "active" || subscription.status === "authenticated") {
          const planName = getPlanNameFromId(subscription.plan_id);
          const existingSubscription = await storage.getSubscriptionByUserId(parseInt(userId));

          if (!existingSubscription || existingSubscription.razorpay_subscription_id !== subscription.id) {
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
          }

          res.json({
            success: true,
            message: "Subscription verified successfully",
            subscription: {
              id: subscription.id,
              status: subscription.status,
              plan_name: planName,
            },
          });
        } else {
          res.status(400).json({
            message: `Subscription status: ${subscription.status}. Please complete the payment.`,
          });
        }
      } else {
        res.status(400).json({ message: "Subscription ID required for verification" });
      }
    } catch (error){
      console.error("Error verifying subscription:", error);
      res.status(500).json({ message: "Failed to verify subscription" });
    }
  });

  app.get("/api/subscription/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      const subscription = await storage.getSubscriptionByUserId(userId);

      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }

      return res.status(200).json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/payment-history/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Valid user ID is required" });
      }

      const paymentHistory = await storage.getPaymentHistoryByUserId(userId);
      return res.status(200).json(paymentHistory);
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Plan upgrade/downgrade routes
  app.post("/api/subscription/:id/upgrade", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPlanId, userId } = req.body;

      if (!newPlanId || !userId) {
        return res.status(400).json({ error: "New plan ID and user ID are required" });
      }

      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      let actualRazorpayPlanId: string;
      let newPlanName: string;
      let planAmount: number;

      try {
        planAmount = await getINRAmountByPlanId(newPlanId);

        switch (newPlanId) {
          case "pro-monthly":
            actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
            newPlanName = "Pro Monthly";
            break;
          case "pro-yearly":
            actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
            newPlanName = "Pro Yearly";
            break;
          case "enterprise-monthly":
            actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
            newPlanName = "Enterprise Monthly";
            break;
          case "enterprise-yearly":
            actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
            newPlanName = "Enterprise Yearly";
            break;
          default:
            return res.status(400).json({ error: "Invalid plan ID for upgrade" });
        }

        if (planAmount === 0) {
          return res.status(400).json({ error: "Invalid plan pricing" });
        }
      } catch (error) {
        console.error("Error getting upgrade pricing:", error);
        return res.status(500).json({ error: "Failed to get plan pricing" });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customer;
      try {
        const existingCustomers = await razorpay.customers.all({
          email: user.email,
          count: 10, // Get more results to check
        });

        // Find exact email match
        const exactMatch = existingCustomers.items?.find(c => c.email === user.email);

        if (exactMatch) {
          customer = exactMatch;
          console.log("Found existing customer for upgrade:", customer.id, "email:", customer.email);
        } else {
          customer = await razorpay.customers.create({
            name: user.username,
            email: user.email,
            contact: "+919000000000",
          });
          console.log("Created new customer for upgrade:", customer.id, "email:", customer.email);
        }
      } catch (customerError) {
        console.error("Failed to handle customer for upgrade:", customerError);
        return res.status(500).json({ error: "Failed to handle customer" });
      }

      try {
        const paymentLink = await razorpay.paymentLink.create({
          amount: planAmount,
          currency: "INR",
          accept_partial: false,
          customer: {
            id: customer.id,
          },
          description: `Upgrade to ${newPlanName}`,
          callback_url: `${req.protocol}://${req.get('host')}/billing?payment_success=true&plan=${newPlanId}&redirect=auto`,
          callback_method: 'get',
          notes: {
            userId: userId,
            planId: actualRazorpayPlanId,
            planName: newPlanName,
            upgradeFrom: subscription.plan_name,
            upgradeTo: newPlanName,
          },
          // Force automatic redirection
          expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
          reference_id: `upg_${userId}_${Date.now().toString().slice(-8)}`
        });

        res.json({
          success: true,
          paymentRequired: true,
          paymentLink: paymentLink.short_url,
          message: `To upgrade to ${newPlanName}, please complete the payment`,
          upgradeDetails: {
            currentPlan: subscription.plan_name,
            newPlan: newPlanName,
            amount: planAmount / 100,
            currency: "INR",
          },
        });
      } catch (paymentError) {
        res.status(500).json({
          error: "Failed to create upgrade payment",
          message: "Please try again or contact support",
        });
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  app.post("/api/subscription/:id/downgrade", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPlanId, userId } = req.body;

      if (!newPlanId || !userId) {
        return res.status(400).json({ error: "New plan ID and user ID are required" });
      }

      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      let newPlanName: string;
      let actualRazorpayPlanId: string;

      switch (newPlanId) {
        case "pro-monthly":
          newPlanName = "Pro Monthly";
          actualRazorpayPlanId = PLAN_IDS.PRO_MONTHLY;
          break;
        case "pro-yearly":
          newPlanName = "Pro Yearly";
          actualRazorpayPlanId = PLAN_IDS.PRO_YEARLY;
          break;
        case "enterprise-monthly":
          newPlanName = "Enterprise Monthly";
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_MONTHLY;
          break;
        case "enterprise-yearly":
          newPlanName = "Enterprise Yearly";
          actualRazorpayPlanId = PLAN_IDS.ENTERPRISE_YEARLY;
          break;
        default:
          return res.status(400).json({ error: "Invalid plan ID for downgrade" });
      }

      const subscriptionIdToUpdate =
        subscription.razorpay_subscription_id ||
        subscription.stripe_subscription_id ||
        id;

      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: "active",
        plan_name: newPlanName,
        plan_id: actualRazorpayPlanId,
        price_id: actualRazorpayPlanId,
        updated_at: new Date(),
      });

      await storage.createPaymentHistory({
        user_id: parseInt(userId),
        razorpay_payment_id: `downgrade_${subscriptionIdToUpdate}_${Date.now()}`,
        amount: 0,
        currency: "INR",
        status: "succeeded",
        description: `Plan downgraded from ${subscription.plan_name} to ${newPlanName}`,
      });

      res.json({
        success: true,
        subscription: dbUpdate,
        message: `Successfully downgraded from ${subscription.plan_name} to ${newPlanName}`,
      });
    } catch (error) {
      console.error("Error downgrading subscription:", error);
      res.status(500).json({ error: "Failed to downgrade subscription" });
    }
  });

  app.post("/api/subscription/:id/cancel", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const subscriptionIdToUpdate =
        subscription.razorpay_subscription_id ||
        subscription.stripe_subscription_id ||
        id;

      try {
        await razorpay.subscriptions.cancel(subscriptionIdToUpdate, {
          cancel_at_cycle_end: 1,
        });
      } catch (razorpayError: any) {
        console.error("Error cancelling Razorpay subscription:", razorpayError);
      }

      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: "cancelled",
        cancel_at_period_end: false,
        updated_at: new Date(),
      });

      if (userId) {
        await storage.createPaymentHistory({
          user_id: parseInt(userId),
          razorpay_payment_id: `cancel_${subscriptionIdToUpdate}_${Date.now()}`,
          amount: 0,
          currency: "INR",
          status: "succeeded",
          description: `Subscription cancelled: ${subscription.plan_name}`,
        });
      }

      res.json({
        success: true,
        subscription: dbUpdate,
        message: "Subscription cancelled successfully.",
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.post("/api/subscription/:id/downgrade-to-free", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const subscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!subscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      const subscriptionIdToUpdate =
        subscription.razorpay_subscription_id ||
        subscription.stripe_subscription_id ||
        id;

      // Cancel the Razorpay subscription if it exists
      try {
        if (subscription.razorpay_subscription_id) {
          await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, {
            cancel_at_cycle_end: 0, // Cancel immediately
          });
        }
      } catch (razorpayError: any) {
        console.error("Error cancelling Razorpay subscription:", razorpayError);
        // Continue with local cancellation even if Razorpay fails
      }

      // Update subscription status to cancelled
      const dbUpdate = await storage.updateSubscription(subscriptionIdToUpdate, {
        status: "cancelled",
        plan_name: "Free",
        plan_id: "free",
        price_id: "free",
        cancel_at_period_end: false,
        updated_at: new Date(),
      });

      // Create payment history record for the downgrade
      await storage.createPaymentHistory({
        user_id: parseInt(userId),
        razorpay_payment_id: `downgrade_free_${subscriptionIdToUpdate}_${Date.now()}`,
        amount: 0,
        currency: "INR",
        status: "succeeded",
        description: `Plan downgraded from ${subscription.plan_name} to Free`,
      });

      res.json({
        success: true,
        subscription: dbUpdate,
        message: "Successfully downgraded to Free plan. Your subscription has been cancelled.",
      });
    } catch (error) {
      console.error("Error downgrading to free:", error);
      res.status(500).json({ error: "Failed to downgrade to free plan" });
    }
  });

  // Contact form submission route
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const contactData = validateBody(insertContactSchema, req.body);

      console.log("Contact form submission received:", {
        ...contactData,
        timestamp: new Date().toISOString(),
      });

      // Save contact submission
      let submission;
      try {
        submission = await storage.createContactSubmission(contactData);
        console.log("Contact submission saved successfully:", submission.id);
      } catch (storageError) {
        console.error("Error saving contact submission:", storageError);
        return res.status(500).json({ 
          message: "Failed to save contact submission. Please try again.",
          error: "STORAGE_ERROR"
        });
      }

      // Send email notifications (optional - don't fail if this fails)
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await sendContactFormNotifications(contactData);
          console.log("Email notifications sent successfully");
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError);
          // Don't fail the request if email fails - just log it
        }
      } else {
        console.log("Email credentials not configured - skipping email notifications");
      }

      return res.status(201).json({ 
        message: "Contact form submitted successfully. We'll get back to you within 24 hours.",
        success: true,
        submissionId: submission?.id || "unknown"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error processing contact form:", error);
      return res.status(500).json({ 
        message: "Internal server error. Please try again or contact support.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Waitlist route
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const { email } = validateBody(insertWaitlistSchema, req.body);

      const entries = await storage.getWaitlistEntries();
      const exists = entries.some((entry) => entry.email === entry);

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

  const httpServer = createServer(app);
  return httpServer;
}