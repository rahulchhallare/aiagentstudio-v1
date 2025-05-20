import { MarkerType } from 'reactflow';
import { FlowData } from './types';

// Default layout for a blank agent with pre-connected components
export const getDefaultLayout = (): FlowData => {
  return {
    nodes: [
      {
        id: 'input-default',
        type: 'inputNode',
        position: { x: 250, y: 80 },
        data: { 
          label: 'Text Input', 
          placeholder: 'Enter your question...', 
          description: 'Type your query here' 
        }
      },
      {
        id: 'gpt-default',
        type: 'gptNode',
        position: { x: 250, y: 250 },
        data: { 
          label: 'GPT-4 Processor',
          model: 'gpt-4o',
          systemPrompt: 'You are a helpful assistant that provides accurate and concise answers.',
          temperature: 0.7,
          maxTokens: 1000
        }
      },
      {
        id: 'output-default',
        type: 'outputNode',
        position: { x: 250, y: 430 },
        data: { 
          label: 'Text Output', 
          format: 'markdown' 
        }
      }
    ],
    edges: [
      {
        id: 'e-input-gpt',
        source: 'input-default',
        target: 'gpt-default',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-gpt-output',
        source: 'gpt-default',
        target: 'output-default',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    ]
  };
};

// Simple layout with just input and output
export const getSimpleLayout = (): FlowData => {
  return {
    nodes: [
      {
        id: 'input-simple',
        type: 'inputNode',
        position: { x: 250, y: 100 },
        data: { 
          label: 'Text Input', 
          placeholder: 'Enter your text...',
          description: 'User input'
        }
      },
      {
        id: 'output-simple',
        type: 'outputNode',
        position: { x: 250, y: 250 },
        data: { 
          label: 'Text Output',
          format: 'plaintext'
        }
      }
    ],
    edges: [
      {
        id: 'e-input-output',
        source: 'input-simple',
        target: 'output-simple',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    ]
  };
};

// Logic pattern with conditional branching
export const getLogicLayout = (): FlowData => {
  return {
    nodes: [
      {
        id: 'input-logic',
        type: 'inputNode',
        position: { x: 250, y: 50 },
        data: { 
          label: 'User Input', 
          placeholder: 'Enter a number...',
          description: 'Enter a value to check'
        }
      },
      {
        id: 'logic-node',
        type: 'logicNode',
        position: { x: 250, y: 180 },
        data: { 
          label: 'Number Check',
          condition: 'parseInt(input) > 10',
          description: 'Checks if number is greater than 10'
        }
      },
      {
        id: 'gpt-true',
        type: 'gptNode',
        position: { x: 100, y: 350 },
        data: { 
          label: 'Large Number Response',
          model: 'gpt-4o',
          systemPrompt: 'The user entered a large number (>10). Provide an interesting fact about large numbers.',
          temperature: 0.7,
          maxTokens: 500
        }
      },
      {
        id: 'gpt-false',
        type: 'gptNode',
        position: { x: 400, y: 350 },
        data: { 
          label: 'Small Number Response',
          model: 'gpt-4o',
          systemPrompt: 'The user entered a small number (≤10). Provide an interesting fact about small numbers.',
          temperature: 0.7,
          maxTokens: 500
        }
      },
      {
        id: 'output-logic',
        type: 'outputNode',
        position: { x: 250, y: 500 },
        data: { 
          label: 'Final Response',
          format: 'markdown'
        }
      }
    ],
    edges: [
      {
        id: 'e-input-logic',
        source: 'input-logic',
        target: 'logic-node',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-logic-true',
        source: 'logic-node',
        target: 'gpt-true',
        sourceHandle: 'true',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-logic-false',
        source: 'logic-node',
        target: 'gpt-false',
        sourceHandle: 'false',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-gpt-true-output',
        source: 'gpt-true',
        target: 'output-logic',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-gpt-false-output',
        source: 'gpt-false',
        target: 'output-logic',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    ]
  };
};

// API integration pattern
export const getAPILayout = (): FlowData => {
  return {
    nodes: [
      {
        id: 'input-api',
        type: 'inputNode',
        position: { x: 250, y: 50 },
        data: { 
          label: 'Search Query', 
          placeholder: 'Enter search keywords...',
          description: 'Enter keywords to search'
        }
      },
      {
        id: 'api-node',
        type: 'apiNode',
        position: { x: 250, y: 180 },
        data: { 
          label: 'Search API',
          endpoint: 'https://api.example.com/search',
          method: 'GET',
          headers: '{"Content-Type": "application/json", "Accept": "application/json"}',
          body: '{}'
        }
      },
      {
        id: 'gpt-api',
        type: 'gptNode',
        position: { x: 250, y: 320 },
        data: { 
          label: 'Results Processor',
          model: 'gpt-4o',
          systemPrompt: 'Summarize the search results into a concise, readable format.',
          temperature: 0.5,
          maxTokens: 800
        }
      },
      {
        id: 'output-api',
        type: 'outputNode',
        position: { x: 250, y: 450 },
        data: { 
          label: 'Processed Results',
          format: 'markdown'
        }
      }
    ],
    edges: [
      {
        id: 'e-input-api',
        source: 'input-api',
        target: 'api-node',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-api-gpt',
        source: 'api-node',
        target: 'gpt-api',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      },
      {
        id: 'e-gpt-output',
        source: 'gpt-api',
        target: 'output-api',
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }
    ]
  };
};