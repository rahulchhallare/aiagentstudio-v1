import { Node, Edge, Position } from 'reactflow';
import { FlowData } from './types';

// Base template with a unique id generator function
const createTemplateFlow = (nodes: Node[], edges: Edge[]): FlowData => {
  // Assign unique IDs to nodes and update edge references
  const nodeIdMap = new Map<string, string>();
  
  const newNodes = nodes.map(node => {
    const newId = `${node.id}-${Date.now()}`;
    nodeIdMap.set(node.id, newId);
    return { ...node, id: newId };
  });
  
  const newEdges = edges.map(edge => {
    return {
      ...edge,
      id: `${edge.id}-${Date.now()}`,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target
    };
  });
  
  return {
    nodes: newNodes,
    edges: newEdges
  };
};

// Blog Writer Template
export const blogWriterTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Blog Topic',
        placeholder: 'Enter the blog topic...',
        description: 'What should this blog post be about?',
        required: true
      }
    },
    {
      id: 'input-2',
      type: 'inputNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'Target Audience',
        placeholder: 'Who is the target audience?',
        description: 'Define who the blog post is written for',
        required: false,
        defaultValue: 'General audience'
      }
    },
    {
      id: 'hf-1',
      type: 'huggingFaceNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Outline Generator',
        model: 'microsoft/DialoGPT-medium',
        systemPrompt: 'You are a professional content strategist who creates detailed blog post outlines. Based on the topic and target audience, create a comprehensive outline with main sections and bullet points for subsections.',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    {
      id: 'hf-2',
      type: 'huggingFaceNode',
      position: { x: 250, y: 440 },
      data: {
        label: 'Blog Post Writer',
        model: 'microsoft/DialoGPT-medium',
        systemPrompt: 'You are a professional blog writer who creates engaging, informative content. Using the provided outline, write a complete blog post that is engaging, informative, and tailored to the target audience. Include a compelling introduction, well-structured body with headings and subheadings, and a conclusion with a call to action.',
        temperature: 0.8,
        maxTokens: 2000
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 570 },
      data: {
        label: 'Final Blog Post',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'hf-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'input-2',
      target: 'hf-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-3',
      source: 'hf-1',
      target: 'hf-2',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-4',
      source: 'hf-2',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// Social Media Creator Template
export const socialMediaTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Content Topic',
        placeholder: 'Enter content topic or product...',
        description: 'What should the social media posts be about?',
        required: true
      }
    },
    {
      id: 'input-2',
      type: 'inputNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'Platforms',
        placeholder: 'Twitter, Instagram, LinkedIn...',
        description: 'Which platforms do you want content for?',
        required: true
      }
    },
    {
      id: 'gpt-1',
      type: 'gptNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Social Media Generator',
        model: 'gpt-4o',
        systemPrompt: 'You are a professional social media manager. Create engaging social media posts for the specified platforms about the given topic. Adjust the tone, length, and format to be optimal for each platform. For Twitter, keep under 280 characters. For LinkedIn, make it professional. For Instagram, make it visual and engaging with appropriate hashtags.',
        temperature: 0.8,
        maxTokens: 1000
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 440 },
      data: {
        label: 'Social Media Posts',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'input-2',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-3',
      source: 'gpt-1',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// FAQ Responder Template
export const faqResponderTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Customer Question',
        placeholder: 'Enter customer question...',
        description: 'What is the customer asking about?',
        required: true
      }
    },
    {
      id: 'gpt-1',
      type: 'gptNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'FAQ Matcher',
        model: 'gpt-4o',
        systemPrompt: 'You are a customer support assistant. Your role is to understand customer questions and provide helpful, accurate answers based on company knowledge. Maintain a friendly, professional tone and focus on addressing the customer\'s needs. If you\'re unsure about an answer, acknowledge that and suggest where the customer might find more information rather than inventing details.\n\nKnowledge Base:\n- Our return policy allows returns within 30 days of purchase with receipt\n- Free shipping on orders over $50\n- Products have a 1-year warranty against manufacturing defects\n- We ship to the US and Canada only\n- Customer support hours: Mon-Fri, 9am-5pm EST\n- Orders typically process in 1-2 business days\n- Subscription plans can be canceled anytime with no penalty',
        temperature: 0.3,
        maxTokens: 800
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Response to Customer',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'gpt-1',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// Data Summarizer Template
export const dataSummarizerTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Data Input',
        placeholder: 'Paste structured data (JSON, CSV, etc.)...',
        description: 'Enter the data you want to summarize',
        required: true
      }
    },
    {
      id: 'input-2',
      type: 'inputNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'Summary Focus',
        placeholder: 'What aspects to focus on...',
        description: 'What aspects of the data are most important?',
        required: false
      }
    },
    {
      id: 'gpt-1',
      type: 'gptNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Data Analyzer',
        model: 'gpt-4o',
        systemPrompt: 'You are a data analysis expert. Analyze the provided structured data and create a comprehensive summary that highlights key patterns, trends, and insights. Focus on the aspects specified by the user. Present your analysis in a clear, organized format with sections for methodology, key findings, and recommendations if applicable.',
        temperature: 0.2,
        maxTokens: 1500
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 440 },
      data: {
        label: 'Data Summary',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'input-2',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-3',
      source: 'gpt-1',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// Research Assistant Template
export const researchAssistantTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Research Topic',
        placeholder: 'Enter research topic...',
        description: 'What topic are you researching?',
        required: true
      }
    },
    {
      id: 'gpt-1',
      type: 'gptNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'Research Planner',
        model: 'gpt-4o',
        systemPrompt: 'You are a research methodology expert. Based on the provided research topic, create a comprehensive research plan including key questions to investigate, potential sources of information, methodological approaches, and anticipated challenges. Your output should help guide a thorough literature review and research synthesis.',
        temperature: 0.4,
        maxTokens: 1000
      }
    },
    {
      id: 'gpt-2',
      type: 'gptNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Literature Reviewer',
        model: 'gpt-4o',
        systemPrompt: 'You are a thorough academic researcher. Based on the research plan and topic, provide a comprehensive literature review synthesis. Mention key authors, theories, findings, and gaps in the literature. Organize the information by themes or chronologically as appropriate. Note that this is a simulated literature review (you don\'t have access to actual academic sources), so you should focus on providing a framework that the user can fill in with actual citations and findings.',
        temperature: 0.3,
        maxTokens: 2000
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 440 },
      data: {
        label: 'Research Summary',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'gpt-1',
      target: 'gpt-2',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-3',
      source: 'gpt-2',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// Ticket Classifier Template
export const ticketClassifierTemplate = (): FlowData => {
  const nodes: Node[] = [
    {
      id: 'input-1',
      type: 'inputNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Support Ticket',
        placeholder: 'Enter the customer support ticket...',
        description: 'Paste the full text of the customer ticket',
        required: true
      }
    },
    {
      id: 'gpt-1',
      type: 'gptNode',
      position: { x: 250, y: 180 },
      data: {
        label: 'Ticket Classifier',
        model: 'gpt-4o',
        systemPrompt: 'You are a customer support ticket classifier. Analyze the provided ticket text and categorize it based on the following criteria:\n\n1. Priority Level: Low, Medium, High, Critical\n2. Department: Technical Support, Billing, Product Information, Feature Request, Bug Report, Account Issues\n3. Estimated Resolution Time: Quick (< 1 hour), Standard (1-24 hours), Extended (1-3 days), Complex (3+ days)\n\nProvide a brief justification for each classification. Then suggest a specific next action for the support team to take.',
        temperature: 0.3,
        maxTokens: 800
      }
    },
    {
      id: 'output-1',
      type: 'outputNode',
      position: { x: 250, y: 310 },
      data: {
        label: 'Ticket Classification',
        format: 'markdown'
      }
    }
  ];
  
  const edges: Edge[] = [
    {
      id: 'edge-1',
      source: 'input-1',
      target: 'gpt-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    },
    {
      id: 'edge-2',
      source: 'gpt-1',
      target: 'output-1',
      sourceHandle: 'output',
      targetHandle: 'input',
      type: 'smoothstep',
      animated: true
    }
  ];
  
  return createTemplateFlow(nodes, edges);
};

// Map template IDs to template generator functions
export const getTemplateById = (templateId: string): FlowData | null => {
  const templates: Record<string, () => FlowData> = {
    'cc-1': blogWriterTemplate,
    'cc-2': socialMediaTemplate,
    'cs-1': faqResponderTemplate,
    'cs-2': ticketClassifierTemplate,
    'dp-1': dataSummarizerTemplate,
    'dp-2': researchAssistantTemplate,
  };
  
  return templates[templateId] ? templates[templateId]() : null;
};