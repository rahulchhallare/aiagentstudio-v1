
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export function AuthDebugger() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    console.log('🔍 AUTH DEBUG:', {
      location,
      user: user ? { id: user.id, username: user.username } : null,
      isLoading,
      localStorage: localStorage.getItem('auth_user'),
      timestamp: new Date().toISOString()
    });
  }, [location, user, isLoading]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Auth Debug</strong></div>
      <div>Location: {location}</div>
      <div>User: {user ? user.username : 'null'}</div>
      <div>Loading: {isLoading.toString()}</div>
      <div>LocalStorage: {localStorage.getItem('auth_user') ? 'exists' : 'null'}</div>
    </div>
  );
}
