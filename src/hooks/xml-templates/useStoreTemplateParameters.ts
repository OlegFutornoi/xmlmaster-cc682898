
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpdateParameterData {
  id: string;
  parameter_value: string | null;
}

export const useStoreTemplateParameters = (storeId: string, templateId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: parameters = [], isLoading, error, refetch: refetchParameters } = useQuery({
    queryKey: ['store-template-parameters', storeId, templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      console.log('Fetching store template parameters for store:', storeId, 'template:', templateId);
      
      const { data, error } = await supabase
        .from('store_template_parameters')
        .select('*')
        .eq('store_id', storeId)
        .eq('template_id', templateId)
        .order('parameter_category', { ascending: true })
        .order('parameter_name', { ascending: true });

      if (error) {
        console.error('Error fetching store template parameters:', error);
        throw error;
      }

      console.log('Fetched store template parameters:', data);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 хвилин
    enabled: !!storeId && !!templateId,
  });

  const updateParameterMutation = useMutation({
    mutationFn: async (data: UpdateParameterData) => {
      console.log('Updating parameter:', data);
      
      const { error } = await supabase
        .from('store_template_parameters')
        .update({ parameter_value: data.parameter_value })
        .eq('id', data.id);

      if (error) {
        console.error('Error updating parameter:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['store-template-parameters', storeId, templateId], (oldData: any[]) => {
        return oldData;
      });
      toast({
        title: "Успіх",
        description: "Параметр успішно оновлено",
      });
    },
    onError: (error: any) => {
      console.error('Update parameter error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити параметр",
        variant: "destructive",
      });
    },
  });

  const saveParameterMutation = useMutation({
    mutationFn: async (data: UpdateParameterData) => {
      console.log('Saving parameter:', data);
      
      const { error } = await supabase
        .from('store_template_parameters')
        .update({ parameter_value: data.parameter_value })
        .eq('id', data.id);

      if (error) {
        console.error('Error saving parameter:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Параметр успішно збережено",
      });
    },
    onError: (error: any) => {
      console.error('Save parameter error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти параметр",
        variant: "destructive",
      });
    },
  });

  const deleteParameterMutation = useMutation({
    mutationFn: async (parameterId: string) => {
      console.log('Deleting parameter:', parameterId);
      
      const { error } = await supabase
        .from('store_template_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) {
        console.error('Error deleting parameter:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['store-template-parameters', storeId, templateId] 
      });
      toast({
        title: "Успіх",
        description: "Параметр успішно видалено",
      });
    },
    onError: (error: any) => {
      console.error('Delete parameter error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити параметр",
        variant: "destructive",
      });
    },
  });

  const copyParametersMutation = useMutation({
    mutationFn: async ({ templateId, storeId }: { templateId: string; storeId: string }) => {
      console.log('Copying template parameters for template:', templateId, 'to store:', storeId);
      
      // Отримуємо параметри шаблону
      const { data: templateParams, error: fetchError } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching template parameters:', fetchError);
        throw fetchError;
      }

      if (!templateParams || templateParams.length === 0) {
        console.log('No template parameters found for template:', templateId);
        return;
      }

      console.log('Found template parameters:', templateParams);

      // Групуємо параметри по parameter_name та xml_path для уникнення дублікатів
      const uniqueParams = templateParams.reduce((acc, param) => {
        const key = `${param.parameter_name}_${param.xml_path}`;
        if (!acc[key]) {
          acc[key] = param;
        }
        return acc;
      }, {} as Record<string, any>);

      const uniqueParamsArray = Object.values(uniqueParams);
      console.log('Unique parameters to copy:', uniqueParamsArray);

      // Підготовка даних для вставки
      const storeParams = uniqueParamsArray.map(param => ({
        store_id: storeId,
        template_id: templateId,
        parameter_name: param.parameter_name,
        parameter_type: param.parameter_type,
        parameter_category: param.parameter_category,
        xml_path: param.xml_path,
        parameter_value: param.parameter_value,
        is_required: param.is_required,
        is_active: param.is_active,
      }));

      console.log('Prepared store parameters for insertion:', storeParams);

      // Вставка параметрів для магазину
      const { data: insertedData, error: insertError } = await supabase
        .from('store_template_parameters')
        .insert(storeParams)
        .select();

      if (insertError) {
        console.error('Error inserting store parameters:', insertError);
        throw insertError;
      }

      console.log('Successfully copied template parameters to store:', insertedData);
      return insertedData;
    },
    onSuccess: (data) => {
      console.log('Parameters copied successfully:', data);
      queryClient.invalidateQueries({ 
        queryKey: ['store-template-parameters', storeId, templateId] 
      });
      toast({
        title: "Успіх",
        description: `Параметри шаблону успішно скопійовано (${data?.length || 0} параметрів)`,
      });
    },
    onError: (error: any) => {
      console.error('Copy parameters error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скопіювати параметри шаблону",
        variant: "destructive",
      });
    },
  });

  return {
    parameters,
    isLoading,
    error,
    updateParameter: updateParameterMutation.mutate,
    saveParameter: saveParameterMutation.mutate,
    deleteParameter: deleteParameterMutation.mutate,
    copyTemplateParameters: (templateId: string, storeId: string) => 
      copyParametersMutation.mutateAsync({ templateId, storeId }),
    refetchParameters,
    isUpdating: updateParameterMutation.isPending,
    isSaving: saveParameterMutation.isPending,
  };
};
