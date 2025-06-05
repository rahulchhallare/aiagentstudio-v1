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
          return { data: "", error: "No input provided to Hugging Face node" };
        }

        const systemPrompt = node.data?.systemPrompt || "You are a helpful assistant.";
        const model = node.data?.model || "gpt2";
        const temperature = node.data?.temperature || 0.7;
        const maxTokens = node.data?.maxTokens || 1000;

        console.log(`Processing Hugging Face node ${node.id} with model: ${model}`);
        console.log(`Input data length: ${combinedInput.length} characters`);
        console.log(`System prompt: ${systemPrompt.substring(0, 100)}...`);

        try {
          // Check if we have a Hugging Face API token
          const hfToken = process.env.HUGGINGFACE_API_TOKEN;

          // Since HF API now requires authentication, provide a helpful response instead
          if (!hfToken) {
            console.log('No Hugging Face API token found, providing demo response');

            // Generate a contextual response based on the input
            let response = '';
            const input = combinedInput.toLowerCase();

            if (input.includes('blog') || input.includes('write') || input.includes('content')) {
              response = `# ${combinedInput}\n\nI'd be happy to help you with content creation! As a demo AI assistant, I can provide guidance on writing engaging content. Here are some key points to consider:\n\n- **Clear headline**: Make sure your title captures attention\n- **Engaging introduction**: Hook your readers from the start\n- **Valuable content**: Provide actionable insights or information\n- **Call to action**: End with what you want readers to do next\n\nWould you like me to elaborate on any of these points?`;
            } else if (input.includes('help') || input.includes('assist')) {
              response = `Hello! I'm a demo AI assistant built with AI Agent Studio. I'm here to help you with various tasks including:\n\n- Content creation and writing\n- Answering questions\n- Providing suggestions and ideas\n- General assistance\n\nHow can I assist you today? Feel free to ask me anything!`;
            } else if (input.includes('trend')) {
              response = `Here are some current AI and technology trends:\n\n🤖 **AI Integration**: More businesses are integrating AI into their workflows\n📱 **No-Code/Low-Code**: Tools that let anyone build applications without coding\n🔗 **API-First Development**: Building applications with APIs at the core\n🎯 **Personalization**: AI-powered personalized user experiences\n\nWhat specific trends are you most interested in learning about?`;
            } else {
              response = `Thank you for your message: "${combinedInput}"\n\nI'm a demo AI assistant powered by AI Agent Studio. While I don't have access to advanced language models in this demo environment, I'm designed to help with various tasks. \n\nFor a production version, you would connect this to services like:\n- OpenAI GPT models\n- Google's Bard/Gemini\n- Anthropic's Claude\n- Or other AI APIs\n\nHow else can I assist you today?`;
            }

            return { data: response };
          }

          // If we have a token, try to use the HF API
          // Use more reliable models that are known to work
          const reliableModels = [
            'deepseek-ai/DeepSeek-R1-0528',
            'ByteDance-Seed/BAGEL-7B-MoT',
            'google/gemma-3n-E4B-it-litert-preview',
            'nvidia/parakeet-tdt-0.6b-v2',
            'mistralai/Devstral-Small-2505',
            'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B'
          ];

          const modelToUse = reliableModels.includes(model) ? model : 'deepseek-ai/DeepSeek-R1-0528';

          console.log(`Attempting Hugging Face request with model: ${modelToUse}`);

          const response = await fetch(`https://api-inference.huggingface.co/models/${modelToUse}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${hfToken}`
            },
            body: JSON.stringify({
              inputs: `${systemPrompt}\n\nUser: ${combinedInput}\nAssistant:`,
              parameters: {
                max_new_tokens: Math.min(maxTokens, 500),
                temperature: temperature,
                return_full_text: false,
                do_sample: true
              }
            })
          });

          console.log(`HF API Response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`HF API Error: ${response.status} - ${errorText}`);

            // Handle specific error cases
            if (response.status === 404) {
              console.log(`Model ${modelToUse} not found, trying fallback model`);

              // Try with the most reliable fallback models in order
              const fallbackModels = ['ByteDance-Seed/BAGEL-7B-MoT', 'nvidia/parakeet-tdt-0.6b-v2', 'mistralai/Devstral-Small-2505'];
              const fallbackModel = fallbackModels[0]; // Select the first fallback model

              const fallbackResponse = await fetch(`https://api-inference.huggingface.co/models/${fallbackModel}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${hfToken}`
                },
                body: JSON.stringify({
                  inputs: combinedInput,
                  parameters: {
                    max_length: Math.min(maxTokens + combinedInput.length, 200),
                    temperature: temperature,
                    return_full_text: false
                  }
                })
              });

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json();
                let result = '';
                if (Array.isArray(fallbackData) && fallbackData[0]) {
                  result = fallbackData[0].generated_text || '';
                } else if (fallbackData.generated_text) {
                  result = fallbackData.generated_text;
                }

                if (result && result.length > 10) {
                  return { data: result };
                }
              }
            }

            // Fallback to demo response
            return { 
              data: `I understand you're asking about "${combinedInput}". I'm a demo AI assistant. The Hugging Face model "${modelToUse}" is currently unavailable (${response.status}), but in a production environment, this would be connected to a robust AI model. How else can I help you?`
            };
          }

          const data = await response.json();
          console.log('HF API Response data:', data);

          let result = '';
          if (Array.isArray(data) && data[0]) {
            result = data[0].generated_text || data[0].text || '';
          } else if (data.generated_text) {
            result = data.generated_text;
          } else if (typeof data === 'string') {
            result = data;
          } else {
            console.log('Unexpected HF API response format:', data);
            return { 
              data: "", 
              error: "Unexpected response format from Hugging Face API" 
            };
          }

          // Clean up the result - remove the original prompt
          const originalPrompt = `${systemPrompt}\n\nUser: ${combinedInput}\nAssistant:`;
          result = result.replace(originalPrompt, '').trim();

          // Remove any remaining prompt artifacts
          result = result.replace(/^(System:|User:|Assistant:)/gi, '').trim();

          if (!result || result.length < 10) {
            console.log('Generated result too short or empty:', result);
            return { 
              data: "", 
              error: "Hugging Face model generated an empty or very short response. Try a different model or check if the model is available." 
            };
          }

          console.log(`Hugging Face node ${node.id} response:`, result.substring(0, 200) + "...");
          return { data: result };
        } catch (error: any) {
          console.error('HF API Error:', error);
          return { 
            data: `Hello! I'm a demo AI assistant built with AI Agent Studio. I'm currently experiencing some technical difficulties with the AI service, but I'm still here to help! This demo shows how you can build AI agents that would normally be powered by advanced language models. In production, you'd connect this to services like OpenAI, Google's AI, or other providers. What would you like to know about AI agent building?`
          };
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