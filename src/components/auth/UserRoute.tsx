
// Компонент для захисту маршрутів користувача
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';

interface UserRouteProps {
  children: ReactNode;
  requiresSubscription?: boolean;
}

// Компонент для захисту маршрутів користувача
const UserRoute = ({ children, requiresSubscription = true }: UserRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const { activeSubscription, isLoading } = useUserSubscriptions();

  // Якщо користувач не авторизований, перенаправляємо на логін
  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  // Якщо марштут вимагає активної підписки і відбувається завантаження - показуємо пустий компонент
  if (requiresSubscription && isLoading) {
    return null;
  }

  // Якщо маршрут вимагає підписки і її немає, перенаправляємо на сторінку тарифів
  if (requiresSubscription && !activeSubscription && location.pathname !== '/user/dashboard/tariffs') {
    return <Navigate to="/user/dashboard/tariffs" replace />;
  }

  return <>{children}</>;
};

export default UserRoute;
