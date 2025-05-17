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
import { getTemplateById } from '@/lib/templates';

// Node types
const nodeTypes = {
  inputNode: InputNode,
  gptNode: GPTNode,
  outputNode: OutputNode
};

export default function AgentBuilder() {
  const { id } = useParams();
  const [location, navigate] = useLocation();
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
  
  // Check for template ID in URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('template');

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

  // Handle template loading
  useEffect(() => {
    // Only attempt to load a template if:
    // 1. User is authenticated
    // 2. Not currently editing an existing agent (no id)
    // 3. A template ID is provided in the URL
    if (user && !id && templateId) {
      console.log('Loading template with ID:', templateId);
      
      // Delay template loading slightly to ensure reactflow is initialized
      setTimeout(() => {
        const templateData = getTemplateById(templateId);
        
        if (templateData) {
          // Determine agent name from template ID
          let templateName = 'Template Agent';
          
          switch(templateId) {
            case 'cc-1':
              templateName = 'Blog Writer Agent';
              break;
            case 'cc-2':
              templateName = 'Social Media Agent';
              break;
            case 'cs-1':
              templateName = 'FAQ Responder Agent';
              break;
            case 'dp-1':
              templateName = 'Data Summarizer Agent';
              break;
            case 'dp-2':
              templateName = 'Research Assistant Agent';
              break;
          }
          
          // Set agent name
          setAgentName(templateName);
          
          // Apply the template's nodes and edges
          console.log('Template data:', templateData);
          setNodes(templateData.nodes);
          setEdges(templateData.edges);
          
          // Remove template parameter from URL to prevent reapplying on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Show success message
          toast({
            title: 'Template Applied',
            description: `${templateName} template loaded successfully.`,
          });
        } else {
          toast({
            title: 'Template Error',
            description: 'Could not load the requested template.',
            variant: 'destructive',
          });
        }
      }, 500);
    }
  }, [user, id, templateId, setNodes, setEdges, toast]);

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

        // Define node types mapping
        const typeMap = {
          'inputNode': 'inputNode',
          'gptNode': 'gptNode',
          'outputNode': 'outputNode',
          'textInput': 'inputNode',
          'gptBlock': 'gptNode',
          'textOutput': 'outputNode'
        };
        
        // Use the mapping to determine the correct type
        const nodeType = typeMap[type] || type;
        
        let newNode: Node = {
          id: `${nodeType}-${Date.now()}`,
          type: nodeType,
          position,
          data: {}
        };

        // Set default data based on node type
        if (nodeType === 'inputNode') {
          newNode.data = { 
            label: 'Text Input',
            placeholder: 'Enter your question...',
            description: 'Type your query here'
          };
        } else if (nodeType === 'gptNode') {
          newNode.data = { 
            label: 'GPT-4 Processor',
            model: 'gpt-4o',
            systemPrompt: 'You are a helpful assistant that provides accurate and concise answers.',
            temperature: 0.7,
            maxTokens: 1000
          };
        } else if (nodeType === 'outputNode') {
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
        // Fetch the updated agent info to get the deployment URL
        const updatedAgent = await queryClient.fetchQuery({
          queryKey: [`/api/agents/${id}`],
        });
        
        if (updatedAgent && updatedAgent.deploy_url) {
          toast({
            title: 'Agent deployed',
            description: (
              <div>
                <p>Your agent "{agentName}" has been deployed successfully.</p>
                <p className="mt-2">
                  <a 
                    href={updatedAgent.deploy_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View deployed agent
                  </a>
                </p>
              </div>
            ),
            duration: 10000, // Show for 10 seconds so user has time to click
          });
        } else {
          toast({
            title: 'Agent deployed',
            description: `Your agent "${agentName}" has been deployed successfully.`,
          });
        }
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
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 z-20">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-1.5 text-gray-600 hover:text-gray-900"
              onClick={() => navigate('/dashboard')}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            
            <div className="flex items-center space-x-3 h-9 border border-gray-200 rounded-md px-3 bg-gray-50 hover:bg-white transition-colors">
              <Input 
                type="text" 
                value={agentName} 
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Name your agent..."
                className="h-full border-none text-sm md:text-base font-medium text-gray-900 focus:ring-0 bg-transparent px-0 py-0" 
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom Controls - Desktop Only */}
            <div className="hidden md:flex items-center bg-gray-50 rounded-md border border-gray-200 p-0.5">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.zoomOut();
                  }
                }}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.fitView();
                  }
                }}
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => {
                  if (reactFlowInstance) {
                    reactFlowInstance.zoomIn();
                  }
                }}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {lastSaved && (
              <span className="text-gray-500 text-xs hidden md:inline-block">
                Last saved at {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center"
                    onClick={() => saveAgent(false)}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
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
                    className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                    onClick={() => saveAgent(true)}
                    disabled={isSaving}
                  >
                    <Rocket className="h-4 w-4 mr-1.5" />
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
          <div className="flex-grow bg-[#f9fafc] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden" ref={reactFlowWrapper}>
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
                className="touch-none"
                defaultEdgeOptions={{
                  style: { strokeWidth: 2 },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                  },
                  animated: true,
                }}
              >
                <Background gap={20} size={1} />
                <Controls 
                  position="bottom-right"
                  showInteractive={false}
                  className="m-3"
                />
                <MiniMap
                  nodeStrokeWidth={3}
                  className="bg-white border rounded-lg shadow-sm p-1"
                />
                
                {/* Empty state guidance */}
                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center">
                    <div className="max-w-sm p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Build Your AI Agent</h3>
                      <p className="text-gray-600 mb-4">
                        Drag and drop components from the panel on the left to create your agent's workflow.
                      </p>
                      <div className="text-sm text-gray-500">
                        <p className="mb-2">Start with:</p>
                        <ul className="space-y-1 list-disc pl-5">
                          <li>An input block to collect data</li>
                          <li>Processing blocks like GPT to analyze</li>
                          <li>Output blocks to show results</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
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
