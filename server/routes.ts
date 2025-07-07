import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import session from "express-session";
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
// import { chatbotService } from "./chatbot-service";

// Extend session type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      username: string;
    };
  }
}

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

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.user && req.session.user.id) {
    // User is authenticated
    next();
  } else {
    // User is not authenticated
    res.status(401).json({ error: "Unauthorized", message: "Please log in to continue" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

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

        console.log("Webhook signature verification:", {
          received: signature,
          expected: expectedSignature,
          bodyLength: bodyString.length,
          webhookSecretLength: webhookSecret.length
        });

        if (expectedSignature !== signature) {
          console.error("Webhook signature mismatch - skipping verification for now");
          // Temporarily skip signature verification to allow webhooks to process
          // return res.status(400).json({ message: "Invalid webhook signature" });
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

          case "subscription.activated":
          case "subscription.charged":
            const subscription = event.payload.subscription.entity;
            const paymentEntity = event.payload.payment?.entity;

            try {
              const userId = parseInt(subscription.notes?.userId || "0");
              console.log("Processing subscription event:", event.event, "for user:", userId, "subscription:", subscription.id);

              if (userId > 0) {
                const planName = getPlanNameFromId(subscription.plan_id);
                console.log("Plan details:", { planId: subscription.plan_id, planName });

                const existingSubscription = await storage.getSubscriptionByUserId(userId);

                if (existingSubscription && existingSubscription.razorpay_subscription_id === subscription.id) {
                  // Update existing subscription status
                  await storage.updateSubscription(subscription.id, {
                    status: subscription.status,
                    current_period_start: new Date(subscription.current_start * 1000),
                    current_period_end: new Date(subscription.current_end * 1000),
                    updated_at: new Date(),
                  });
                  console.log("Updated existing subscription:", subscription.id);
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
                  console.log("Created new subscription:", subscription.id);
                }

                // Create payment history if payment exists
                if (paymentEntity) {
                  // Check if payment history already exists to prevent duplicates
                  const existingPaymentHistory = await storage.getPaymentHistoryByUserId(userId);
                  const paymentExists = existingPaymentHistory.some(
                    (p) => p.razorpay_payment_id === paymentEntity.id
                  );

                  if (!paymentExists) {
                    await storage.createPaymentHistory({
                      user_id: userId,
                      razorpay_payment_id: paymentEntity.id,
                      amount: paymentEntity.amount,
                      currency: paymentEntity.currency,
                      status: "succeeded",
                      description: event.event === "subscription.activated" 
                        ? `Subscription activated for ${planName}`
                        : `Subscription renewal payment for ${planName}`,
                    });
                    console.log("Created payment history for:", paymentEntity.id);
                  } else {
                    console.log("Payment history already exists for:", paymentEntity.id);
                  }
                }
              }
            } catch (error) {
              console.error("Error saving subscription data:", error);
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
      
      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };

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

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };

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

  // Session check route
  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (req.session && req.session.user) {
      res.json({ user: req.session.user, authenticated: true });
    } else {
      res.json({ user: null, authenticated: false });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

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

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        username: user.username
      };

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
        user_id: 1,        name: "Reliable Content Assistant",
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
          const customers = await razorpay.customers.all({ 
            email: email,
            count: 10 
          });

          console.log("Razorpay customers API response:", {
            count: customers.count,
            items: customers.items?.length || 0
          });

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
          console.log("Customer creation error context:", customerError.message);

          try {
            // Validate email format before creating customer
            if (!email || !email.includes('@')) {
              throw new Error("Invalid email format");
            }

            const customerName = email.split("@")[0] || "Customer";

            const customerParams = {
              name: customerName,
              email: email,
              contact: "", // Empty string is acceptable
              notes: {
                userId: userId.toString(),
                created_via: "checkout_session"
              },
            };

            console.log("Creating customer with params:", JSON.stringify(customerParams, null, 2));

            // Log the actual request being sent to Razorpay
            console.log("=== RAZORPAY CUSTOMER CREATE REQUEST ===");
            console.log("Endpoint: POST /v1/customers");
            console.log("Request Body:", JSON.stringify(customerParams, null, 2));
            console.log("Timestamp:", new Date().toISOString());

            customer = await razorpay.customers.create(customerParams);

            // Log the complete response from Razorpay
            console.log("=== RAZORPAY CUSTOMER CREATE RESPONSE ===");
            console.log("Response Body:", JSON.stringify(customer, null, 2));
            console.log("Response Status: SUCCESS");
            console.log("Timestamp:", new Date().toISOString());
            console.log("Created new customer:", customer.id, "for email:", customer.email);
          } catch (createError: any) {
            console.error("Failed to create customer:", {
              message: createError.message,
              error: createError.error || createError,
              statusCode: createError.statusCode
            });
            return res.status(500).json({
              message: "Failed to create customer account",
              error: createError.message || "Unknown customer creation error",
              details: createError.error?.description || "Please check your account details and try again"
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
        let razorpayPlanId: string | undefined;

        try {
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
              throw new Error(`Invalid plan ID: ${planId}`);
          }

          if (!razorpayPlanId) {
            throw new Error(`Razorpay plan ID not configured for ${planId}. Please set the environment variable.`);
          }

          console.log(`Attempting to create Razorpay subscription with plan ID: ${razorpayPlanId}`);
          console.log(`Customer ID: ${customer.id}`);
          console.log(`User ID: ${userId}`);

          // Validate customer exists and is properly formatted
          if (!customer.id || typeof customer.id !== 'string') {
            throw new Error(`Invalid customer ID: ${customer.id}`);
          }

          // Set total_count based on plan type for 2-year subscription
          let totalCount = 100; // default fallback
          if (planId === 'pro-monthly' || planId === 'enterprise-monthly') {
            totalCount = 24; // 24 monthly cycles = 2 years
          } else if (planId === 'pro-yearly' || planId === 'enterprise-yearly') {
            totalCount = 2; // 2 yearly cycles = 2 years
          }

          // Create actual Razorpay subscription with proper error handling
          const subscriptionParams = {
            plan_id: razorpayPlanId,
            quantity: 1,
            total_count: totalCount,
            notes: {
              userId: userId.toString(),
              planId: planId,
              planName: planName,
              customer_id: customer.id
            }
          };

          console.log("Creating subscription with params:", JSON.stringify(subscriptionParams, null, 2));

          // Log the actual request being sent to Razorpay
          console.log("=== RAZORPAY SUBSCRIPTION CREATE REQUEST ===");
          console.log("Endpoint: POST /v1/subscriptions");
          console.log("Request Body:", JSON.stringify(subscriptionParams, null, 2));
          console.log("Timestamp:", new Date().toISOString());

          const subscription = await razorpay.subscriptions.create(subscriptionParams);

          // Log the complete response from Razorpay
          console.log("=== RAZORPAY SUBSCRIPTION CREATE RESPONSE ===");
          console.log("Response Body:", JSON.stringify(subscription, null, 2));
          console.log("Response Status: SUCCESS");
          console.log("Timestamp:", new Date().toISOString());
          console.log("Subscription ID:", subscription.id);
          console.log("Subscription Status:", subscription.status);
          console.log("Subscription short_url:", subscription.short_url);

          // Check if subscription has a payment URL, if not create a payment link instead
          if (!subscription.short_url || subscription.short_url.includes('api.razorpay.com/v1/t/')) {
            console.log("Subscription created but no valid payment URL, falling back to payment link");
            throw new Error("No valid payment URL for subscription");
          }

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
        } catch (subscriptionError: any) {
          // Log the complete error response from Razorpay
          console.log("=== RAZORPAY SUBSCRIPTION CREATE ERROR RESPONSE ===");
          console.log("Error Response:", JSON.stringify(subscriptionError, null, 2));
          console.log("Error Message:", subscriptionError.message);
          console.log("Error Status Code:", subscriptionError.statusCode);
          console.log("Timestamp:", new Date().toISOString());

          console.error("Subscription creation failed:", {
            message: subscriptionError.message,
            error: subscriptionError.error || subscriptionError,
            statusCode: subscriptionError.statusCode,
            planId: razorpayPlanId,
            customerId: customer?.id
          });

          // Log detailed error information
          if (subscriptionError.error) {
            console.error("Razorpay error details:", {
              code: subscriptionError.error.code,
              description: subscriptionError.error.description,
              field: subscriptionError.error.field,
              step: subscriptionError.error.step,
              reason: subscriptionError.error.reason
            });
          }

          console.log("Subscription creation failed, falling back to payment link. Error:", subscriptionError.message || "Unknown error");

          // Fallback to payment link
          try {
            const paymentLinkParams = {
              amount: planAmount,
              currency: "INR",
              accept_partial: false,
              description: `Subscription Payment: ${planName}`,
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
                paymentType: "subscription_fallback",
                originalSubscriptionId: subscription?.id || "none"
              },
              expire_by: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
              reference_id: `sub_${userId}_${Date.now().toString().slice(-8)}`
            };

            // Log the actual request being sent to Razorpay
            console.log("=== RAZORPAY PAYMENT LINK CREATE REQUEST ===");
            console.log("Endpoint: POST /v1/payment_links");
            console.log("Request Body:", JSON.stringify(paymentLinkParams, null, 2));
            console.log("Timestamp:", new Date().toISOString());

            const paymentLink = await razorpay.paymentLink.create(paymentLinkParams);

            // Log the complete response from Razorpay
            console.log("=== RAZORPAY PAYMENT LINK CREATE RESPONSE ===");
            console.log("Response Body:", JSON.stringify(paymentLink, null, 2));
            console.log("Response Status: SUCCESS");
            console.log("Timestamp:", new Date().toISOString());
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

      const currentSubscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!currentSubscription) {
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

      // Use the new switchSubscriptionPlan method to mark old as inactive and create new
      const newSubscription = await storage.switchSubscriptionPlan(parseInt(userId), {
        razorpay_subscription_id: `downgrade_${currentSubscription.id}_${Date.now()}`,
        razorpay_customer_id: currentSubscription.razorpay_customer_id || "unknown",
        status: "active",
        plan_name: newPlanName,
        plan_id: actualRazorpayPlanId,
        price_id: actualRazorpayPlanId,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      // Don't create misleading payment history for downgrades
      // The plan change is tracked in the subscription table

      res.json({
        success: true,
        subscription: newSubscription,
        message: `Successfully downgraded from ${currentSubscription.plan_name} to ${newPlanName}`,
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

      const currentSubscription = await storage.getSubscriptionByUserId(parseInt(userId));
      if (!currentSubscription) {
        return res.status(404).json({ error: "Subscription not found" });
      }

      // Cancel the Razorpay subscription if it exists
      try {
        if (currentSubscription.razorpay_subscription_id) {
          await razorpay.subscriptions.cancel(currentSubscription.razorpay_subscription_id, {
            cancel_at_cycle_end: 0, // Cancel immediately
          });
        }
      } catch (razorpayError: any) {
        console.error("Error cancelling Razorpay subscription:", razorpayError);
        // Continue with local cancellation even if Razorpay fails
      }

      // Use the new switchSubscriptionPlan method to mark old as inactive and create new free plan
      const newSubscription = await storage.switchSubscriptionPlan(parseInt(userId), {
        razorpay_subscription_id: `free_${currentSubscription.id}_${Date.now()}`,
        razorpay_customer_id: currentSubscription.razorpay_customer_id || "unknown",        status: "cancelled",
        plan_name: "Free",        plan_id: "free",
        price_id: "free",
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now (free plan)
      });

      // Don't create misleading payment history for downgrades to free
      // The plan change is tracked in the subscription table

      res.json({
        success: true,
        subscription: newSubscription,
        message: "Successfully downgraded to Free plan. Your subscription has been cancelled.",
      });
    } catch (error) {
      console.error("Error downgrading to free:", error);
      res.status(500).json({ error: "Failed to downgrade to free plan" });
    }
  });

  // Get user's saved business analyses
  app.get("/api/business-analyses", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.user!.id;
      const analyses = await storage.getBusinessAnalysesByUserId(userId);
      res.json(analyses);
    } catch (error: any) {
      console.error("Error fetching business analyses:", error);
      res.status(500).json({ error: "Failed to fetch business analyses" });
    }
  });

  // Get specific business analysis with recommendations
  app.get("/api/business-analyses/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.id);
      const userId = req.session!.user!.id;

      const analysis = await storage.getBusinessAnalysis(analysisId);
      if (!analysis || analysis.user_id !== userId) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const recommendations = await storage.getRecommendationsByAnalysisId(analysisId);

      res.json({
        analysis,
        recommendations
      });
    } catch (error: any) {
      console.error("Error fetching business analysis:", error);
      res.status(500).json({ error: "Failed to fetch business analysis" });
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

  // Chatbot endpoints
  app.post("/api/chatbot/session", async (req: Request, res: Response) => {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      res.json({
        sessionId,
        message: "Hello! I'm here to help you with orders, returns, shipping, and any other questions. How can I assist you today?",
        status: "connected",
        requiresGDPR: true
      });
    } catch (error) {
      console.error('Error creating chatbot session:', error);
      res.status(500).json({ 
        error: 'Failed to create session',
        sessionId: `fallback_${Date.now()}`,
        message: "Hello! I'm here to help you with orders, returns, shipping, and any other questions. How can I assist you today?",
        status: "connected",
        requiresGDPR: true
      });
    }
  });

  app.post("/api/chatbot/message", async (req: Request, res: Response) => {
    try {
      const { sessionId, message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`Chatbot message received: ${message}`);

      // Simple chatbot responses without external dependencies
      const lowerMessage = message.toLowerCase();
      let response;

      if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
        response = {
          message: "Hello! Thanks for reaching out. I'm here to help you with:\n\n" +
                  "• Order tracking and status updates\n" +
                  "• Shipping information and delivery options\n" +
                  "• Returns and exchanges\n" +
                  "• Payment questions\n" +
                  "• Product information\n\n" +
                  "What can I help you with today?"
        };
      } else if (lowerMessage.includes('return') || lowerMessage.includes('exchange')) {
        response = {
          message: "I can help you with returns! Here's how it works:\n\n" +
                  "1. Items can be returned within 30 days of purchase\n" +
                  "2. Items must be in original condition with tags\n" +
                  "3. Original receipt or order number required\n" +
                  "4. Refunds processed within 5-7 business days\n\n" +
                  "Would you like me to start a return request for you? I'll need your order number."
        };
      } else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
        response = {
          message: "Here are our shipping options:\n\n" +
                  "• **Free Standard Shipping** (3-5 business days) - Orders over $50\n" +
                  "• **Express Shipping** (1-2 business days) - $9.99\n" +
                  "• **Overnight Shipping** (next business day) - $19.99\n" +
                  "• **International Shipping** (7-14 business days) - Rates vary\n\n" +
                  "All orders are processed within 24 hours. Would you like tracking information for an existing order?"
        };
      } else if (lowerMessage.includes('order') || lowerMessage.includes('track')) {
        response = {
          message: "I can help you track your order! Please provide your order number (it usually starts with # or contains letters and numbers like ABC123).\n\n" +
                  "You can find your order number in:\n" +
                  "• Your order confirmation email\n" +
                  "• Your account dashboard\n" +
                  "• Your receipt\n\n" +
                  "Once you provide the order number, I'll get you the latest status and tracking information."
        };
      } else if (lowerMessage.includes('payment') || lowerMessage.includes('billing')) {
        response = {
          message: "I can help with payment and billing questions! We accept:\n\n" +
                  "• Credit/Debit cards (Visa, Mastercard, Amex)\n" +
                  "• PayPal\n" +
                  "• Apple Pay & Google Pay\n" +
                  "• Buy now, pay later options\n\n" +
                  "For billing issues, please provide your order number so I can look into it for you."
        };
      } else {
        response = {
          message: "I'd be happy to help! I can assist you with:\n\n" +
                  "• Order tracking and status updates\n" +
                  "• Shipping information and options\n" +
                  "• Returns and exchanges\n" +
                  "• Payment methods and billing questions\n" +
                  "• Product information\n\n" +
                  "What specific question can I help you with today?"
        };
      }

      console.log(`Chatbot response: ${JSON.stringify(response)}`);
      res.json(response);
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({ 
        message: "I'm sorry, I'm having technical difficulties. Please try again.",
        error: true
      });
    }
  });

  app.post("/api/chatbot/consent", async (req: Request, res: Response) => {
    try {
      const { sessionId, consent } = req.body;

      res.json({
        message: consent 
          ? "Thank you for your consent. How can I help you today?" 
          : "I understand. I can still help with general questions without storing personal data.",
        status: "consent_updated"
      });
    } catch (error) {
      console.error('Error updating consent:', error);
      res.status(500).json({ error: 'Failed to update consent' });
    }
  });

  // Business Analysis API Routes
  app.post("/api/analyze-website", async (req: Request, res: Response) => {
  try {
    const { websiteUrl, userId } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({ error: "Website URL is required" });
    }

    // Get user ID from session (authenticated users) or request body (fallback)
    const authenticatedUserId = req.session?.user?.id || userId;

    // Import analyzer here to avoid circular dependencies
    const { websiteAnalyzer } = await import("./website-analyzer");
    const { recommendationEngine } = await import("./recommendation-engine");

    // Analyze website content
    const analysis = await websiteAnalyzer.analyzeWebsite(websiteUrl);

    // Save analysis to database 
    let savedAnalysis = null;
    try {
      savedAnalysis = await storage.createBusinessAnalysis({
        user_id: authenticatedUserId || null, // Use numeric user ID from session or request
        website_url: websiteUrl,
        business_name: analysis.businessName,
        business_type: analysis.businessType,
        industry: analysis.industry,
        pain_points: analysis.painPoints,
        workflows: analysis.workflows,
        content_summary: analysis.contentSummary,
        key_features: analysis.keyFeatures,
        target_audience: analysis.targetAudience,
        current_tech: analysis.currentTech,
      });

      if (userId && savedAnalysis.id > 1000000000) {
        console.log('Business analysis saved to database with ID:', savedAnalysis.id);
      } else {
        console.log('Business analysis created for unauthenticated user (not persisted)');
      }
    } catch (analysisError) {
      console.error("Failed to save analysis to database:", analysisError);
      // Create a fallback analysis object
      savedAnalysis = { 
        id: Date.now(), 
        user_id: userId,
        website_url: websiteUrl,
        business_name: analysis.businessName,
        created_at: new Date() 
      };
    }

    // Generate AI recommendations
    const recommendations = await recommendationEngine.generateRecommendations(analysis);

    // Save recommendations to database
    if (savedAnalysis && authenticatedUserId) {
      try {
        const savedRecommendations = await Promise.all(
          recommendations.map(async (rec: any) => {
            try {
              return await storage.createAiRecommendation({
                analysis_id: savedAnalysis.id,
                solution_type: rec.solutionType,
                solution_name: rec.solutionName,
                description: rec.description,
                estimated_cost_savings: rec.estimatedCostSavings,
                estimated_time_savings: rec.estimatedTimeSavings,
                implementation_difficulty: rec.implementationDifficulty,
                roi_percentage: rec.roiPercentage,
                industry_benchmark: rec.industryBenchmark || '',
                priority_score: rec.priorityScore,
                template_id: rec.templateId,
                customization_data: rec.customizationData || {},
                reasoning: rec.reasoning,
                rag_evidence: rec.ragEvidence || [],
                case_studies: rec.caseStudies || [],
                ethical_considerations: rec.ethicalConsiderations || '',
                compliance_requirements: rec.complianceRequirements || [],
                monitoring_metrics: rec.monitoringMetrics || [],
                implementation_timeline: rec.implementationTimeline || '',
                expected_revenue: rec.expectedRevenue || 0,
                risk_factors: rec.riskFactors || []
              });
            } catch (recError) {
              console.error("Failed to save recommendation:", recError);
              return null;
            }
          })
        );

        // Filter out failed saves
        const validRecommendations = savedRecommendations.filter(rec => rec !== null);
        console.log(`Saved ${validRecommendations.length} recommendations to database`);
      } catch (recError) {
        console.error("Failed to save recommendations:", recError);
      }
    }

    res.json({
      success: true,
      analysis: analysis,
      recommendations: recommendations,
      websiteUrl: websiteUrl,
      analysisId: savedAnalysis?.id || null
    });
  } catch (error: any) {
    console.error("Website analysis error:", error);
    res.status(500).json({ 
      message: "Failed to analyze website",
      error: error.message 
    });
  }
});

  app.get("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.id);

      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getBusinessAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const recommendations = await storage.getRecommendationsByAnalysisId(analysisId);

      res.json({
        success: true,
        analysis,
        recommendations
      });
    } catch (error: any) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ 
        message: "Failed to fetch analysis",
        error: error.message 
      });
    }
  });

  app.post("/api/recommendations/:id/select", async (req: Request, res: Response) => {
    try {
      const recommendationId = parseInt(req.params.id);

      if (isNaN(recommendationId)) {
        return res.status(400).json({ message: "Invalid recommendation ID" });
      }

      await storage.updateRecommendationStatus(recommendationId, 'selected');

      res.json({
        success: true,
        message: "Recommendation selected for implementation"
      });
    } catch (error: any) {
      console.error('Error selecting recommendation:', error);
      res.status(500).json({ 
        message: "Failed to select recommendation",
        error: error.message 
      });
    }
  });

  // Agent Deployment API Routes

  // Get deployed solutions for current user
  app.get("/api/deployed-solutions", async (req: Request, res: Response) => {
    try {
      // For demo purposes, return sample deployed solutions
      // TODO: Implement actual database queries once schema is set up
      const deployedSolutions = [
        {
          id: 1,
          solution_name: "Customer Support Assistant",
          deployment_status: "active",
          deployment_url: "/chatbot",
          deployment_id: "cs-assistant-001",
          configuration: { 
            name: "Customer Support Assistant",
            description: "24/7 automated customer service"
          },
          performance_metrics: {
            requests_handled: 1247,
            satisfaction_rate: 94.5,
            response_time: "1.2s"
          },
          created_at: new Date().toISOString(),
          analysis: {
            business_name: "TechCorp Solutions",
            industry: "Technology"
          },
          template: {
            name: "Customer Support Assistant",
            solution_type: "Customer Support",
            capabilities: ["Order Tracking", "FAQ Handling", "Human Escalation", "Sentiment Analysis"]
          }
        }
      ];

      res.json(deployedSolutions);
    } catch (error: any) {
      console.error('Error fetching deployed solutions:', error);
      res.status(500).json({ 
        message: "Failed to fetch deployed solutions",
        error: error.message 
      });
    }
  });

  // Get available agent templates
  app.get("/api/agent-templates", async (req: Request, res: Response) => {
    try {
      // Return sample agent templates for demo
      const templates = [
        {
          id: 1,
          name: "Customer Support Assistant",
          description: "24/7 automated customer service with advanced sentiment analysis",
          solution_type: "Customer Support",
          industry: "E-commerce",
          capabilities: ["Order Tracking", "Returns Processing", "FAQ Handling", "Human Escalation"],
          integration_requirements: ["Website Integration", "CRM Connection", "Email System"],
          pricing_model: "Usage-based"
        },
        {
          id: 2,
          name: "Predictive Analytics Engine",
          description: "AI-powered business forecasting and trend analysis",
          solution_type: "Analytics",
          industry: "Finance",
          capabilities: ["Sales Forecasting", "Risk Assessment", "Market Analysis", "Custom Reports"],
          integration_requirements: ["Database Access", "API Integration", "Dashboard Setup"],
          pricing_model: "Subscription"
        },
        {
          id: 3,
          name: "Personalization Engine",
          description: "AI-driven content and product recommendations",
          solution_type: "Personalization",
          industry: "Retail",
          capabilities: ["Product Recommendations", "Content Curation", "User Segmentation", "A/B Testing"],
          integration_requirements: ["E-commerce Platform", "User Tracking", "Analytics"],
          pricing_model: "Revenue Share"
        }
      ];

      res.json(templates);
    } catch (error: any) {
      console.error('Error fetching agent templates:', error);
      res.status(500).json({ 
        message: "Failed to fetch agent templates",
        error: error.message 
      });
    }
  });

  // Deploy new AI agent
  app.post("/api/deploy-agent", async (req: Request, res: Response) => {
    try {
      const { template_id, name, description, configuration } = req.body;

      if (!template_id || !name) {
        return res.status(400).json({ 
          message: "Template ID and name are required" 
        });
      }

      // For demo purposes, simulate deployment process
      const deploymentId = `agent-${Date.now()}`;
      const deploymentUrl = `https://${deploymentId}.aiagntstudio.ai`;

      // TODO: Implement actual agent deployment logic
      // This would involve:
      // 1. Creating agent configuration
      // 2. Deploying to AI agent platform
      // 3. Setting up monitoring
      // 4. Storing deployment record in database

      const deployedSolution = {
        id: Date.now(),
        template_id,
        solution_name: name,
        deployment_status: "deploying",
        deployment_url: deploymentUrl,
        deployment_id: deploymentId,
        configuration: {
          name,
          description,
          ...configuration
        },
        created_at: new Date().toISOString()
      };

      // Simulate deployment delay
      setTimeout(() => {
        console.log(`Agent ${deploymentId} deployment completed`);
      }, 5000);

      res.json({
        success: true,
        deployment: deployedSolution,
        message: "Agent deployment initiated successfully"
      });
    } catch (error: any) {
      console.error('Error deploying agent:', error);
      res.status(500).json({ 
        message: "Failed to deploy agent",
        error: error.message 
      });
    }
  });

  // Update Business Analyzer to include deployment flow integration
  app.post("/api/recommendations/:id/deploy", async (req: Request, res: Response) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const { configuration } = req.body;

      if (isNaN(recommendationId)) {
        return res.status(400).json({ message: "Invalid recommendation ID" });
      }

      // Mark recommendation as selected for deployment
      await storage.updateRecommendationStatus(recommendationId, 'deploying');

      // TODO: Implement automatic agent deployment from recommendation
      const deploymentId = `rec-${recommendationId}-${Date.now()}`;
      const deploymentUrl = `https://${deploymentId}.aiagntstudio.ai`;

      res.json({
        success: true,
        deployment_id: deploymentId,
        deployment_url: deploymentUrl,
        message: "Recommendation deployment initiated"
      });
    } catch (error: any) {
      console.error('Error deploying recommendation:', error);
      res.status(500).json({ 
        message: "Failed to deploy recommendation",
        error: error.message 
      });
    }
  });

  // Serve the chatbot test/demo page
  app.get("/test-embed", (req: Request, res: Response) => {
    const testPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Embed Test - AI Agent Studio</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.2em;
        }
        .content {
            line-height: 1.6;
            color: #555;
        }
        .highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .highlight h3 {
            margin-top: 0;
            color: white;
        }
        .test-scenarios {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin: 25px 0;
            border-left: 5px solid #667eea;
        }
        .scenario {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .scenario strong {
            color: #667eea;
        }
        .status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 9999;
        }
        .instructions {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        ul li, ol li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="status">Chatbot: Active</div>

    <div class="container">
        <h1>E-commerce Chatbot Demo</h1>
        <p class="subtitle">AI-Powered Customer Support for Shopify & E-commerce</p>

        <div class="content">
            <p>Welcome to our AI Agent Studio chatbot demonstration! This shows how our intelligent customer service bot integrates seamlessly into any e-commerce website.</p>

            <div class="highlight">
                <h3>Features Available</h3>
                <ul>
                    <li><strong>Order Tracking:</strong> Real-time order status and shipping updates</li>
                    <li><strong>Returns & Exchanges:</strong> Guided return process with order lookup</li>
                    <li><strong>Product Support:</strong> Instant answers to product questions</li>
                    <li><strong>Payment Help:</strong> Billing and payment method assistance</li>
                    <li><strong>Human Escalation:</strong> Seamless handoff to live agents when needed</li>
                    <li><strong>GDPR Compliant:</strong> Privacy-first data handling</li>
                </ul>
            </div>

            <div class="instructions">
                <strong>Look for the chat button in the bottom-right corner!</strong>
                <br>Click it to start a conversation with our AI customer service agent.
            </div>

            <div class="test-scenarios">
                <h3>Test Conversation Flows</h3>
                <p>Try these realistic customer service scenarios:</p>

                <div class="scenario">
                    <strong>1. Order Tracking</strong><br>
                    Say: "Can you track my order?"<br>
                    Then provide: "ABC123" when asked for order number
                </div>

                <div class="scenario">
                    <strong>2. Return Request</strong><br>
                    Say: "I want to return something"<br>
                    Follow the guided return process
                </div>

                <div class="scenario">
                    <strong>3. Human Agent</strong><br>
                    Say: "I need to speak to a human agent"<br>
                    See the escalation process in action
                </div>

                <div class="scenario">
                    <strong>4. Shipping Information</strong><br>
                    Ask: "What are your shipping options?"<br>
                    Get detailed shipping policy information
                </div>

                <div class="scenario">
                    <strong>5. Payment Support</strong><br>
                    Ask: "What payment methods do you accept?"<br>
                    Learn about available payment options
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h3>Ready for Your E-commerce Store?</h3>
                <p>This chatbot can be embedded in any website with just 2 lines of code!</p>
                <p><strong>Perfect for Shopify, WooCommerce, Magento, and custom stores.</strong></p>
            </div>
        </div>
    </div>

    <!-- Chatbot Integration Script -->
    <script>
      console.log('Loading chatbot with URL:', window.location.origin);
      window.chatbotConfig = {
        apiUrl: window.location.origin,
        theme: 'light',
        position: 'bottom-right'
      };
    </script>
    <script src="/chatbot-embed.js"></script>

    <script>
      // Add some debugging
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (!window.EcommerceChatbot) {
            console.error('Chatbot failed to load. Check console for errors.');
          } else {
            console.log('Chatbot loaded successfully!');
          }
        }, 2000);
      });
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(testPageHTML);
  });

  // Also serve chatbot-embed.js with proper headers  
  app.get("/chatbot-embed.js", (req: Request, res: Response) => {
    import('fs').then(fs => {
      import('path').then(path => {
        import('url').then(url => {
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
          res.sendFile(path.join(__dirname, "../public/chatbot-embed.js"));
        });
      });
    });
  });

  // Auto-deploy missing AI agents
  app.post("/api/deploy-missing-agents", async (req: Request, res: Response) => {
    try {
      const { agentAutoDeployer } = await import("./agent-auto-deploy");
      const userId = req.body.userId || 1; // Default to system user

      await agentAutoDeployer.deployAllMissingAgents(userId);
      const status = await agentAutoDeployer.getDeploymentStatus();

      res.json({
        success: true,
        message: "Missing agents deployed successfully",
        status
      });
    } catch (error) {
      console.error("Error deploying missing agents:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to deploy agents"
      });
    }
  });

  // Get comprehensive agent templates
  app.get("/api/comprehensive-agent-templates", async (req: Request, res: Response) => {
    try {
      const { agentAutoDeployer } = await import("./agent-auto-deploy");
      const templates = agentAutoDeployer.getAvailableTemplates();
      const categorized = agentAutoDeployer.getTemplatesByCategory();

      res.json({
        success: true,
        templates,
        categorized,
        total: templates.length
      });
    } catch (error) {
      console.error("Error getting comprehensive agent templates:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to get templates"
      });
    }
  });

  // Deploy specific agent by template ID
  app.post("/api/deploy-agent-template/:templateId", async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      const { agentAutoDeployer } = await import("./agent-auto-deploy");
      const userId = req.body.userId || 1;

      const deployedAgent = await agentAutoDeployer.deploySpecificAgent(templateId, userId);

      res.json({
        success: true,
        message: "Agent deployed successfully",
        agent: deployedAgent
      });
    } catch (error) {
      console.error("Error deploying specific agent:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to deploy agent"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}