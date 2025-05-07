
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
          // Типи для більшої чіткості
          type LimitationResponse = {
            id: string;
            value: number;
            limitation_types: {
              id: string;
              name: string;
              description: string | null;
            };
          };
          
          // Використовуємо приведення типу через unknown, щоб уникнути помилок TypeScript
          const formattedLimitations: PlanLimitation[] = data.map(item => {
            const typedItem = item as unknown as LimitationResponse;
            
            return {
              id: typedItem.id,
              limitation_type: {
                id: typedItem.limitation_types?.id || '',
                name: typedItem.limitation_types?.name || '',
                description: typedItem.limitation_types?.description || ''
              },
              value: typedItem.value
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

  // Допоміжна функція для отримання обмеження за його назвою
  const getLimitationByName = (name: string): PlanLimitation | undefined => {
    return planLimitations.find(limitation => 
      limitation.limitation_type.name === name
    );
  };

  return { 
    planLimitations, 
    isLoading,
    updateLimitationValue,
    getLimitationByName
  };
};
