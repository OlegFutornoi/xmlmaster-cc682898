
// Сервіс для роботи з тарифними планами
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const assignTariffPlan = async (userId: string, selectedPlanId: string, activeSubscriptionId?: string) => {
  // Отримуємо вибраний тарифний план
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
    
  if (planError) {
    throw planError;
  }
  
  if (!selectedPlan) {
    throw new Error("Тариф не знайдено");
  }

  // Розраховуємо кінцеву дату підписки
  let endDate = null;
  if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
    const startDate = new Date();
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
    
    // Форматуємо дату у формат ISO для зберігання в базі
    endDate = format(endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  }

  // Якщо є активна підписка, деактивуємо її
  if (activeSubscriptionId) {
    const { error: updateError } = await supabase
      .from('user_tariff_subscriptions')
      .update({ is_active: false })
      .eq('id', activeSubscriptionId);

    if (updateError) {
      throw updateError;
    }
  }

  // Створюємо нову підписку
  const { error } = await supabase
    .from('user_tariff_subscriptions')
    .insert({
      user_id: userId,
      tariff_plan_id: selectedPlanId,
      end_date: endDate,
      is_active: true
    });

  if (error) {
    throw error;
  }

  return selectedPlan;
};
