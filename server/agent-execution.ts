import OpenAI from "openai";
import { FlowData } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type definitions for node outputs
interface NodeOutput {
  data: any;
  error?: string;
}

// Helper function to generate contextual responses when API fails
function generateContextualResponse(input: string): string {
  const inputLower = input.toLowerCase();
  
  if (inputLower.includes('blog') || inputLower.includes('write') || inputLower.includes('article')) {
    return `# Content Creation Guide\n\nBased on your request: "${input}"\n\n## Key Steps:\n1. **Research thoroughly** - Gather reliable sources\n2. **Structure clearly** - Use headings and bullet points\n3. **Add value** - Provide actionable insights\n4. **Include examples** - Make content relatable\n\n## Best Practices:\n- Start with a compelling hook\n- Keep paragraphs short and scannable\n- End with a clear call-to-action\n\n*This is a demo response from AI Agent Studio. In production, this would be powered by advanced AI models.*`;
  }
  
  if (inputLower.includes('code') || inputLower.includes('program') || inputLower.includes('function')) {
    return `## Code Development Response\n\nFor your request: "${input}"\n\n### Approach:\n1. Break down the problem into smaller components\n2. Choose appropriate tools and programming language\n3. Write clean, well-documented code\n4. Test thoroughly with various inputs\n\n### Best Practices:\n- Use meaningful variable names\n- Add comments for complex logic\n- Handle edge cases and errors\n- Follow language conventions\n\n*AI Agent Studio would generate actual code in production.*`;
  }
  
  if (inputLower.includes('help') || inputLower.includes('assist') || inputLower.includes('question')) {
    return `## AI Assistant\n\nI understand you need help with: "${input}"\n\n### How I can assist:\n- **Information & Research** - Find and summarize relevant data\n- **Content Creation** - Write articles, emails, and documents\n- **Problem Solving** - Break down complex issues\n- **Analysis** - Provide insights on various topics\n\n### Next Steps:\nFeel free to ask specific questions for detailed assistance.\n\n*This demonstrates AI Agent Studio's capabilities.*`;
  }
  
  return `## AI Response\n\nThank you for your input: "${input}"\n\nI've processed your request and would provide a comprehensive AI-powered response in a production environment. This platform demonstrates how to build, deploy, and scale AI agents.\n\n### Features in Production:\n- Real-time AI model integration\n- Context-aware responses\n- Multi-language support\n- Custom model fine-tuning\n\n*Powered by AI Agent Studio*`;
}

