
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

// Функція для перевірки чи підписка дійсно активна (не прострочена)
const isSubscriptionValid = (subscription: UserSubscription): boolean => {
  if (!subscription.is_active) {
    return false;
  }

  // Якщо підписка постійна, вона завжди активна
  if (subscription.tariff_plan.is_permanent) {
    return true;
  }

  // Перевіряємо чи не закінчилась підписка
  if (subscription.end_date) {
    const currentTime = new Date().getTime();
    const endTime = new Date(subscription.end_date).getTime();
    return currentTime <= endTime;
  }

  return false;
};

// Функція для автоматичної деактивації прострочених підписок
const deactivateExpiredSubscription = async (subscriptionId: string) => {
  try {
    console.log(`Deactivating expired subscription: ${subscriptionId}`);
    const { error } = await extendedSupabase
      .from('user_tariff_subscriptions')
      .update({ 
        is_active: false 
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error deactivating expired subscription:', error);
    } else {
      console.log('Successfully deactivated expired subscription');
    }
  } catch (error) {
    console.error('Error in deactivateExpiredSubscription:', error);
  }
};

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
    staleTime: 1 * 60 * 1000, // 1 хвилина для частіших перевірок
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 2 * 60 * 1000, // Перевіряємо кожні 2 хвилини
  });

  useEffect(() => {
    const processSubscriptions = async () => {
      if (!subscriptions || subscriptions.length === 0) {
        setActiveSubscription(null);
        setSubscriptionHistory([]);
        return;
      }

      console.log('Processing subscriptions at:', new Date().toISOString());
      
      let foundActiveSubscription: UserSubscription | null = null;
      const expiredSubscriptionsToDeactivate: string[] = [];

      // Перевіряємо всі підписки
      for (const subscription of subscriptions) {
        const isValid = isSubscriptionValid(subscription);
        
        console.log(`Subscription ${subscription.id} validation:`, {
          name: subscription.tariff_plan.name,
          is_active_in_db: subscription.is_active,
          is_permanent: subscription.tariff_plan.is_permanent,
          end_date: subscription.end_date,
          is_valid: isValid,
          current_time: new Date().toISOString()
        });

        // Якщо підписка в базі позначена як активна, але насправді прострочена
        if (subscription.is_active && !isValid && !subscription.tariff_plan.is_permanent) {
          expiredSubscriptionsToDeactivate.push(subscription.id);
        }

        // Шукаємо дійсно активну підписку
        if (isValid && !foundActiveSubscription) {
          foundActiveSubscription = subscription;
          console.log('Found valid active subscription:', subscription.id);
        }
      }

      // Деактивуємо прострочені підписки
      if (expiredSubscriptionsToDeactivate.length > 0) {
        console.log('Deactivating expired subscriptions:', expiredSubscriptionsToDeactivate);
        for (const subscriptionId of expiredSubscriptionsToDeactivate) {
          await deactivateExpiredSubscription(subscriptionId);
        }
        // Перезавантажуємо дані після деактивації
        setTimeout(() => {
          refetchSubscriptions();
        }, 1000);
        return;
      }

      setActiveSubscription(foundActiveSubscription);
      setSubscriptionHistory(subscriptions);
      
      console.log('Final subscription state:', {
        activeSubscription: foundActiveSubscription?.tariff_plan.name || 'None',
        historyCount: subscriptions.length,
        hasValidSubscription: !!foundActiveSubscription
      });
    };

    processSubscriptions();
  }, [subscriptions, refetchSubscriptions]);

  // Додаємо функцію для ручної перевірки статусу
  const checkSubscriptionStatus = () => {
    console.log('Manual subscription status check triggered');
    refetchSubscriptions();
  };

  return {
    subscriptions: subscriptions || [],
    activeSubscription,
    subscriptionHistory,
    isLoading,
    error,
    refetchSubscriptions,
    checkSubscriptionStatus,
    // Додаємо допоміжну функцію для перевірки чи є активна підписка
    hasActiveSubscription: !!activeSubscription
  };
};
