import { useState, useCallback, useRef, useEffect } from 'react';
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
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Rocket, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import SimpleNodePanel from '@/components/builder/SimpleNodePanel';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import DeployModal from '@/components/builder/DeployModal';
import { FlowData } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  useAgent, 
  useCreateAgent,
  useUpdateAgent 
} from '@/hooks/useAgents';
import { getTemplateById } from '@/lib/templates';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import Footer from '@/components/Footer';

// Import node components
import InputNode from '@/components/builder/nodes/InputNode';
import FileInputNode from '@/components/builder/nodes/FileInputNode';
import ImageInputNode from '@/components/builder/nodes/ImageInputNode';
import WebhookInputNode from '@/components/builder/nodes/WebhookInputNode';
import GPTNode from '@/components/builder/nodes/GPTNode';
import OllamaNode from '@/components/builder/nodes/OllamaNode';
import APINode from '@/components/builder/nodes/APINode';
import LogicNode from '@/components/builder/nodes/LogicNode';
import OutputNode from '@/components/builder/nodes/OutputNode';
import ImageOutputNode from '@/components/builder/nodes/ImageOutputNode';
import EmailNode from '@/components/builder/nodes/EmailNode';
import NotificationNode from '@/components/builder/nodes/NotificationNode';
import HuggingFaceNode from '@/components/builder/nodes/HuggingFaceNode';

// Define node types
const nodeTypes = {
  inputNode: InputNode,
  outputNode: OutputNode,
  gptNode: GPTNode,
  huggingFaceNode: HuggingFaceNode,
  hfInferenceNode: HuggingFaceNode,
  ollamaNode: OllamaNode,
  apiNode: APINode,
  emailNode: EmailNode,
  webhookInputNode: WebhookInputNode,
  fileInputNode: FileInputNode,
  imageInputNode: ImageInputNode,
  imageOutputNode: ImageOutputNode,
  logicNode: LogicNode,
  notificationNode: NotificationNode,
};

