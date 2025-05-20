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
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      // First clone the response so we can read it multiple times if needed
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      
      // Check if the response is not ok
      if (!response.ok) {
        // Try to get error details from the response
        try {
          const errorText = await response.text();
          let errorMessage = 'Authentication failed';
          
          try {
            // Try to parse the error as JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If it's not valid JSON, use the text as is
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        } catch (textError) {
          // If we can't read the response text, throw a generic error
          throw new Error('Authentication failed: Unable to connect to server');
        }
      }
      
      // If we get here, the response is ok, so try to parse it
      try {
        const userData = await response.json();
        
        // Store user data
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        return userData;
      } catch (jsonError) {
        throw new Error('Authentication failed: Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      throw error;
    }
  };

  // Register function
  const register = async (userData: Omit<InsertUser, 'password'> & { password: string }): Promise<User | null> => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      
      // Check if the response is not ok
      if (!response.ok) {
        // Try to get error details from the response
        try {
          const errorText = await response.text();
          let errorMessage = 'Registration failed';
          
          try {
            // Try to parse the error as JSON
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If it's not valid JSON, use the text as is
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        } catch (textError) {
          // If we can't read the response text, throw a generic error
          throw new Error('Registration failed: Unable to connect to server');
        }
      }
      
      // If we get here, the response is ok, so try to parse it
      try {
        const newUser = await response.json();
        
        // Store user data
        setUser(newUser);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
        
        return newUser;
      } catch (jsonError) {
        throw new Error('Registration failed: Invalid response from server');
      }
    } catch (error: any) {
      console.error('Registration error details:', error);
      throw error;
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