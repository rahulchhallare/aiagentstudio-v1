import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useAgents } from '@/hooks/useAgents';
import Sidebar from '@/components/dashboard/Sidebar';
import AgentCard from '@/components/dashboard/AgentCard';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

export default function Agents() {
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

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">All Agents</h1>
            <Button 
              onClick={() => navigate('/builder')}
              className="flex items-center space-x-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create New Agent</span>
            </Button>
          </div>
          
          {agentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse h-48"></div>
              ))}
            </div>
          ) : agents && agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-600 mb-6">You haven't created any agents yet. Get started by creating your first agent.</p>
              <Button 
                onClick={() => navigate('/builder')}
                className="flex items-center space-x-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Your First Agent</span>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}