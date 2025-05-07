
import { Routes, Route, Navigate } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import { useAuth } from '@/context/AuthContext';
import UserHome from './UserHome';
import UserTariffs from './UserTariffs';
import UserStores from './UserStores';
import UserSuppliers from './UserSuppliers';
import UserSettings from './UserSettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { tryActivateDefaultPlan } from '@/services/subscriptionService';

const UserDashboard = () => {
  const { user } = useAuth();
  const { 
    activeSubscription, 
    isLoading: subscriptionsLoading, 
    refetchSubscriptions 
  } = useUserSubscriptions();
  
  useEffect(() => {
    const checkAndActivateDemoPlan = async () => {
      if (!user) return;
      
      await refetchSubscriptions();
      
      // Якщо у користувача немає активної підписки, пробуємо активувати демо-план
      if (!activeSubscription) {
        console.log('No active subscription found, trying to activate demo plan');
        const result = await tryActivateDefaultPlan(user.id);
        if (result) {
          console.log('Demo plan activated:', result);
          await refetchSubscriptions();
        }
      }
    };
    
    // Перевіряємо підписку та активуємо демо-план при потребі
    checkAndActivateDemoPlan();
    
    // Встановлюємо інтервал для регулярної перевірки підписки
    const intervalId = setInterval(() => {
      if (user) {
        refetchSubscriptions();
      }
    }, 120000); // перевірка кожні 2 хвилини
    
    return () => {
      clearInterval(intervalId); // Очищаємо інтервал при розмонтуванні компонента
    };
  }, [user]);

  if (subscriptionsLoading) {
    return <div className="flex justify-center items-center h-screen">Завантаження...</div>;
  }

  return (
    <div className="flex h-screen">
      <UserSidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              activeSubscription 
                ? <UserHome /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route path="/tariffs" element={<UserTariffs />} />
          <Route 
            path="/stores" 
            element={
              activeSubscription 
                ? <UserStores /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route 
            path="/suppliers" 
            element={
              activeSubscription 
                ? <UserSuppliers /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route 
            path="/settings" 
            element={
              activeSubscription 
                ? <UserSettings /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default UserDashboard;
