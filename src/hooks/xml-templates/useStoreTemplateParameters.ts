
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
    if (!storeId) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Fetching parameters for store:', storeId);
      
      const { data, error } = await extendedSupabase
        .from('store_template_parameters')
        .select('*')
        .eq('store_id', storeId)
        .order('parameter_name');

      if (error) {
        console.error('Error fetching parameters:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити параметри',
          variant: 'destructive'
        });
        return;
      }

      console.log('Store parameters found:', data);
      setParameters(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити параметри',
        variant: 'destructive'
      });
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
            parameter_name: parameter.parameter_name,
            parameter_value: parameter.parameter_value,
            xml_path: parameter.xml_path,
            parameter_type: parameter.parameter_type,
            parameter_category: parameter.parameter_category,
            is_active: parameter.is_active,
            is_required: parameter.is_required
          })
          .eq('id', parameter.id);

        if (error) throw error;
      } else {
        // Створення нового параметра
        const { error } = await extendedSupabase
          .from('store_template_parameters')
          .insert({
            store_id: parameter.store_id!,
            template_id: parameter.template_id!,
            parameter_name: parameter.parameter_name!,
            parameter_value: parameter.parameter_value,
            xml_path: parameter.xml_path!,
            parameter_type: parameter.parameter_type!,
            parameter_category: parameter.parameter_category!,
            is_active: parameter.is_active!,
            is_required: parameter.is_required!
          });

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
      console.log('Copying template parameters from template:', templateId, 'to store:', storeId);
      
      // Спочатку видаляємо існуючі параметри магазину
      await extendedSupabase
        .from('store_template_parameters')
        .delete()
        .eq('store_id', storeId);

      // Отримуємо параметри шаблону
      const { data: templateParams, error } = await extendedSupabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) {
        console.error('Error fetching template parameters:', error);
        throw error;
      }

      console.log('Template parameters to copy:', templateParams);

      // Копіюємо параметри в магазин
      if (templateParams && templateParams.length > 0) {
        const storeParams = templateParams.map(param => ({
          store_id: storeId,
          template_id: templateId,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type,
          parameter_category: param.parameter_category,
          is_active: param.is_active,
          is_required: param.is_required
        }));

        const { error: insertError } = await extendedSupabase
          .from('store_template_parameters')
          .insert(storeParams);

        if (insertError) {
          console.error('Error inserting store parameters:', insertError);
          throw insertError;
        }

        console.log('Successfully copied', storeParams.length, 'parameters');
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
