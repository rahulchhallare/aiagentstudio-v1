import { useState } from 'react';
import { useLocation } from 'wouter';
import { Agent } from '@/lib/types';
import { BarChart2, Edit, MoreHorizontal, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Format the date
  const getUpdatedTimeText = () => {
    if (!agent.updated_at) return 'Recently updated';
    
    try {
      const date = new Date(agent.updated_at);
      return `Updated ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return 'Recently updated';
    }
  };

  // Mutation for deleting agent
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/agents/${agent.id}`, undefined);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      
      toast({
        title: 'Agent deleted',
        description: `Your agent "${agent.name}" has been deleted successfully.`,
      });
      
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete agent',
        description: error.message || 'An error occurred while deleting the agent.',
        variant: 'destructive',
      });
    },
  });

  // Handle edit button click
  const handleEdit = () => {
    navigate(`/builder/${agent.id}`);
  };

  // Handle delete button click
  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition duration-200">
        <div className={`h-2 ${agent.is_active ? 'bg-green-500' : 'bg-amber-500'}`}></div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
            <span className={`px-2 py-1 ${agent.is_active ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} text-xs rounded-full`}>
              {agent.is_active ? 'Active' : 'Draft'}
            </span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            {agent.description || 'No description provided.'}
          </p>
          
          <div className="flex items-center text-gray-500 text-sm mb-4">
            <div className="flex items-center mr-4">
              <Clock className="h-4 w-4 mr-1" />
              <span>{getUpdatedTimeText()}</span>
            </div>
            <div className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-1" />
              <span>0 calls today</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-xs"
              onClick={handleEdit}
            >
              <Edit className="h-3 w-3 mr-1" />
              <span>Edit</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center text-xs"
            >
              <BarChart2 className="h-3 w-3 mr-1" />
              <span>Analytics</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center text-xs"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agent "{agent.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
