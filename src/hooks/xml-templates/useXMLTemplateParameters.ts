
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { XMLTemplateParameter } from '@/types/xml-template';

// Правильне сортування параметрів згідно з ієрархією XML структури
const sortParametersByXMLHierarchy = (params: XMLTemplateParameter[]) => {
  return params.sort((a, b) => {
    const categoryA = a.parameter_category || 'parameter';
    const categoryB = b.parameter_category || 'parameter';
    
    // Визначаємо порядок категорій згідно з XML структурою
    const categoryOrder = {
      'parameter': 0,     // 1. Основна інформація магазину
      'currency': 1,      // 2. Валюти
      'category': 2,      // 3. Категорії
      'offer': 3,         // 4. Товари
      'characteristic': 4 // 5. Характеристики товарів
    };
    
    const orderA = categoryOrder[categoryA as keyof typeof categoryOrder] ?? 999;
    const orderB = categoryOrder[categoryB as keyof typeof categoryOrder] ?? 999;
    
    // Спочатку сортуємо по категоріях
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Потім по display_order в межах категорії
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    
    // Нарешті по назві параметру
    return a.parameter_name.localeCompare(b.parameter_name);
  });
};

export const useXMLTemplateParameters = (templateId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error, refetch } = useQuery({
    queryKey: ['template-xml-parameters', templateId],
    queryFn: async (): Promise<XMLTemplateParameter[]> => {
      if (!templateId) return [];
      
      console.log('🔍 Завантаження параметрів шаблону:', templateId);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Помилка завантаження параметрів шаблону:', error);
        throw error;
      }
      
      console.log(`📦 Завантажено ${data?.length || 0} параметрів шаблону`);
      
      // Приводимо TypeScript типи до правильного формату
      const typedData = (data || []).map(item => ({
        ...item,
        parameter_category: item.parameter_category as 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency',
        nested_values: item.nested_values ? 
          (typeof item.nested_values === 'string' ? 
            JSON.parse(item.nested_values) : 
            item.nested_values
          ) : undefined
      }));
      
      // Застосовуємо правильне сортування
      const sortedData = sortParametersByXMLHierarchy(typedData);
      console.log('📋 Параметри відсортовано за ієрархією XML');
      
      return sortedData;
    },
    enabled: !!templateId,
  });

  const createParameterMutation = useMutation({
    mutationFn: async (parameterData: any) => {
      console.log('💾 Створення параметру:', parameterData);
      
      // КРИТИЧНО ВАЖЛИВО: переконуємося що parameter_name НЕ null
      if (!parameterData.parameter_name || parameterData.parameter_name.trim() === '') {
        parameterData.parameter_name = 'Новий параметр';
      }
      
      // Валідуємо та очищуємо дані перед відправкою
      const cleanedData = {
        template_id: parameterData.template_id,
        parameter_name: String(parameterData.parameter_name).trim(),
        parameter_value: String(parameterData.parameter_value || ''),
        xml_path: String(parameterData.xml_path || 'shop/'),
        parameter_type: String(parameterData.parameter_type || 'text'),
        parameter_category: String(parameterData.parameter_category || 'parameter'),
        parent_parameter: parameterData.parent_parameter || null,
        is_active: Boolean(parameterData.is_active ?? true),
        is_required: Boolean(parameterData.is_required ?? false),
        display_order: Number(parameterData.display_order ?? 0),
        nested_values: parameterData.nested_values || null
      };
      
      // Додаткова валідація
      if (!cleanedData.template_id) {
        throw new Error('ID шаблону є обов\'язковим');
      }
      
      console.log('📋 Очищені дані для створення:', cleanedData);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .insert([cleanedData])
        .select()
        .single();

      if (error) {
        console.error('❌ Помилка створення параметру:', error);
        throw error;
      }
      
      console.log('✅ Параметр створено успішно:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр створено успішно",
      });
    },
    onError: (error: any) => {
      console.error('❌ Помилка створення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('🔄 Оновлення параметру:', id, updates);
      
      // Очищуємо updates від undefined значень
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .update(cleanedUpdates)
        .eq('id', id);

      if (error) {
        console.error('❌ Помилка оновлення параметру:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр оновлено успішно",
      });
    },
    onError: (error: any) => {
      console.error('❌ Помилка оновлення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити параметр",
        variant: "destructive",
      });
    },
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (parameterId: string) => {
      console.log('🗑️ Видалення параметру:', parameterId);
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) {
        console.error('❌ Помилка видалення параметру:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр видалено успішно",
      });
    },
    onError: (error: any) => {
      console.error('❌ Помилка видалення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити параметр",
        variant: "destructive",
      });
    },
  });

  // Створюємо асинхронну функцію для створення параметрів
  const createParameterAsync = async (parameterData: any): Promise<void> => {
    // КРИТИЧНО ВАЖЛИВО: валідація parameter_name
    if (!parameterData.parameter_name?.trim()) {
      parameterData.parameter_name = 'Новий параметр';
    }
    
    if (!parameterData.template_id) {
      throw new Error('ID шаблону є обов\'язковим');
    }
    
    if (!parameterData.xml_path?.trim()) {
      parameterData.xml_path = 'shop/';
    }
    
    return new Promise<void>((resolve, reject) => {
      createParameterMutation.mutate(parameterData, {
        onSuccess: () => {
          console.log('✅ Параметр створено через async функцію');
          resolve();
        },
        onError: (error) => {
          console.error('❌ Помилка в async функції:', error);
          reject(error);
        }
      });
    });
  };

  return {
    parameters,
    isLoading,
    error,
    refetch,
    createParameter: createParameterMutation.mutate,
    createParameterAsync,
    updateParameter: updateParameterMutation.mutate,
    deleteParameter: deleteParameterMutation.mutate,
    isCreating: createParameterMutation.isPending,
    isUpdating: updateParameterMutation.isPending,
    isDeleting: deleteParameterMutation.isPending,
  };
};
