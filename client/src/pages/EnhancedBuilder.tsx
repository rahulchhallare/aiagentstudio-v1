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
import { Save, Rocket, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import node components
import InputNode from '@/components/builder/nodes/InputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OutputNode from '@/components/builder/nodes/OutputNode';

// Define node types
const nodeTypes = {
  inputNode: InputNode,
  gptNode: GPTNode,
  outputNode: OutputNode,
};

export default function EnhancedBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Agent state
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [isSaving, setIsSaving] = useState(false);
  
  // ReactFlow state
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Load initial nodes and edges when component mounts
  useEffect(() => {
    // Create default nodes for blank template
    const initialNodes: Node[] = [
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
    ];

    const initialEdges: Edge[] = [
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
    ];
    
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [setNodes, setEdges]);
  
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
        <div className="flex space-x-2">
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
            className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
      </div>
    </div>
  );
}