
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
    
    // Детальна перевірка наявності активної підписки
    const { data: existingSubscriptions, error: checkError } = await supabase
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
      .order('created_at', { ascending: false });

    if (checkError) {
      console.error('Error checking existing subscriptions:', checkError);
      return null;
    }

    // Перевіряємо кожну активну підписку
    let hasValidSubscription = false;
    const expiredSubscriptionIds = [];

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      for (const subscription of existingSubscriptions) {
        console.log('Checking subscription:', subscription);
        
        // Перевіряємо термін дії, якщо це не безстрокова підписка
        if (!subscription.tariff_plans.is_permanent && subscription.end_date) {
          const endDate = new Date(subscription.end_date);
          const now = new Date();
          
          const isExpired = now.getTime() > endDate.getTime();
          
          console.log('Subscription expiry check:', {
            subscriptionId: subscription.id,
            planName: subscription.tariff_plans.name,
            endDate: endDate.toISOString(),
            now: now.toISOString(),
            isExpired
          });
          
          if (isExpired) {
            expiredSubscriptionIds.push(subscription.id);
          } else {
            hasValidSubscription = true;
          }
        } else {
          // Безстрокова підписка
          hasValidSubscription = true;
        }
      }

      // Деактивуємо прострочені підписки
      if (expiredSubscriptionIds.length > 0) {
        console.log('Deactivating expired subscriptions:', expiredSubscriptionIds);
        const { error: deactivateError } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .in('id', expiredSubscriptionIds);
          
        if (deactivateError) {
          console.error('Error deactivating expired subscriptions:', deactivateError);
        }
      }

      // Якщо є дійсна активна підписка, повертаємо її
      if (hasValidSubscription) {
        const validSubscription = existingSubscriptions.find(sub => 
          sub.tariff_plans.is_permanent || 
          (sub.end_date && new Date(sub.end_date).getTime() > new Date().getTime())
        );
        console.log('User already has a valid subscription:', validSubscription?.tariff_plans.name);
        return validSubscription;
      }
    }

    // Якщо немає дійсної підписки, створюємо демо-тариф тільки якщо користувач взагалі не має жодної підписки в історії
    const { data: allSubscriptions, error: historyError } = await supabase
      .from('user_tariff_subscriptions')
      .select('id')
      .eq('user_id', userId);

    if (historyError) {
      console.error('Error checking subscription history:', historyError);
      return null;
    }

    // Якщо користувач взагалі не має підписок, активуємо демо-тариф
    if (!allSubscriptions || allSubscriptions.length === 0) {
      console.log('User has no subscriptions, activating demo plan');
      
      // Створюємо або отримуємо демо-тарифний план
      const demoTariffId = await createDemoTariffIfNotExist();
      if (!demoTariffId) {
        console.error('Could not create or find demo tariff');
        return null;
      }

      // Активуємо демо-тариф для користувача
      console.log(`Activating demo tariff ${demoTariffId} for user ${userId}`);
      return await activateUserPlan(userId, demoTariffId);
    }

    console.log('User has subscription history but no active subscription. Not activating demo plan.');
    return null;
  } catch (error) {
    console.error('Error activating default plan:', error);
    return null;
  }
};
