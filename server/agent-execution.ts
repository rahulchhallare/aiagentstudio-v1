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
    const { nodes, edges } = flowData;
    
    // Find the input node (typically the first node)
    const inputNode = nodes.find(node => node.type?.includes('input'));
    if (!inputNode) {
      throw new Error("No input node found in the flow");
    }
    
    // Initialize node outputs (each node will produce output that subsequent nodes can use)
    const nodeOutputs = new Map<string, NodeOutput>();
    
    // Set the initial input
    nodeOutputs.set(inputNode.id, { data: userInput });
    
    // Create a list of nodes to process (start with the input node)
    const processedNodes = new Set<string>();
    const nodesToProcess: string[] = [inputNode.id];
    
    // Process nodes in order based on connections
    while (nodesToProcess.length > 0) {
      const currentNodeId = nodesToProcess.shift();
      if (!currentNodeId || processedNodes.has(currentNodeId)) continue;
      
      const currentNode = nodes.find(node => node.id === currentNodeId);
      if (!currentNode) continue;
      
      // Process the current node
      const nodeOutput = await processNode(currentNode, nodeOutputs, flowData);
      nodeOutputs.set(currentNodeId, nodeOutput);
      processedNodes.add(currentNodeId);
      
      // Find connected nodes to process next
      const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
      for (const edge of outgoingEdges) {
        // Add target nodes to the processing queue
        if (!processedNodes.has(edge.target)) {
          nodesToProcess.push(edge.target);
        }
      }
    }
    
    // Find the output node (typically the last node)
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
    
    // Get input data from connected nodes
    const inputData: string[] = [];
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    for (const edge of incomingEdges) {
      const sourceOutput = nodeOutputs.get(edge.source);
      if (sourceOutput) {
        inputData.push(sourceOutput.data);
      }
    }
    
    const combinedInput = inputData.join("\n");
    
    switch (node.type) {
      case 'inputNode':
      case 'fileInputNode':
      case 'imageInputNode':
      case 'webhookInputNode':
        // Input nodes don't transform data, they just pass it through
        // Their output was already set when we initialized nodeOutputs
        return { data: combinedInput || "" };
        
      case 'gptNode': {
        // Process with GPT
        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const model = node.data?.model || "gpt-4o"; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const temperature = node.data?.temperature || 0.7;
        const maxTokens = node.data?.maxTokens || 1000;
        
        const response = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: combinedInput }
          ],
          temperature,
          max_tokens: maxTokens,
        });
        
        return { data: response.choices[0].message.content || "" };
      }
      
      case 'apiNode': {
        // Make API request
        const endpoint = node.data?.endpoint || "";
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
        // Evaluate condition
        const condition = node.data?.condition || "";
        
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
      case 'notificationNode':
        // Output nodes also pass through data
        return { data: combinedInput };
        
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