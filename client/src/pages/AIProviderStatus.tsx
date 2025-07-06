import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProviderStatus {
  available: boolean;
  keyLength: number;
}

interface DebugInfo {
  environment: string;
  domain: string;
  timestamp: string;
  providers: {
    gemini: ProviderStatus;
    openai: ProviderStatus;
    deepseek: ProviderStatus;
    aiml: ProviderStatus;
  };
}

export default function AIProviderStatus() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/debug/ai-providers");
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch debug info:", error);
    } finally {
      setLoading(false);
    }
  };

  const testAnalyzer = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/analyze-website", {
        websiteUrl: "https://example.com"
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult({ success: true, data: result });
      } else {
        const error = await response.json();
        setTestResult({ success: false, error: error.message });
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const getStatusIcon = (available: boolean) => {
    return available ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (available: boolean) => {
    return (
      <Badge variant={available ? "default" : "destructive"}>
        {available ? "Available" : "Missing"}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Provider Status</h1>
          <p className="text-gray-600">Debug page for AI business analyzer</p>
        </div>

        <div className="space-y-6">
          {/* Environment Info */}
          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Environment Information
                  <Button onClick={fetchDebugInfo} disabled={loading} size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Environment</label>
                    <p className="text-lg">{debugInfo.environment}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Domain</label>
                    <p className="text-lg">{debugInfo.domain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Check</label>
                    <p className="text-sm text-gray-600">
                      {new Date(debugInfo.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Providers Status */}
          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(debugInfo.providers).map(([name, status]) => (
                    <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(status.available)}
                        <div>
                          <h3 className="font-medium capitalize">{name}</h3>
                          <p className="text-sm text-gray-600">
                            API Key Length: {status.keyLength} characters
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(status.available)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Business Analyzer */}
          <Card>
            <CardHeader>
              <CardTitle>Test Business Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testAnalyzer} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Analysis with Example.com"
                )}
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <h4 className="font-medium">
                      {testResult.success ? "Test Successful" : "Test Failed"}
                    </h4>
                  </div>
                  <pre className="text-sm bg-white p-2 rounded border overflow-auto max-h-40">
                    {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">1</div>
                  <div>
                    <h4 className="font-medium">Check Environment Variables</h4>
                    <p className="text-sm text-gray-600">Ensure AI provider API keys are set in your Replit deployment secrets</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">2</div>
                  <div>
                    <h4 className="font-medium">Get Free Gemini API Key</h4>
                    <p className="text-sm text-gray-600">Visit <a href="https://aistudio.google.com/" target="_blank" className="text-blue-600 hover:underline">Google AI Studio</a> for unlimited free access</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">3</div>
                  <div>
                    <h4 className="font-medium">Redeploy After Adding Keys</h4>
                    <p className="text-sm text-gray-600">After adding environment variables, redeploy your application</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}