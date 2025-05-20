import { FlowData } from '@shared/schema';

// Creates a simple pre-configured test agent for demo purposes
export function createTestAgent(): FlowData {
  // Create a simple agent with Input -> GPT -> Output nodes
  const inputNode = {
    id: 'input-1',
    type: 'inputNode',
    position: { x: 100, y: 200 },
    data: {
      label: 'User Input',
      placeholder: 'What would you like to know?',
      description: 'Enter your question here',
      required: true
    }
  };

  const gptNode = {
    id: 'gpt-1',
    type: 'gptNode',
    position: { x: 400, y: 200 },
    data: {
      label: 'AI Processing',
      model: 'gpt-4o',
      systemPrompt: 'You are a helpful assistant specialized in content creation. Provide detailed, creative, and well-structured responses.',
      temperature: 0.7,
      maxTokens: 2000
    }
  };

  const outputNode = {
    id: 'output-1',
    type: 'outputNode',
    position: { x: 700, y: 200 },
    data: {
      label: 'Response',
      format: 'markdown'
    }
  };

  // Connect the nodes
  const edgeInputToGpt = {
    id: 'edge-input-gpt',
    source: 'input-1',
    target: 'gpt-1'
  };

  const edgeGptToOutput = {
    id: 'edge-gpt-output',
    source: 'gpt-1',
    target: 'output-1'
  };

  return {
    nodes: [inputNode, gptNode, outputNode],
    edges: [edgeInputToGpt, edgeGptToOutput],
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    }
  };
}