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
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
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
  stripe_subscription_id: text("stripe_subscription_id").notNull().unique(),
  stripe_customer_id: text("stripe_customer_id").notNull(),
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
  stripe_payment_intent_id: text("stripe_payment_intent_id").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const webhook_events = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  stripe_event_id: text("stripe_event_id").notNull().unique(),
  event_type: text("event_type").notNull(),
  processed: boolean("processed").default(false),
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
  stripe_subscription_id: true,
  stripe_customer_id: true,
  status: true,
  plan_name: true,
  price_id: true,
  current_period_start: true,
  current_period_end: true,
});

export const insertPaymentHistorySchema = createInsertSchema(payment_history).pick({
  user_id: true,
  stripe_payment_intent_id: true,
  amount: true,
  currency: true,
  status: true,
  description: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhook_events).pick({
  stripe_event_id: true,
  event_type: true,
  processed: true,
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

export type FlowData = z.infer<typeof flowDataSchema>;