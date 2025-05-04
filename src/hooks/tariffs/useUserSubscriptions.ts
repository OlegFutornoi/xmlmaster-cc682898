
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

  const checkSubscriptionExpiry = async (subscription: Subscription) => {
    if (!user) return false;
    
    // Якщо підписка постійна, вона не може закінчитися
    if (subscription.tariff_plan.is_permanent) return true;
    
    // Якщо є кінцева дата, перевіряємо, чи не минула вона
    if (subscription.end_date) {
      const endDate = new Date(subscription.end_date);
      const now = new Date();
      
      // Якщо дата закінчення вже минула, деактивуємо підписку
      if (endDate < now && subscription.is_active) {
        const { error } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id);
          
        if (error) {
          console.error('Помилка деактивації підписки:', error);
        }
        
        return false;
      }
    }
    
    return subscription.is_active;
  };

  const fetchUserSubscriptions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Отримуємо активну підписку
      const { data: activeData, error: activeError } = await supabase
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
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (activeError) throw activeError;

      // Перетворюємо дані
      if (activeData) {
        const formattedActive = {
          id: activeData.id,
          is_active: activeData.is_active,
          start_date: activeData.start_date,
          end_date: activeData.end_date,
          tariff_plan: {
            id: activeData.tariff_plans.id,
            name: activeData.tariff_plans.name,
            price: activeData.tariff_plans.price,
            duration_days: activeData.tariff_plans.duration_days,
            is_permanent: activeData.tariff_plans.is_permanent,
            currency: {
              code: activeData.tariff_plans.currencies.code
            }
          }
        };

        // Перевіряємо, чи не закінчився термін дії підписки
        const isStillActive = await checkSubscriptionExpiry(formattedActive);
        
        if (isStillActive) {
          setActiveSubscription(formattedActive);
        } else {
          setActiveSubscription(null);
        }
      } else {
        setActiveSubscription(null);
      }

      // Отримуємо історію підписок
      const { data: historyData, error: historyError } = await supabase
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
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('start_date', { ascending: false });

      if (historyError) throw historyError;

      if (historyData) {
        const formattedHistory = historyData.map(item => ({
          id: item.id,
          is_active: item.is_active,
          start_date: item.start_date,
          end_date: item.end_date,
          tariff_plan: {
            id: item.tariff_plans.id,
            name: item.tariff_plans.name,
            price: item.tariff_plans.price,
            duration_days: item.tariff_plans.duration_days,
            is_permanent: item.tariff_plans.is_permanent,
            currency: {
              code: item.tariff_plans.currencies.code
            }
          }
        }));
        setSubscriptionHistory(formattedHistory);
      }
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

  useEffect(() => {
    if (user) {
      fetchUserSubscriptions();
    }
    
    // Періодично перевіряємо статус підписки
    const interval = setInterval(() => {
      if (user && activeSubscription) {
        checkSubscriptionExpiry(activeSubscription)
          .then(isActive => {
            if (!isActive) {
              setActiveSubscription(null);
            }
          });
      }
    }, 60000); // Перевіряємо кожну хвилину
    
    return () => clearInterval(interval);
  }, [user, activeSubscription]);

  return {
    activeSubscription,
    subscriptionHistory,
    isLoading,
    refetchSubscriptions: fetchUserSubscriptions
  };
};
