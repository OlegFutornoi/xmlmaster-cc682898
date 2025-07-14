
// Хук для роботи з підписками користувача
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useQuery } from '@tanstack/react-query';

interface UserSubscription {
  id: string;
  user_id: string;
  tariff_plan_id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  tariff_plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number | null;
    is_permanent: boolean;
    currency: {
      id: string;
      code: string;
      name: string;
    };
  };
}

export const useUserSubscriptions = () => {
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscription[]>([]);

  const { 
    data: subscriptions, 
    isLoading, 
    error,
    refetch: refetchSubscriptions 
  } = useQuery({
    queryKey: ['userSubscriptions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user ID, skipping subscription fetch');
        return [];
      }

      console.log('Fetching subscriptions for user:', user.id);
      
      const { data, error } = await extendedSupabase
        .from('user_tariff_subscriptions')
        .select(`
          *,
          tariff_plan:tariff_plans (
            id,
            name,
            price,
            duration_days,
            is_permanent,
            currency:currencies (
              id,
              code,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
    // Збільшуємо staleTime для цього конкретного запиту
    staleTime: 10 * 60 * 1000, // 10 хвилин
    // Вимикаємо автоматичний рефетч
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!subscriptions || subscriptions.length === 0) {
      setActiveSubscription(null);
      setSubscriptionHistory([]);
      return;
    }

    console.log('Current date and time:', new Date().toISOString());
    
    let foundActiveSubscription: UserSubscription | null = null;

    // Шукаємо активну підписку
    for (const subscription of subscriptions) {
      const currentTime = new Date().getTime();
      const endTime = subscription.end_date ? new Date(subscription.end_date).getTime() : null;
      
      const isExpired = endTime ? currentTime > endTime : false;
      
      console.log(`Subscription ${subscription.id} expiry check:`, {
        currentTime: new Date().toISOString(),
        endDate: subscription.end_date,
        currentTimeMs: currentTime,
        endTimeMs: endTime,
        isExpired,
        timeDifference: endTime ? endTime - currentTime : null,
        hoursLeft: endTime ? Math.floor((endTime - currentTime) / (1000 * 60 * 60)) : null
      });

      const isCurrentlyActive = subscription.is_active && !isExpired;
      
      console.log(`Checking subscription ${subscription.id}:`, {
        name: subscription.tariff_plan.name,
        isCurrentlyActive,
        isExpired,
        start_date: subscription.start_date,
        end_date: subscription.end_date,
        duration_days: subscription.tariff_plan.duration_days,
        is_permanent: subscription.tariff_plan.is_permanent
      });

      if (isCurrentlyActive && !foundActiveSubscription) {
        foundActiveSubscription = subscription;
        console.log('Found valid active subscription:', subscription.id);
      }
    }

    setActiveSubscription(foundActiveSubscription);
    setSubscriptionHistory(subscriptions);
    
    console.log('Final state:', {
      activeSubscription: foundActiveSubscription?.tariff_plan.name || 'None',
      historyCount: subscriptions.length
    });
  }, [subscriptions]);

  return {
    subscriptions: subscriptions || [],
    activeSubscription,
    subscriptionHistory,
    isLoading,
    error,
    refetchSubscriptions
  };
};
