
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
    refetchSubscriptions,
    checkSubscriptionStatus,
    hasActiveSubscription
  } = useUserSubscriptions();
  
  useEffect(() => {
    const initializeUserSubscription = async () => {
      if (!user) return;
      
      console.log('Initializing subscription for user:', user.id);
      
      // Спочатку перевіряємо поточний статус підписки
      await checkSubscriptionStatus();
      
      // Чекаємо трохи, щоб дані завантажились
      setTimeout(async () => {
        // Якщо у користувача немає активної підписки, пробуємо активувати демо-план
        if (!hasActiveSubscription) {
          console.log('No active subscription found, trying to activate demo plan');
          const result = await tryActivateDefaultPlan(user.id);
          if (result) {
            console.log('Demo plan activated:', result);
            await refetchSubscriptions();
          }
        } else {
          console.log('User has active subscription:', activeSubscription?.tariff_plan.name);
        }
      }, 1000);
    };
    
    if (user) {
      initializeUserSubscription();
    }
    
    // Встановлюємо інтервал для регулярної перевірки підписки
    const intervalId = setInterval(() => {
      if (user) {
        console.log('Periodic subscription check');
        checkSubscriptionStatus();
      }
    }, 30000); // перевірка кожні 30 секунд
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user, hasActiveSubscription]);

  // Додаємо обробник для фокуса вікна
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        console.log('Window focused, checking subscription status');
        checkSubscriptionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, checkSubscriptionStatus]);

  console.log('UserDashboard render:', {
    subscriptionsLoading,
    hasActiveSubscription,
    subscriptionName: activeSubscription?.tariff_plan?.name,
    userId: user?.id
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
