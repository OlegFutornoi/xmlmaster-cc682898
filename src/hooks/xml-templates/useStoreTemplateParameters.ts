
// Хук для роботи з параметрами шаблону магазину
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StoreTemplateParameter {
  id: string;
  store_id: string;
  template_id: string;
  parameter_name: string;
  parameter_value: string | null;
  xml_path: string;
  parameter_type: string;
  parameter_category: string;
  is_active: boolean;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateParameterData {
  id: string;
  parameter_value?: string;
  is_active?: boolean;
  is_required?: boolean;
}

export const useStoreTemplateParameters = (storeId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: parameters, 
    isLoading, 
    error,
    refetch: refetchParameters 
  } = useQuery({
    queryKey: ['storeTemplateParameters', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await extendedSupabase
        .from('store_template_parameters')
        .select('*')
        .eq('store_id', storeId)
        .order('parameter_category', { ascending: true })
        .order('parameter_name', { ascending: true });

      if (error) {
        console.error('Error fetching store template parameters:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!storeId,
    // Збільшуємо staleTime для параметрів
    staleTime: 10 * 60 * 1000, // 10 хвилин
    // Вимикаємо автоматичний рефетч
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Мутація для оновлення параметра
  const updateParameterMutation = useMutation({
    mutationFn: async (data: UpdateParameterData) => {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await extendedSupabase
        .from('store_template_parameters')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating parameter:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      // Оновлюємо кеш без рефетчу
      queryClient.invalidateQueries({ 
        queryKey: ['storeTemplateParameters', storeId],
        refetchType: 'none' // Не робимо автоматичний рефетч
      });
    },
    onError: (error) => {
      console.error('Error updating parameter:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити параметр',
        variant: 'destructive'
      });
    }
  });

  const updateParameter = (data: UpdateParameterData) => {
    updateParameterMutation.mutate(data);
  };

  // Функція копіювання параметрів з шаблону
  const copyTemplateParameters = async (templateId: string, storeId: string) => {
    try {
      console.log('Copying template parameters from template:', templateId, 'to store:', storeId);
      
      // Спочатку видаляємо існуючі параметри магазину
      console.log('Deleting existing store parameters...');
      const { error: deleteError } = await extendedSupabase
        .from('store_template_parameters')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) {
        console.error('Error deleting existing store parameters:', deleteError);
        throw deleteError;
      }
      console.log('Existing store parameters deleted successfully');

      // Отримуємо параметри шаблону
      console.log('Fetching template parameters...');
      const { data: templateParams, error } = await extendedSupabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) {
        console.error('Error fetching template parameters:', error);
        throw error;
      }

      console.log('Template parameters found:', templateParams?.length || 0);

      // Копіюємо параметри в магазин з обов'язковим статусом
      if (templateParams && templateParams.length > 0) {
        console.log('Copying parameters to store...');
        
        // Групуємо параметри по назві та XML шляху для виявлення дублікатів
        const uniqueParams = new Map();
        templateParams.forEach(param => {
          const key = `${param.parameter_name}-${param.xml_path}`;
          if (!uniqueParams.has(key)) {
            uniqueParams.set(key, param);
          } else {
            console.warn('Duplicate parameter detected:', param.parameter_name, param.xml_path);
          }
        });

        const storeParams = Array.from(uniqueParams.values()).map(param => ({
          store_id: storeId,
          template_id: templateId,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type,
          parameter_category: param.parameter_category,
          is_active: param.is_active,
          is_required: true // ВСІ ПАРАМЕТРИ ОБОВ'ЯЗКОВІ ЗА ЗАМОВЧУВАННЯМ
        }));

        console.log('Parameters to insert:', storeParams.length);

        const { data, error: insertError } = await extendedSupabase
          .from('store_template_parameters')
          .insert(storeParams)
          .select();

        if (insertError) {
          console.error('Error inserting store parameters:', insertError);
          throw insertError;
        }

        console.log('Successfully copied', storeParams.length, 'parameters to store');
      }

      // Оновлюємо кеш без автоматичного рефетчу
      queryClient.invalidateQueries({ 
        queryKey: ['storeTemplateParameters', storeId],
        refetchType: 'none'
      });
      
      toast({
        title: 'Успіх',
        description: `Параметри шаблону успішно скопійовано (${templateParams?.length || 0} параметрів)`,
      });
      
    } catch (error) {
      console.error('Error copying template parameters:', error);
      toast({
        title: 'Помилка',
        description: 'Помилка копіювання параметрів шаблону',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    parameters: parameters || [],
    isLoading,
    error,
    updateParameter,
    copyTemplateParameters,
    refetchParameters,
    isUpdating: updateParameterMutation.isPending
  };
};
