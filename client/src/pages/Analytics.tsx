import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { BarChart3, MessageSquare, UserCheck, RotateCcw, Calendar, TrendingUp } from 'lucide-react';

interface AnalyticsSummary {
  totalSessions: number;
  totalMessages: number;
  escalations: number;
  returnRequests: number;
  escalationRate: string;
}

interface AnalyticsData {
  analytics: any[];
  summary: AnalyticsSummary;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const response = await apiRequest('GET', `/api/chatbot/analytics?${queryParams}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    fetchAnalytics();
  };

  const resetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(fetchAnalytics, 100);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
        return 'bg-blue-100 text-blue-800';
      case 'message_sent':
        return 'bg-green-100 text-green-800';
      case 'escalation':
        return 'bg-red-100 text-red-800';
      case 'return_request':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbot Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor chatbot performance, user interactions, and support metrics
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-48">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleDateFilter} className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Apply Filter
            </Button>
            <Button variant="outline" onClick={resetDateFilter} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {analyticsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Unique chat sessions initiated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Messages sent by users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Human Escalations</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.escalations}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.summary.escalationRate}% escalation rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Return Requests</CardTitle>
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.summary.returnRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Return authorizations issued
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest chatbot interactions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.analytics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No analytics data available for the selected period.
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData.analytics.slice(0, 20).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getEventTypeColor(event.event_type)}>
                          {event.event_type.replace('_', ' ')}
                        </Badge>
                        <div>
                          <p className="font-medium">Session: {event.session_id.slice(0, 8)}...</p>
                          {event.event_data && (
                            <p className="text-sm text-gray-600">
                              {JSON.stringify(event.event_data).slice(0, 100)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg. Messages per Session</span>
                    <Badge variant="outline">
                      {analyticsData.summary.totalSessions > 0 
                        ? (analyticsData.summary.totalMessages / analyticsData.summary.totalSessions).toFixed(1)
                        : '0'
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Escalation Rate</span>
                    <Badge variant={
                      parseFloat(analyticsData.summary.escalationRate) > 20 ? 'destructive' : 'secondary'
                    }>
                      {analyticsData.summary.escalationRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Return Request Rate</span>
                    <Badge variant="outline">
                      {analyticsData.summary.totalSessions > 0 
                        ? ((analyticsData.summary.returnRequests / analyticsData.summary.totalSessions) * 100).toFixed(1)
                        : '0'
                      }%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['session_start', 'message_sent', 'escalation', 'return_request'].map(eventType => {
                    const count = analyticsData.analytics.filter(a => a.event_type === eventType).length;
                    const percentage = analyticsData.analytics.length > 0 
                      ? ((count / analyticsData.analytics.length) * 100).toFixed(1)
                      : '0';
                    
                    return (
                      <div key={eventType} className="flex justify-between items-center">
                        <span className="capitalize">{eventType.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{count}</span>
                          <Badge variant="outline">{percentage}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}