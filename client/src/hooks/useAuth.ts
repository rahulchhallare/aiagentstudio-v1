import { useState, useEffect } from 'react';
import { User, InsertUser } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // This would typically be a call to a /me or /session endpoint
        // For this demo, we'll check localStorage for simplicity
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const userData = await response.json();
      
      // Store user data
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      return userData;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      throw new Error(message);
    }
  };

  // Register function
  const register = async (userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User> => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();
      
      // Store user data
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      
      return newUser;
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(message);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return {
    user,
    login,
    register,
    logout,
    isLoading
  };
}