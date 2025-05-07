
// Сервіс для створення демо-тарифів
import { supabase } from '@/integrations/supabase/client';

export const createDemoTariffIfNotExist = async () => {
  try {
    // Перевірка наявності демо-тарифного плану
    const { data: existingPlan, error: checkError } = await supabase
      .from('tariff_plans')
      .select('id')
      .eq('price', 0)
      .eq('name', 'Демо доступ')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for demo tariff:', checkError);
      return null;
    }

    // Якщо план вже існує, повертаємо його ID
    if (existingPlan) {
      console.log('Demo tariff already exists:', existingPlan.id);
      return existingPlan.id;
    }

    // Отримуємо базову валюту
    const { data: currency, error: currencyError } = await supabase
      .from('currencies')
      .select('id')
      .eq('is_base', true)
      .maybeSingle();

    if (currencyError || !currency) {
      console.error('Error finding base currency:', currencyError);
      return null;
    }

    // Створюємо демо-тарифний план
    const { data: newPlan, error: createError } = await supabase
      .from('tariff_plans')
      .insert({
        name: 'Демо доступ',
        price: 0,
        currency_id: currency.id,
        is_permanent: false, // 
        duration_days: 14 // 14 днів демо-доступу
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating demo tariff:', createError);
      return null;
    }

    console.log('Created new demo tariff plan:', newPlan.id);
    return newPlan.id;
  } catch (error) {
    console.error('Error in createDemoTariffIfNotExist:', error);
    return null;
  }
};

// Виконати при завантаженні застосунку
try {
  createDemoTariffIfNotExist().then(id => {
    if (id) {
      console.log('Demo tariff plan checked/created with ID:', id);
    }
  });
} catch (error) {
  console.error('Error initializing demo tariff:', error);
}
