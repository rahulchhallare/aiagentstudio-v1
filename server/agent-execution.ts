import OpenAI from "openai";
import { FlowData } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type definitions for node outputs
interface NodeOutput {
  data: any;
  error?: string;
}

// Execute a flow using the configured nodes and connections
export async function executeFlow(flowData: FlowData, userInput: string): Promise<NodeOutput> {
  try {
    if (!flowData || !flowData.nodes || !flowData.edges) {
      throw new Error("Invalid flow data structure");
    }
    
    const { nodes, edges } = flowData;
    
    // Find all input nodes
    const inputNodes = nodes.filter(node => node.type && node.type.includes('input'));
    if (inputNodes.length === 0) {
      throw new Error("No input nodes found in the flow");
    }
    
    // Initialize node outputs
    const nodeOutputs = new Map<string, NodeOutput>();
    
    // Set initial inputs - for blog writer, we expect the first input to be the main topic
    // and subsequent inputs to be additional context
    inputNodes.forEach((node, index) => {
      if (index === 0) {
        // Primary input gets the user input
        nodeOutputs.set(node.id, { data: userInput });
      } else {
        // Secondary inputs might be empty or have default values
        const defaultValue = node.data?.defaultValue || "";
        nodeOutputs.set(node.id, { data: defaultValue });
      }
    });
    
    // Create a topological sort of nodes to process them in the correct order
    const processedNodes = new Set<string>();
    const nodeQueue: string[] = [...inputNodes.map(node => node.id)];
    
    // Process nodes layer by layer
    while (nodeQueue.length > 0) {
      const currentNodeId = nodeQueue.shift();
      if (!currentNodeId || processedNodes.has(currentNodeId)) continue;
      
      const currentNode = nodes.find(node => node.id === currentNodeId);
      if (!currentNode) continue;
      
      // Check if all prerequisites are met (all incoming nodes are processed)
      const incomingEdges = edges.filter(edge => edge.target === currentNodeId);
      const allPrereqsMet = incomingEdges.every(edge => processedNodes.has(edge.source));
      
      if (!allPrereqsMet && !inputNodes.some(node => node.id === currentNodeId)) {
        // Put back at end of queue if prerequisites not met
        nodeQueue.push(currentNodeId);
        continue;
      }
      
      // Process the current node
      const nodeOutput = await processNode(currentNode, nodeOutputs, flowData);
      nodeOutputs.set(currentNodeId, nodeOutput);
      processedNodes.add(currentNodeId);
      
      // Add connected target nodes to the queue
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      for (const edge of outgoingEdges) {
        if (!processedNodes.has(edge.target) && !nodeQueue.includes(edge.target)) {
          nodeQueue.push(edge.target);
        }
      }
    }
    
    // Find the output node
    const outputNode = nodes.find(node => node.type === 'outputNode');
    if (!outputNode || !nodeOutputs.has(outputNode.id)) {
      throw new Error("No output was generated from the flow");
    }
    
    return nodeOutputs.get(outputNode.id) as NodeOutput;
  } catch (error) {
    console.error("Error executing flow:", error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error executing flow" 
    };
  }
}

// Process an individual node based on its type
async function processNode(
  node: any, 
  nodeOutputs: Map<string, NodeOutput>,
  flowData: FlowData
): Promise<NodeOutput> {
  try {
    const { edges } = flowData;
    
    switch (node.type) {
      case 'inputNode':
      case 'fileInputNode':
      case 'imageInputNode':
      case 'webhookInputNode':
        // Input nodes return their existing output (already set during initialization)
        const existingOutput = nodeOutputs.get(node.id);
        return existingOutput || { data: "" };
        
      case 'gptNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            // Label the input based on the source node type/name
            const sourceNode = flowData.nodes.find(n => n.id === edge.source);
            const label = sourceNode?.data?.label || sourceNode?.type || "Input";
            inputData.push(`${label}: ${sourceOutput.data}`);
          }
        }
        
        const combinedInput = inputData.join("\n\n");
        
        if (!combinedInput.trim()) {
          return { data: "", error: "No input provided to GPT node" };
        }
        
        // Process with GPT
        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const model = node.data?.model || "gpt-4o";
        const temperature = node.data?.temperature || 0.7;
        const maxTokens = node.data?.maxTokens || 1000;
        
        console.log(`Processing GPT node ${node.id} with input:`, combinedInput);
        
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: combinedInput }
          ],
          temperature,
          max_tokens: maxTokens,
        });
        
        const result = response.choices[0].message.content || "";
        console.log(`GPT node ${node.id} response:`, result.substring(0, 200) + "...");
        
        return { data: result };
      }
      
      case 'apiNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            inputData.push(sourceOutput.data);
          }
        }
        
        const combinedInput = inputData.join("\n");
        
        // Make API request
        const endpoint = String(node.data?.endpoint || "");
        const method = node.data?.method || "GET";
        const headers = node.data?.headers ? JSON.parse(node.data.headers) : {};
        
        if (!endpoint) {
          throw new Error("API endpoint not specified");
        }
        
        const options: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers
          }
        };
        
        if (method !== "GET" && method !== "HEAD") {
          options.body = JSON.stringify({ query: combinedInput });
        }
        
        const response = await fetch(endpoint, options);
        const data = await response.json();
        return { data: JSON.stringify(data) };
      }
      
      case 'logicNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            inputData.push(sourceOutput.data);
          }
        }
        
        const combinedInput = inputData.join("\n");
        
        // Evaluate condition
        const condition = String(node.data?.condition || "");
        
        if (!condition) {
          throw new Error("Logic condition not specified");
        }
        
        // Create a safe evaluation environment
        const input = combinedInput;
        const result = new Function('input', `
          try {
            return ${condition};
          } catch (e) {
            return false;
          }
        `)(input);
        
        return { data: result ? "true" : "false" };
      }
      
      case 'outputNode':
      case 'imageOutputNode':
      case 'emailNode':
      case 'notificationNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        
        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            inputData.push(sourceOutput.data);
          }
        }
        
        const combinedInput = inputData.join("\n");
        return { data: combinedInput };
      }
        
      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  } catch (error) {
    console.error(`Error processing node ${node.id}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown error processing node" 
    };
  }
}