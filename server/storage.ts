import { users, agents, waitlist, type User, type InsertUser, type Agent, type InsertAgent, type Waitlist, type InsertWaitlist } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export const storage = new MemStorage();
