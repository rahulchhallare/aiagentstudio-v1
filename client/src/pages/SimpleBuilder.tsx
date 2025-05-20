import { useState, useCallback, useRef } from 'react';
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
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Rocket, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InputNode from '@/components/builder/nodes/InputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OutputNode from '@/components/builder/nodes/OutputNode';

// Define node types
const nodeTypes = {
  inputNode: InputNode,
  gptNode: GPTNode,
  outputNode: OutputNode,
};

// Start with empty canvas - user will need to drag and drop components
// This ensures components only appear when explicitly added by the user
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function SimpleBuilder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);

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

  // Handle node drag
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle background click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Mock save function
  const handleSave = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: 'Agent Saved',
        description: 'Your agent has been saved successfully.',
      });
    }, 1000);
  };

  // Mock deploy function
  const handleDeploy = () => {
    toast({
      title: 'Agent Deployed',
      description: 'Your agent has been deployed successfully.',
    });
  };

  // Add new node
  const addNewNode = (type: string) => {
    if (!reactFlowInstance) return;
    
    // Get viewport center
    const { x, y } = reactFlowInstance.getViewport();
    
    let newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: -x + 200, y: -y + 200 },
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
    
    setNodes((nds) => nds.concat(newNode));
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
        {/* Left sidebar */}
        <div className="w-64 border-r bg-background p-4 overflow-y-auto">
          <h3 className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">Components</h3>
          
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground mb-2">Input</div>
            <div 
              className="p-3 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg cursor-pointer hover:shadow-sm transition-shadow flex items-center"
              onClick={() => addNewNode('inputNode')}
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
              onClick={() => addNewNode('gptNode')}
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
              onClick={() => addNewNode('outputNode')}
            >
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center mr-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3 A 3 3 0 0 1 12 6 A 3 3 0 0 1 9 3 A 3 3 0 0 1 15 3 z"></path>
                  <path d="M16 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3"></path>
                  <path d="M10 12v4"></path>
                  <path d="M14 12v4"></path>
                </svg>
              </div>
              <div>
                <div className="font-medium text-sm">Text Output</div>
                <div className="text-xs text-purple-500">Display text results</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content - Flow canvas */}
        <div className="flex-1 flex overflow-hidden" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              attributionPosition="bottom-right"
            >
              <Background gap={12} size={1} color="#f1f1f1" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}