export default function AgentBuilder() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  // Agent state
  const [agentName, setAgentName] = useState('Untitled Agent');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  // ReactFlow state
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Auth modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  // Get agent data from API
  const { agent, isLoading: isLoadingAgent } = useAgent(id);
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  // Load agent or template data
  useEffect(() => {
    // Load existing agent if ID is provided
    if (id && agent) {
      console.log("Loading existing agent:", agent);
      setAgentName(agent.name);

      if (agent.flow_data) {
        console.log("Setting flow data:", agent.flow_data);

        try {
          // Ensure flow_data is properly parsed if it's a string
          let flowData = agent.flow_data;
          if (typeof flowData === 'string') {
            try {
              flowData = JSON.parse(flowData);
            } catch (e) {
              console.error("Failed to parse flow_data string:", e);
            }
          }

          // Handle case where agent has no nodes or edges
          const nodeArray = flowData.nodes || [];
          const edgeArray = flowData.edges || [];

          // If we don't have any nodes and the user was expecting to edit an agent,
          // let's add some default nodes to show something
          if (nodeArray.length === 0) {
            // Add default nodes for editing
            const defaultNodes = [
              {
                id: 'input-edit-1',
                type: 'inputNode',
                position: { x: 250, y: 100 },
                data: { 
                  label: 'Text Input', 
                  placeholder: 'Enter your text...', 
                  description: 'User input'
                }
              },
              {
                id: 'output-edit-1',
                type: 'outputNode',
                position: { x: 250, y: 250 },
                data: { 
                  label: 'Text Output',
                  format: 'plaintext'
                }
              }
            ];

            const defaultEdges = [
              {
                id: 'e-edit-1',
                source: 'input-edit-1',
                target: 'output-edit-1',
                type: 'smoothstep',
                animated: true,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              }
            ];

            setNodes(defaultNodes);
            setEdges(defaultEdges);
          } else {
            // Use the existing nodes and edges
            setNodes(nodeArray);
            setEdges(edgeArray);
          }

          console.log("Successfully set nodes and edges for editing");
        } catch (error) {
          console.error("Error setting up agent for editing:", error);
          // Fallback to default nodes if something went wrong
          const defaultNodes = [
            {
              id: 'input-default-1',
              type: 'inputNode',
              position: { x: 250, y: 100 },
              data: { 
                label: 'Text Input', 
                placeholder: 'Enter your text...', 
                description: 'User input'
              }
            },
            {
              id: 'output-default-1',
              type: 'outputNode',
              position: { x: 250, y: 250 },
              data: { 
                label: 'Text Output',
                format: 'plaintext'
              }
            }
          ];

          const defaultEdges = [
            {
              id: 'e-default-1',
              source: 'input-default-1',
              target: 'output-default-1',
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }
          ];

          setNodes(defaultNodes);
          setEdges(defaultEdges);
        }
      } else {
        console.warn("Agent has no flow_data, setting up default components");
        // Fallback to default nodes and edges
        const defaultNodes = [
          {
            id: 'input-default-1',
            type: 'inputNode',
            position: { x: 250, y: 100 },
            data: { 
              label: 'Text Input', 
              placeholder: 'Enter your text...', 
              description: 'User input'
            }
          },
          {
            id: 'output-default-1',
            type: 'outputNode',
            position: { x: 250, y: 250 },
            data: { 
              label: 'Text Output',
              format: 'plaintext'
            }
          }
        ];

        const defaultEdges = [
          {
            id: 'e-default-1',
            source: 'input-default-1',
            target: 'output-default-1',
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }
        ];

        setNodes(defaultNodes);
        setEdges(defaultEdges);
      }
      return;
    }

    // Otherwise, check for template
    const templateId = localStorage.getItem('selectedTemplate');

    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        console.log("Loading template:", template);
        setNodes(template.nodes);
        setEdges(template.edges);
        localStorage.removeItem('selectedTemplate');
        return;
      }
    }

    // If starting with blank template
    const isBlankTemplate = localStorage.getItem('blankTemplate') === 'true';
    if (isBlankTemplate) {
      // Start with an empty canvas - no pre-placed nodes
      console.log("Starting with blank template");
      setNodes([]);
      setEdges([]);
      localStorage.removeItem('blankTemplate');
    }
  }, [id, agent, setNodes, setEdges]);

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

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (!nodeType) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {}
      };

      // Set appropriate data based on node type
      if (nodeType === 'inputNode') {
        newNode.data = { 
          label: 'Text Input',
          placeholder: 'Enter your text...',
          description: 'User input' 
        };
      } else if (nodeType === 'gptNode') {
        newNode.data = { 
          label: 'GPT-4 Processor',
          model: 'gpt-4o',
          systemPrompt: 'You are a helpful assistant.',
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

  // Update node properties
  const updateNode = useCallback((updatedNode: Node) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === updatedNode.id) {
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes]);

  // Save agent
  const handleSave = async () => {
    if (authLoading) return;

    if (!user) {
      // Prompt login if not authenticated
      setIsLoginModalOpen(true);
      return;
    }

    if (!reactFlowInstance) return;

    setIsSaving(true);

    try {
      const flowData: FlowData = reactFlowInstance.toObject();

      if (id && agent) {
        // Update existing agent
        await updateAgent.mutateAsync({
          id: Number(id),
          name: agentName,
          description: '',
          flow_data: flowData,
          is_active: true,
          user_id: user.id
        });

        toast({
          title: 'Agent Updated',
          description: 'Your agent has been updated successfully.',
        });
      } else {
        // Create new agent
        const newAgent = await createAgent.mutateAsync({
          name: agentName,
          description: '',
          flow_data: flowData,
          is_active: true,
          user_id: user.id
        });

        toast({
          title: 'Agent Saved',
          description: 'Your agent has been saved successfully.',
        });

        // Navigate to the new agent
        navigate(`/builder/${newAgent.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Deploy agent
  const handleDeploy = () => {
    if (authLoading) return;

    if (!user) {
      // Prompt login if not authenticated
      setIsLoginModalOpen(true);
      return;
    }

    if (!reactFlowInstance) return;

    const flowData: FlowData = reactFlowInstance.toObject();
    setIsDeploying(true);
  };

  // Auth modal handlers
  const handleLoginClick = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleSignupClick = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  };

  const handleDeployClose = () => {
    setIsDeploying(false);
  };

  const handleDeployConfirm = () => {
    setIsDeploying(false);
    toast({
      title: 'Agent Deployed',
      description: 'Your agent has been deployed successfully.',
    });
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
          <SimpleNodePanel />
        </div>

        {/* Main content - ReactFlow canvas */}
        <div className="flex-1 flex overflow-hidden">
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
                {!isMobile && <MiniMap />}
                <Panel position="top-center">
                  <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-md border shadow-sm text-sm text-center">
                    Drag components from the left panel and connect them to build your agent
                  </div>
                </Panel>
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        </div>

        {/* Right sidebar - Properties panel */}
        {selectedNode && (
          <div className="w-80 border-l bg-background overflow-y-auto flex-shrink-0 shadow-sm">
            <PropertiesPanel selectedNode={selectedNode} updateNode={updateNode} />
          </div>
        )}
      </div>
    </div>

    {/* Deploy Modal */}
    {isDeploying && reactFlowInstance && (
      <DeployModal
        isOpen={isDeploying}
        onClose={handleDeployClose}
        agentName={agentName}
        agentId={id}
        flowData={reactFlowInstance.toObject()}
        userId={user?.id || 0}
        onDeploy={handleDeployConfirm}
      />
    )}

    {/* Auth Modals */}
    <LoginModal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
      onSwitchToSignup={handleSignupClick}
    />

    <SignupModal
      isOpen={isSignupModalOpen}
      onClose={() => setIsSignupModalOpen(false)}
      onSwitchToLogin={handleLoginClick}
    />
  </div>
  );
}