import { users, agents, waitlist, type User, type InsertUser, type Agent, type InsertAgent, type Waitlist, type InsertWaitlist, type ChatSession, type InsertChatSession, type ChatMessage, type InsertChatMessage, type ReturnRequest, type InsertReturnRequest, type ChatbotAnalytics, type InsertChatbotAnalytics } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  getAgentByDeployId(deployId: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  // Waitlist operations
  addToWaitlist(email: InsertWaitlist): Promise<Waitlist>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  
  // Business Analysis methods
  createBusinessAnalysis(insertBusinessAnalysis: any): Promise<any>;
  getBusinessAnalysis(id: number): Promise<any>;
  createAiRecommendation(insertAiRecommendation: any): Promise<any>;
  getRecommendationsByAnalysisId(analysisId: number): Promise<any[]>;
  updateRecommendationStatus(id: number, status: string): Promise<void>;
  getAiSolutionTemplate(templateId: string): Promise<any>;
  createDeployedSolution(insertDeployedSolution: any): Promise<any>;

  // Chatbot operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  updateChatSession(sessionId: string, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest>;
  getReturnRequest(authNumber: string): Promise<ReturnRequest | undefined>;
  createAnalyticsEvent(analytics: InsertChatbotAnalytics): Promise<ChatbotAnalytics>;
  getChatbotAnalytics(startDate?: Date, endDate?: Date): Promise<ChatbotAnalytics[]>;

  // Contact Form
  createContactSubmission(data: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
    inquiryType?: string;
  }): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private waitlist: Map<number, Waitlist>;
  private userIdCounter: number;
  private agentIdCounter: number;
  private waitlistIdCounter: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.waitlist = new Map();
    this.userIdCounter = 1;
    this.agentIdCounter = 1;
    this.waitlistIdCounter = 1;

    // Create a test user for development
    const testUser: User = {
      id: this.userIdCounter++,
      username: "testuser",
      email: "test@example.com",
      password: "Password123",
      avatar_url: "",
      subscription_status: "inactive",
      subscription_plan: "free",
      razorpay_customer_id: null,
      razorpay_subscription_id: null,
      subscription_expires_at: null,
      created_at: new Date()
    };
    this.users.set(testUser.id, testUser);

    console.log("Created test user:", { email: testUser.email, password: "Password123" });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      avatar_url: insertUser.avatar_url || null,
      subscription_status: "inactive",
      subscription_plan: "free",
      razorpay_customer_id: null,
      razorpay_subscription_id: null,
      subscription_expires_at: null,
      created_at: now
    };
    this.users.set(id, user);
    return user;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.user_id === userId
    );
  }

  async getAgentByDeployId(deployId: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(
      (agent) => agent.deploy_id === deployId
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++;
    const now = new Date();
    const agent: Agent = {
      ...insertAgent,
      id,
      is_active: insertAgent.is_active || false,
      created_at: now,
      updated_at: now,
      deploy_url: insertAgent.deploy_url || null,
      deploy_id: insertAgent.deploy_id || null,
      description: insertAgent.description || null
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, agentData: Partial<InsertAgent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    const updatedAgent: Agent = {
      ...agent,
      ...agentData,
      updated_at: new Date()
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Waitlist operations
  async addToWaitlist(insertWaitlist: InsertWaitlist): Promise<Waitlist> {
    const id = this.waitlistIdCounter++;
    const now = new Date();
    const entry: Waitlist = {
      ...insertWaitlist,
      id,
      created_at: now
    };
    this.waitlist.set(id, entry);
    return entry;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    return Array.from(this.waitlist.values());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createContactSubmission(data: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
    inquiryType?: string;
  }) {
    // This would require a contact_submissions table in your database
    // For now, we'll just log it - you can implement the table later
    console.log("Contact submission would be saved:", data);
    return { id: Date.now(), ...data, created_at: new Date() };
  }

  // Business Analysis methods - Stub implementations for memory storage
  async createBusinessAnalysis(insertBusinessAnalysis: any): Promise<any> {
    const id = Date.now();
    return { id, ...insertBusinessAnalysis, created_at: new Date() };
  }

  async getBusinessAnalysis(id: number): Promise<any> {
    // Stub implementation
    return null;
  }

  async createAiRecommendation(insertAiRecommendation: any): Promise<any> {
    const id = Date.now();
    return { id, ...insertAiRecommendation, created_at: new Date() };
  }

  async getRecommendationsByAnalysisId(analysisId: number): Promise<any[]> {
    // Stub implementation
    return [];
  }

  async updateRecommendationStatus(id: number, status: string): Promise<void> {
    // Stub implementation
  }

  async getAiSolutionTemplate(templateId: string): Promise<any> {
    // Stub implementation
    return null;
  }

  async createDeployedSolution(insertDeployedSolution: any): Promise<any> {
    const id = Date.now();
    return { id, ...insertDeployedSolution, created_at: new Date() };
  }

  // Chatbot operations - Stub implementations for memory storage
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const id = Date.now();
    return { 
      id, 
      ...session, 
      created_at: new Date(), 
      updated_at: new Date() 
    } as ChatSession;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    // Stub implementation
    return undefined;
  }

  async updateChatSession(sessionId: string, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    // Stub implementation
    return undefined;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = Date.now();
    return { 
      id, 
      ...message, 
      created_at: new Date() 
    } as ChatMessage;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    // Stub implementation
    return [];
  }

  async createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest> {
    const id = Date.now();
    return { 
      id, 
      ...returnRequest, 
      created_at: new Date(), 
      updated_at: new Date() 
    } as ReturnRequest;
  }

  async getReturnRequest(authNumber: string): Promise<ReturnRequest | undefined> {
    // Stub implementation
    return undefined;
  }

  async createAnalyticsEvent(analytics: InsertChatbotAnalytics): Promise<ChatbotAnalytics> {
    const id = Date.now();
    return { 
      id, 
      ...analytics, 
      created_at: new Date() 
    } as ChatbotAnalytics;
  }

  async getChatbotAnalytics(startDate?: Date, endDate?: Date): Promise<ChatbotAnalytics[]> {
    // Stub implementation
    return [];
  }
}

import { createClient } from '@supabase/supabase-js';

export class SupabaseStorage implements IStorage {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return undefined;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return undefined;
    return data;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data;
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getAgentByDeployId(deployId: string): Promise<Agent | undefined> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('*')
      .eq('deploy_id', deployId)
      .single();

    if (error) return undefined;
    return data;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    try {
      const { data, error } = await this.supabase
        .from('agents')
        .insert(insertAgent)
        .select()
        .single();

      if (error) {
        console.error('Supabase agent creation error:', error);
        throw new Error(error.message);
      }
      return data;
    } catch (err) {
      console.error('Agent creation failed:', err);
      throw err;
    }
  }

  async updateAgent(id: number, agentData: Partial<InsertAgent>): Promise<Agent | undefined> {
    const { data, error } = await this.supabase
      .from('agents')
      .update({ ...agentData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteAgent(id: number): Promise<boolean> {
    const { error } = await this.supabase
      .from('agents')
      .delete()
      .eq('id', id);

    return !error;
  }

  async addToWaitlist(insertWaitlist: InsertWaitlist): Promise<Waitlist> {
    const { data, error } = await this.supabase
      .from('waitlist')
      .insert(insertWaitlist)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    const { data, error } = await this.supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  // Subscription methods
  async createSubscription(subscription: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateSubscription(subscriptionId: string, updates: any): Promise<any> {
    const finalUpdates = { 
      ...updates, 
      updated_at: new Date()
    };

    // First try to find which column contains the subscription ID
    let targetColumn: string | null = null;
    let existingRecord: any = null;

    // Check razorpay_subscription_id first
    const razorpayCheck = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('razorpay_subscription_id', subscriptionId)
      .maybeSingle();

    if (!razorpayCheck.error && razorpayCheck.data) {
      targetColumn = 'razorpay_subscription_id';
      existingRecord = razorpayCheck.data;
    } else {
      // Check stripe_subscription_id
      const stripeCheck = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();

      if (!stripeCheck.error && stripeCheck.data) {
        targetColumn = 'stripe_subscription_id';
        existingRecord = stripeCheck.data;
      }
    }

    if (!targetColumn || !existingRecord) {
      throw new Error(`No subscription found with ID: ${subscriptionId}`);
    }

    // Update the specific record using the primary key
    const updateResult = await this.supabase
      .from('subscriptions')
      .update(finalUpdates)
      .eq('id', existingRecord.id)
      .select()
      .single();

    if (updateResult.error) {
      throw new Error(updateResult.error.message);
    }

    return updateResult.data;
  }

  async switchSubscriptionPlan(userId: number, newPlanData: {
    razorpay_subscription_id?: string;
    razorpay_customer_id?: string;
    status: string;
    plan_name: string;
    plan_id: string;
    price_id: string;
    current_period_start: Date;
    current_period_end: Date;
  }): Promise<any> {
    // First, mark all existing active subscriptions for this user as inactive
    await this.supabase
      .from('subscriptions')
      .update({ 
        status: 'inactive',
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new subscription record
    const newSubscription = {
      user_id: userId,
      ...newPlanData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const { data, error } = await this.supabase
      .from('subscriptions')
      .insert(newSubscription)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getSubscriptionByUserId(userId: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  // Payment history methods
  async createPaymentHistory(payment: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('payment_history')
      .insert(payment)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getPaymentHistoryByUserId(userId: number): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async deletePaymentHistory(id: number): Promise<any> {
    const { data, error } = await this.supabase
        .from('payment_history')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) return null;
    return data;
  }

  // Webhook event methods
  async createWebhookEvent(event: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getWebhookEvent(stripeEventId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .select('*')
      .eq('stripe_event_id', stripeEventId)
      .single();

    if (error) return null;
    return data;
  }

  async getWebhookEventById(eventId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('webhook_events')
      .select('*')
      .eq('razorpay_event_id', eventId)
      .single();

      if (error) return null;
      return data;
  }

  async createContactSubmission(data: {
    name: string;
    email: string;
    company?: string;
    subject: string;
    message: string;
    inquiryType?: string;
  }) {
    // Map camelCase to snake_case for database
    const dbData = {
      name: data.name,
      email: data.email,
      company: data.company,
      subject: data.subject,
      message: data.message,
      inquiry_type: data.inquiryType
    };

    const { data: result, error } = await this.supabase
      .from('contact_submissions')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Supabase contact submission error:', error);
      throw new Error(error.message);
    }
    return result;
  }

  // Business Analysis methods - Add these to your database if you plan to use Supabase
  async createBusinessAnalysis(insertBusinessAnalysis: any): Promise<any> {
    // This would require implementing the business_analyses table in Supabase
    throw new Error("Business analysis methods not implemented for Supabase storage");
  }

  async getBusinessAnalysis(id: number): Promise<any> {
    throw new Error("Business analysis methods not implemented for Supabase storage");
  }

  async createAiRecommendation(insertAiRecommendation: any): Promise<any> {
    throw new Error("AI recommendation methods not implemented for Supabase storage");
  }

  async getRecommendationsByAnalysisId(analysisId: number): Promise<any[]> {
    throw new Error("AI recommendation methods not implemented for Supabase storage");
  }

  async updateRecommendationStatus(id: number, status: string): Promise<void> {
    throw new Error("AI recommendation methods not implemented for Supabase storage");
  }

  async getAiSolutionTemplate(templateId: string): Promise<any> {
    throw new Error("AI solution template methods not implemented for Supabase storage");
  }

  async createDeployedSolution(insertDeployedSolution: any): Promise<any> {
    throw new Error("Deployed solution methods not implemented for Supabase storage");
  }

  // Chatbot operations - Add these to your database if you plan to use Supabase
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async updateChatSession(sessionId: string, updates: Partial<InsertChatSession>): Promise<ChatSession | undefined> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async createReturnRequest(returnRequest: InsertReturnRequest): Promise<ReturnRequest> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async getReturnRequest(authNumber: string): Promise<ReturnRequest | undefined> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async createAnalyticsEvent(analytics: InsertChatbotAnalytics): Promise<ChatbotAnalytics> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }

  async getChatbotAnalytics(startDate?: Date, endDate?: Date): Promise<ChatbotAnalytics[]> {
    throw new Error("Chatbot methods not implemented for Supabase storage");
  }
}

// Use Supabase storage if credentials are available, otherwise fallback to MemStorage
let storage: IStorage;
try {
  storage = new SupabaseStorage();
  console.log('Using Supabase storage');
} catch (error) {
  storage = new MemStorage();
  console.log('Using local memory storage - Supabase credentials not found');
}

export { storage };