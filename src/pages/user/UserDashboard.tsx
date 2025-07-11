
import { Routes, Route, Navigate } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import { useAuth } from '@/context/AuthContext';
import UserHome from './UserHome';
import UserTariffs from './UserTariffs';
import UserStores from './UserStores';
import UserSuppliers from './UserSuppliers';
import UserSettings from './UserSettings';
import { useEffect } from 'react';
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
      
      console.log('Checking subscription status for user:', user.id);
      await refetchSubscriptions();
      
      // Якщо у користувача немає активної підписки, пробуємо активувати демо-план
      if (!activeSubscription) {
        console.log('No active subscription found, trying to activate demo plan');
        const result = await tryActivateDefaultPlan(user.id);
        if (result) {
          console.log('Demo plan activated:', result);
          await refetchSubscriptions();
        }
      } else {
        console.log('User has active subscription:', activeSubscription.tariff_plan.name);
      }
    };
    
    // Перевіряємо підписку та активуємо демо-план при потребі
    if (user) {
      checkAndActivateDemoPlan();
    }
    
    // Встановлюємо інтервал для регулярної перевірки підписки
    const intervalId = setInterval(() => {
      if (user) {
        console.log('Periodic subscription check');
        refetchSubscriptions();
      }
    }, 60000); // перевірка кожну хвилину
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  console.log('UserDashboard render:', {
    subscriptionsLoading,
    hasActiveSubscription: !!activeSubscription,
    subscriptionName: activeSubscription?.tariff_plan?.name
  });

  if (subscriptionsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = !!activeSubscription;

  return (
    <div className="flex h-screen">
      <UserSidebar hasActiveSubscription={hasActiveSubscription} />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              hasActiveSubscription 
                ? <UserHome /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route path="/tariffs" element={<UserTariffs />} />
          <Route 
            path="/stores" 
            element={
              hasActiveSubscription 
                ? <UserStores /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route 
            path="/suppliers" 
            element={
              hasActiveSubscription 
                ? <UserSuppliers /> 
                : <Navigate to="/user/dashboard/tariffs" replace />
            } 
          />
          <Route 
            path="/settings" 
            element={
              hasActiveSubscription 
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
