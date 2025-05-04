
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface UserRouteProps {
  children: ReactNode;
}

// Компонент для захисту маршрутів користувача
const UserRoute = ({ children }: UserRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;
