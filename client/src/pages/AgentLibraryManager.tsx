import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  Rocket, 
  RefreshCw, 
  Download,
  Target,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  solutionType: string;
  industry: string[];
  capabilities: string[];
  integrationRequirements: string[];
  estimatedCostSavings: number;
  estimatedTimeSavings: string;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  roiPercentage: number;
}

interface DeploymentStatus {
  total: number;
  deployed: number;
  missing: string[];
  available: string[];
}

export default function AgentLibraryManager() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [categorizedTemplates, setCategorizedTemplates] = useState<Record<string, AgentTemplate[]>>({});
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/api/comprehensive-agent-templates");
      setTemplates(response.templates);
      setCategorizedTemplates(response.categorized);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch agent templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deployAllMissingAgents = async () => {
    try {
      setIsDeploying(true);
      setDeploymentProgress(0);

      // Simulate deployment progress
      const progressInterval = setInterval(() => {
        setDeploymentProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiRequest("/api/deploy-missing-agents", {
        method: "POST",
        body: JSON.stringify({ userId: 1 })
      });

      clearInterval(progressInterval);
      setDeploymentProgress(100);

      setDeploymentStatus(response.status);

      toast({
        title: "Success",
        description: `${response.status.deployed} AI agents deployed successfully!`,
      });

      // Refresh templates after deployment
      setTimeout(() => {
        fetchTemplates();
        setDeploymentProgress(0);
      }, 2000);

    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy missing agents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const deploySpecificAgent = async (templateId: string, name: string) => {
    try {
      await apiRequest(`/api/deploy-agent-template/${templateId}`, {
        method: "POST",
        body: JSON.stringify({ userId: 1 })
      });

      toast({
        title: "Success",
        description: `${name} deployed successfully!`,
      });

      fetchTemplates();
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: `Failed to deploy ${name}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800 border-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "hard": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTotalValue = () => {
    return templates.reduce((total, template) => total + template.estimatedCostSavings, 0);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading agent templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Agent Library Manager</h1>
          <p className="text-xl text-gray-600 mb-6">
            Deploy comprehensive AI solutions to expand your platform's capabilities
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Total Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${getTotalValue().toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">Annual savings potential</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Industries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(categorizedTemplates).length}
              </div>
              <p className="text-xs text-gray-600">Categories available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Ready to Deploy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
              <p className="text-xs text-gray-600">Agents available</p>
            </CardContent>
          </Card>
        </div>

        {/* Deployment Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Deploy All Missing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <Download className="h-4 w-4" />
              <AlertDescription>
                Deploy all comprehensive AI agent templates to make them available across the platform.
                This will create fully functional agents ready for immediate use.
              </AlertDescription>
            </Alert>

            {isDeploying && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Deploying agents...</span>
                  <span>{deploymentProgress}%</span>
                </div>
                <Progress value={deploymentProgress} className="mb-2" />
              </div>
            )}

            {deploymentStatus && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Deployment Complete!</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Total Templates:</strong> {deploymentStatus.total}</p>
                    <p><strong>Successfully Deployed:</strong> {deploymentStatus.deployed}</p>
                  </div>
                  <div>
                    <p><strong>Available Solutions:</strong> {deploymentStatus.available.length}</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={deployAllMissingAgents}
              disabled={isDeploying}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isDeploying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy All Missing Agents
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Agent Templates by Category */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="customer">Customer Support</TabsTrigger>
            <TabsTrigger value="sales">Sales & Marketing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="industry">Industry Specific</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{template.solutionType}</Badge>
                          <Badge className={getDifficultyColor(template.implementationDifficulty)}>
                            {template.implementationDifficulty}
                          </Badge>
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            ${template.estimatedCostSavings.toLocaleString()} savings
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => deploySpecificAgent(template.id, template.name)}
                        variant="default"
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        Deploy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{template.description}</p>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Industries</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.industry.map((ind, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ind}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Key Capabilities</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.capabilities.slice(0, 3).map((cap, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cap}
                            </Badge>
                          ))}
                          {template.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">ROI & Savings</h4>
                        <div className="text-sm">
                          <p><strong>ROI:</strong> {template.roiPercentage}%</p>
                          <p><strong>Time Saved:</strong> {template.estimatedTimeSavings}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Category-specific tabs */}
          {Object.entries(categorizedTemplates).map(([category, categoryTemplates]) => (
            <TabsContent key={category} value={category.toLowerCase().replace(/\s+/g, '-').replace('&', '')} className="space-y-4">
              <div className="grid gap-6">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{template.name}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{template.solutionType}</Badge>
                            <Badge className={getDifficultyColor(template.implementationDifficulty)}>
                              {template.implementationDifficulty}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => deploySpecificAgent(template.id, template.name)}
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Rocket className="w-4 h-4 mr-2" />
                          Deploy
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4">{template.description}</p>
                      <div className="text-sm text-gray-600">
                        <strong>Estimated Savings:</strong> ${template.estimatedCostSavings.toLocaleString()} annually
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}