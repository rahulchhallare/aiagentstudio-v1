import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  avatar_url: text("avatar_url"),
  subscription_status: text("subscription_status").default("inactive"),
  subscription_plan: text("subscription_plan").default("free"),
  razorpay_customer_id: text("razorpay_customer_id"),
  razorpay_subscription_id: text("razorpay_subscription_id"),
  subscription_expires_at: timestamp("subscription_expires_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  flow_data: jsonb("flow_data").notNull(),
  is_active: boolean("is_active").notNull().default(false),
  deploy_url: text("deploy_url"),
  deploy_id: text("deploy_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  razorpay_subscription_id: text("razorpay_subscription_id").notNull().unique(),
  razorpay_customer_id: text("razorpay_customer_id").notNull(),
  status: text("status").notNull(),
  plan_name: text("plan_name").notNull(),
  price_id: text("price_id").notNull(),
  current_period_start: timestamp("current_period_start").notNull(),
  current_period_end: timestamp("current_period_end").notNull(),
  cancel_at_period_end: boolean("cancel_at_period_end").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const payment_history = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  razorpay_payment_id: text("razorpay_payment_id").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const webhook_events = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  razorpay_event_id: text("razorpay_event_id").notNull().unique(),
  event_type: text("event_type").notNull(),
  processed: boolean("processed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const contact_submissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  inquiry_type: text("inquiry_type"),
  created_at: timestamp("created_at").defaultNow(),
});

// Business Analysis tables
export const business_analyses = pgTable("business_analyses", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  website_url: text("website_url").notNull(),
  business_name: text("business_name").notNull(),
  business_type: text("business_type").notNull(),
  industry: text("industry").notNull(),
  pain_points: jsonb("pain_points").notNull(),
  workflows: jsonb("workflows").notNull(),
  content_summary: text("content_summary").notNull(),
  key_features: jsonb("key_features").notNull(),
  target_audience: text("target_audience").notNull(),
  current_tech: jsonb("current_tech").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const ai_recommendations = pgTable("ai_recommendations", {
  id: serial("id").primaryKey(),
  analysis_id: integer("analysis_id").notNull().references(() => business_analyses.id),
  solution_type: text("solution_type").notNull(),
  solution_name: text("solution_name").notNull(),
  description: text("description").notNull(),
  estimated_cost_savings: integer("estimated_cost_savings").notNull(),
  estimated_time_savings: text("estimated_time_savings").notNull(),
  implementation_difficulty: text("implementation_difficulty").notNull(),
  roi_percentage: integer("roi_percentage").notNull(),
  industry_benchmark: text("industry_benchmark").notNull(),
  priority_score: integer("priority_score").notNull(),
  template_id: text("template_id").notNull(),
  customization_data: jsonb("customization_data").notNull(),
  reasoning: text("reasoning").notNull(),
  rag_evidence: jsonb("rag_evidence"),
  case_studies: jsonb("case_studies"),
  ethical_considerations: text("ethical_considerations"),
  compliance_requirements: jsonb("compliance_requirements"),
  monitoring_metrics: jsonb("monitoring_metrics"),
  implementation_timeline: text("implementation_timeline"),
  expected_revenue: integer("expected_revenue"),
  risk_factors: jsonb("risk_factors"),
  status: text("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

// AI Agent Templates for deployable solutions
export const aiAgentTemplates = pgTable("ai_agent_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  solution_type: text("solution_type").notNull(), // "customer_support", "predictive_analytics", etc.
  industry: text("industry").notNull(),
  template_config: jsonb("template_config").notNull(), // Agent flow configuration
  capabilities: jsonb("capabilities").notNull(), // List of agent capabilities
  integration_requirements: jsonb("integration_requirements").notNull(),
  pricing_model: text("pricing_model").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Deployed AI Solutions from recommendations
export const deployedSolutions = pgTable("deployed_solutions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  analysis_id: integer("analysis_id").notNull().references(() => business_analyses.id),
  template_id: integer("template_id").notNull().references(() => aiAgentTemplates.id),
  solution_name: text("solution_name").notNull(),
  deployment_status: text("deployment_status").notNull().default("pending"), // pending, deploying, active, failed
  deployment_url: text("deployment_url"),
  deployment_id: text("deployment_id"),
  configuration: jsonb("configuration").notNull(),
  performance_metrics: jsonb("performance_metrics"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Chatbot related tables
export const chat_sessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull().unique(),
  user_id: integer("user_id").references(() => users.id),
  gdpr_consent: boolean("gdpr_consent").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const chat_messages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull().references(() => chat_sessions.session_id),
  sender: text("sender").notNull(), // "user" or "bot"
  message: text("message").notNull(),
  message_type: text("message_type").default("text"),
  created_at: timestamp("created_at").defaultNow(),
});

export const return_requests = pgTable("return_requests", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull().references(() => chat_sessions.session_id),
  order_number: text("order_number").notNull(),
  product_name: text("product_name"),
  return_reason: text("return_reason"),
  status: text("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const chatbot_analytics = pgTable("chatbot_analytics", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull().references(() => chat_sessions.session_id),
  event_type: text("event_type").notNull(),
  event_data: jsonb("event_data"),
  created_at: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  avatar_url: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  user_id: true,
  name: true,
  description: true,
  flow_data: true,
  is_active: true,
  deploy_url: true,
  deploy_id: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).pick({
  email: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  user_id: true,
  razorpay_subscription_id: true,
  razorpay_customer_id: true,
  status: true,
  plan_name: true,
  price_id: true,
  current_period_start: true,
  current_period_end: true,
});

export const insertPaymentHistorySchema = createInsertSchema(payment_history).pick({
  user_id: true,
  razorpay_payment_id: true,
  amount: true,
  currency: true,
  status: true,
  description: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhook_events).pick({
  razorpay_event_id: true,
  event_type: true,
  processed: true,
});

export const insertAiAgentTemplateSchema = createInsertSchema(aiAgentTemplates).pick({
  name: true,
  description: true,
  solution_type: true,
  industry: true,
  template_config: true,
  capabilities: true,
  integration_requirements: true,
  pricing_model: true,
  is_active: true,
});

export const insertDeployedSolutionSchema = createInsertSchema(deployedSolutions).pick({
  user_id: true,
  analysis_id: true,
  template_id: true,
  solution_name: true,
  deployment_status: true,
  deployment_url: true,
  deployment_id: true,
  configuration: true,
  performance_metrics: true,
});

export const insertChatSessionSchema = createInsertSchema(chat_sessions).pick({
  session_id: true,
  user_id: true,
  gdpr_consent: true,
});

export const insertChatMessageSchema = createInsertSchema(chat_messages).pick({
  session_id: true,
  sender: true,
  message: true,
  message_type: true,
});

export const insertReturnRequestSchema = createInsertSchema(return_requests).pick({
  session_id: true,
  order_number: true,
  product_name: true,
  return_reason: true,
  status: true,
});

export const insertChatbotAnalyticsSchema = createInsertSchema(chatbot_analytics).pick({
  session_id: true,
  event_type: true,
  event_data: true,
});

// Custom flow data schema
export const flowDataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      data: z.record(z.any()).optional().default({}),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    })
  ),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertPaymentHistory = typeof payment_history.$inferInsert;
export type PaymentHistory = typeof payment_history.$inferSelect;

export type InsertWebhookEvent = typeof webhook_events.$inferInsert;
export type WebhookEvent = typeof webhook_events.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chat_sessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chat_messages.$inferSelect;

export type InsertReturnRequest = z.infer<typeof insertReturnRequestSchema>;
export type ReturnRequest = typeof return_requests.$inferSelect;

export type InsertChatbotAnalytics = z.infer<typeof insertChatbotAnalyticsSchema>;
export type ChatbotAnalytics = typeof chatbot_analytics.$inferSelect;

export type FlowData = z.infer<typeof flowDataSchema>;

export const insertContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  company: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  inquiryType: z.string().optional(),
});