
// Хук для отримання обмежень тарифного плану
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { PlanLimitation } from '@/components/admin/tariffs/types';

export const usePlanLimitations = (selectedPlanId: string) => {
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlanLimitations([]);
      return;
    }

    const fetchPlanLimitations = async () => {
      const { data, error } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', selectedPlanId);

      if (error) {
        console.error('Error fetching plan limitations:', error);
      } else {
        const formattedLimitations = (data || []).map(item => ({
          limitation_type: {
            name: item.limitation_types ? item.limitation_types.name || '' : '',
            description: item.limitation_types ? item.limitation_types.description || '' : ''
          },
          value: item.value
        }));
        
        setPlanLimitations(formattedLimitations);
      }
    };

    fetchPlanLimitations();
  }, [selectedPlanId]);

  return { planLimitations };
};
