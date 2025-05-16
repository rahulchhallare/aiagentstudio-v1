import { z } from 'zod';
import { Node, Edge } from 'reactflow';

// Re-export types from schema.ts for frontend use
export type User = {
  id: number;
  username: string;
  password?: string; // Optional since we don't always want to expose this
  email: string;
  avatar_url?: string | null;
  created_at?: Date;
};

export type Agent = {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  flow_data: FlowData;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type Waitlist = {
  id: number;
  email: string;
  created_at?: Date;
};

export type InsertUser = Omit<User, 'id' | 'created_at'>;
export type InsertAgent = Omit<Agent, 'id' | 'created_at' | 'updated_at'>;
export type InsertWaitlist = Omit<Waitlist, 'id' | 'created_at'>;

// Flow data type for React Flow
export interface FlowData {
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Node data types
export interface InputNodeData {
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
}

export interface GPTNodeData {
  label?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface OutputNodeData {
  label?: string;
  format?: 'plaintext' | 'markdown' | 'html';
}
