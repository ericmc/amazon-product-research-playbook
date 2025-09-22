import { Navigate, useLocation } from 'react-router-dom';
import { isAppUnlocked } from '@/utils/appLock';

interface LockGuardProps {
  children: React.ReactNode;
}

// Routes that are accessible even when locked
const publicRoutes = ['/lock', '/help'];

// Check if route should be accessible when locked
const isPublicRoute = (pathname: string): boolean => {
  // Allow exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  
  // Allow static assets (though these are typically handled by the server)
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return true;
  }
  
  return false;
};

export const LockGuard: React.FC<LockGuardProps> = ({ children }) => {
  const location = useLocation();
  const isUnlocked = isAppUnlocked();

  // If app is unlocked, render children normally
  if (isUnlocked) {
    return <>{children}</>;
  }

  // If app is locked but current route is public, render children
  if (isPublicRoute(location.pathname)) {
    return <>{children}</>;
  }

  // Otherwise, redirect to lock screen
  return <Navigate to="/lock" replace />;
};
