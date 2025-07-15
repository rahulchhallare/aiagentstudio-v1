import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  Rocket, 
  Settings, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Zap,
  Shield,
  BarChart3,
  Users,
  Globe,
  Code
} from "lucide-react";

interface DeployedSolution {
  id: number;
  solution_name: string;
  deployment_status: "pending" | "deploying" | "active" | "failed";
  deployment_url?: string;
  deployment_id?: string;
  configuration: any;
  performance_metrics?: any;
  created_at: string;
  analysis: {
    business_name: string;
    industry: string;
  };
  template: {
    name: string;
    solution_type: string;
    capabilities: string[];
  };
}

interface AgentTemplate {
  id: number;
  name: string;
  description: string;
  solution_type: string;
  industry: string;
  capabilities: string[];
  integration_requirements: string[];
  pricing_model: string;
}

export default function AgentDeployment() {
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [deploymentConfig, setDeploymentConfig] = useState({
    name: "",
    description: "",
    settings: {}
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deployed solutions
  const { data: deployedSolutions, isLoading: loadingDeployed } = useQuery({
    queryKey: ["/api/deployed-solutions"],
    enabled: true
  });

  // Fetch available agent templates
  const { data: agentTemplates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["/api/agent-templates"],
    enabled: true
  });

  // Deploy agent mutation
  const deployAgent = useMutation({
    mutationFn: async (deploymentData: any) => {
      const response = await apiRequest("POST", "/api/deploy-agent", deploymentData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agent Deployment Started",
        description: "Your AI agent is being deployed. You'll receive a notification when it's ready.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deployed-solutions"] });
      setSelectedTemplate(null);
      setDeploymentConfig({ name: "", description: "", settings: {} });
    },
    onError: (error: any) => {
      toast({
        title: "Deployment Failed",
        description: error.message || "Failed to deploy agent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeploy = () => {
    if (!selectedTemplate || !deploymentConfig.name) {
      toast({
        title: "Configuration Required",
        description: "Please select a template and provide deployment configuration.",
        variant: "destructive",
      });
      return;
    }

    deployAgent.mutate({
      template_id: selectedTemplate.id,
      name: deploymentConfig.name,
      description: deploymentConfig.description,
      configuration: deploymentConfig.settings
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "deploying": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="w-4 h-4" />;
      case "deploying": return <Clock className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "failed": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Rocket className="w-8 h-8 mr-3 text-blue-600" />
            AI Agent Deployment
          </h1>
          <p className="text-lg text-gray-600">
            Transform your AI recommendations into live, deployable agents on the aiagntstudio.ai platform.
          </p>
        </div>

        <Tabs defaultValue="deployed" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deployed">Deployed Agents</TabsTrigger>
            <TabsTrigger value="templates">Available Templates</TabsTrigger>
            <TabsTrigger value="deploy">Deploy New Agent</TabsTrigger>
          </TabsList>

          {/* Deployed Agents Tab */}
          <TabsContent value="deployed" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Deployed AI Agents</h2>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {deployedSolutions?.length || 0} Active
              </Badge>
            </div>

            {loadingDeployed ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : deployedSolutions?.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deployedSolutions.map((solution: DeployedSolution) => (
                  <Card key={solution.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <Bot className="w-5 h-5 mr-2 text-blue-600" />
                            {solution.solution_name}
                          </CardTitle>
                          <CardDescription>
                            {solution.analysis.business_name} • {solution.analysis.industry}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(solution.deployment_status)}>
                          {getStatusIcon(solution.deployment_status)}
                          <span className="ml-1 capitalize">{solution.deployment_status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Agent Type</Label>
                        <p className="text-sm text-gray-600">{solution.template.solution_type}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Capabilities</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {solution.template.capabilities?.slice(0, 3).map((capability, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {solution.deployment_status === "active" && solution.deployment_url && (
                        <Button asChild size="sm" className="w-full">
                          <a href={solution.deployment_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open Agent
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Deployed Agents</h3>
                  <p className="text-gray-600 mb-4">
                    Start by analyzing your business or browse available agent templates to deploy your first AI agent.
                  </p>
                  <Button onClick={() => window.location.href = "/business-analyzer"}>
                    Analyze Your Business
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Available Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">AI Agent Templates</h2>
              <Badge variant="outline" className="text-green-600 border-green-300">
                {agentTemplates?.length || 0} Available
              </Badge>
            </div>

            {loadingTemplates ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : agentTemplates?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {agentTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-purple-600" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Badge variant="outline">{template.solution_type}</Badge>
                        <Badge variant="secondary">{template.industry}</Badge>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Key Capabilities</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.capabilities.map((capability, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Integration Requirements</Label>
                        <ul className="text-sm text-gray-600 mt-1">
                          {template.integration_requirements.map((req, idx) => (
                            <li key={idx} className="flex items-center">
                              <Shield className="w-3 h-3 mr-2 text-gray-400" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button 
                        onClick={() => setSelectedTemplate(template)}
                        className="w-full"
                        variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      >
                        {selectedTemplate?.id === template.id ? "Selected" : "Select Template"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                  <p className="text-gray-600 mb-4">
                    Agent templates are being loaded. Please try again in a moment.
                  </p>
                  <Button onClick={() => window.location.reload()}>
                    Refresh Templates
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Deploy New Agent Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-6">Deploy New AI Agent</h2>

              {selectedTemplate ? (
                <div className="space-y-6">
                  {/* Selected Template */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-900">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Selected Template: {selectedTemplate.name}
                      </CardTitle>
                      <CardDescription className="text-blue-700">
                        {selectedTemplate.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Configuration Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Agent Configuration</CardTitle>
                      <CardDescription>
                        Customize your AI agent settings before deployment
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input
                          id="agent-name"
                          placeholder="e.g., Customer Support Bot"
                          value={deploymentConfig.name}
                          onChange={(e) => setDeploymentConfig(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="agent-description">Description</Label>
                        <Textarea
                          id="agent-description"
                          placeholder="Describe what this agent will do..."
                          value={deploymentConfig.description}
                          onChange={(e) => setDeploymentConfig(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedTemplate(null)}
                        >
                          Change Template
                        </Button>
                        <Button 
                          onClick={handleDeploy}
                          disabled={deployAgent.isPending || !deploymentConfig.name}
                        >
                          {deployAgent.isPending ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Deploying...
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4 mr-2" />
                              Deploy Agent
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Template First</h3>
                    <p className="text-gray-600 mb-4">
                      Choose an AI agent template from the "Available Templates" tab to begin deployment.
                    </p>
                    <Button onClick={() => window.location.hash = "#templates"}>
                      Browse Templates
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}