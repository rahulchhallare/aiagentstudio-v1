import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { User, InsertUser } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: Omit<InsertUser, 'password'> & { password: string }) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for Google OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth');
        const userData = urlParams.get('user');

        if (authSuccess === 'success' && userData) {
          const user = JSON.parse(decodeURIComponent(userData));
          setUser(user);
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast({
            title: "Login successful",
            description: "Welcome to AIagentStudio.ai",
          });
        } else {
          // Check localStorage for existing session
          const storedUser = localStorage.getItem('auth_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

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
    try {
      // Clear user state first
      setUser(null);
      
      // Remove from localStorage
      localStorage.removeItem('auth_user');
      
      // Notify user
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Use navigate instead of window.location for SPA behavior
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to hard redirect if navigation fails
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}