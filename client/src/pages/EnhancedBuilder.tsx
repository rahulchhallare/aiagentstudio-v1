import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Rocket, ChevronLeft, X, PanelLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TemplatesPanel from '@/components/builder/TemplatesPanel';
import { 
  blogWriterTemplate, 
  socialMediaTemplate, 
  faqResponderTemplate, 
  dataSummarizerTemplate, 
  researchAssistantTemplate 
} from '@/lib/templates';

// Import node components
import InputNode from '@/components/builder/nodes/InputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OutputNode from '@/components/builder/nodes/OutputNode';
import APINode from '@/components/builder/nodes/APINode';
import LogicNode from '@/components/builder/nodes/LogicNode';

// Define node types
const nodeTypes = {
  inputNode: InputNode,
  gptNode: GPTNode,
  outputNode: OutputNode,
  apiNode: APINode,
  logicNode: LogicNode,
};

export default function EnhancedBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Agent state
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  
  // ReactFlow state
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Load template function
  const loadTemplate = useCallback((templateData: { nodes: Node[], edges: Edge[] }) => {
    if (!templateData) return;
    
    setNodes(templateData.nodes);
    setEdges(templateData.edges);
    
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView();
      }
    }, 50);
  }, [setNodes, setEdges, reactFlowInstance]);

  // Template selection handler
  const handleTemplateSelect = useCallback((templateId: string) => {
    let templateData;
    
    switch(templateId) {
      case 'blog-writer':
        templateData = blogWriterTemplate();
        break;
      case 'social-media':
        templateData = socialMediaTemplate();
        break;
      case 'faq-responder':
        templateData = faqResponderTemplate();
        break;
      case 'data-summarizer':
        templateData = dataSummarizerTemplate();
        break;
      case 'research-assistant':
        templateData = researchAssistantTemplate();
        break;
      default:
        // Default blank template
        templateData = {
          nodes: [
            {
              id: 'input-1',
              type: 'inputNode',
              position: { x: 250, y: 100 },
              data: { 
                label: 'Text Input', 
                placeholder: 'Enter your question...', 
                description: 'Type your query here' 
              }
            },
            {
              id: 'gpt-1',
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
              id: 'output-1',
              type: 'outputNode',
              position: { x: 250, y: 400 },
              data: { 
                label: 'Text Output', 
                format: 'markdown' 
              }
            }
          ],
          edges: [
            {
              id: 'e1-2',
              source: 'input-1',
              target: 'gpt-1',
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            },
            {
              id: 'e2-3',
              source: 'gpt-1',
              target: 'output-1',
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }
          ]
        };
    }
    
    loadTemplate(templateData);
    setShowTemplateMenu(false);
  }, [loadTemplate]);

  // Load initial nodes and edges when component mounts
  useEffect(() => {
    // Load blank template by default
    handleTemplateSelect('blank');
  }, [handleTemplateSelect]);
  
  // Handle connecting nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => 
        addEdge({ 
          ...params, 
          type: 'smoothstep', 
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }, eds)
      );
    },
    [setEdges]
  );
  
  // Handle node drag over
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle node drop
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.log('Missing reactFlowWrapper or reactFlowInstance');
        return;
      }
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is valid
      if (!type) {
        console.log('No valid node type found in dataTransfer');
        return;
      }
      
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      console.log('Creating new node of type:', type, 'at position:', position);
      
      let newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {}
      };
      
      // Set appropriate data based on node type
      if (type === 'inputNode') {
        newNode.data = { 
          label: 'Text Input',
          placeholder: 'Enter your text...',
          description: 'User input' 
        };
      } else if (type === 'gptNode') {
        newNode.data = { 
          label: 'GPT-4 Processor',
          model: 'gpt-4o',
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.7,
          maxTokens: 1000
        };
      } else if (type === 'apiNode') {
        newNode.data = { 
          label: 'API Block',
          endpoint: 'https://api.example.com',
          method: 'GET',
          headers: '{}',
          body: '{}'
        };
      } else if (type === 'logicNode') {
        newNode.data = { 
          label: 'Logic Block',
          condition: 'input.length > 0',
          description: 'Logic branch based on condition'
        };
      } else if (type === 'outputNode') {
        newNode.data = { 
          label: 'Text Output',
          format: 'markdown'
        };
      }
      
      console.log('Adding new node:', newNode);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );
  
  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);
  
  // Handle background click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  
  // Save agent
  const handleSave = () => {
    if (!reactFlowInstance) return;
    
    setIsSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Agent Saved',
        description: 'Your agent has been saved successfully.',
      });
    }, 1000);
  };
  
  // Deploy agent
  const handleDeploy = () => {
    if (!reactFlowInstance) return;
    
    toast({
      title: 'Agent Deployed',
      description: 'Your agent has been deployed successfully.',
    });
  };
  
  // Node component buttons
  const addInputNode = () => {
    if (!reactFlowInstance) return;
    
    const newNode: Node = {
      id: `inputNode-${Date.now()}`,
      type: 'inputNode',
      position: { 
        x: Math.random() * 300, 
        y: Math.random() * 300 
      },
      data: { 
        label: 'Text Input',
        placeholder: 'Enter your text...',
        description: 'User input' 
      }
    };
    
    setNodes((nodes) => nodes.concat(newNode));
  };
  
  const addGPTNode = () => {
    if (!reactFlowInstance) return;
    
    const newNode: Node = {
      id: `gptNode-${Date.now()}`,
      type: 'gptNode',
      position: { 
        x: Math.random() * 300 + 200, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: 'GPT-4 Processor',
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.',
        temperature: 0.7,
        maxTokens: 1000
      }
    };
    
    setNodes((nodes) => nodes.concat(newNode));
  };
  
  const addAPINode = () => {
    if (!reactFlowInstance) return;
    
    const newNode: Node = {
      id: `apiNode-${Date.now()}`,
      type: 'apiNode',
      position: { 
        x: Math.random() * 300 + 300, 
        y: Math.random() * 300 + 150 
      },
      data: { 
        label: 'API Connector',
        endpoint: 'https://api.example.com',
        method: 'GET',
        headers: '{}',
        body: '{}'
      }
    };
    
    setNodes((nodes) => nodes.concat(newNode));
  };
  
  const addLogicNode = () => {
    if (!reactFlowInstance) return;
    
    const newNode: Node = {
      id: `logicNode-${Date.now()}`,
      type: 'logicNode',
      position: { 
        x: Math.random() * 300 + 250, 
        y: Math.random() * 300 + 200 
      },
      data: { 
        label: 'Condition',
        condition: 'input.length > 0',
        description: 'Logic branch based on condition'
      }
    };
    
    setNodes((nodes) => nodes.concat(newNode));
  };
  
  const addOutputNode = () => {
    if (!reactFlowInstance) return;
    
    const newNode: Node = {
      id: `outputNode-${Date.now()}`,
      type: 'outputNode',
      position: { 
        x: Math.random() * 300 + 400, 
        y: Math.random() * 300 + 200 
      },
      data: { 
        label: 'Text Output',
        format: 'markdown'
      }
    };
    
    setNodes((nodes) => nodes.concat(newNode));
  };
  
  // Helper function to determine if we should show properties panel
  const renderPropertiesPanel = () => {
    if (!selectedNode) return null;
    
    return (
      <div className="w-80 border-l bg-background overflow-y-auto flex-shrink-0 shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-medium text-lg">Node Properties</h3>
          <X 
            className="h-5 w-5 text-gray-500 cursor-pointer" 
            onClick={() => setSelectedNode(null)} 
          />
        </div>
        
        <div className="p-4 space-y-4">
          {selectedNode.type === 'inputNode' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        label: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Node Label"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Placeholder Text</label>
                <Input
                  value={(selectedNode.data as any).placeholder || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        placeholder: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Enter placeholder text..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={(selectedNode.data as any).description || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        description: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Describe this input..."
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[80px]"
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'gptNode' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        label: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Node Label"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Select
                  value={(selectedNode.data as any).model || 'gpt-4o'}
                  onValueChange={(value) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        model: value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <textarea
                  value={(selectedNode.data as any).systemPrompt || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        systemPrompt: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Enter system instructions..."
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Temperature: {(selectedNode.data as any).temperature || 0.7}</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={(selectedNode.data as any).temperature || 0.7}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        temperature: parseFloat(e.target.value)
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>More Precise</span>
                  <span>More Creative</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <Input
                  type="number"
                  min="1"
                  max="4000"
                  value={(selectedNode.data as any).maxTokens || 1000}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        maxTokens: parseInt(e.target.value)
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                />
              </div>
            </>
          )}
          
          {selectedNode.type === 'outputNode' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        label: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Node Label"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Format</label>
                <Select
                  value={(selectedNode.data as any).format || 'markdown'}
                  onValueChange={(value) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        format: value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintext">Plain Text</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {selectedNode.type === 'apiNode' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        label: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Node Label"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input
                  value={(selectedNode.data as any).endpoint || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        endpoint: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="https://api.example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Method</label>
                <Select
                  value={(selectedNode.data as any).method || 'GET'}
                  onValueChange={(value) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        method: value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Headers (JSON)</label>
                <textarea
                  value={(selectedNode.data as any).headers || '{}'}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        headers: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder='{"Content-Type": "application/json"}'
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[80px] font-mono"
                />
              </div>
              
              {(selectedNode.data as any).method !== 'GET' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Request Body (JSON)</label>
                  <textarea
                    value={(selectedNode.data as any).body || '{}'}
                    onChange={(e) => {
                      const updatedNode = {
                        ...selectedNode,
                        data: {
                          ...selectedNode.data,
                          body: e.target.value
                        }
                      };
                      setNodes((nds) =>
                        nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                      );
                    }}
                    placeholder='{"key": "value"}'
                    className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[80px] font-mono"
                  />
                </div>
              )}
            </>
          )}
          
          {selectedNode.type === 'logicNode' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as any).label || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        label: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Node Label"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={(selectedNode.data as any).description || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        description: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="Describe this logic branch..."
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Condition</label>
                <textarea
                  value={(selectedNode.data as any).condition || ''}
                  onChange={(e) => {
                    const updatedNode = {
                      ...selectedNode,
                      data: {
                        ...selectedNode.data,
                        condition: e.target.value
                      }
                    };
                    setNodes((nds) =>
                      nds.map((n) => (n.id === selectedNode.id ? updatedNode : n))
                    );
                  }}
                  placeholder="input.length > 0"
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm min-h-[80px] font-mono"
                />
              </div>
              
              <div className="mt-4 pt-4 border-t flex justify-between">
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-green-600 mb-1">True output</span>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-red-600 mb-1">False output</span>
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Button>
          <div className="h-5 w-[1px] bg-border mx-4"></div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 mr-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-1 rounded-md"
          >
            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
            <path d="M17.5 8a2.5 2.5 0 0 0 -5 0" />
            <path d="M19.5 17a2.5 2.5 0 0 0 0 -5" />
          </svg>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="h-9 border-none shadow-none focus-visible:ring-0 p-0 text-lg font-medium"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <TemplatesPanel onSelectTemplate={loadTemplate} />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="mr-1 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <Button
            size="sm"
            onClick={handleDeploy}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700"
          >
            <Rocket className="mr-1 h-4 w-4" />
            Deploy
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Components panel */}
        <div className="w-72 border-r bg-background overflow-y-auto flex-shrink-0 shadow-sm">
          <div className="p-4 space-y-6">
            <div>
              <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">Components</h3>
              <p className="text-sm text-gray-500 mb-4">Drag and drop these components to the canvas on the right, or click to add them directly:</p>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground mb-2">Input</div>
              <div 
                className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', 'inputNode');
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={addInputNode}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center mr-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="12" x2="15" y2="12"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Text Input</div>
                  <div className="text-xs text-blue-500">User text input</div>
                </div>
              </div>
              
              <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">AI Processing</div>
              <div 
                className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', 'gptNode');
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={addGPTNode}
              >
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center mr-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"></path>
                    <path d="M17.5 8a2.5 2.5 0 0 0 -5 0"></path>
                    <path d="M19.5 17a2.5 2.5 0 0 0 0 -5"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">GPT Block</div>
                  <div className="text-xs text-green-500">AI text generation</div>
                </div>
              </div>
              
              <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Integration</div>
              <div 
                className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', 'apiNode');
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={addAPINode}
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center mr-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">API Block</div>
                  <div className="text-xs text-indigo-500">External API call</div>
                </div>
              </div>
              
              <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Logic</div>
              <div 
                className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', 'logicNode');
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={addLogicNode}
              >
                <div className="w-8 h-8 bg-amber-100 rounded-md flex items-center justify-center mr-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3v12h10l-4-4m0 8l4-4"></path>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Logic Block</div>
                  <div className="text-xs text-amber-500">Conditional branching</div>
                </div>
              </div>
              
              <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">Output</div>
              <div 
                className="p-3 bg-purple-50 border border-purple-200 text-purple-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/reactflow', 'outputNode');
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={addOutputNode}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mr-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm">Text Output</div>
                  <div className="text-xs text-purple-500">Display text results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content - ReactFlow canvas */}
        <ReactFlowProvider>
          <div 
            className="flex-1 h-full" 
            ref={reactFlowWrapper}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              deleteKeyCode="Delete"
              fitView
            >
              <Background gap={12} size={1} />
              <Controls />
              <MiniMap />
              <Panel position="top-center">
                <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-md border shadow-sm text-sm text-center">
                  Drag components from the left panel and connect them to build your agent
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
        
        {/* Right sidebar - Properties panel */}
        {renderPropertiesPanel()}
      </div>
    </div>
  );
}