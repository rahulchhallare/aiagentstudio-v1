import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function AuthGuard({ 
  children, 
  redirectTo = '/', 
  requireAuth = true 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle redirects with useEffect to prevent render loops
  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        navigate('/');
      } else if (!requireAuth && user) {
        navigate('/dashboard');
      }
    }
  }, [isLoading, requireAuth, user, navigate]);

  // If we need auth but don't have user, show loading (redirect is happening)
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // If we don't need auth but have user, show loading (redirect is happening)
  if (!requireAuth && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}