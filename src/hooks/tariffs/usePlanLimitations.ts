
// Хук для отримання обмежень тарифного плану
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { PlanLimitation, LimitationType } from '@/components/admin/tariffs/types';

export const usePlanLimitations = (selectedPlanId: string) => {
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlanLimitations([]);
      return;
    }

    const fetchPlanLimitations = async () => {
      setIsLoading(true);
      console.log('Fetching limitations for plan ID:', selectedPlanId);
      
      try {
        const { data, error } = await extendedSupabase
          .from('tariff_plan_limitations')
          .select(`
            id,
            value,
            limitation_types:limitation_type_id (id, name, description)
          `)
          .eq('tariff_plan_id', selectedPlanId);

        if (error) {
          console.error('Error fetching plan limitations:', error);
          return;
        }

        if (data) {
          const formattedLimitations: PlanLimitation[] = data.map((item: any) => {
            // limitation_types - це один об'єкт з join-запиту, не масив
            const limitationType = item.limitation_types;
            
            return {
              id: item.id,
              limitation_type: {
                id: limitationType?.id || '',
                name: limitationType?.name || '',
                description: limitationType?.description || ''
              },
              value: item.value
            };
          });
          
          console.log('Fetched limitations:', formattedLimitations);
          setPlanLimitations(formattedLimitations);
        }
      } catch (error) {
        console.error('Error in usePlanLimitations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanLimitations();
  }, [selectedPlanId]);

  const updateLimitationValue = async (limitationId: string, newValue: number): Promise<boolean> => {
    try {
      console.log('Updating limitation value:', limitationId, newValue);
      const { error } = await extendedSupabase
        .from('tariff_plan_limitations')
        .update({ value: newValue })
        .eq('id', limitationId);
      
      if (error) {
        console.error('Error updating limitation value:', error);
        return false;
      }
      
      // Оновлюємо локальний стан
      setPlanLimitations(prev => 
        prev.map(item => 
          item.id === limitationId ? { ...item, value: newValue } : item
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error in updateLimitationValue:', error);
      return false;
    }
  };

  return { 
    planLimitations, 
    isLoading,
    updateLimitationValue
  };
};
