import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
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
import Sidebar from '@/components/dashboard/Sidebar';
import NodePanel from '@/components/builder/NodePanel';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FlowData } from '@/lib/types';
import InputNode from '@/components/builder/nodes/InputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OutputNode from '@/components/builder/nodes/OutputNode';
import { Save, Rocket, Menu, ChevronLeft, ZoomIn, ZoomOut, 
  MousePointer } from 'lucide-react';

// Node types
const nodeTypes = {
  inputNode: InputNode,
  gptNode: GPTNode,
  outputNode: OutputNode
};

export default function AgentBuilder() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch agent data if editing existing agent
  const { data: agent, isLoading: isAgentLoading } = useQuery({
    queryKey: [`/api/agents/${id}`],
    enabled: !!id && !!user,
  });

  // Mutation for saving agent
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string, flowData: FlowData, userId: number, isActive: boolean }) => {
      if (id) {
        // Update existing agent
        const response = await apiRequest('PUT', `/api/agents/${id}`, {
          name: data.name,
          flow_data: data.flowData,
          is_active: data.isActive,
        });
        return response.json();
      } else {
        // Create new agent
        const response = await apiRequest('POST', '/api/agents', {
          name: data.name,
          flow_data: data.flowData,
          user_id: data.userId,
          is_active: data.isActive,
        });
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      setLastSaved(new Date());
      toast({
        title: 'Agent saved successfully',
        description: `Your agent "${data.name}" has been saved.`,
      });
      
      // If this was a new agent, redirect to the edit page
      if (!id && data.id) {
        navigate(`/builder/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to save agent',
        description: error.message || 'An error occurred while saving your agent. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Load agent data if editing
  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
      
      if (agent.flow_data) {
        const flowData = agent.flow_data as FlowData;
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
      }
    }
  }, [agent, setNodes, setEdges]);

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

  // Handle dropping nodes onto canvas
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (reactFlowWrapper.current && reactFlowInstance) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        
        // Check if the dropped element is valid
        if (!type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        let newNode: Node = {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: {}
        };

        // Set default data based on node type
        if (type === 'inputNode') {
          newNode.data = { 
            label: 'Text Input',
            placeholder: 'Enter your question...',
            description: 'Type your query here'
          };
        } else if (type === 'gptNode') {
          newNode.data = { 
            label: 'GPT-4 Processor',
            model: 'gpt-4',
            systemPrompt: 'You are a helpful assistant that provides accurate and concise answers.',
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
      }
    },
    [reactFlowInstance, setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle node click
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle background click
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Save agent
  const saveAgent = useCallback(async (deploy: boolean = false) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You need to be logged in to save an agent.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (!reactFlowInstance) {
        throw new Error('Flow instance not initialized');
      }

      const flowData: FlowData = reactFlowInstance.toObject();
      
      await saveMutation.mutateAsync({
        name: agentName,
        flowData,
        userId: user.id,
        isActive: deploy,
      });

      if (deploy) {
        toast({
          title: 'Agent deployed',
          description: `Your agent "${agentName}" has been deployed successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving agent:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, agentName, reactFlowInstance, saveMutation, toast]);

  // If loading, show spinner
  if (authLoading || (id && isAgentLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 flex flex-col h-screen">
        {/* Builder Header */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 z-20">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <Button 
              variant="ghost" 
              className="flex items-center space-x-2"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div>
              <Input 
                type="text" 
                value={agentName} 
                onChange={(e) => setAgentName(e.target.value)}
                className="text-lg font-medium text-gray-900 border-b-2 border-transparent focus:border-primary-500 focus:outline-none bg-transparent py-1" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-gray-500 text-sm hidden md:inline-block">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => saveAgent(false)}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden md:inline-block">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Save your agent
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => saveAgent(true)}
                    disabled={isSaving}
                  >
                    <Rocket className="h-4 w-4" />
                    <span className="hidden md:inline-block">Deploy</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Save and deploy your agent
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Builder Content */}
        <div className="flex-grow flex overflow-hidden">
          {/* Left Panel (Components) */}
          <NodePanel />
          
          {/* Canvas (React Flow Area) */}
          <div className="flex-grow bg-gray-50 relative overflow-hidden" ref={reactFlowWrapper}>
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                snapToGrid
                snapGrid={[15, 15]}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              >
                <Background />
                <Controls />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
          
          {/* Right Panel (Properties) */}
          <PropertiesPanel 
            selectedNode={selectedNode} 
            updateNode={(updatedNode) => {
              setNodes(nodes.map(node => 
                node.id === updatedNode.id ? updatedNode : node
              ));
            }}
          />
        </div>
      </div>
    </div>
  );
}
