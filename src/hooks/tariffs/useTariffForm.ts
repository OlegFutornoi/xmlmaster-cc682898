
// Хук для керування формою тарифного плану
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Схема валідації форми
const tariffFormSchema = z.object({
  name: z.string().min(1, { message: 'Назва тарифного плану обов\'язкова' }),
  price: z.number().min(0, { message: 'Ціна повинна бути не меншою за 0' }),
  currency_id: z.string().min(1, { message: 'Виберіть валюту' }),
  is_permanent: z.boolean(),
  duration_days: z.number().nullable().optional(),
});

export const useTariffForm = (planId: string | undefined) => {
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<z.infer<typeof tariffFormSchema>>({
    resolver: zodResolver(tariffFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      currency_id: '',
      is_permanent: false,
      duration_days: null,
    },
  });

  // Завантаження валют та даних тарифного плану
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      
      // Завантажуємо спочатку валюти
      await fetchCurrencies();
      
      // Завантажуємо дані тарифного плану, якщо це редагування
      if (planId) {
        await fetchTariffPlan();
      }
      
      setIsLoading(false);
    };
    
    initialize();
  }, [planId]);

  const fetchCurrencies = async () => {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (error) {
      console.error('Error fetching currencies:', error);
      return;
    }
    
    setCurrencies(data || []);
    
    // Якщо немає вибраної валюти і є доступні валюти, встановлюємо першу валюту за замовчуванням
    const currentCurrencyId = form.getValues("currency_id");
    if (!currentCurrencyId && data && data.length > 0) {
      form.setValue("currency_id", data[0].id);
    }
  };

  const fetchTariffPlan = async () => {
    if (!planId) return;
    
    const { data, error } = await supabase
      .from('tariff_plans')
      .select(`
        *,
        currencies:currency_id (
          id,
          code,
          name
        )
      `)
      .eq('id', planId)
      .single();
      
    if (error) {
      console.error('Error fetching tariff plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити тарифний план',
        variant: 'destructive',
      });
      return;
    }
    
    // Заповнюємо форму отриманими даними
    form.reset({
      name: data.name,
      price: data.price,
      currency_id: data.currency_id,
      is_permanent: data.is_permanent,
      duration_days: data.duration_days,
    });
    
    console.log('Loaded tariff plan data:', data);
  };

  const onSubmit = async (navigate: (path: string) => void) => {
    setIsSubmitting(true);
    
    try {
      const values = form.getValues();
      console.log('Saving tariff plan values:', values);
      
      if (planId) {
        // Оновлення існуючого тарифу
        const { error } = await supabase
          .from('tariff_plans')
          .update({
            name: values.name,
            price: values.price,
            currency_id: values.currency_id,
            is_permanent: values.is_permanent,
            duration_days: values.is_permanent ? null : values.duration_days,
          })
          .eq('id', planId);
          
        if (error) throw error;
        
        toast({
          title: 'Успішно',
          description: 'Тарифний план оновлено',
        });
      } else {
        // Створення нового тарифу
        const { error } = await supabase.from('tariff_plans').insert({
          name: values.name,
          price: values.price,
          currency_id: values.currency_id,
          is_permanent: values.is_permanent,
          duration_days: values.is_permanent ? null : values.duration_days,
        });
        
        if (error) throw error;
        
        toast({
          title: 'Успішно',
          description: 'Тарифний план створено',
        });
        
        navigate('/admin/dashboard/tariffs');
      }
    } catch (error) {
      console.error('Error saving tariff plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    currencies,
    isSubmitting,
    isLoading,
    onSubmit
  };
};
