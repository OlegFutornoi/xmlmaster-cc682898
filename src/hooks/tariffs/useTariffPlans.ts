
// Хук для отримання тарифних планів
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TariffPlan } from '@/components/admin/tariffs/types';

export const useTariffPlans = () => {
  const [tariffPlans, setTariffPlans] = useState<TariffPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTariffPlans = async () => {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
          id, 
          name, 
          price, 
          duration_days, 
          is_permanent,
          currencies:currency_id (
            name, 
            code
          ),
          description
        `)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching tariff plans:', error);
      } else {
        setTariffPlans(
          data?.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            duration_days: item.duration_days,
            is_permanent: item.is_permanent,
            currency: {
              name: item.currencies.name,
              code: item.currencies.code
            }
          })) || []
        );
      }
      setIsLoading(false);
    };

    fetchTariffPlans();
  }, []);

  return { tariffPlans, isLoading };
};