// Helper function to extract text from various HF API response formats
function extractResponseText(data: any, originalInput: string): string {
  let result = '';
  
  if (data.generated_text) {
    result = data.generated_text;
  } else if (Array.isArray(data) && data[0]) {
    if (data[0].generated_text) {
      result = data[0].generated_text;
    } else if (data[0].text) {
      result = data[0].text;
    }
  } else if (typeof data === 'string') {
    result = data;
  }
  
  if (result) {
    // Clean up the result
    result = result.replace(originalInput, '').trim();
    result = result.replace(/^(Human:|Assistant:|User:)/gi, '').trim();
    
    if (result.length < 5) {
      return generateContextualResponse(originalInput);
    }
  }
  
  return result || generateContextualResponse(originalInput);
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

      case 'huggingFaceNode':
      case 'hfInferenceNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);

        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            const sourceNode = flowData.nodes.find(n => n.id === edge.source);
            const label = sourceNode?.data?.label || sourceNode?.type || "Input";
            inputData.push(`${label}: ${sourceOutput.data}`);
          }
        }

        const combinedInput = inputData.join("\n\n");

        if (!combinedInput.trim()) {
          return { data: "", error: "No input provided to AI node" };
        }

        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const model = node.data?.model || "llama3-8b-8192";
        const temperature = node.data?.temperature || 0.7;
        const maxTokens = node.data?.maxTokens || 1000;

        console.log(`Processing AI node ${node.id} with model: ${model}`);

        try {
          // Check for available API tokens
          const groqToken = process.env.GROQ_API_KEY;
          const togetherToken = process.env.TOGETHER_API_KEY;

          console.log('API Keys status:', {
            groq: groqToken ? 'Available' : 'Missing',
            together: togetherToken ? 'Available' : 'Missing'
          });

          // Prioritize Groq if available, otherwise use Together AI
          if (groqToken) {
            console.log('Using Groq API for AI inference');
            
            const groqModelMap: { [key: string]: string } = {
              'gpt2': 'llama3-8b-8192',
              'distilgpt2': 'llama3-8b-8192',
              'microsoft/DialoGPT-small': 'mixtral-8x7b-32768',
              'microsoft/DialoGPT-medium': 'mixtral-8x7b-32768',
              'facebook/blenderbot-400M-distill': 'llama3-8b-8192',
              'llama3-8b-8192': 'llama3-8b-8192',
              'mixtral-8x7b-32768': 'mixtral-8x7b-32768',
              'gemma-7b-it': 'gemma-7b-it'
            };

            const groqModel = groqModelMap[model] || 'llama3-8b-8192';

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqToken}`
              },
              body: JSON.stringify({
                model: groqModel,
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: combinedInput }
                ],
                temperature: Math.min(Math.max(temperature, 0.1), 2.0),
                max_tokens: Math.min(maxTokens, 8000)
              })
            });

            if (response.ok) {
              const data = await response.json();
              const result = data.choices[0]?.message?.content || '';
              
              if (result && result.length > 10) {
                console.log(`Groq API successful, response length: ${result.length}`);
                return { data: result };
              }
            } else {
              console.log(`Groq API error: ${response.status}`);
            }
          }

          // Use Together API (free and reliable)          
          if (togetherToken) {
            console.log('Using Together AI for inference');
            
            const togetherModelMap: { [key: string]: string } = {
              'gpt2': 'meta-llama/Llama-3-8b-chat-hf',
              'distilgpt2': 'meta-llama/Llama-3-8b-chat-hf', 
              'microsoft/DialoGPT-small': 'meta-llama/Llama-3-8b-chat-hf',
              'microsoft/DialoGPT-medium': 'meta-llama/Llama-3-8b-chat-hf',
              'facebook/blenderbot-400M-distill': 'meta-llama/Llama-3-8b-chat-hf',
              'llama3-8b-8192': 'meta-llama/Llama-3-8b-chat-hf',
              'mixtral-8x7b-32768': 'mistralai/Mixtral-8x7B-Instruct-v0.1'
            };

            const togetherModel = togetherModelMap[model] || 'meta-llama/Llama-3-8b-chat-hf';

            try {
              const response = await fetch('https://api.together.xyz/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${togetherToken}`
                },
                body: JSON.stringify({
                  model: togetherModel,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: combinedInput }
                ],
                  temperature: Math.min(Math.max(temperature, 0.1), 1.0),
                  max_tokens: Math.min(maxTokens, 2048),
                  stop: null
                })
              });

              if (response.ok) {
                const data = await response.json();
                const result = data.choices?.[0]?.message?.content || '';
                
                if (result && result.length > 10) {
                  console.log(`Together AI successful, response length: ${result.length}`);
                  return { data: result };
                }
              } else {
                const errorText = await response.text();
                console.log(`Together AI error: ${response.status} - ${errorText}`);
              }
            } catch (error) {
              console.log(`Together AI request failed:`, error);
            }
          }

          // Final fallback to intelligent demo response
          console.log('No API tokens found or all APIs failed, providing intelligent demo response');
          return { data: generateContextualResponse(combinedInput) };

        } catch (error: any) {
          console.error('AI API Error:', error);
          return { data: generateContextualResponse(combinedInput) };
        }
      }

      case 'ollamaNode': {
        // Get input data from connected nodes
        const inputData: string[] = [];
        const incomingEdges = edges.filter(edge => edge.target === node.id);

        for (const edge of incomingEdges) {
          const sourceOutput = nodeOutputs.get(edge.source);
          if (sourceOutput && sourceOutput.data) {
            const sourceNode = flowData.nodes.find(n => n.id === edge.source);
            const label = sourceNode?.data?.label || sourceNode?.type || "Input";
            inputData.push(`${label}: ${sourceOutput.data}`);
          }
        }

        const combinedInput = inputData.join("\n\n");

        if (!combinedInput.trim()) {
          return { data: "", error: "No input provided to Ollama node" };
        }

        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const model = node.data?.model || "llama2";
        const temperature = node.data?.temperature || 0.7;
        const endpoint = node.data?.endpoint || "http://localhost:11434";

        console.log(`Processing Ollama node ${node.id} with model: ${model}`);

        try {
          const response = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              prompt: `${systemPrompt}\n\nUser: ${combinedInput}\nAssistant:`,
              stream: false,
              options: {
                temperature: temperature
              }
            })
          });

          if (!response.ok) {
            return { data: "", error: "Ollama server not available. Make sure Ollama is running locally." };
          }

          const data = await response.json();
          const result = data.response || "";

          console.log(`Ollama node ${node.id} response:`, result.substring(0, 200) + "...");
          return { data: result };
        } catch (error: any) {
          return { 
            data: "", 
            error: "Ollama connection failed. Ensure Ollama is running on " + endpoint 
          };
        }
      }

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

        try {
          // Retry logic for quota exceeded errors
          let retries = 3;
          let delay = 1000; // Start with 1 second delay

          while (retries > 0) {
            try {
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
            } catch (error: any) {
              if (error.status === 429) {
                retries--;
                if (retries > 0) {
                  console.log(`Quota exceeded, retrying in ${delay}ms...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                  delay *= 2; // Exponential backoff
                  continue;
                } else {
                  return { 
                    data: "", 
                    error: "OpenAI quota exceeded after retries. Please check your billing and usage limits at platform.openai.com/account/billing. Ensure you have added a payment method and increased usage limits." 
                  };
                }
              }
              throw error;
            }
          }

          return { data: "", error: "Max retries exceeded" };
        } catch (error: any) {
          if (error.status === 429) {
            return { 
              data: "", 
              error: "OpenAI quota exceeded. Please check your billing and usage limits at platform.openai.com/account/billing" 
            };
          }
          throw error;
        }
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

async function executeGPTNode(node: any, inputs: string[]): Promise<{ data?: string; error?: string }> {
  try {
    console.log(`Executing GPT node with model: ${node.data.model}`);

    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return { error: 'OpenAI API key not configured' };
    }

    // Prepare the input text
    const inputText = inputs.join('\n\n');
    console.log(`Input text length: ${inputText.length} characters`);

    // Prepare messages for OpenAI API
    const messages = [];

    if (node.data.systemPrompt) {
      messages.push({
        role: 'system',
        content: node.data.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: inputText
    });

    console.log(`Making OpenAI API request with ${messages.length} messages`);

    // Make the API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: node.data.model || 'gpt-4o',
        messages: messages,
        temperature: node.data.temperature || 0.7,
        max_tokens: node.data.maxTokens || 1000,
      }),
    });

    console.log(`OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      return { error: `OpenAI API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();

    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('Invalid response format from OpenAI API:', result);
      return { error: 'Invalid response format from OpenAI API' };
    }

    const output = result.choices[0].message.content;
    console.log(`OpenAI API response received, output length: ${output.length} characters`);

    return { data: output };
  } catch (error) {
    console.error('Error executing GPT node:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error in GPT node execution' 
    };
  }
}

async function executeOllamaNode(node: any, inputs: string[]): Promise<{ data?: string; error?: string }> {
  try {
    console.log(`Executing Ollama node with model: ${node.data.model}`);

    // Prepare the input text
    const inputText = inputs.join('\n\n');
    console.log(`Input text length: ${inputText.length} characters`);

    // Prepare the prompt for Ollama
    let prompt = inputText;
    if (node.data.systemPrompt) {
      prompt = `${node.data.systemPrompt}\n\nUser: ${inputText}\n\nAssistant:`;
    }

    const endpoint = node.data.endpoint || 'http://localhost:11434';
    const apiUrl = `${endpoint}/api/generate`;

    console.log(`Making Ollama API request to: ${apiUrl}`);

    // Make the API request to Ollama
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: node.data.model || 'llama2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: node.data.temperature || 0.7,
        },
      }),
    });

    console.log(`Ollama API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ollama API error: ${response.status} - ${errorText}`);
      return { error: `Ollama API error: ${response.status} - ${errorText}. Make sure Ollama is running on ${endpoint}` };
    }

    const result = await response.json();

    if (!result.response) {
      console.error('Invalid response format from Ollama API:', result);
      return { error: 'Invalid response format from Ollama API' };
    }

    const output = result.response;
    console.log(`Ollama API response received, output length: ${output.length} characters`);

    return { data: output };
  } catch (error) {
    console.error('Error executing Ollama node:', error);

    // Check if it's a connection error
    if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed'))) {
      return { 
        error: `Cannot connect to Ollama server at ${node.data.endpoint || 'http://localhost:11434'}. Please make sure Ollama is installed and running.` 
      };
    }

    return { 
      error: error instanceof Error ? error.message : 'Unknown error in Ollama node execution' 
    };
  }
}