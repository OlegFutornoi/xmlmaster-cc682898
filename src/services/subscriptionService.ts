
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { createDemoTariffIfNotExist } from './demoTariffService';

// Активація тарифного плану для користувача
export const activateUserPlan = async (
  userId: string, 
  planId: string, 
  currentSubscriptionId: string | null = null
) => {
  try {
    // Отримуємо дані тарифного плану
    const { data: planData, error: planError } = await supabase
      .from('tariff_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      throw new Error('Не вдалося отримати деталі тарифного плану');
    }

    // Якщо є активна підписка, деактивуємо її
    if (currentSubscriptionId) {
      const { error: deactivateError } = await supabase
        .from('user_tariff_subscriptions')
        .update({
          is_active: false,
          end_date: new Date().toISOString()
        })
        .eq('id', currentSubscriptionId);
        
      if (deactivateError) {
        console.error('Error deactivating current subscription:', deactivateError);
      }
    }

    // Розраховуємо дату закінчення нової підписки
    const startDate = new Date();
    let endDate = null;
    
    if (!planData.is_permanent && planData.duration_days) {
      const end = new Date(startDate);
      end.setDate(end.getDate() + planData.duration_days);
      endDate = end.toISOString();
      console.log(`Встановлюємо кінцеву дату підписки: ${endDate} (${planData.duration_days} днів від ${startDate.toISOString()})`);
    }

    // Створюємо нову підписку
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_tariff_subscriptions')
      .insert({
        user_id: userId,
        tariff_plan_id: planId,
        start_date: startDate.toISOString(),
        end_date: endDate,
        is_active: true
      })
      .select();
    
    if (subscriptionError) {
      throw subscriptionError;
    }
    
    return subscriptionData;
  } catch (error) {
    console.error('Error in activateUserPlan:', error);
    throw error;
  }
};

// Спроба активації демо-тарифу для нового користувача
export const tryActivateDefaultPlan = async (userId: string) => {
  try {
    // Перевіримо, чи має користувач уже активну підписку
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_tariff_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subscription:', checkError);
      return null;
    }

    // Якщо користувач уже має активну підписку, не створюємо нову
    if (existingSubscription) {
      return existingSubscription;
    }

    // Створюємо або отримуємо демо-тарифний план
    const demoTariffId = await createDemoTariffIfNotExist();
    if (!demoTariffId) {
      console.error('Could not create or find demo tariff');
      return null;
    }

    // Активуємо демо-тариф для користувача
    return await activateUserPlan(userId, demoTariffId);
  } catch (error) {
    console.error('Error activating default plan:', error);
    return null;
  }
};
