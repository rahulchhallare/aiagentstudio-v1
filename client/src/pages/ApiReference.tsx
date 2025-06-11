import { useState } from "react";
import { Code, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: any;
  responses: Response[];
  example: string;
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Response {
  status: number;
  description: string;
  example: any;
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/agents",
    description: "Retrieve all AI agents for the authenticated user",
    responses: [
      {
        status: 200,
        description: "Successfully retrieved agents",
        example: {
          agents: [
            {
              id: 1,
              name: "Customer Support Bot",
              description: "Handles customer inquiries",
              is_active: true,
              created_at: "2024-06-01T10:00:00Z"
            }
          ]
        }
      }
    ],
    example: `curl -X GET "https://api.aiagentstudio.ai/api/agents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
  },
  {
    method: "POST",
    path: "/api/agents",
    description: "Create a new AI agent",
    requestBody: {
      name: "string",
      description: "string",
      flow_data: "object"
    },
    responses: [
      {
        status: 201,
        description: "Agent created successfully",
        example: {
          id: 2,
          name: "New Agent",
          description: "Agent description",
          is_active: true
        }
      }
    ],
    example: `curl -X POST "https://api.aiagentstudio.ai/api/agents" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My New Agent",
    "description": "Agent description",
    "flow_data": {...}
  }'`
  },
  {
    method: "GET",
    path: "/api/agents/{id}",
    description: "Retrieve a specific AI agent by ID",
    parameters: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "The unique identifier of the agent"
      }
    ],
    responses: [
      {
        status: 200,
        description: "Successfully retrieved agent",
        example: {
          id: 1,
          name: "Customer Support Bot",
          description: "Handles customer inquiries",
          flow_data: {},
          is_active: true
        }
      },
      {
        status: 404,
        description: "Agent not found",
        example: { error: "Agent not found" }
      }
    ],
    example: `curl -X GET "https://api.aiagentstudio.ai/api/agents/1" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    method: "PUT",
    path: "/api/agents/{id}",
    description: "Update an existing AI agent",
    parameters: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "The unique identifier of the agent"
      }
    ],
    requestBody: {
      name: "string (optional)",
      description: "string (optional)",
      flow_data: "object (optional)",
      is_active: "boolean (optional)"
    },
    responses: [
      {
        status: 200,
        description: "Agent updated successfully",
        example: {
          id: 1,
          name: "Updated Agent Name",
          description: "Updated description"
        }
      }
    ],
    example: `curl -X PUT "https://api.aiagentstudio.ai/api/agents/1" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Updated Agent Name",
    "is_active": false
  }'`
  },
  {
    method: "DELETE",
    path: "/api/agents/{id}",
    description: "Delete an AI agent",
    parameters: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "The unique identifier of the agent"
      }
    ],
    responses: [
      {
        status: 200,
        description: "Agent deleted successfully",
        example: { message: "Agent deleted successfully" }
      }
    ],
    example: `curl -X DELETE "https://api.aiagentstudio.ai/api/agents/1" \\
  -H "Authorization: Bearer YOUR_API_KEY"`
  },
  {
    method: "POST",
    path: "/api/agents/{id}/execute",
    description: "Execute an AI agent with input data",
    parameters: [
      {
        name: "id",
        type: "integer",
        required: true,
        description: "The unique identifier of the agent"
      }
    ],
    requestBody: {
      input: "string",
      context: "object (optional)"
    },
    responses: [
      {
        status: 200,
        description: "Agent executed successfully",
        example: {
          output: "Agent response",
          execution_time: "2.5s",
          tokens_used: 150
        }
      }
    ],
    example: `curl -X POST "https://api.aiagentstudio.ai/api/agents/1/execute" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": "Hello, how can you help me?",
    "context": {"user_id": "12345"}
  }'`
  }
];

