
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { XMLTemplateParameter } from '@/types/xml-template';

// Функція для автоматичного визначення категорії на основі XML-шляху
const getCategoryFromXmlPath = (xmlPath: string): 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency' => {
  const path = xmlPath.toLowerCase();
  if (path.includes('/currencies/') || path.includes('/currency')) {
    return 'currency';
  }
  if (path.includes('/categories/') || path.includes('/category')) {
    return 'category';
  }
  if (path.includes('/offers/') || path.includes('/offer')) {
    return 'offer';
  }
  if (path.includes('/param') || path.includes('characteristic')) {
    return 'characteristic';
  }
  return 'parameter';
};

export const useXMLTemplateParameters = (templateId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['template-xml-parameters', templateId],
    queryFn: async (): Promise<XMLTemplateParameter[]> => {
      if (!templateId) return [];
      
      console.log('Завантаження параметрів шаблону:', templateId);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true })
        .order('parameter_category', { ascending: true })
        .order('parameter_name', { ascending: true });

      if (error) {
        console.error('Помилка завантаження параметрів:', error);
        throw error;
      }
      
      console.log('Завантажено параметрів:', data?.length || 0);
      
      // Приводимо типи до правильного формату
      return (data || []).map(item => ({
        ...item,
        parameter_category: item.parameter_category as 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency'
      }));
    },
    enabled: !!templateId,
  });

  const createParameterMutation = useMutation({
    mutationFn: async (parameterData: any) => {
      console.log('Створення параметру:', parameterData);
      
      // Валідація обов'язкових полів
      if (!parameterData.parameter_name || parameterData.parameter_name.trim() === '') {
        throw new Error('Назва параметру є обов\'язковою');
      }
      
      if (!parameterData.xml_path || parameterData.xml_path.trim() === '') {
        throw new Error('XML-шлях є обов\'язковим');
      }
      
      // Автоматично визначаємо категорію якщо вона не вказана
      if (!parameterData.parameter_category && parameterData.xml_path) {
        parameterData.parameter_category = getCategoryFromXmlPath(parameterData.xml_path);
      }
      
      // Встановлюємо значення за замовчуванням
      const dataToInsert = {
        template_id: templateId,
        parameter_name: parameterData.parameter_name.trim(),
        parameter_value: parameterData.parameter_value || null,
        xml_path: parameterData.xml_path.trim(),
        parameter_type: parameterData.parameter_type || 'text',
        parameter_category: parameterData.parameter_category || 'parameter',
        is_active: parameterData.is_active !== false,
        is_required: parameterData.is_required === true,
        display_order: parameterData.display_order || 0
      };
      
      console.log('Дані для вставки:', dataToInsert);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Помилка створення параметру:', error);
        throw error;
      }

      console.log('Параметр створено успішно:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Параметр створено успішно:', data);
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр створено успішно",
      });
    },
    onError: (error: any) => {
      console.error('Помилка створення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('Оновлення параметру:', id, updates);
      
      // Валідація
      if (updates.parameter_name !== undefined && (!updates.parameter_name || updates.parameter_name.trim() === '')) {
        throw new Error('Назва параметру не може бути порожньою');
      }
      
      // Автоматично визначаємо категорію якщо оновлюється xml_path
      if (updates.xml_path && !updates.parameter_category) {
        updates.parameter_category = getCategoryFromXmlPath(updates.xml_path);
      }
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Помилка оновлення параметру:', error);
        throw error;
      }

      console.log('Параметр оновлено успішно:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр оновлено успішно",
      });
    },
    onError: (error: any) => {
      console.error('Помилка оновлення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParametersOrderMutation = useMutation({
    mutationFn: async (parametersWithOrder: { id: string; display_order: number }[]) => {
      console.log('Оновлення порядку параметрів:', parametersWithOrder);
      
      // Оновлюємо кожен параметр окремо
      const updatePromises = parametersWithOrder.map(param => 
        supabase
          .from('template_xml_parameters')
          .update({ display_order: param.display_order })
          .eq('id', param.id)
      );

      const results = await Promise.all(updatePromises);
      
      // Перевіряємо чи всі оновлення пройшли успішно
      for (const result of results) {
        if (result.error) {
          console.error('Помилка оновлення порядку параметру:', result.error);
          throw result.error;
        }
      }
      
      console.log('Порядок параметрів оновлено успішно');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
    },
    onError: (error: any) => {
      console.error('Помилка оновлення порядку:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити порядок параметрів",
        variant: "destructive",
      });
    },
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (parameterId: string) => {
      console.log('Видалення параметру:', parameterId);
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) {
        console.error('Помилка видалення параметру:', error);
        throw error;
      }
      
      console.log('Параметр видалено успішно');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр видалено успішно",
      });
    },
    onError: (error: any) => {
      console.error('Помилка видалення параметру:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити параметр",
        variant: "destructive",
      });
    },
  });

  return {
    parameters,
    isLoading,
    error,
    createParameter: createParameterMutation.mutate,
    updateParameter: updateParameterMutation.mutate,
    updateParametersOrder: updateParametersOrderMutation.mutate,
    deleteParameter: deleteParameterMutation.mutate,
    isCreating: createParameterMutation.isPending,
    isUpdating: updateParameterMutation.isPending,
    isDeleting: deleteParameterMutation.isPending,
  };
};
