import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Zap, Brain, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface ProviderStatus {
  name: string;
  status: 'online' | 'offline' | 'quota_exceeded' | 'testing';
  responseTime: number;
  lastTested: string;
  error?: string;
  isPrimary: boolean;
}

export default function AIProviderStatus() {
  const [providers, setProviders] = useState<ProviderStatus[]>([
    {
      name: 'OpenAI GPT-4o',
      status: 'quota_exceeded',
      responseTime: 2400,
      lastTested: new Date().toISOString(),
      error: 'You exceeded your current quota, please check your plan and billing details.',
      isPrimary: true
    },
    {
      name: 'DeepSeek',
      status: 'quota_exceeded',
      responseTime: 1800,
      lastTested: new Date().toISOString(),
      error: 'Insufficient Balance',
      isPrimary: false
    },
    {
      name: 'Google Gemini',
      status: 'offline',
      responseTime: 0,
      lastTested: new Date().toISOString(),
      error: 'API key not configured',
      isPrimary: false
    },
    {
      name: 'AI/ML API',
      status: 'offline',
      responseTime: 0,
      lastTested: new Date().toISOString(),
      error: 'API key not configured',
      isPrimary: false
    }
  ]);

  const [isTestingAll, setIsTestingAll] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'down'>('degraded');

  useEffect(() => {
    const healthyProviders = providers.filter(p => p.status === 'online').length;
    if (healthyProviders === 0) {
      setSystemHealth('down');
    } else if (healthyProviders === 1) {
      setSystemHealth('degraded');
    } else {
      setSystemHealth('healthy');
    }
  }, [providers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'quota_exceeded': return 'bg-yellow-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'quota_exceeded': return 'Quota Exceeded';
      case 'testing': return 'Testing...';
      default: return 'Unknown';
    }
  };

  const testProvider = async (providerName: string) => {
    setProviders(prev => prev.map(p => 
      p.name === providerName ? { ...p, status: 'testing' } : p
    ));

    try {
      const response = await fetch('/api/test-ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerName })
      });

      const result = await response.json();
      
      setProviders(prev => prev.map(p => 
        p.name === providerName ? {
          ...p,
          status: result.success ? 'online' : 'offline',
          responseTime: result.responseTime || 0,
          lastTested: new Date().toISOString(),
          error: result.error
        } : p
      ));
    } catch (error) {
      setProviders(prev => prev.map(p => 
        p.name === providerName ? {
          ...p,
          status: 'offline',
          lastTested: new Date().toISOString(),
          error: 'Network error'
        } : p
      ));
    }
  };

  const testAllProviders = async () => {
    setIsTestingAll(true);
    await Promise.all(providers.map(p => testProvider(p.name)));
    setIsTestingAll(false);
  };

  const getHealthBadge = () => {
    switch (systemHealth) {
      case 'healthy':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="w-4 h-4 mr-1" />All Systems Operational</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 text-white"><Activity className="w-4 h-4 mr-1" />Degraded Performance</Badge>;
      case 'down':
        return <Badge className="bg-red-500 text-white"><XCircle className="w-4 h-4 mr-1" />System Down</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Provider Status</h1>
          <p className="text-xl text-gray-600 mb-6">
            Monitor the health and performance of AI providers powering the business analyzer
          </p>
          <div className="flex justify-center items-center gap-4 mb-6">
            {getHealthBadge()}
            <Button onClick={testAllProviders} disabled={isTestingAll}>
              {isTestingAll ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Testing All...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test All Providers
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        {systemHealth === 'down' && (
          <Alert className="mb-6 border-red-500 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>System Down:</strong> All AI providers are currently unavailable. The system is running on demo data.
            </AlertDescription>
          </Alert>
        )}

        {systemHealth === 'degraded' && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <Activity className="h-4 w-4" />
            <AlertDescription>
              <strong>Degraded Performance:</strong> Some AI providers are experiencing issues. Primary provider failover is active.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Provider Status</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {providers.map((provider, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        {provider.isPrimary && (
                          <Badge variant="outline" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)}`} />
                        <span className="text-sm font-medium">{getStatusText(provider.status)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className="text-sm font-medium">{provider.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Last Tested</span>
                        <span className="text-sm font-medium">
                          {new Date(provider.lastTested).toLocaleTimeString()}
                        </span>
                      </div>
                      {provider.error && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-700">{provider.error}</p>
                        </div>
                      )}
                      <Button 
                        onClick={() => testProvider(provider.name)}
                        disabled={provider.status === 'testing'}
                        variant="outline"
                        className="w-full"
                      >
                        {provider.status === 'testing' ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mr-2" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Test Provider
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Response times and reliability statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {providers.map((provider, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-sm text-gray-600">{provider.responseTime}ms</span>
                      </div>
                      <Progress 
                        value={Math.min(100, (5000 - provider.responseTime) / 50)} 
                        className="h-2"
                      />
                      <div className="text-xs text-gray-500 flex justify-between">
                        <span>Faster</span>
                        <span>Slower</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Configuration</CardTitle>
                <CardDescription>Current failover and routing configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Multi-Provider Failover System</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      The system uses a 4-tier failover configuration to ensure maximum availability:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <strong>1. Primary:</strong> OpenAI GPT-4o (Superior analysis quality)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <strong>2. Second:</strong> DeepSeek (Cost-effective alternative)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <strong>3. Third:</strong> Google Gemini (Free unlimited access)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <strong>4. Ultimate:</strong> AI/ML API (200+ models)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        <strong>5. Fallback:</strong> Demo data (When all providers fail)
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Failover Logic</h3>
                    <p className="text-sm text-gray-700">
                      When the primary provider fails, the system automatically switches to the backup provider. 
                      If both fail, it serves demo data to maintain functionality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
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
