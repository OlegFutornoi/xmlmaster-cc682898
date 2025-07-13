
// Хук для отримання підписок користувача
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  tariff_plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number | null;
    is_permanent: boolean;
    updated_at: string;
    currency: {
      code: string;
    }
  }
}

export const useUserSubscriptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserSubscriptions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Fetching subscriptions for user:', user.id);
      
      // Отримуємо всі підписки користувача
      const { data: allSubscriptions, error: fetchError } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          is_active,
          start_date,
          end_date,
          tariff_plans:tariff_plan_id (
            id,
            name,
            price,
            duration_days,
            is_permanent,
            updated_at,
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      let currentActiveSubscription = null;
      const expiredSubscriptions = [];
      const validHistorySubscriptions = [];

      const now = new Date();
      console.log('Current date and time:', now.toISOString());

      // Перевіряємо кожну підписку
      for (const subscription of allSubscriptions || []) {
        const isCurrentlyActive = subscription.is_active;
        const isExpired = checkIfSubscriptionExpired(subscription, now);

        console.log(`Checking subscription ${subscription.id}:`, {
          name: subscription.tariff_plans.name,
          isCurrentlyActive,
          isExpired,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          duration_days: subscription.tariff_plans.duration_days,
          is_permanent: subscription.tariff_plans.is_permanent
        });

        if (isCurrentlyActive && isExpired) {
          // Підписка активна, але прострочена - деактивуємо
          console.log('Deactivating expired subscription:', subscription.id);
          expiredSubscriptions.push(subscription.id);
          validHistorySubscriptions.push(formatSubscriptionData(subscription));
        } else if (isCurrentlyActive && !isExpired) {
          // Активна і не прострочена підписка
          currentActiveSubscription = formatSubscriptionData(subscription);
          console.log('Found valid active subscription:', subscription.id);
        } else {
          // Неактивна підписка - додаємо в історію
          validHistorySubscriptions.push(formatSubscriptionData(subscription));
        }
      }

      // Деактивуємо прострочені підписки
      if (expiredSubscriptions.length > 0) {
        const { error: deactivateError } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .in('id', expiredSubscriptions);
        
        if (deactivateError) {
          console.error('Error deactivating expired subscriptions:', deactivateError);
        } else {
          console.log('Successfully deactivated expired subscriptions:', expiredSubscriptions);
        }
      }

      setActiveSubscription(currentActiveSubscription);
      setSubscriptionHistory(validHistorySubscriptions);

      console.log('Final state:', {
        activeSubscription: currentActiveSubscription?.tariff_plan?.name || 'None',
        historyCount: validHistorySubscriptions.length
      });

    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити інформацію про підписки',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для перевірки чи підписка прострочена
  const checkIfSubscriptionExpired = (subscription: any, currentTime: Date): boolean => {
    if (subscription.tariff_plans.is_permanent) {
      console.log(`Subscription ${subscription.id} is permanent - never expires`);
      return false; // Постійні підписки не можуть бути прострочені
    }

    if (!subscription.end_date) {
      console.log(`Subscription ${subscription.id} has no end date - treating as active`);
      return false; // Якщо немає дати закінчення, вважаємо активною
    }

    const endDate = new Date(subscription.end_date);
    
    // Встановлюємо час для поточної дати та дати закінчення на кінець дня для точного порівняння
    const currentTimeMs = currentTime.getTime();
    const endTimeMs = endDate.getTime();
    
    const isExpired = currentTimeMs > endTimeMs;
    
    console.log(`Subscription ${subscription.id} expiry check:`, {
      currentTime: currentTime.toISOString(),
      endDate: endDate.toISOString(),
      currentTimeMs,
      endTimeMs,
      isExpired,
      timeDifference: endTimeMs - currentTimeMs,
      hoursLeft: Math.round((endTimeMs - currentTimeMs) / (1000 * 60 * 60))
    });

    return isExpired;
  };

  // Функція для форматування даних підписки
  const formatSubscriptionData = (data: any): Subscription => {
    return {
      id: data.id,
      is_active: data.is_active,
      start_date: data.start_date,
      end_date: data.end_date,
      tariff_plan: {
        id: data.tariff_plans.id,
        name: data.tariff_plans.name,
        price: data.tariff_plans.price,
        duration_days: data.tariff_plans.duration_days,
        is_permanent: data.tariff_plans.is_permanent,
        updated_at: data.tariff_plans.updated_at,
        currency: {
          code: data.tariff_plans.currencies ? data.tariff_plans.currencies.code : 'UAH'
        }
      }
    };
  };

  useEffect(() => {
    if (user) {
      fetchUserSubscriptions();
    }
  }, [user]);

  return {
    activeSubscription,
    subscriptionHistory,
    isLoading,
    refetchSubscriptions: fetchUserSubscriptions
  };
};
