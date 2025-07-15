import { useState, useContext, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Rocket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CalendlyBookingWidget from "@/components/CalendlyBookingWidget";

interface AnalysisResult {
  analysis: {
    id: number;
    businessType: string;
    businessName: string;
    industry: string;
    painPoints: string[];
    workflows: string[];
    contentSummary: string;
    keyFeatures: string[];
    targetAudience: string;
    currentTech: string[];
  };
  recommendations: Array<{
    id: number;
    solutionType: string;
    solutionName: string;
    description: string;
    estimatedCostSavings: string;
    estimatedTimeSavings: string;
    implementationDifficulty: string;
    roiPercentage: string;
    industryBenchmark: string;
    priorityScore: number;
    reasoning: string;
    // Enhanced features
    ragEvidence?: string[];
    caseStudies?: string[];
    ethicalConsiderations?: string;
    complianceRequirements?: string[];
    monitoringMetrics?: string[];
    implementationTimeline?: string;
    expectedRevenue?: number;
    riskFactors?: string[];
    // New comprehensive analysis features
    availabilityStatus: "Available" | "Missing";
    creationPrompt?: {
      agentName: string;
      purpose: string;
      keyWorkflows: string[];
      requiredIntegrations: string[];
      customizationOptions: string[];
      performanceMetrics: string[];
    };
  }>;
}

export default function BusinessAnalyzer() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [selectedRecommendations, setSelectedRecommendations] = useState<
    Set<number>
  >(new Set());
  const { toast } = useToast();
  const { user } = useAuth();



  const handleAnalyze = async () => {
    if (!websiteUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await apiRequest("POST", "/api/analyze-website", {
        websiteUrl,
        userId: user?.id,
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResult(result);
        toast({
          title: "Analysis Complete",
          description: `Found ${result.recommendations.length} AI solution recommendations for your business`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Analysis failed");
      }
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze website",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectRecommendation = async (id: number) => {
    try {
      const response = await apiRequest(
        "POST",
        `/api/recommendations/${id}/select`,
      );

      if (response.ok) {
        setSelectedRecommendations((prev) => new Set([...prev, id]));
        toast({
          title: "Recommendation Selected",
          description:
            "This solution has been added to your implementation queue",
        });
      }
    } catch (error: any) {
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to select recommendation",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return "bg-red-100 text-red-800";
    if (score >= 6) return "bg-orange-100 text-orange-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Business Analyzer</h1>
          <p className="text-xl text-gray-600 mb-6">
            Discover which AI solutions can transform your business
          </p>

          {!user && (
            <Alert className="max-w-2xl mx-auto mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please log in to save your analysis results. You can still
                analyze websites without logging in, but results won't be saved.
              </AlertDescription>
            </Alert>
          )}

          {/* URL Input */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website-url">Your Business Website URL</Label>
                  <div className="flex mt-2">
                    <Input
                      id="website-url"
                      type="url"
                      placeholder="https://your-business.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1"
                      disabled={isAnalyzing}
                    />
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !websiteUrl}
                      className="ml-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={33} className="w-full" />
                    <p className="text-sm text-gray-600">
                      Analyzing website content and identifying AI
                      opportunities...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Business Overview</TabsTrigger>
                <TabsTrigger value="recommendations">
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger value="implementation">Implementation</TabsTrigger>
              </TabsList>

              {/* Business Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-primary" />
                        LLM SEO Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`text-3xl font-bold mr-3 ${
                            analysisResult.analysis.llmSearchRanking?.score >= 80 ? 'text-green-600' :
                            analysisResult.analysis.llmSearchRanking?.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {analysisResult.analysis.llmSearchRanking?.score || 0}
                          </div>
                          <div>
                            <div className="text-sm font-medium">AI Search Visibility</div>
                            <Badge className={`text-sm ${
                              analysisResult.analysis.llmSearchRanking?.score >= 80 ? 'bg-green-100 text-green-800' :
                              analysisResult.analysis.llmSearchRanking?.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              Grade {analysisResult.analysis.llmSearchRanking?.grade || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Performance Factors:</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Content Quality:</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-2 bg-primary rounded-full" 
                                  style={{ width: `${analysisResult.analysis.llmSearchRanking?.factors?.contentQuality || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">{analysisResult.analysis.llmSearchRanking?.factors?.contentQuality || 0}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">AI Readability:</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-2 bg-primary rounded-full" 
                                  style={{ width: `${analysisResult.analysis.llmSearchRanking?.factors?.aiReadability || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">{analysisResult.analysis.llmSearchRanking?.factors?.aiReadability || 0}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Structured Data:</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-2 bg-primary rounded-full" 
                                  style={{ width: `${analysisResult.analysis.llmSearchRanking?.factors?.structuredData || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">{analysisResult.analysis.llmSearchRanking?.factors?.structuredData || 0}%</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Semantic Clarity:</span>
                            <div className="flex items-center">
                              <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className="h-2 bg-primary rounded-full" 
                                  style={{ width: `${analysisResult.analysis.llmSearchRanking?.factors?.semanticClarity || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-8">{analysisResult.analysis.llmSearchRanking?.factors?.semanticClarity || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {analysisResult.analysis.llmSearchRanking?.recommendations && analysisResult.analysis.llmSearchRanking.recommendations.length > 0 && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <div className="text-sm font-medium mb-2 text-primary">Priority Improvements:</div>
                          <div className="space-y-1">
                            {analysisResult.analysis.llmSearchRanking.recommendations.map((rec, index) => (
                              <div key={index} className="text-xs text-primary/80 flex items-start">
                                <div className="w-1 h-1 bg-primary rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        Business Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Business Name
                        </Label>
                        <p className="text-lg">
                          {analysisResult.analysis.businessName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <Badge variant="secondary" className="ml-2">
                          {analysisResult.analysis.businessType}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Industry</Label>
                        <Badge variant="outline" className="ml-2">
                          {analysisResult.analysis.industry}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Summary</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {analysisResult.analysis.contentSummary}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Pain Points Identified
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.analysis.painPoints.map(
                          (point, index) => (
                            <div key={index} className="flex items-start">
                              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-sm">{point}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Current Workflows
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.analysis.workflows.map(
                          (workflow, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-2 mb-2"
                            >
                              {workflow}
                            </Badge>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Key Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.analysis.keyFeatures.map(
                          (feature, index) => (
                            <div key={index} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>


                </div>
              </TabsContent>

              {/* AI Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    These AI solutions are specifically recommended for your
                    business type and identified pain points. Cost savings are
                    estimated based on industry benchmarks.
                  </AlertDescription>
                </Alert>

                {/* Summary Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Solutions Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Solution</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Availability</th>
                            <th className="text-left p-2">Cost</th>
                            <th className="text-left p-2">Annual Savings</th>
                            <th className="text-left p-2">Priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysisResult.recommendations
                            .sort((a, b) => b.priorityScore - a.priorityScore)
                            .map((rec, index) => (
                              <tr
                                key={rec.id}
                                className={
                                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                }
                              >
                                <td className="p-2 font-medium">
                                  {rec.solutionName}
                                </td>
                                <td className="p-2">{rec.solutionType}</td>
                                <td className="p-2">
                                  <Badge
                                    className={
                                      rec.availabilityStatus === "Available"
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : "bg-orange-100 text-orange-800 border-orange-300"
                                    }
                                  >
                                    {rec.availabilityStatus === "Available" ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Available
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Missing
                                      </>
                                    )}
                                  </Badge>
                                </td>
                                <td className="p-2 font-medium text-orange-600">
                                  $9/month
                                </td>
                                <td className="p-2 font-medium text-green-600">
                                  $
                                  {Number(
                                    rec.estimatedCostSavings,
                                  ).toLocaleString()}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={getPriorityColor(
                                      rec.priorityScore,
                                    )}
                                  >
                                    {rec.priorityScore}/10
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {analysisResult.recommendations
                    .sort((a, b) => b.priorityScore - a.priorityScore)
                    .map((recommendation, index) => (
                      <Card
                        key={recommendation.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-xl">
                                {recommendation.solutionName}
                              </CardTitle>
                              <div className="flex gap-2 mt-2">
                                <Badge
                                  className={getPriorityColor(
                                    recommendation.priorityScore,
                                  )}
                                >
                                  Priority: {recommendation.priorityScore}/10
                                </Badge>
                                <Badge
                                  className={getDifficultyColor(
                                    recommendation.implementationDifficulty,
                                  )}
                                >
                                  {recommendation.implementationDifficulty}
                                </Badge>
                                <Badge
                                  className={
                                    recommendation.availabilityStatus ===
                                    "Available"
                                      ? "bg-green-100 text-green-800 border-green-300"
                                      : "bg-orange-100 text-orange-800 border-orange-300"
                                  }
                                >
                                  {recommendation.availabilityStatus ===
                                  "Available" ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Available
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Missing
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  (window.location.href = `/agent-deployment?recommendation=${recommendation.id}&name=${encodeURIComponent(recommendation.solutionName)}`)
                                }
                                variant="default"
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                              >
                                <Rocket className="w-4 h-4 mr-2" />
                                Deploy Agent
                              </Button>
                              <Button
                                onClick={() =>
                                  handleSelectRecommendation(recommendation.id)
                                }
                                disabled={selectedRecommendations.has(
                                  recommendation.id,
                                )}
                                variant={
                                  selectedRecommendations.has(recommendation.id)
                                    ? "outline"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {selectedRecommendations.has(
                                  recommendation.id,
                                ) ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Selected
                                  </>
                                ) : (
                                  <>
                                    Select
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-gray-700">
                            {recommendation.description}
                          </p>

                          <div className="grid md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-green-600">
                                $
                                {Number(
                                  recommendation.estimatedCostSavings,
                                ).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                Annual Savings
                              </div>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-blue-600">
                                {recommendation.estimatedTimeSavings}
                              </div>
                              <div className="text-sm text-gray-600">
                                Time Saved
                              </div>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                              <div className="text-2xl font-bold text-purple-600">
                                {Number(recommendation.roiPercentage)}%
                              </div>
                              <div className="text-sm text-gray-600">ROI</div>
                            </div>

                            <div className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                              <div className="w-8 h-8 mx-auto mb-2 bg-orange-500 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-orange-600">
                                $9
                              </div>
                              <div className="text-sm text-gray-600">
                                per month
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-2">
                              Why this solution fits your business:
                            </h4>
                            <p className="text-sm text-gray-700">
                              {recommendation.reasoning}
                            </p>
                          </div>

                          {/* Enhanced Features Section */}
                          <div className="space-y-4">
                            {/* RAG Evidence */}
                            {recommendation.ragEvidence &&
                              recommendation.ragEvidence.length > 0 && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                                    Research Evidence
                                  </h4>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {recommendation.ragEvidence.map(
                                      (evidence, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-start"
                                        >
                                          <span className="text-blue-600 mr-2">
                                            •
                                          </span>
                                          {evidence}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* Case Studies */}
                            {recommendation.caseStudies &&
                              recommendation.caseStudies.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <Lightbulb className="w-4 h-4 mr-2 text-green-600" />
                                    Success Stories
                                  </h4>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {recommendation.caseStudies.map(
                                      (caseStudy, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-start"
                                        >
                                          <span className="text-green-600 mr-2">
                                            •
                                          </span>
                                          {caseStudy}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              )}

                            {/* Implementation Details */}
                            <div className="grid md:grid-cols-2 gap-4">
                              {recommendation.implementationTimeline && (
                                <div className="bg-purple-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <Clock className="w-4 h-4 mr-2 text-purple-600" />
                                    Timeline
                                  </h4>
                                  <p className="text-sm text-gray-700">
                                    {recommendation.implementationTimeline}
                                  </p>
                                </div>
                              )}

                              {recommendation.expectedRevenue && (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2 text-orange-600" />
                                    Expected Revenue
                                  </h4>
                                  <p className="text-sm font-semibold text-orange-700">
                                    $
                                    {Number(
                                      recommendation.expectedRevenue,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Compliance & Ethics */}
                            {recommendation.complianceRequirements &&
                              recommendation.complianceRequirements.length >
                                0 && (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                                    Compliance Requirements
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {recommendation.complianceRequirements.map(
                                      (requirement, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-yellow-700 border-yellow-300"
                                        >
                                          {requirement}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Ethical Considerations */}
                            {recommendation.ethicalConsiderations && (
                              <div className="bg-indigo-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-2 text-indigo-600" />
                                  Ethical Considerations
                                </h4>
                                <p className="text-sm text-gray-700">
                                  {recommendation.ethicalConsiderations}
                                </p>
                              </div>
                            )}

                            {/* Monitoring Metrics */}
                            {recommendation.monitoringMetrics &&
                              recommendation.monitoringMetrics.length > 0 && (
                                <div className="bg-teal-50 p-4 rounded-lg">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-2 text-teal-600" />
                                    Key Performance Metrics
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {recommendation.monitoringMetrics.map(
                                      (metric, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="outline"
                                          className="text-teal-700 border-teal-300"
                                        >
                                          {metric}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Creation Prompt for Missing Agents */}
                            {recommendation.availabilityStatus === "Missing" &&
                              recommendation.creationPrompt && (
                                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
                                  <h4 className="font-medium mb-3 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                                    Agent Creation Prompt
                                  </h4>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Agent Name:
                                      </p>
                                      <p className="text-sm text-gray-700">
                                        {
                                          recommendation.creationPrompt
                                            .agentName
                                        }
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Purpose:
                                      </p>
                                      <p className="text-sm text-gray-700">
                                        {recommendation.creationPrompt.purpose}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Key Workflows:
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {recommendation.creationPrompt.keyWorkflows.map(
                                          (workflow, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-orange-700 border-orange-300 text-xs"
                                            >
                                              {workflow}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Required Integrations:
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {recommendation.creationPrompt.requiredIntegrations.map(
                                          (integration, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-orange-700 border-orange-300 text-xs"
                                            >
                                              {integration}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Customization Options:
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {recommendation.creationPrompt.customizationOptions.map(
                                          (option, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-orange-700 border-orange-300 text-xs"
                                            >
                                              {option}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-orange-800">
                                        Performance Metrics:
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {recommendation.creationPrompt.performanceMetrics.map(
                                          (metric, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-orange-700 border-orange-300 text-xs"
                                            >
                                              {metric}
                                            </Badge>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="text-sm text-gray-600 pt-4 border-t">
                            <strong>Industry Benchmark:</strong>{" "}
                            {recommendation.industryBenchmark}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              {/* Implementation Tab */}
              <TabsContent value="implementation" className="space-y-6">
                {selectedRecommendations.size === 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-2">
                        Free AI Expert Implementation
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Get your AI solutions deployed by our certified experts completely free of charge. 
                        Select solutions from the Recommendations tab to begin.
                      </p>
                    </div>

                    {/* Free Expert Implementation Offer */}
                    <Card className="bg-gradient-to-r from-brand-blue to-brand-green text-white">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Rocket className="w-12 h-12 mx-auto mb-4 text-white" />
                          <h4 className="text-xl font-bold mb-2">
                            🎉 FREE AI Expert Implementation
                          </h4>
                          <p className="text-white/90 mb-4 max-w-2xl mx-auto">
                            Our certified AI experts will implement your selected solutions completely free of charge. 
                            No hidden costs, no setup fees - just professional deployment and ongoing support.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="text-center">
                              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-white" />
                              <p className="text-sm font-medium">100% Free Setup</p>
                              <p className="text-xs text-white/80">No charges for implementation</p>
                            </div>
                            <div className="text-center">
                              <Clock className="w-8 h-8 mx-auto mb-2 text-white" />
                              <p className="text-sm font-medium">Quick Deployment</p>
                              <p className="text-xs text-white/80">Live within 24-48 hours</p>
                            </div>
                            <div className="text-center">
                              <Target className="w-8 h-8 mx-auto mb-2 text-white" />
                              <p className="text-sm font-medium">Ongoing Support</p>
                              <p className="text-xs text-white/80">Free consultation & optimization</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Options */}
                    <div className="grid grid-cols-1 gap-4">
                      <Card className="border-2 border-brand-blue">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <BarChart3 className="w-10 h-10 text-brand-blue mx-auto mb-3" />
                            <h4 className="font-semibold text-lg mb-2">
                              Free Expert Consultation
                            </h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Schedule a 30-minute consultation with our AI experts to discuss your 
                              implementation strategy and get personalized recommendations.
                            </p>
                            <Button 
                              size="lg" 
                              className="w-full bg-brand-blue hover:bg-brand-blue/90"
                              onClick={() => {
                                // Open booking link in new tab
                                window.open('https://calendly.com/aiagentstudio9/30min', '_blank');
                              }}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Book Free Consultation
                            </Button>
                          </div>
                        </CardContent>
                      </Card>


                    {/* Implementation Details */}
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">What's Included in Your Free Implementation:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2 text-brand-blue">Setup & Configuration</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Complete solution deployment</li>
                              <li>• Custom integration with your systems</li>
                              <li>• Data migration and setup</li>
                              <li>• Performance optimization</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2 text-brand-green">Training & Support</h5>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Team training sessions</li>
                              <li>• Documentation and guides</li>
                              <li>• 90-day free support</li>
                              <li>• Performance monitoring</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card className="bg-gray-50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <h4 className="font-medium mb-2">Need Immediate Assistance?</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Our AI experts are available 24/7 for urgent implementation needs
                          </p>
                          <div className="flex justify-center gap-4">
                            <Button variant="outline" size="sm">
                              <span className="mr-2">📞</span>
                              Call: +1 (555) 123-4567
                            </Button>
                            <Button variant="outline" size="sm">
                              <span className="mr-2">💬</span>
                              Live Chat Support
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <CalendlyBookingWidget />

                    {/* CTA to select solutions */}
                    <Card className="border-2 border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Target className="w-10 h-10 text-orange-600 mx-auto mb-3" />
                          <h4 className="font-semibold text-lg mb-2">
                            Ready to Get Started?
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Go to the AI Recommendations tab and select the solutions you'd like our experts to implement for free.
                          </p>
                          <Button 
                            size="lg" 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              // Switch to recommendations tab
                              const recommendationsTab = document.querySelector('[data-state="inactive"][value="recommendations"]');
                              if (recommendationsTab) {
                                (recommendationsTab as HTMLElement).click();
                              }
                            }}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            View AI Recommendations
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <CalendlyBookingWidget />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-semibold mb-2">
                        Implementation Ready
                      </h3>
                      <p className="text-gray-600 max-w-2xl mx-auto">
                        Our AI experts will implement your selected solutions completely free of charge.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Disclaimer Footer */}
            <div className="mt-8 p-4 bg-gray-50 border-t border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                This Analysis, including all recommendations and financial projections, has been crafted by AI Business Analyzer. All estimations are AI-generated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
