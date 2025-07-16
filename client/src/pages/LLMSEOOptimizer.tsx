import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoginModal from "@/components/LoginModal";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Globe,
  Settings,
  Monitor,
  Clock,
  Shield,
  Sparkles,
  Rocket,
  Eye
} from "lucide-react";

interface LLMSEOAnalysisResult {
  overallScore: number;
  engineScores: {
    chatgpt: number;
    gemini: number;
    perplexity: number;
    claude: number;
  };
  contentAnalysis: {
    readability: number;
    structure: number;
    semanticDepth: number;
    entityMentions: string[];
    keyTopics: string[];
    contentGaps: string[];
  };
  competitorAnalysis: {
    topCompetitors: string[];
    strengthsWeaknesses: any[];
    opportunities: string[];
  };
  searchQueries: {
    primaryQueries: string[];
    longTailQueries: string[];
    intentAnalysis: any[];
  };
  optimizationRecommendations: LLMSEOOptimization[];
}

interface LLMSEOOptimization {
  type: 'content' | 'schema' | 'structure' | 'keywords';
  title: string;
  description: string;
  currentContent?: string;
  optimizedContent: string;
  impactScore: number;
  priority: 'high' | 'medium' | 'low';
  llmEngines: string[];
  implementationSteps: string[];
  expectedResults: string[];
}

interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  currentRanking: number;
  targetRanking: number;
  llmVisibility: {
    chatgpt: number;
    gemini: number;
    perplexity: number;
    claude: number;
  };
  optimizationOpportunities: string[];
}

const LLMEngineIcon = ({ engine }: { engine: string }) => {
  const iconMap = {
    chatgpt: <Brain className="w-4 h-4 text-green-500" />,
    gemini: <Sparkles className="w-4 h-4 text-blue-500" />,
    perplexity: <Search className="w-4 h-4 text-purple-500" />,
    claude: <Zap className="w-4 h-4 text-orange-500" />
  };
  return iconMap[engine] || <Globe className="w-4 h-4" />;
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
    low: "bg-green-100 text-green-800 border-green-200"
  };
  
  return (
    <Badge className={colors[priority] || colors.medium}>
      {priority.toUpperCase()}
    </Badge>
  );
};

