
// Хук для отримання активної підписки користувача
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useActiveSubscription = (userId: string, isOpen: boolean) => {
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          start_date,
          end_date,
          is_active,
          tariff_plans (
            id,
            name,
            price,
            is_permanent,
            duration_days,
            currencies:currency_id (name, code)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      } else {
        setActiveSubscription(data);
      }
      setIsLoading(false);
    };

    if (isOpen) {
      fetchActiveSubscription();
    }
  }, [isOpen, userId]);

  return { activeSubscription, isLoading };
};
