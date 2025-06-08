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
    // Clear user state
    setUser(null);
    
    // Remove from localStorage
    localStorage.removeItem('auth_user');
    
    // Notify user
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Immediate navigation to landing page
    navigate('/welcome');
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