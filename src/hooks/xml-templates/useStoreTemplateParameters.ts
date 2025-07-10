
// Хук для роботи з параметрами шаблону конкретного магазину
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useToast } from '@/hooks/use-toast';

export interface StoreTemplateParameter {
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

export const useStoreTemplateParameters = (storeId: string) => {
  const [parameters, setParameters] = useState<StoreTemplateParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchParameters = async () => {
    if (!storeId) return;
    
    try {
      const { data, error } = await extendedSupabase
        .from('store_template_parameters')
        .select('*')
        .eq('store_id', storeId)
        .order('parameter_name');

      if (error) {
        console.error('Error fetching parameters:', error);
        return;
      }

      setParameters(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveParameter = async (parameter: Partial<StoreTemplateParameter>) => {
    setIsSaving(true);
    try {
      if (parameter.id) {
        // Оновлення існуючого параметра
        const { error } = await extendedSupabase
          .from('store_template_parameters')
          .update({
            parameter_value: parameter.parameter_value,
            is_active: parameter.is_active
          })
          .eq('id', parameter.id);

        if (error) throw error;
      } else {
        // Створення нового параметра
        const { error } = await extendedSupabase
          .from('store_template_parameters')
          .insert(parameter);

        if (error) throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Параметр збережено'
      });
      
      fetchParameters();
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти параметр',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteParameter = async (parameterId: string) => {
    try {
      const { error } = await extendedSupabase
        .from('store_template_parameters')
        .delete()
        .eq('id', parameterId);

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Параметр видалено'
      });
      
      fetchParameters();
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити параметр',
        variant: 'destructive'
      });
    }
  };

  const copyTemplateParameters = async (templateId: string, storeId: string) => {
    try {
      // Отримуємо параметри шаблону
      const { data: templateParams, error } = await extendedSupabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;

      // Копіюємо параметри в магазин
      const storeParams = templateParams?.map(param => ({
        store_id: storeId,
        template_id: templateId,
        parameter_name: param.parameter_name,
        parameter_value: param.parameter_value,
        xml_path: param.xml_path,
        parameter_type: param.parameter_type,
        parameter_category: param.parameter_category,
        is_active: param.is_active,
        is_required: param.is_required
      })) || [];

      if (storeParams.length > 0) {
        const { error: insertError } = await extendedSupabase
          .from('store_template_parameters')
          .insert(storeParams);

        if (insertError) throw insertError;
      }

      fetchParameters();
    } catch (error) {
      console.error('Error copying template parameters:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [storeId]);

  return {
    parameters,
    isLoading,
    isSaving,
    saveParameter,
    deleteParameter,
    copyTemplateParameters,
    refetchParameters: fetchParameters
  };
};
