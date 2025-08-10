import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpdateParameterData {
  id?: string;
  parameter_value: string | null;
  parameter_name?: string;
  parameter_type?: string;
  parameter_category?: 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency';
  xml_path?: string;
  is_active?: boolean;
  is_required?: boolean;
  store_id?: string;
  template_id?: string;
  display_order?: number;
}

export interface UpdateStoreData {
  name?: string;
  shop_name?: string;
  shop_company?: string;
  shop_url?: string;
}

// Функція для автоматичного визначення категорії на основі XML-шляху
const getCategoryFromXmlPath = (xmlPath: string): 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency' => {
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

// Функція для правильного сортування параметрів згідно з ієрархією XML
const sortParametersByXMLHierarchy = (params: any[]) => {
  const hierarchyOrder = {
    // Основна інформація магазину (shop level)
    'parameter': {
      'name': 1,
      'shop_name': 2,
      'company': 3,
      'shop_company': 4,
      'url': 5,
      'shop_url': 6,
    },
    // Валюти (currencies level)
    'currency': {
      'currency': 10,
      'currencyId': 11,
      'currency_id': 12,
      'currency_code': 13,
      'rate': 14,
    },
    // Категорії (categories level)
    'category': {
      'category': 20,
      'categoryId': 21,
      'category_id': 22,
      'category_name': 23,
      'external_id': 24,
      'rz_id': 25,
    },
    // Товари (offers level)
    'offer': {
      'offer': 30,
      'offer_id': 31,
      'available': 32,
      'price': 33,
      'price_old': 34,
      'price_promo': 35,
      'currencyId': 36,
      'categoryId': 37,
      'picture': 38,
      'vendor': 39,
      'name': 40,
      'description': 41,
      'stock_quantity': 42,
      'url': 43,
    },
    // Характеристики товарів (offer params level)
    'characteristic': {
      'param': 50,
    }
  };

  return params.sort((a, b) => {
    const categoryA = a.parameter_category || 'parameter';
    const categoryB = b.parameter_category || 'parameter';
    
    const orderA = hierarchyOrder[categoryA as keyof typeof hierarchyOrder]?.[a.parameter_name as keyof any] || 999;
    const orderB = hierarchyOrder[categoryB as keyof typeof hierarchyOrder]?.[b.parameter_name as keyof any] || 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Якщо порядок однаковий, сортуємо по display_order, потім по назві
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    
    return a.parameter_name.localeCompare(b.parameter_name);
  });
};

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
        .eq('template_id', templateId);

      if (error) {
        console.error('Error fetching store template parameters:', error);
        throw error;
      }

      console.log('Fetched store template parameters:', data);
      
      // Приводимо типи до правильного формату та сортуємо
      const typedData = (data || []).map(item => ({
        ...item,
        parameter_category: item.parameter_category as 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency'
      }));
      
      return sortParametersByXMLHierarchy(typedData);
    },
    staleTime: 5 * 60 * 1000, // 5 хвилин
    enabled: !!storeId && !!templateId,
  });

  // Отримання даних магазину
  const { data: storeData, refetch: refetchStore } = useQuery({
    queryKey: ['user-store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) {
        console.error('Error fetching store:', error);
        throw error;
      }

      return data;
    },
    enabled: !!storeId,
  });

  // Мутація для оновлення основної інформації магазину
  const updateStoreInfoMutation = useMutation({
    mutationFn: async (data: UpdateStoreData & { id: string }) => {
      console.log('Updating store info:', data);
      
      const { error } = await supabase
        .from('user_stores')
        .update({
          name: data.name,
        })
        .eq('id', data.id);

      if (error) {
        console.error('Error updating store:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-store', storeId] 
      });
      toast({
        title: "Успіх",
        description: "Інформацію про магазин оновлено",
      });
    },
    onError: (error: any) => {
      console.error('Update store error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити інформацію магазину",
        variant: "destructive",
      });
    },
  });

  const saveParameterMutation = useMutation({
    mutationFn: async (data: UpdateParameterData) => {
      console.log('Saving parameter:', data);
      
      // Автоматично визначаємо категорію якщо вона не вказана
      if (!data.parameter_category && data.xml_path) {
        data.parameter_category = getCategoryFromXmlPath(data.xml_path);
      }
      
      if (data.id) {
        // Обновляем существующий параметр
        const { error } = await supabase
          .from('store_template_parameters')
          .update({
            parameter_value: data.parameter_value,
            parameter_name: data.parameter_name,
            parameter_type: data.parameter_type,
            parameter_category: data.parameter_category,
            xml_path: data.xml_path,
            is_active: data.is_active,
            is_required: data.is_required,
            display_order: data.display_order
          })
          .eq('id', data.id);

        if (error) {
          console.error('Error updating parameter:', error);
          throw error;
        }
      } else {
        // Создаем новый параметр
        const { error } = await supabase
          .from('store_template_parameters')
          .insert({
            store_id: data.store_id!,
            template_id: data.template_id!,
            parameter_name: data.parameter_name!,
            parameter_value: data.parameter_value,
            parameter_type: data.parameter_type!,
            parameter_category: data.parameter_category!,
            xml_path: data.xml_path!,
            is_active: data.is_active!,
            is_required: data.is_required!,
            display_order: data.display_order || 0
          });

        if (error) {
          console.error('Error creating parameter:', error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['store-template-parameters', storeId, templateId] 
      });
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

  const updateParametersOrderMutation = useMutation({
    mutationFn: async (parametersWithOrder: { id: string; display_order: number }[]) => {
      console.log('Updating parameters order:', parametersWithOrder);
      
      // Оновлюємо кожен параметр окремо
      const updatePromises = parametersWithOrder.map(param => 
        supabase
          .from('store_template_parameters')
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
      queryClient.invalidateQueries({ 
        queryKey: ['store-template-parameters', storeId, templateId] 
      });
      toast({
        title: "Успіх",
        description: "Порядок параметрів оновлено",
      });
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

      // Підготовка даних для вставки з автоматичним призначенням категорій
      const storeParams = uniqueParamsArray.map((param, index) => ({
        store_id: storeId,
        template_id: templateId,
        parameter_name: param.parameter_name,
        parameter_type: param.parameter_type,
        parameter_category: getCategoryFromXmlPath(param.xml_path),
        xml_path: param.xml_path,
        parameter_value: param.parameter_value,
        is_required: param.is_required,
        is_active: param.is_active,
        display_order: index
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
    storeData,
    isLoading,
    error,
    saveParameter: saveParameterMutation.mutate,
    updateStoreInfo: updateStoreInfoMutation.mutate,
    deleteParameter: deleteParameterMutation.mutate,
    updateParametersOrder: updateParametersOrderMutation.mutate,
    copyTemplateParameters: (templateId: string, storeId: string) => 
      copyParametersMutation.mutateAsync({ templateId, storeId }),
    refetchParameters,
    refetchStore,
    isSaving: saveParameterMutation.isPending || updateStoreInfoMutation.isPending,
  };
};
