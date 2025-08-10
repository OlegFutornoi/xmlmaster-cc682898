
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Функція для автоматичного визначення категорії на основі XML-шляху
const getCategoryFromXmlPath = (xmlPath: string): string => {
  if (xmlPath.includes('/currencies/') || xmlPath.includes('/currency')) {
    return 'currency';
  }
  if (xmlPath.includes('/categories/') || xmlPath.includes('/category')) {
    return 'category';
  }
  if (xmlPath.includes('/offers/') || xmlPath.includes('/offer')) {
    return 'offer';
  }
  if (xmlPath.includes('/param') || xmlPath.includes('characteristic')) {
    return 'characteristic';
  }
  return 'parameter';
};

export const useXMLTemplateParameters = (templateId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['template-xml-parameters', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId)
        .order('display_order', { ascending: true })
        .order('parameter_category', { ascending: true })
        .order('parameter_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!templateId,
  });

  const createParameterMutation = useMutation({
    mutationFn: async (parameterData: any) => {
      // Автоматично визначаємо категорію якщо вона не вказана
      if (!parameterData.parameter_category && parameterData.xml_path) {
        parameterData.parameter_category = getCategoryFromXmlPath(parameterData.xml_path);
      }
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .insert([parameterData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр створено успішно",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити параметр",
        variant: "destructive",
      });
    },
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      // Автоматично визначаємо категорію якщо оновлюється xml_path
      if (updates.xml_path && !updates.parameter_category) {
        updates.parameter_category = getCategoryFromXmlPath(updates.xml_path);
      }
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр оновлено успішно",
      });
    },
    onError: (error: any) => {
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
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .upsert(
          parametersWithOrder.map(p => ({
            id: p.id,
            display_order: p.display_order
          })),
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Error updating parameters order:', error);
        throw error;
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
      const { error } = await supabase
        .from('template_xml_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-xml-parameters', templateId] });
      toast({
        title: "Успіх",
        description: "Параметр видалено успішно",
      });
    },
    onError: (error: any) => {
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
