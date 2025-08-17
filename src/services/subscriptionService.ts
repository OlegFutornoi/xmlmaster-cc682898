
import { supabase } from '@/integrations/supabase/client';
import { createDemoTariffIfNotExist } from './demoTariffService';

// Активація тарифного плану для користувача
export const activateUserPlan = async (
  userId: string, 
  planId: string, 
  currentSubscriptionId: string | null = null
) => {
  try {
    console.log(`Activating plan ${planId} for user ${userId}`);
    
    // Отримуємо дані тарифного плану
    const { data: planData, error: planError } = await supabase
      .from('tariff_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Error fetching tariff plan:', planError);
      throw new Error('Не вдалося отримати деталі тарифного плану');
    }

    console.log('Plan data:', planData);

    // Якщо є активна підписка, деактивуємо її
    if (currentSubscriptionId) {
      console.log(`Deactivating current subscription ${currentSubscriptionId}`);
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

    // Деактивуємо всі інші активні підписки користувача
    const { error: deactivateAllError } = await supabase
      .from('user_tariff_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
      
    if (deactivateAllError) {
      console.error('Error deactivating all active subscriptions:', deactivateAllError);
    }

    // Розраховуємо дату закінчення нової підписки
    const startDate = new Date();
    let endDate = null;
    
    if (!planData.is_permanent && planData.duration_days) {
      // Створюємо дату закінчення точно через вказану кількість днів
      const end = new Date(startDate);
      end.setDate(end.getDate() + planData.duration_days);
      // Встановлюємо час на кінець дня (23:59:59)
      end.setHours(23, 59, 59, 999);
      endDate = end.toISOString();
      
      console.log(`Subscription calculation:`, {
        startDate: startDate.toISOString(),
        durationDays: planData.duration_days,
        endDate: endDate,
        startDateMs: startDate.getTime(),
        endDateMs: end.getTime(),
        actualDurationMs: end.getTime() - startDate.getTime(),
        expectedDurationMs: planData.duration_days * 24 * 60 * 60 * 1000
      });
    } else {
      console.log('Subscription is permanent or has no duration');
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
      console.error('Error creating subscription:', subscriptionError);
      throw subscriptionError;
    }
    
    console.log('Subscription created successfully:', subscriptionData);
    return subscriptionData;
  } catch (error) {
    console.error('Error in activateUserPlan:', error);
    throw error;
  }
};

// Спроба активації демо-тарифу для нового користувача
export const tryActivateDefaultPlan = async (userId: string) => {
  try {
    console.log(`Trying to activate default plan for user ${userId}`);
    
    // Перевіримо, чи має користувач уже активну підписку
    const { data: existingSubscription, error: checkError } = await supabase
      .from('user_tariff_subscriptions')
      .select(`
        id,
        is_active,
        end_date,
        start_date,
        tariff_plans:tariff_plan_id (
          id,
          name,
          is_permanent,
          duration_days
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing subscription:', checkError);
      return null;
    }

    // Перевіряємо, чи не закінчилась активна підписка
    if (existingSubscription) {
      console.log('Found active subscription:', existingSubscription);
      
      // Перевіряємо термін дії, якщо це не безстрокова підписка
      if (!existingSubscription.tariff_plans.is_permanent && existingSubscription.end_date) {
        const endDate = new Date(existingSubscription.end_date);
        const now = new Date();
        
        const isExpired = now.getTime() > endDate.getTime();
        
        console.log('Subscription expiry check:', {
          endDate: endDate.toISOString(),
          now: now.toISOString(),
          endDateMs: endDate.getTime(),
          nowMs: now.getTime(),
          isExpired,
          timeDifference: endDate.getTime() - now.getTime(),
          hoursLeft: Math.round((endDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        });
        
        if (isExpired) {
          console.log('Subscription has expired, deactivating it');
          // Деактивуємо прострочену підписку
          await supabase
            .from('user_tariff_subscriptions')
            .update({ is_active: false })
            .eq('id', existingSubscription.id);
            
          // Продовжуємо, щоб активувати демо-план
        } else {
          // Підписка активна і не прострочена
          console.log('User already has an active valid subscription');
          return existingSubscription;
        }
      } else {
        // Безстрокова підписка
        console.log('User has a permanent active subscription');
        return existingSubscription;
      }
    }

    // Створюємо або отримуємо демо-тарифний план
    const demoTariffId = await createDemoTariffIfNotExist();
    if (!demoTariffId) {
      console.error('Could not create or find demo tariff');
      return null;
    }

    console.log(`Found demo tariff: ${demoTariffId}`);

    // Деактивуємо будь-які існуючі підписки для цього користувача
    const { error: deactivateError } = await supabase
      .from('user_tariff_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId);
      
    if (deactivateError) {
      console.warn('Error deactivating existing subscriptions:', deactivateError);
    }

    // Активуємо демо-тариф для користувача
    console.log(`Activating demo tariff ${demoTariffId} for user ${userId}`);
    return await activateUserPlan(userId, demoTariffId);
  } catch (error) {
    console.error('Error activating default plan:', error);
    return null;
  }
};
