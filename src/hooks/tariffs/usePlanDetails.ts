
// Хук для отримання деталей тарифного плану
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useToast } from '@/hooks/use-toast';
import { PlanLimitation } from '@/components/admin/tariffs/types';

interface TariffItem {
  id: string;
  description: string;
  is_active: boolean;
}

// Виправлений тип для відповіді від Supabase
interface SupabaseLimitationResponse {
  id: string;
  value: number;
  limitation_types: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}

export const usePlanDetails = (planId: string | null) => {
  const { toast } = useToast();
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [planItems, setPlanItems] = useState<TariffItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails(planId);
    } else {
      setPlanLimitations([]);
      setPlanItems([]);
    }
  }, [planId]);

  const fetchPlanDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const { data: limitationsData, error: limitationsError } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          id,
          value,
          limitation_types:limitation_type_id (id, name, description)
        `)
        .eq('tariff_plan_id', id);

      if (limitationsError) throw limitationsError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('tariff_plan_items')
        .select(`
          tariff_items:tariff_item_id (id, description),
          is_active
        `)
        .eq('tariff_plan_id', id);

      if (itemsError) throw itemsError;

      if (limitationsData) {
        // Виправлене перетворення даних з правильними типами
        const formattedLimitations: PlanLimitation[] = limitationsData.map(item => {
          const typedItem = item as SupabaseLimitationResponse;
          
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
        
        setPlanLimitations(formattedLimitations);
      }

      if (itemsData) {
        // Виправляємо виведення описів функцій в діалозі
        const formattedItems = itemsData
          .filter(item => item.is_active)
          .map(item => ({
            id: item.tariff_items?.id || '',
            description: item.tariff_items?.description || '',
            is_active: item.is_active
          }));
        setPlanItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити деталі тарифного плану',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    planLimitations,
    planItems,
    isLoading,
    fetchPlanDetails
  };
};
