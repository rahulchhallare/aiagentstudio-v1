import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bot, 
  BarChart3, 
  Settings, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Globe,
  Code,
  Upload,
  Download,
  RefreshCcw,
  Zap,
  Shield,
  HelpCircle,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

interface AgentMetrics {
  agent_id: string;
  agent_name: string;
  status: "active" | "paused" | "error";
  total_conversations: number;
  avg_satisfaction: number;
  avg_response_time: string;
  conversations_today: number;
  resolution_rate: number;
  uptime_percentage: number;
  last_active: string;
  monthly_usage: {
    messages: number;
    limit: number;
  };
}

interface ConversationLog {
  id: string;
  timestamp: string;
  user_message: string;
  agent_response: string;
  satisfaction_rating?: number;
  resolved: boolean;
  escalated: boolean;
}

export default function AgentDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch deployed agents
  const { data: deployedAgents, isLoading: loadingAgents } = useQuery({
    queryKey: ["/api/agent-metrics"],
    enabled: true
  });

  // Mock data for demo - Replace with actual API calls
  const mockAgentMetrics: AgentMetrics[] = [
    {
      agent_id: "agent-cs-001",
      agent_name: "Customer Support Assistant",
      status: "active",
      total_conversations: 1247,
      avg_satisfaction: 4.8,
      avg_response_time: "1.2s",
      conversations_today: 23,
      resolution_rate: 94.5,
      uptime_percentage: 99.8,
      last_active: "2 minutes ago",
      monthly_usage: {
        messages: 1840,
        limit: 5000
      }
    },
    {
      agent_id: "agent-sales-002", 
      agent_name: "Sales Assistant",
      status: "active",
      total_conversations: 892,
      avg_satisfaction: 4.6,
      avg_response_time: "0.8s",
      conversations_today: 41,
      resolution_rate: 87.3,
      uptime_percentage: 99.2,
      last_active: "5 minutes ago",
      monthly_usage: {
        messages: 1205,
        limit: 3000
      }
    }
  ];

  const mockConversations: ConversationLog[] = [
    {
      id: "conv-001",
      timestamp: "2024-01-04 14:32:00",
      user_message: "I need help with my order #12345",
      agent_response: "I'd be happy to help you with order #12345. Let me look that up for you right away.",
      satisfaction_rating: 5,
      resolved: true,
      escalated: false
    },
    {
      id: "conv-002", 
      timestamp: "2024-01-04 14:28:00",
      user_message: "What's your return policy?",
      agent_response: "Our return policy allows returns within 30 days of purchase. Items must be in original condition.",
      satisfaction_rating: 4,
      resolved: true,
      escalated: false
    },
    {
      id: "conv-003",
      timestamp: "2024-01-04 14:25:00",
      user_message: "My product arrived damaged",
      agent_response: "I'm sorry to hear your product arrived damaged. I'm escalating this to our support team for immediate assistance.",
      satisfaction_rating: 4,
      resolved: false,
      escalated: true
    }
  ];

  const currentAgent = selectedAgent 
    ? mockAgentMetrics.find(agent => agent.agent_id === selectedAgent)
    : mockAgentMetrics[0];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversations Today</p>
                <p className="text-2xl font-bold">{currentAgent?.conversations_today}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
            <div className="mt-2">
              <Progress value={65} className="w-full h-2" />
              <p className="text-xs text-gray-500 mt-1">+12% from yesterday</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Satisfaction Score</p>
                <p className="text-2xl font-bold">{currentAgent?.avg_satisfaction}/5.0</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="mt-2">
              <Progress value={96} className="w-full h-2" />
              <p className="text-xs text-gray-500 mt-1">+0.2 from last week</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">{currentAgent?.avg_response_time}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <div className="mt-2">
              <Progress value={88} className="w-full h-2" />
              <p className="text-xs text-gray-500 mt-1">-0.3s improvement</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold">{currentAgent?.resolution_rate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
            <div className="mt-2">
              <Progress value={currentAgent?.resolution_rate} className="w-full h-2" />
              <p className="text-xs text-gray-500 mt-1">+2.1% from last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
            <CardDescription>Message volume and limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Messages Used</span>
                  <span>{currentAgent?.monthly_usage.messages} / {currentAgent?.monthly_usage.limit}</span>
                </div>
                <Progress 
                  value={(currentAgent?.monthly_usage.messages || 0) / (currentAgent?.monthly_usage.limit || 1) * 100} 
                  className="w-full" 
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold">68%</p>
                  <p className="text-xs text-gray-500">Usage Rate</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">12</p>
                  <p className="text-xs text-gray-500">Days Left</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">$24</p>
                  <p className="text-xs text-gray-500">Current Bill</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>7-day performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-medium">Uptime</p>
                  <p className="text-lg font-bold text-green-600">{currentAgent?.uptime_percentage}%</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium">Total Conversations</p>
                  <p className="text-lg font-bold text-blue-600">{currentAgent?.total_conversations}</p>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderConversationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Recent Conversations</h3>
          <p className="text-sm text-gray-600">Latest customer interactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {mockConversations.map((conversation) => (
          <Card key={conversation.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={conversation.resolved ? "default" : "secondary"}>
                        {conversation.resolved ? "Resolved" : "Pending"}
                      </Badge>
                      {conversation.escalated && (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Escalated
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm"><strong>Customer:</strong> {conversation.user_message}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-sm"><strong>Agent:</strong> {conversation.agent_response}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {conversation.satisfaction_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm">{conversation.satisfaction_rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Customize your agent's behavior and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Input id="agentName" value={currentAgent?.agent_name} />
              </div>
              <div>
                <Label htmlFor="responseStyle">Response Style</Label>
                <select className="w-full p-2 border rounded">
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                  <option>Technical</option>
                </select>
              </div>
              <div>
                <Label htmlFor="escalationEmail">Escalation Email</Label>
                <Input id="escalationEmail" placeholder="support@yourcompany.com" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoEscalate">Auto-escalate complex queries</Label>
                <Switch id="autoEscalate" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="collectFeedback">Collect satisfaction ratings</Label>
                <Switch id="collectFeedback" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="businessHours">Respect business hours</Label>
                <Switch id="businessHours" />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <Textarea
              id="customInstructions"
              placeholder="Add specific instructions for your agent..."
              rows={4}
            />
          </div>
          
          <div className="flex gap-2">
            <Button>Save Changes</Button>
            <Button variant="outline">Reset to Defaults</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration & Embed Code</CardTitle>
          <CardDescription>Get your embed code and manage integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="embedCode">Widget Embed Code</Label>
            <Textarea
              id="embedCode"
              value={`<!-- AI Agent Widget -->\n<div id="ai-agent-widget"></div>\n<script src="https://cdn.aiagntstudio.ai/widget.js" data-agent-id="${currentAgent?.agent_id}"></script>`}
              readOnly
              rows={4}
              className="font-mono text-xs"
            />
            <Button variant="outline" className="mt-2" onClick={() => {
              navigator.clipboard.writeText(`<!-- AI Agent Widget -->\n<div id="ai-agent-widget"></div>\n<script src="https://cdn.aiagntstudio.ai/widget.js" data-agent-id="${currentAgent?.agent_id}"></script>`);
              toast({ title: "Copied!", description: "Embed code copied to clipboard" });
            }}>
              <Code className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              <Globe className="w-4 h-4 mr-2" />
              View Live Agent
            </Button>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload FAQs
            </Button>
            <Button variant="outline" className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              API Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
            <CardDescription>Common questions and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                How to customize agent responses
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Setting up email notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Understanding analytics data
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Troubleshooting common issues
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support Resources</CardTitle>
            <CardDescription>Documentation and contact options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full">
              <Globe className="w-4 h-4 mr-2" />
              Visit Documentation
            </Button>
            <Button variant="outline" className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Join Community
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Report Security Issue
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Requests & Feedback</CardTitle>
          <CardDescription>Help us improve your AI agent experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Share your feedback or request new features..." rows={4} />
          <Button>Submit Feedback</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-gray-600">Monitor and manage your AI agents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Deploy New Agent
            </Button>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="mb-6">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {mockAgentMetrics.map((agent) => (
              <Card 
                key={agent.agent_id}
                className={`min-w-[280px] cursor-pointer transition-all ${
                  selectedAgent === agent.agent_id || (!selectedAgent && agent === mockAgentMetrics[0])
                    ? 'ring-2 ring-blue-500' 
                    : ''
                }`}
                onClick={() => setSelectedAgent(agent.agent_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{agent.agent_name}</h3>
                      <p className="text-sm text-gray-600">Last active: {agent.last_active}</p>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverviewTab()}
          </TabsContent>

          <TabsContent value="conversations" className="mt-6">
            {renderConversationsTab()}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            {renderSettingsTab()}
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            {renderSupportTab()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}