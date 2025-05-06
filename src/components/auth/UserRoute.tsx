
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface UserRouteProps {
  children: ReactNode;
}

const UserRoute = ({ children }: UserRouteProps) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;