export default function ApiReference() {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-500";
      case "POST":
        return "bg-green-500";
      case "PUT":
        return "bg-yellow-500";
      case "DELETE":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              API <span className="text-brand-blue">Reference</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Integrate AIAgentStudio.AI into your applications with our comprehensive REST API. Manage agents, execute workflows, and retrieve results programmatically.
            </p>
          </div>
        </section>

        {/* Getting Started */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Getting Started</h2>
              
              <Tabs defaultValue="authentication" className="mb-12">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="authentication">Authentication</TabsTrigger>
                  <TabsTrigger value="base-url">Base URL</TabsTrigger>
                  <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
                </TabsList>
                
                <TabsContent value="authentication" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>API Key Authentication</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        All API requests must include your API key in the Authorization header:
                      </p>
                      <div className="bg-gray-900 text-white p-4 rounded-lg relative">
                        <code>Authorization: Bearer YOUR_API_KEY</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-white hover:bg-gray-700"
                          onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-600 mt-4">
                        You can find your API key in your account settings.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="base-url" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Base URL</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        All API endpoints are relative to the base URL:
                      </p>
                      <div className="bg-gray-900 text-white p-4 rounded-lg relative">
                        <code>https://api.aiagentstudio.ai</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-white hover:bg-gray-700"
                          onClick={() => copyToClipboard("https://api.aiagentstudio.ai")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="rate-limits" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rate Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold">Free Plan:</p>
                          <p className="text-gray-600">100 requests per hour</p>
                        </div>
                        <div>
                          <p className="font-semibold">Pro Plan:</p>
                          <p className="text-gray-600">1,000 requests per hour</p>
                        </div>
                        <div>
                          <p className="font-semibold">Enterprise Plan:</p>
                          <p className="text-gray-600">10,000 requests per hour</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">API Endpoints</h2>
              
              <div className="space-y-4">
                {apiEndpoints.map((endpoint) => {
                  const endpointKey = `${endpoint.method}-${endpoint.path}`;
                  const isExpanded = expandedEndpoint === endpointKey;
                  
                  return (
                    <Card key={endpointKey}>
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-lg font-mono">{endpoint.path}</code>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </div>
                        <p className="text-gray-600">{endpoint.description}</p>
                      </CardHeader>
                      
                      {isExpanded && (
                        <CardContent className="space-y-6">
                          {/* Parameters */}
                          {endpoint.parameters && (
                            <div>
                              <h4 className="font-semibold mb-2">Parameters</h4>
                              <div className="space-y-2">
                                {endpoint.parameters.map((param) => (
                                  <div key={param.name} className="border rounded p-3">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <code className="font-mono text-sm">{param.name}</code>
                                      <Badge variant="outline">{param.type}</Badge>
                                      {param.required && (
                                        <Badge variant="destructive" className="text-xs">Required</Badge>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-sm">{param.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div>
                              <h4 className="font-semibold mb-2">Request Body</h4>
                              <div className="bg-gray-900 text-white p-4 rounded-lg relative">
                                <pre className="text-sm overflow-x-auto">
                                  {JSON.stringify(endpoint.requestBody, null, 2)}
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2 text-white hover:bg-gray-700"
                                  onClick={() => copyToClipboard(JSON.stringify(endpoint.requestBody, null, 2))}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Responses */}
                          <div>
                            <h4 className="font-semibold mb-2">Responses</h4>
                            <div className="space-y-3">
                              {endpoint.responses.map((response) => (
                                <div key={response.status} className="border rounded p-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Badge 
                                      className={`${response.status < 300 ? 'bg-green-500' : 'bg-red-500'} text-white`}
                                    >
                                      {response.status}
                                    </Badge>
                                    <span className="text-sm">{response.description}</span>
                                  </div>
                                  <div className="bg-gray-900 text-white p-3 rounded relative">
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(response.example, null, 2)}
                                    </pre>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="absolute top-2 right-2 text-white hover:bg-gray-700"
                                      onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Example */}
                          <div>
                            <h4 className="font-semibold mb-2">Example Request</h4>
                            <div className="bg-gray-900 text-white p-4 rounded-lg relative">
                              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                                {endpoint.example}
                              </pre>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 text-white hover:bg-gray-700"
                                onClick={() => copyToClipboard(endpoint.example)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SDKs */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">SDKs & Libraries</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Use our official SDKs to integrate with your favorite programming languages.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Code className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">JavaScript/TypeScript</h3>
                  <p className="text-gray-600 text-sm mb-4">Official Node.js SDK</p>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Code className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Python</h3>
                  <p className="text-gray-600 text-sm mb-4">Official Python SDK</p>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Code className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Go</h3>
                  <p className="text-gray-600 text-sm mb-4">Official Go SDK</p>
                  <Button variant="outline" size="sm">Coming Soon</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="py-16 bg-gradient-to-r from-brand-blue to-brand-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Our developer support team is here to help you integrate and build amazing applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-brand-blue hover:bg-white/90">
                Join Discord
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Support
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}