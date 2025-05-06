
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

      // Перевіряємо чи не закінчився термін підписки
      if (activeData && !activeData.tariff_plans.is_permanent && activeData.end_date) {
        const endDate = new Date(activeData.end_date);
        const now = new Date();
        
        if (endDate < now) {
          console.log('Підписка закінчилась, деактивуємо її');
          // Підписка закінчилась - деактивуємо її
          const { error: updateError } = await supabase
            .from('user_tariff_subscriptions')
            .update({ is_active: false })
            .eq('id', activeData.id);
          
          if (updateError) {
            console.error('Помилка деактивації закінченої підписки:', updateError);
          }
          // Не встановлюємо активну підписку, так як вона закінчилась
          setActiveSubscription(null);
        } else {
          // Перетворюємо дані для активної підписки
          const formattedActive = formatSubscriptionData(activeData);
          setActiveSubscription(formattedActive);
        }
      } else if (activeData && activeData.tariff_plans.is_permanent) {
        // Постійна підписка
        const formattedActive = formatSubscriptionData(activeData);
        setActiveSubscription(formattedActive);
      } else {
        // Немає активної підписки
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
        const formattedHistory = historyData.map(item => formatSubscriptionData(item));
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
