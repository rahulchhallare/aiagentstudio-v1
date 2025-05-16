import { useQuery, useMutation } from '@tanstack/react-query';
import { Agent } from '@/lib/types';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';

// Hook for fetching all agents for a user
export function useAgents(userId?: number) {
  const { data, isLoading, error, refetch } = useQuery<Agent[]>({
    queryKey: ['/api/agents', { userId }],
    queryFn: ({ signal }) => 
      fetch(`/api/agents?userId=${userId}`, { signal, credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch agents');
          return res.json();
        }),
    enabled: !!userId,
  });

  return {
    agents: data,
    isLoading,
    error,
    refetch,
  };
}

// Hook for fetching a single agent
export function useAgent(id?: string | number) {
  const { data, isLoading, error } = useQuery<Agent>({
    queryKey: [`/api/agents/${id}`],
    enabled: !!id,
  });

  return {
    agent: data,
    isLoading,
    error,
  };
}

// Hook for creating a new agent
export function useCreateAgent() {
  return useMutation({
    mutationFn: async (newAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiRequest('POST', '/api/agents', newAgent);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
  });
}

// Hook for updating an agent
export function useUpdateAgent() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Agent> }) => {
      const response = await apiRequest('PUT', `/api/agents/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${data.id}`] });
    },
  });
}

// Hook for deleting an agent
export function useDeleteAgent() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/agents/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    },
  });
}
