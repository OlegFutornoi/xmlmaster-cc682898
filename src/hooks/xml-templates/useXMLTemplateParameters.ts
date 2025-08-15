
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { XMLTemplateParameter } from '@/types/xml-template';

// Функція для автоматичного визначення категорії на основі XML-шляху
const getCategoryFromXmlPath = (xmlPath: string): 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency' => {
  if (xmlPath.includes('/currencies/') || xmlPath.includes('/currency') || xmlPath.includes('currency_')) {
    return 'currency';
  }
  if (xmlPath.includes('/categories/') || xmlPath.includes('/category') || xmlPath.includes('category_')) {
    return 'category';
  }
  if (xmlPath.includes('/offers/') || xmlPath.includes('/offer') || xmlPath.includes('offer_')) {
    return 'offer';
  }
  if (xmlPath.includes('/param') || xmlPath.includes('param_') || xmlPath.includes('characteristic')) {
    return 'characteristic';
  }
  return 'parameter';
};

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
    
    const orderA = categoryOrder[categoryA as keyof typeof categoryOrder];
    const orderB = categoryOrder[categoryB as keyof typeof categoryOrder];
    
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

  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['template-xml-parameters', templateId],
    queryFn: async (): Promise<XMLTemplateParameter[]> => {
      if (!templateId) return [];
      
      console.log('Fetching template parameters for:', templateId);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) {
        console.error('Error fetching template parameters:', error);
        throw error;
      }
      
      console.log('Raw template parameters:', data);
      
      // ПриводимоTypesScript типи до правильного формату
      const typedData = (data || []).map(item => ({
        ...item,
        parameter_category: item.parameter_category as 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency'
      }));
      
      // Застосовуємо правильне сортування
      const sortedData = sortParametersByXMLHierarchy(typedData);
      console.log('Sorted template parameters:', sortedData);
      
      return sortedData;
    },
    enabled: !!templateId,
  });

  const createParameterMutation = useMutation({
    mutationFn: async (parameterData: any) => {
      console.log('Creating parameter:', parameterData);
      
      // Автоматично визначаємо категорію якщо вона не вказана
      if (!parameterData.parameter_category && parameterData.xml_path) {
        parameterData.parameter_category = getCategoryFromXmlPath(parameterData.xml_path);
      }
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .insert([parameterData]);

      if (error) {
        console.error('Error creating parameter:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр створено успішно",
      });
    },
    onError: (error: any) => {
      console.error('Create parameter error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('Updating parameter:', id, updates);
      
      // Автоматично визначаємо категорію якщо оновлюється xml_path
      if (updates.xml_path && !updates.parameter_category) {
        updates.parameter_category = getCategoryFromXmlPath(updates.xml_path);
      }
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating parameter:', error);
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
      console.error('Update parameter error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParametersOrderMutation = useMutation({
    mutationFn: async (parametersWithOrder: { id: string; display_order: number }[]) => {
      console.log('Updating parameters order:', parametersWithOrder);
      
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
          console.error('Error updating parameter order:', result.error);
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
    },
    onError: (error: any) => {
      console.error('Update order error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити порядок параметрів",
        variant: "destructive",
      });
    },
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (parameterId: string) => {
      console.log('Deleting parameter:', parameterId);
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) {
        console.error('Error deleting parameter:', error);
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
      console.error('Delete parameter error:', error);
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
