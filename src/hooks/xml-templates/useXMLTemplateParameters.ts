
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XMLTemplateParameter } from '@/types/xml-template';
import { toast } from '@/hooks/use-toast';

interface CreateParameterData {
  template_id: string;
  parameter_name: string;
  parameter_value?: string;
  xml_path: string;
  parameter_type: string;
  is_active: boolean;
  is_required: boolean;
}

export const useXMLTemplateParameters = (templateId?: string) => {
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error } = useQuery({
    queryKey: ['xml-template-parameters', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      console.log('Завантаження параметрів XML-шаблону:', templateId);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Помилка завантаження параметрів:', error);
        throw error;
      }

      console.log('Параметри завантажено:', data);
      return data as XMLTemplateParameter[];
    },
    enabled: !!templateId
  });

  const createParameterMutation = useMutation({
    mutationFn: async (parameterData: CreateParameterData) => {
      console.log('Створення параметру:', parameterData);
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .insert(parameterData)
        .select()
        .single();

      if (error) {
        console.error('Помилка створення параметру:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-template-parameters', templateId] });
      toast({
        title: 'Успіх',
        description: 'Параметр успішно створено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка створення параметру:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити параметр',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<XMLTemplateParameter> }) => {
      console.log('Оновлення параметру:', id, updates);
      
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

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-template-parameters', templateId] });
      toast({
        title: 'Успіх',
        description: 'Параметр успішно оновлено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка оновлення параметру:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити параметр',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Видалення параметру:', id);
      
      const { error } = await supabase
        .from('template_xml_parameters')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Помилка видалення параметру:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-template-parameters', templateId] });
      toast({
        title: 'Успіх',
        description: 'Параметр успішно видалено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка видалення параметру:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити параметр',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  return {
    parameters,
    isLoading,
    error,
    createParameter: createParameterMutation.mutate,
    updateParameter: (id: string, updates: Partial<XMLTemplateParameter>) => {
      updateParameterMutation.mutate({ id, updates });
    },
    deleteParameter: deleteParameterMutation.mutate,
    isCreating: createParameterMutation.isPending,
    isUpdating: updateParameterMutation.isPending,
    isDeleting: deleteParameterMutation.isPending
  };
};