export default function LLMSEOOptimizer() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [analysisResult, setAnalysisResult] = useState<LLMSEOAnalysisResult | null>(null);
  const [selectedOptimization, setSelectedOptimization] = useState<LLMSEOOptimization | null>(null);
  const [optimizedContent, setOptimizedContent] = useState("");
  const [keywordResults, setKeywordResults] = useState<KeywordData[]>([]);
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("analyze");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const queryClient = useQueryClient();

  // Check authentication on component mount
  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
    }
  }, [user]);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { websiteUrl: string; businessName: string; industry: string }) => {
      console.log("Making API request with data:", data);
      try {
        const response = await apiRequest("POST", "/api/llm-seo/analyze", data);
        console.log("API response received:", response);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Parsed response:", result);
        return result;
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Analysis succeeded:", data);
      setAnalysisResult(data.analysis);
      setActiveTab("results");
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
      alert("Analysis failed. Please try again.");
    }
  });

  const optimizeContentMutation = useMutation({
    mutationFn: async (data: { 
      originalContent: string; 
      optimizationType: string; 
      targetKeywords: string[]; 
      llmEngines: string[] 
    }) => {
      const response = await apiRequest("POST", "/api/llm-seo/optimize-content", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setOptimizedContent(data.optimizedContent);
    }
  });

  const keywordAnalysisMutation = useMutation({
    mutationFn: async (data: { businessName: string; industry: string; currentContent: string }) => {
      const response = await apiRequest("POST", "/api/llm-seo/keyword-analysis", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setKeywordResults(data.keywords);
    }
  });

  const monitoringMutation = useMutation({
    mutationFn: async (data: { websiteUrl: string; previousScore: number }) => {
      const response = await apiRequest("POST", "/api/llm-seo/performance-monitoring", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setMonitoringData(data.monitoring);
    }
  });

  const handleAnalyze = () => {
    console.log("Analysis button clicked");
    console.log("Form data:", { websiteUrl, businessName, industry });
    
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!websiteUrl || !businessName || !industry) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Starting analysis mutation");
    analyzeMutation.mutate({ websiteUrl, businessName, industry });
  };

  const handleOptimizeContent = (optimization: LLMSEOOptimization) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setSelectedOptimization(optimization);
    optimizeContentMutation.mutate({
      originalContent: optimization.currentContent || "",
      optimizationType: optimization.type,
      targetKeywords: analysisResult?.searchQueries.primaryQueries || [],
      llmEngines: optimization.llmEngines
    });
  };

  const handleKeywordAnalysis = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!businessName || !industry || !analysisResult) return;
    
    keywordAnalysisMutation.mutate({
      businessName,
      industry,
      currentContent: analysisResult.contentAnalysis.keyTopics.join(" ")
    });
  };

  const handleMonitoring = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (!websiteUrl || !analysisResult) return;
    
    monitoringMutation.mutate({
      websiteUrl,
      previousScore: analysisResult.overallScore
    });
  };

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LLM SEO Optimizer
            </h1>
            <p className="text-gray-600 mt-1">
              Advanced AI-powered SEO optimization for generative search engines
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-green-500" />
            <span>ChatGPT Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Google AI Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-500" />
            <span>Perplexity</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Claude</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        {/* Analysis Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Website Analysis Setup
              </CardTitle>
              <CardDescription>
                Enter your website details to begin comprehensive LLM SEO analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="websiteUrl">Website URL *</Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  placeholder="e.g., E-commerce, SaaS, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={analyzeMutation.isPending || !websiteUrl || !businessName || !industry}
                className="w-full"
                size="lg"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Website...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Start LLM SEO Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {analysisResult && (
            <>
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    LLM SEO Score Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {analysisResult.overallScore}
                      </div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                      <Progress value={analysisResult.overallScore} className="mt-2" />
                    </div>
                    
                    {Object.entries(analysisResult.engineScores).map(([engine, score]) => (
                      <div key={engine} className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <LLMEngineIcon engine={engine} />
                          <span className="text-sm font-medium capitalize">{engine}</span>
                        </div>
                        <div className="text-2xl font-bold">{score}</div>
                        <Progress value={score} className="mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Content Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Content Quality</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Readability</span>
                          <span>{analysisResult.contentAnalysis.readability}%</span>
                        </div>
                        <Progress value={analysisResult.contentAnalysis.readability} />
                        
                        <div className="flex justify-between">
                          <span>Structure</span>
                          <span>{analysisResult.contentAnalysis.structure}%</span>
                        </div>
                        <Progress value={analysisResult.contentAnalysis.structure} />
                        
                        <div className="flex justify-between">
                          <span>Semantic Depth</span>
                          <span>{analysisResult.contentAnalysis.semanticDepth}%</span>
                        </div>
                        <Progress value={analysisResult.contentAnalysis.semanticDepth} />
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Key Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.contentAnalysis.keyTopics.map((topic, index) => (
                          <Badge key={index} variant="secondary">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Content Gaps</h4>
                      <div className="space-y-2">
                        {analysisResult.contentAnalysis.contentGaps.map((gap, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <span className="text-sm">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Optimization Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Optimization Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.optimizationRecommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={rec.priority} />
                            <Badge variant="outline">Impact: {rec.impactScore}%</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium">LLM Engines:</span>
                          {rec.llmEngines.map((engine, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <LLMEngineIcon engine={engine} />
                              <span className="text-sm capitalize">{engine}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          onClick={() => handleOptimizeContent(rec)} 
                          disabled={optimizeContentMutation.isPending}
                          size="sm"
                        >
                          Generate Optimized Content
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          {selectedOptimization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Content Optimization: {selectedOptimization.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedOptimization.currentContent && (
                  <div>
                    <Label>Current Content:</Label>
                    <Textarea 
                      value={selectedOptimization.currentContent} 
                      readOnly 
                      className="mt-2"
                    />
                  </div>
                )}
                
                {optimizedContent && (
                  <div>
                    <Label>Optimized Content:</Label>
                    <Textarea 
                      value={optimizedContent} 
                      onChange={(e) => setOptimizedContent(e.target.value)}
                      className="mt-2"
                      rows={10}
                    />
                  </div>
                )}
                
                <div>
                  <Label>Implementation Steps:</Label>
                  <ul className="mt-2 space-y-1">
                    {selectedOptimization.implementationSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <Label>Expected Results:</Label>
                  <ul className="mt-2 space-y-1">
                    {selectedOptimization.expectedResults.map((result, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-sm">{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                LLM Keyword Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleKeywordAnalysis} disabled={keywordAnalysisMutation.isPending}>
                {keywordAnalysisMutation.isPending ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Keywords...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Generate Keyword Analysis
                  </>
                )}
              </Button>
              
              {keywordResults.length > 0 && (
                <div className="mt-6 space-y-4">
                  {keywordResults.map((keyword, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{keyword.keyword}</h4>
                        <Badge variant="outline">Difficulty: {keyword.difficulty}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Search Volume</div>
                          <div className="font-semibold">{keyword.searchVolume}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Current Rank</div>
                          <div className="font-semibold">{keyword.currentRanking}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Target Rank</div>
                          <div className="font-semibold">{keyword.targetRanking}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Opportunity</div>
                          <div className="font-semibold text-green-600">High</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">LLM Visibility:</div>
                        <div className="grid grid-cols-4 gap-2">
                          {Object.entries(keyword.llmVisibility).map(([engine, score]) => (
                            <div key={engine} className="text-center">
                              <LLMEngineIcon engine={engine} />
                              <div className="text-sm">{score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Performance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleMonitoring} disabled={monitoringMutation.isPending}>
                {monitoringMutation.isPending ? (
                  <>
                    <Settings className="w-4 h-4 mr-2 animate-spin" />
                    Monitoring Performance...
                  </>
                ) : (
                  <>
                    <Monitor className="w-4 h-4 mr-2" />
                    Check Performance
                  </>
                )}
              </Button>
              
              {monitoringData && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {monitoringData.overallScore}
                      </div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                    </div>
                    
                    {Object.entries(monitoringData)
                      .filter(([key]) => key.endsWith('Score') && key !== 'overallScore')
                      .map(([key, score]) => {
                        const engine = key.replace('Score', '');
                        return (
                          <div key={key} className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <LLMEngineIcon engine={engine} />
                              <span className="text-sm font-medium capitalize">{engine}</span>
                            </div>
                            <div className="text-xl font-bold">{score as number}</div>
                          </div>
                        );
                      })}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Visibility Metrics</h4>
                      <div className="space-y-2">
                        {monitoringData.visibilityMetrics && Object.entries(monitoringData.visibilityMetrics).map(([metric, value]) => (
                          <div key={metric} className="flex justify-between">
                            <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1')}</span>
                            <span>{value as number}%</span>
                          </div>
                        ))}
                        {!monitoringData.visibilityMetrics && (
                          <div className="text-gray-500 text-sm">No visibility metrics available</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Performance Insights</h4>
                      <div className="space-y-2">
                        {monitoringData.performanceInsights && monitoringData.performanceInsights.map((insight: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))}
                        {(!monitoringData.performanceInsights || monitoringData.performanceInsights.length === 0) && (
                          <div className="text-gray-500 text-sm">No performance insights available</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}