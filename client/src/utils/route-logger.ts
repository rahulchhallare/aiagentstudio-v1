
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export function useRouteLogger(componentName: string) {
  const [location] = useLocation();
  
  useEffect(() => {
    console.log(`📍 ${componentName} mounted at route:`, location);
    
    // Log any navigation attempts
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      console.log('🚀 Navigation via pushState:', args[2]);
      return originalPushState.apply(window.history, args);
    };
    
    window.history.replaceState = function(...args) {
      console.log('🔄 Navigation via replaceState:', args[2]);
      return originalReplaceState.apply(window.history, args);
    };
    
    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [location, componentName]);
}
