import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Sidebar from '@/components/dashboard/Sidebar';
import AgentCard from '@/components/dashboard/AgentCard';
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';
import { Button } from '@/components/ui/button';
import { Agent } from '@/lib/types';
import { 
  Bot, PlusCircle, FileText, MenuIcon, CircleHelp,
  Bell, Search, HelpCircle, BarChart2, UserCircle
} from 'lucide-react';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { agents, isLoading: agentsLoading } = useAgents(user?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to welcome page if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/welcome');
    }
  }, [user, authLoading, navigate]);

  // Additional check for immediate logout redirect
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/welcome');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    // Force redirect if user is not authenticated
    navigate('/welcome');
    return null;
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        {/* Top Bar */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-1"
              onClick={() => navigate('/help')}
            >
              <CircleHelp className="h-4 w-4" />
              <span>Help</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-1"
              onClick={() => document.querySelector('.search-button')?.dispatchEvent(new MouseEvent('click'))}
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 overflow-y-auto" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's an overview of your AI agents.</p>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Active Agents</h3>
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {agentsLoading ? '—' : agents?.filter(a => a.is_active).length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {agentsLoading ? 'Loading...' : `${agents?.length || 0} total agents`}
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">API Calls</h3>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <BarChart2 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">43</p>
              <p className="text-sm text-gray-500 mt-2">43% of monthly limit</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Saved Flows</h3>
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {agentsLoading ? '—' : agents?.length || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {agentsLoading ? 'Loading...' : `${agents?.filter(a => a.is_active).length || 0} published, ${agents?.filter(a => !a.is_active).length || 0} drafts`}
              </p>
            </div>
          </div>
          
          {/* Recent Agents */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Agents</h2>
              <Button variant="link" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All
              </Button>
            </div>
            
            {agentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse h-48"></div>
                ))}
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.slice(0, 3).map(agent => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-gray-600">You haven't created any agents yet.</p>
                <Button 
                  onClick={() => navigate('/builder')}
                  className="mt-4"
                >
                  Create Your First Agent
                </Button>
              </div>
            )}
          </div>
          
          {/* Quick Start */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Quick Start</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Start Card 1 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-200">
                <div className="p-6">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Create New Agent</h3>
                  <p className="text-gray-600 text-sm mb-4">Start building a custom AI agent from scratch with our visual editor.</p>
                  <Button 
                    variant="link" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0"
                    onClick={() => navigate('/builder')}
                  >
                    Get Started →
                  </Button>
                </div>
              </div>
              
              {/* Quick Start Card 2 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-200">
                <div className="p-6">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Use a Template</h3>
                  <p className="text-gray-600 text-sm mb-4">Choose from pre-built templates for common use cases and customize them.</p>
                  <Button 
                    variant="link" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0"
                  >
                    Browse Templates →
                  </Button>
                </div>
              </div>
              
              {/* Quick Start Card 3 */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-200">
                <div className="p-6">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <HelpCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Watch Tutorial</h3>
                  <p className="text-gray-600 text-sm mb-4">Learn how to create effective AI agents with our step-by-step tutorial.</p>
                  <Button 
                    variant="link" 
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium p-0"
                  >
                    Watch Now →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
