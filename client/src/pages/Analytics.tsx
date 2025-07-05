import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BarChart3, MessageSquare, Users, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Analytics() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/chatbot/analytics'],
    enabled: true
  });

  const mockData = {
    totalSessions: 1247,
    totalMessages: 5684,
    escalationRate: 12.5,
    avgSessionTime: 4.2,
    topQueries: [
      { query: "Order status", count: 234 },
      { query: "Return policy", count: 189 },
      { query: "Shipping info", count: 156 },
      { query: "Product availability", count: 123 },
      { query: "Payment issues", count: 98 }
    ],
    dailyStats: [
      { date: "2024-01-01", sessions: 45, messages: 189 },
      { date: "2024-01-02", sessions: 52, messages: 221 },
      { date: "2024-01-03", sessions: 38, messages: 167 },
      { date: "2024-01-04", sessions: 61, messages: 278 },
      { date: "2024-01-05", sessions: 47, messages: 203 }
    ]
  };

  const data = analyticsData || mockData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onLoginClick={() => {}} onSignupClick={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLoginClick={() => {}} onSignupClick={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Chatbot Analytics Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Monitor your customer service chatbot performance and user interactions
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalSessions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escalation Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.escalationRate}%</div>
                <p className="text-xs text-muted-foreground">
                  -2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.avgSessionTime}m</div>
                <p className="text-xs text-muted-foreground">
                  +0.3m from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="queries">Top Queries</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Trends</CardTitle>
                    <CardDescription>Daily chatbot sessions over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.dailyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{stat.date}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{stat.sessions} sessions</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(stat.sessions / 70) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Message Volume</CardTitle>
                    <CardDescription>Daily message volume trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.dailyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{stat.date}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{stat.messages} messages</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${(stat.messages / 300) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="queries" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Frequent Queries</CardTitle>
                  <CardDescription>Top customer inquiries handled by the chatbot</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topQueries.map((query, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{query.query}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{query.count} times</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(query.count / 250) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Metrics</CardTitle>
                    <CardDescription>How effectively the chatbot resolves queries</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Self-Service Resolution</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                        </div>
                        <span className="text-sm font-medium">87.5%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Human Escalation Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '12.5%' }}></div>
                        </div>
                        <span className="text-sm font-medium">12.5%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Satisfaction</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <span className="text-sm font-medium">4.6/5</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                    <CardDescription>Average response time metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-2">1.2s</div>
                      <div className="text-sm text-gray-600">Average Response Time</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-xl font-bold">0.8s</div>
                        <div className="text-xs text-gray-600">Fastest</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-xl font-bold">2.1s</div>
                        <div className="text-xs text-gray-600">95th percentile</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => window.location.href = '/chatbot'}>
              Test Chatbot Demo
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}