import { users, agents, waitlist, type User, type InsertUser, type Agent, type InsertAgent, type Waitlist, type InsertWaitlist } from "@shared/schema";

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

  async updateSubscription(stripeSubscriptionId: string, updates: any): Promise<any> {
    console.log('=== UPDATE SUBSCRIPTION DEBUG ===');
    console.log('Stripe Subscription ID:', stripeSubscriptionId);
    console.log('Updates to apply:', updates);
    
    const { data, error } = await this.supabase
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date() })
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw new Error(error.message);
    }
    
    console.log('Supabase update successful:', data);
    console.log('=== END UPDATE DEBUG ===');
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