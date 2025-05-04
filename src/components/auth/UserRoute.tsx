
// Компонент для захисту маршрутів користувача
import { ReactNode, useEffect, useState } from 'react';
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

  // Перевіряємо, чи користувач авторизований
  if (!isAuthenticated) {
    return <Navigate to="/user/login" replace />;
  }

  // Якщо маршрут вимагає підписки і відбувається завантаження - показуємо пустий компонент
  if (requiresSubscription && isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Завантаження...</div>;
  }

  // Перевіряємо, чи потрібна підписка для даного маршруту
  // І перенаправляємо на сторінку тарифів, якщо підписки немає
  if (requiresSubscription && !isLoading && !activeSubscription && 
      location.pathname !== '/user/dashboard/tariffs' && user) {
    console.log("Перенаправляємо на сторінку тарифів через відсутність активної підписки");
    return <Navigate to="/user/dashboard/tariffs" replace />;
  }

  // Якщо все в порядку, показуємо дочірні компоненти
  return <>{children}</>;
};

export default UserRoute;
