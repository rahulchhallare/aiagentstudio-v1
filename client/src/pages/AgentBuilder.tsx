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
import { queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FlowData } from '@/lib/types';
import InputNode from '@/components/builder/nodes/InputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OutputNode from '@/components/builder/nodes/OutputNode';
import { Save, Rocket, Menu, ChevronLeft, ZoomIn, ZoomOut, 
  MousePointer } from 'lucide-react';
import DeployModal from '@/components/builder/DeployModal';
import { getTemplateById } from '@/lib/templates';
import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";

// Node types
const nodeTypes = {
  inputNode: InputNode,
  fileInputNode: InputNode,
  imageInputNode: InputNode,
  webhookInputNode: InputNode,
  gptNode: GPTNode,
  imageGenerationNode: GPTNode,
  chatbotNode: GPTNode,
  transformNode: GPTNode,
  translationNode: GPTNode,
  outputNode: OutputNode,
  imageOutputNode: OutputNode,
  emailNode: OutputNode,
  notificationNode: OutputNode,
  dashboardNode: OutputNode,
  conditionNode: GPTNode,
  loopNode: GPTNode,
  calculatorNode: GPTNode,
  databaseNode: GPTNode,
  apiNode: GPTNode,
  socialMediaNode: GPTNode,
  webhookNode: GPTNode
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
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  
  // Check for template ID in URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const templateId = urlParams.get('template');

  // Fetch agent data if editing existing agent
  // Only enabled if an ID is provided (we don't need a user for the initial view)
  const { data: agent, isLoading: isAgentLoading } = useQuery({
    queryKey: [`/api/agents/${id}`],
    enabled: !!id,
  });

  // Mutation for saving agent
  const saveMutation = useMutation({
    mutationFn: async (data: { 
      name: string, 
      flowData: FlowData, 
      userId: number, 
      isActive: boolean 
    }) => {
      if (id) {
        // Update existing agent
        const response = await fetch(`/api/agents/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            flow_data: data.flowData,
            is_active: data.isActive,
            description: selectedNode?.data?.description || 'AI Agent created with AIagentStudio'
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update agent: ${errorText}`);
        }
        
        return response.json();
      } else {
        // Create new agent
        const response = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            user_id: data.userId,
            flow_data: data.flowData,
            is_active: data.isActive,
            description: selectedNode?.data?.description || 'AI Agent created with AIagentStudio'
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create agent: ${errorText}`);
        }
        
        return response.json();
      }
    }
  });

  // With the new Canva-like approach, we allow non-authenticated users to use the builder
  // We'll only require authentication when they try to save or deploy
  // No redirection needed here

  // Handle template loading
  useEffect(() => {
    // Only attempt to load a template if:
    // 1. Not currently editing an existing agent (no id)
    // 2. A template ID is provided in the URL or from localStorage
    const storedTemplateId = localStorage.getItem('selectedTemplate');
    const templateToLoad = templateId || storedTemplateId;
    
    if (!id && templateToLoad) {
      // Clear stored template ID after loading
      localStorage.removeItem('selectedTemplate');
      console.log('Loading template with ID:', templateToLoad);
      
      // Delay template loading slightly to ensure reactflow is initialized
      setTimeout(() => {
        const templateData = getTemplateById(templateToLoad);
        
        if (templateData) {
          // Determine agent name from template ID
          let templateName = 'Template Agent';
          
          switch(templateToLoad) {
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
            case 'tc-1':
              templateName = 'Ticket Classifier Agent';
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
    if (agent && id) {
      setAgentName(agent.name || 'Untitled Agent');
      
      if (agent.flow_data) {
        const flowData = agent.flow_data as FlowData;
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
      }
    }
  }, [agent, id, setNodes, setEdges]);

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
        const typeMap: Record<string, string> = {
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

        // Set default data based on node type category
        if (nodeType.includes('input')) {
          // Input node types
          if (nodeType === 'inputNode') {
            newNode.data = { 
              label: 'Text Input',
              placeholder: 'Enter your question...',
              description: 'Type your query here'
            };
          } else if (nodeType === 'fileInputNode') {
            newNode.data = {
              label: 'File Input',
              placeholder: 'Upload a file...',
              description: 'Upload a document or image'
            };
          } else if (nodeType === 'imageInputNode') {
            newNode.data = {
              label: 'Image Input',
              placeholder: 'Upload an image...',
              description: 'Upload an image for processing'
            };
          } else if (nodeType === 'webhookInputNode') {
            newNode.data = {
              label: 'Webhook Input',
              placeholder: 'Receiving data...',
              description: 'Receive data from external sources'
            };
          } else {
            // Default input node
            newNode.data = { 
              label: 'Input',
              placeholder: 'Enter data...',
              description: 'User input node'
            };
          }
        } else if (nodeType.includes('gpt') || nodeType.includes('transform') || nodeType.includes('bot')) {
          // Processing node types
          if (nodeType === 'gptNode') {
            newNode.data = { 
              label: 'GPT-4 Processor',
              model: 'gpt-4o',
              systemPrompt: 'You are a helpful assistant that provides accurate and concise answers.',
              temperature: 0.7,
              maxTokens: 1000
            };
          } else if (nodeType === 'imageGenerationNode') {
            newNode.data = {
              label: 'Image Generator',
              model: 'dall-e-3',
              systemPrompt: 'Generate a detailed, high-quality image based on the description.',
              temperature: 0.7,
              maxTokens: 1000
            };
          } else if (nodeType === 'chatbotNode') {
            newNode.data = {
              label: 'Conversational AI',
              model: 'gpt-4o',
              systemPrompt: 'You are a friendly chatbot assistant designed to help users with their questions and engage in natural conversation.',
              temperature: 0.8,
              maxTokens: 1000
            };
          } else if (nodeType === 'transformNode') {
            newNode.data = {
              label: 'Data Transformer',
              model: 'gpt-4o',
              systemPrompt: 'Transform the input data as specified. Maintain accuracy and structure.',
              temperature: 0.2,
              maxTokens: 1000
            };
          } else if (nodeType === 'translationNode') {
            newNode.data = {
              label: 'Language Translator',
              model: 'gpt-4o',
              systemPrompt: 'Translate the input text to the specified language while preserving meaning and context.',
              temperature: 0.3,
              maxTokens: 1000
            };
          } else {
            // Default processing node
            newNode.data = { 
              label: 'AI Processor',
              model: 'gpt-4o',
              systemPrompt: 'Process the input data as instructed.',
              temperature: 0.7,
              maxTokens: 1000
            };
          }
        } else if (nodeType.includes('output')) {
          // Output node types
          if (nodeType === 'outputNode') {
            newNode.data = { 
              label: 'Text Output',
              format: 'markdown'
            };
          } else if (nodeType === 'imageOutputNode') {
            newNode.data = {
              label: 'Image Output',
              format: 'image'
            };
          } else if (nodeType === 'emailNode') {
            newNode.data = {
              label: 'Email Sender',
              format: 'markdown'
            };
          } else if (nodeType === 'notificationNode') {
            newNode.data = {
              label: 'Notification',
              format: 'plaintext'
            };
          } else if (nodeType === 'dashboardNode') {
            newNode.data = {
              label: 'Dashboard Display',
              format: 'html'
            };
          } else {
            // Default output node
            newNode.data = { 
              label: 'Output',
              format: 'plaintext'
            };
          }
        } else {
          // Logic, integration, or other node types
          newNode.data = { 
            label: nodeType.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) { return str.toUpperCase(); }),
            model: 'gpt-4o',
            systemPrompt: 'Process the input according to specific logic rules.',
            temperature: 0.5,
            maxTokens: 1000
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

  // Login modal state for the Canva-like experience
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'deploy' | null>(null);
  
  // Save agent
  const saveAgent = useCallback(async (deploy: boolean = false) => {
    if (!user) {
      // Store the action (save or deploy) that the user was trying to perform
      setPendingAction(deploy ? 'deploy' : 'save');
      
      // Open login modal instead of showing toast
      setIsLoginModalOpen(true);
      
      toast({
        title: 'Almost there!',
        description: 'Log in or sign up to save your agent.',
      });
      return;
    }

    // Check if the agent has the required node types for deployment
    if (deploy && reactFlowInstance) {
      const flowData = reactFlowInstance.toObject();
      const hasInputNode = flowData.nodes.some((node: any) => node.type?.includes('input'));
      const hasProcessingNode = flowData.nodes.some((node: any) => 
        node.type?.includes('gpt') || 
        node.type?.includes('transform') || 
        node.type?.includes('bot'));
      const hasOutputNode = flowData.nodes.some((node: any) => node.type?.includes('output'));

      if (!hasInputNode || !hasProcessingNode || !hasOutputNode) {
        toast({
          title: 'Incomplete Agent',
          description: 'Your agent needs at least one input node, one processing node, and one output node to be deployed.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      if (!reactFlowInstance) {
        throw new Error('Flow instance not initialized');
      }

      const flowData: FlowData = reactFlowInstance.toObject();
      
      // Call the mutation
      const response = await saveMutation.mutateAsync({
        name: agentName,
        flowData,
        userId: user.id,
        isActive: deploy
      });
      
      // Handle response based on create/update and deploy status
      if (id === undefined && response.id) {
        // Created a new agent
        navigate(`/builder/${response.id}`);
      }
      
      // Handle deployed status and display appropriate toast
      if (deploy && response.deploy_url) {
        toast({
          title: '🎉 Agent Deployed Successfully!',
          description: (
            <div>
              <p>Your agent "{agentName}" is now live and can be accessed at:</p>
              <div className="mt-2 mb-1 p-2 bg-slate-100 dark:bg-slate-900 rounded-md flex items-center justify-between">
                <code className="text-sm text-blue-500 break-all">{response.deploy_url}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(response.deploy_url);
                    toast({ title: "URL copied to clipboard!" });
                  }}
                >
                  Copy
                </Button>
              </div>
              <div className="mt-3">
                <Button asChild variant="default" className="w-full">
                  <a href={response.deploy_url} target="_blank" rel="noopener noreferrer">
                    Open Agent
                  </a>
                </Button>
              </div>
            </div>
          ),
          duration: 15000, // Show for 15 seconds
        });
      } else if (deploy) {
        toast({
          title: id ? 'Agent deployed' : 'Agent created and deployed',
          description: `Your agent "${agentName}" has been ${id ? 'deployed' : 'created and deployed'} successfully.`,
        });
      } else {
        toast({
          title: id ? 'Agent saved' : 'Agent created',
          description: `Your agent "${agentName}" has been ${id ? 'saved' : 'created'} successfully.`,
        });
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast({
        title: 'Error saving agent',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      // Refresh agent list after save/deploy
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    }
  }, [user, agentName, reactFlowInstance, id, navigate, saveMutation, toast, selectedNode]);

  // Function to update a node
  const updateNode = useCallback((updatedNode: Node) => {
    setNodes((nds) => 
      nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
    );
  }, [setNodes]);

  // If loading, show spinner
  if (authLoading || (id && isAgentLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card p-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="mr-2 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="mx-4 h-6 w-px bg-border"></div>
          <Input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="max-w-[200px] text-lg font-semibold border-none shadow-none focus-visible:ring-0 p-0"
          />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => saveAgent(false)}
            disabled={isSaving}
            className="flex items-center"
          >
            <Save className="mr-1 h-4 w-4" />
            Save
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsDeployModalOpen(true)}
            disabled={isSaving}
            className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Rocket className="mr-1 h-4 w-4" />
            Deploy
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Components panel */}
        <div className="w-64 border-r bg-card overflow-y-auto hidden md:block">
          <NodePanel />
        </div>
        
        {/* Main content - ReactFlow canvas */}
        <div className="flex-1 flex overflow-hidden">
          <ReactFlowProvider>
            <div
              ref={reactFlowWrapper}
              className="flex-1 h-full"
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                deleteKeyCode="Delete"
                fitView
                snapToGrid
                onInit={setReactFlowInstance}
              >
                <Background gap={12} size={1} color="#f1f1f1" />
                <Controls showInteractive={false}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="react-flow__controls-button">
                          <MousePointer className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select Mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Controls>
                <MiniMap />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
          
          {/* Right sidebar - Properties panel */}
          <div className="w-80 border-l bg-card overflow-y-auto hidden lg:block">
            <PropertiesPanel
              selectedNode={selectedNode}
              updateNode={updateNode}
            />
          </div>
        </div>
      </div>
      
      {/* Deploy Modal */}
      {user && reactFlowInstance && (
        <DeployModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          agentName={agentName}
          agentId={id}
          flowData={reactFlowInstance.toObject()}
          userId={user.id}
          onDeploy={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
            setLastSaved(new Date());
          }}
        />
      )}
      
      {/* Login/Signup Modals for Canva-like experience */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)}
        onSignupClick={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      
      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)}
        onLoginClick={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}