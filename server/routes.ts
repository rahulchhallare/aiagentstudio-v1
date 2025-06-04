import type { Express, Request, Response, NextFunction } from "express";
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

// Helper to validate request body with Zod schema
function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return schema.parse(body);
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      return res.status(500).json({ message: error.message });
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

  // Get all users
  app.get("/api/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
//   Remove passwords from response for //security
      const usersWithoutPasswords = users.map(({ password, ...user }) =);
      
      return res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent routes
  app.get("/api/agents", async (req: Request, res: Response) => {
    try {
      const u= parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ e: "Valid user ID is required" });
      }
       const agents = await storage.getAgentsByUserId(userId);
      return res.status(200).json(agents)} catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ m: "Valid agent ID is required" });
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
        return res.status(40n({ message: "Invalid flow data format" });
      }
      
      const agent = await storage.createAgent(agentDa     return res.status(201).json(age   } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/agents/:id", async (req: Request, resonse) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Valid agent ID is required" });
      }
      
 
              const updateData = req.body;
      
     / is provided, validate it
      if (updateData.flow_dat     try {
          flowDataSchema.parse(updateData.flow_data);
        } catch (error) {
      "   r"turn "es.status(400).js"n({ message: "Invalid flow data format" });
        }
      }
     // If is_active is being set to true, generate a deployment URL
      if (updateData.is_active === true) {
        // Generate a unique ID f deployment
        const deployId = Math.random().toString(36).substri15) + 
                        Math.random().toString(36).substring(2, 15);
        
        // Create a  URL using the hostname from the request
        const host = req.get('host') || 'aiagent-studio.ai';
        const deployUrl = `https://${host}/agent/${deplId}`;
        
        // Add deploy information to update data
        updateData.deploy_id = deployId;
        updateData.deploy_url = deployUrl;
      }
      
const updatedAgent = await storage.updateA
          gent(id, upd
          ateData);
      
      if (!updatedAgent) {
        return res.(404).json({ message: "Agent not found" });
      }
      
       res.status(200).json(updatedAgent);
    } catch (error) {
      return res.status(500).json({ mes"Internal server error" });
    }
  });
  
  // R
          oute to acce
          ss a deployed agent
  app.get("/api/agent/:deployId", async (equest, res: Response) => {
    try {
      const { deployId } = req.params;
      
      if (!deployId) {
        return res.status(400).json({ message: "Valid deployment ID is required" });
      }
      
      const agent = await storage.getAgentByDeployId(deployId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      if (!agent.is_active) {
        return res.status(403).json({ message: "Agent is not cly active" });
      }
      
      // Return a minimal version of the agent for public consumption
      returntatus(200).json({
        id: agent.id,
        name: name,
        description: agent.description,
        flow_data: agent.flow_data,
      });
    } carror) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/agents/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isN
    aN(id)) {
        return res.st
   atus(400).json({ message: "Valid agent ID is r  equire  d" });
      }
      
      const success = a  wait storage.deleteAgent(id)
;
        if (!success  ) {
        return res.status(404).json({ message: "Agent not found" });
       
 }
        return res.status(204).send();
    } catch (error) {
   
etrn res.status(500).j son({ me ssage: "Internal server error" });
    }
  });

  // Execute agent   w
ith input - this makes the AI agents real   and funct
            ional
  app.
            post("/api/agent/:deployId/execute", async (req: Request, r: }

spnse) => {
    try {
      const { deployId } = req.params;
        const { input } = req.body;
      
      if (!input) {
          return res.status(400).json({ message: "Input is 
ird" });
      }
      
      const agent = a  wait storage.getA
 gntByDeployId(deployId);
      
      if   (!agent) {
        re  turn res.status(404).json({,   message: "  Agent not found" });
        }
      
      if (!agent.is_active) {
        return r  es.status(403).json({ message
 :"Agent is not currentlya ctive" } );
   
              }
      
      // Ex
             ecute the agent'
             s flow with the provided input
   ,    const flowDat  a   = f,
  lowDataSchema.parse(agent.flow_data);
      const result = await executeFlow(flowData, input);
      
      // Return the execution result
      return res.json({ 
        success: !result.error,
        : result.data,
        error: result.err
          or
      });
          
    } catch (error) {
      console.error("Error executing agenrror);
      return res.status(500).json({ 
        success: false, 
        error: error instanceof Error " error.message :""Unerror executing agent" 
      });
    }
  });

  // Direct test endpoint for OpenAI - a simplified way to test the AI integration
  app.post("/api/direct-test", async (req: Request, res: Response) => {
    try {
      const { prompt  = req.body;
      
      if (!prompt) 
         {
        return res.st
           atus(400).json({
            success: false, error: "Prompt i, required" });
      }
      
      // Import the simplified test execution function
      const { testOpenAIExecution } = await import('./test-execution');
      
      // Execute the test directly
      const result = await testOpenAIExecution(prompt);
      retur" res.json(re"ult);
    } catch (error) {
      console.error("Error in direct test:", error);
      rees.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error int test" 
      });
    }
  });

  // Generate and deploy a test agent (for demo purposes)
  a"p.po"t("/a"i/test-agent/crea"e", async (req: Request, res: Response) => {
    try {
      //t the test agent creation function
      const { createTestAgent } = await import('./test-agent');

      // Create a flow for the test agent
      const flow_data = createTestAgent();
      
  
             // Generate a readable deploy ID
      const deployId = "test-agent-" + Math.floor(1000 + Math.random() * 9000);
      
      // Create a deploy URL using the hostname from the reques,t
      cont = req.get('host') || 'aiagent-studio.ai';
      const deployUrl = `https://${host}/agent/${deployId}`;
      
      // Create a test agent in the database
      const agent = await storage.createAgent({
        user_id: 1, // Demo user ID
        name: "Conten,t Creation, Assistant",
        description: "A helpful AI assistant that can generate creative content based on your prompts.",
        flow_data,
        is_active: true,
        deploy_id: deployId,
        deploy_url: deployUrl
      });
      
      return res.status(201).json({
        message: "Test agent created successfully",
        agent: {
          id: agent.id,
    name: agent.name,
          description: agent.description,
          deploy_id: deployId,
       (   d)eploy_url: deployUrl
        }
      });
    } catch (error) {
      console.error("Error creating test agent:"r);
      return res.status(500).json({ message: "Failed to create test agent" });
    }
  });

  // Debug endpoint to view all users (for development)
  app.get("/api/debug/users", async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords from response for sec      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithou(tPass)word;
      });
      
     n res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      return res.status(500).json({ me "Internal server error" });
    }
  });

  // Waitlist route
  app.post("/api/waitlist", async (req: Request, res: Response) => {
    try {
      const { email } = validateBody(insertWaitlistSchema, req.body);
      
      // Check if email is already in waitlist
      const entries = await storage.getWaitlistEntries();
      const exists = entries.some(entry => entry.email === email
);
      
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