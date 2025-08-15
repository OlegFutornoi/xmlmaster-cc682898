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

// Покращена функція для правильного сортування параметрів згідно з ієрархією XML
const sortParametersByXMLHierarchy = (params: XMLTemplateParameter[]) => {
  // Детальна структура порядку згідно з XML файлом
  const hierarchyOrder = {
    // 1. Основна інформація магазину (shop level) - порядок 1-99
    'parameter': {
      'name': 1,           // <name>Назва магазину</name>
      'shop_name': 1,
      'company': 2,        // <company>Назва компанії</company>
      'shop_company': 2,
      'url': 3,            // <url>https://example.com</url>
      'shop_url': 3,
    },
    
    // 2. Валюти (currencies level) - порядок 100-199
    'currency': {
      'currency_id': 100,  // <currency id="UAH" rate="1"/>
      'currency_rate': 101,
      'currency': 102,
      'currencyId': 103,
      'currency_code': 104,
      'rate': 105,
      'id': 106,
    },
    
    // 3. Категорії (categories level) - порядок 200-299
    'category': {
      'category_id': 200,  // <category id="391">Назва категорії</category>
      'category_name': 201,
      'category': 202,
      'categoryId': 203,
      'external_id': 204,
      'rz_id': 205,
      'id': 206,
    },
    
    // 4. Товари (offers level) - порядок 300-999
    'offer': {
      'offer_id': 300,     // <offer id="1001" available="true">
      'offer': 301,
      'id': 302,
      'available': 303,    // <available>true</available>
      'price': 310,        // <price>Ціна товару</price>
      'price_old': 311,    // <price_old>Попередня ціна</price_old>
      'price_promo': 312,  // <price_promo>Акційна ціна</price_promo>
      'currencyid': 320,   // <currencyId>UAH</currencyId>
      'categoryid': 321,   // <categoryId>391</categoryId>
      'picture': 330,      // <picture>Посилання на фото</picture>
      'vendor': 340,       // <vendor>Виробник</vendor>
      'article': 345,      // <article>58265468</article>
      'stock_quantity': 350, // <stock_quantity>Кількість на складі</stock_quantity>
      'name': 360,         // <name>Назва товару</name>
      'name_ua': 361,      // <name_ua>Назва товару українською</name_ua>
      'description': 370,  // <description><![CDATA[Опис товару]]></description>
      'description_ua': 371, // <description_ua><![CDATA[Опис товару українською]]></description_ua>
      'url': 380,          // <url>Посилання на сайт</url>
    },
    
    // 5. Характеристики товарів (offer params level) - порядок від 1000
    'characteristic': {}  // Для характеристик використовуємо display_order
  };

  return params.sort((a, b) => {
    const categoryA = a.parameter_category || 'parameter';
    const categoryB = b.parameter_category || 'parameter';
    
    // Спочатку сортуємо по категоріях
    const categoryOrderA = ['parameter', 'currency', 'category', 'offer', 'characteristic'].indexOf(categoryA);
    const categoryOrderB = ['parameter', 'currency', 'category', 'offer', 'characteristic'].indexOf(categoryB);
    
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    
    // Потім по порядку в межах категорії
    if (categoryA === 'characteristic') {
      // Для характеристик використовуємо display_order
      const orderA = a.display_order || 1000;
      const orderB = b.display_order || 1000;
      return orderA - orderB;
    } else {
      // Для інших категорій використовуємо визначений порядок
      const orderA = hierarchyOrder[categoryA as keyof typeof hierarchyOrder]?.[a.parameter_name.toLowerCase() as keyof any] || 9999;
      const orderB = hierarchyOrder[categoryB as keyof typeof hierarchyOrder]?.[b.parameter_name.toLowerCase() as keyof any] || 9999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }
    
    // Якщо порядок однаковий, сортуємо по display_order, потім по назві
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    
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
      
      const { data, error } = await supabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;
      
      // Приводимо типи до правильного формату та застосовуємо правильне сортування
      const typedData = (data || []).map(item => ({
        ...item,
        parameter_category: item.parameter_category as 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency'
      }));
      
      return sortParametersByXMLHierarchy(typedData);
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
