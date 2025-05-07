
// Сервіс для створення демо-тарифів
import { supabase } from '@/integrations/supabase/client';

export const createDemoTariffIfNotExist = async () => {
  try {
    console.log("Checking for demo tariff plan");
    
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
        is_permanent: false,
        duration_days: 14 // 14 днів демо-доступу
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating demo tariff:', createError);
      return null;
    }

    console.log('Created new demo tariff plan:', newPlan.id);
    
    // Отримуємо типи обмежень для магазинів та постачальників
    const { data: limitationTypes, error: typesError } = await supabase
      .from('limitation_types')
      .select('id, name')
      .in('name', ['stores_count', 'suppliers_count']);
      
    if (typesError) {
      console.error('Error fetching limitation types:', typesError);
    } else if (limitationTypes && limitationTypes.length > 0) {
      // Додаємо обмеження для демо-тарифу
      const limitations = limitationTypes.map(type => ({
        tariff_plan_id: newPlan.id,
        limitation_type_id: type.id,
        value: type.name === 'stores_count' ? 1 : 2 // 1 магазин і 2 постачальники
      }));
      
      const { error: limitError } = await supabase
        .from('tariff_plan_limitations')
        .insert(limitations);
        
      if (limitError) {
        console.error('Error setting limitations for demo tariff:', limitError);
      } else {
        console.log('Added limitations for demo tariff');
      }
    }
    
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
