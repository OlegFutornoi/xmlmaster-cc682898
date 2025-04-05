
import { Routes, Route, Navigate } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import { useAuth } from '@/context/AuthContext';
import UserHome from './UserHome';
import UserTariffs from './UserTariffs';
import UserStores from './UserStores';
import UserSettings from './UserSettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const UserDashboard = () => {
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Додаємо залежність від пошукового параметра, щоб компонент перемонтувався після зміни URL
  const [location, setLocation] = useState(window.location.pathname);

  // Оновлюємо стан розташування при зміні URL
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const { data, error } = await supabase
            .from('user_tariff_subscriptions')
            .select(`
              id,
              is_active,
              tariff_plans (id)
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            console.error('Error fetching subscription:', error);
          } else {
            setActiveSubscription(data);
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSubscription();
  }, [user, location]); // Додаємо location в залежності

  if (isLoading) {
    return <div>Завантаження...</div>;
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
