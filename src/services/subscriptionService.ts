
// Сервіс для керування підписками користувача
import { supabase } from '@/integrations/supabase/client';

export const activateUserPlan = async (
  userId: string, 
  selectedPlanId: string, 
  activeSubscriptionId: string | null = null
) => {
  if (!userId || !selectedPlanId) {
    throw new Error('Не вдалося активувати тарифний план: відсутній користувач або тарифний план');
  }
  
  try {
    const { data: selectedPlan, error: planError } = await supabase
      .from('tariff_plans')
      .select(`
        id, 
        name, 
        price, 
        duration_days, 
        is_permanent
      `)
      .eq('id', selectedPlanId)
      .single();
      
    if (planError) throw planError;
    
    if (!selectedPlan) {
      throw new Error("Тариф не знайдено");
    }

    // Розраховуємо кінцеву дату підписки
    let endDate = null;
    if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
      // Якщо це Демо доступ (price=0 і is_permanent=true), не встановлюємо кінцеву дату
      if (selectedPlan.price === 0 && selectedPlan.is_permanent) {
        endDate = null;
      } else {
        const startDate = new Date();
        endDate = new Date();
        endDate.setDate(startDate.getDate() + selectedPlan.duration_days);
      }
    }

    // Якщо є активна підписка, деактивуємо її
    if (activeSubscriptionId) {
      const { error: updateError } = await supabase
        .from('user_tariff_subscriptions')
        .update({ is_active: false })
        .eq('id', activeSubscriptionId);

      if (updateError) throw updateError;
    }

    // Створюємо нову підписку
    const { error: createError } = await supabase
      .from('user_tariff_subscriptions')
      .insert({
        user_id: userId,
        tariff_plan_id: selectedPlanId,
        end_date: endDate,
        is_active: true
      });

    if (createError) throw createError;

    return selectedPlan;
  } catch (error) {
    console.error('Error activating plan:', error);
    throw error;
  }
};
