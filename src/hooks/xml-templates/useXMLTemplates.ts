
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XMLTemplate } from '@/types/xml-template';
import { toast } from '@/hooks/use-toast';

interface CreateTemplateData {
  name: string;
  structure: Record<string, any>;
  is_active: boolean;
  shop_name?: string;
  shop_company?: string;
  shop_url?: string;
  parameters?: any[];
}

export const useXMLTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['xml-templates'],
    queryFn: async () => {
      console.log('Завантаження XML-шаблонів з розширеними даними...');
      
      const { data, error } = await supabase
        .from('template_xml')
        .select(`
          *,
          template_xml_parameters (*),
          template_currencies (*),
          template_categories (*),
          template_images (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка завантаження шаблонів:', error);
        throw error;
      }

      console.log('XML-шаблони завантажено з розширеними даними:', data);
      return data as XMLTemplate[];
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      console.log('Створення XML-шаблону з розширеними даними:', templateData);
      
      // Створюємо основний шаблон
      const { data: template, error: templateError } = await supabase
        .from('template_xml')
        .insert({
          name: templateData.name,
          structure: templateData.structure,
          is_active: templateData.is_active,
          shop_name: templateData.shop_name,
          shop_company: templateData.shop_company,
          shop_url: templateData.shop_url
        })
        .select()
        .single();

      if (templateError) {
        console.error('Помилка створення шаблону:', templateError);
        throw templateError;
      }

      // Створюємо параметри шаблону
      if (templateData.parameters && templateData.parameters.length > 0) {
        const parametersToInsert = templateData.parameters.map(param => ({
          template_id: template.id,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type,
          parameter_category: param.parameter_category,
          is_active: param.is_active,
          is_required: param.is_required
        }));

        const { error: paramsError } = await supabase
          .from('template_xml_parameters')
          .insert(parametersToInsert);

        if (paramsError) {
          console.error('Помилка створення параметрів шаблону:', paramsError);
          // Видаляємо створений шаблон у разі помилки
          await supabase.from('template_xml').delete().eq('id', template.id);
          throw paramsError;
        }
      }

      // Створюємо валюти шаблону (якщо є в структурі)
      if (templateData.structure?.currencies) {
        const currenciesToInsert = templateData.structure.currencies.map((currency: any) => ({
          template_id: template.id,
          currency_code: currency.id,
          rate: currency.rate
        }));

        const { error: currenciesError } = await supabase
          .from('template_currencies')
          .insert(currenciesToInsert);

        if (currenciesError) {
          console.error('Помилка створення валют шаблону:', currenciesError);
        }
      }

      // Створюємо категорії шаблону (якщо є в структурі)
      if (templateData.structure?.categories) {
        const categoriesToInsert = templateData.structure.categories.map((category: any) => ({
          template_id: template.id,
          category_name: category.name,
          external_id: category.id,
          rz_id: category.rz_id
        }));

        const { error: categoriesError } = await supabase
          .from('template_categories')
          .insert(categoriesToInsert);

        if (categoriesError) {
          console.error('Помилка створення категорій шаблону:', categoriesError);
        }
      }

      // Створюємо налаштування зображень шаблону
      const { error: imagesError } = await supabase
        .from('template_images')
        .insert({
          template_id: template.id,
          image_field_name: 'picture',
          is_multiple: true,
          max_count: 15
        });

      if (imagesError) {
        console.error('Помилка створення налаштувань зображень:', imagesError);
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно створено з розширеною структурою',
        duration: 3000
      });
    },
    onError: (error) => {
      console.error('Помилка створення шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити XML-шаблон',
        variant: 'destructive',
        duration: 3000
      });
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<XMLTemplate> }) => {
      console.log('Оновлення XML-шаблону:', id, updates);
      
      const { data, error } = await supabase
        .from('template_xml')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Помилка оновлення шаблону:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно оновлено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка оновлення шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити XML-шаблон',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Видалення XML-шаблону:', id);
      
      const { error } = await supabase
        .from('template_xml')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Помилка видалення шаблону:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно видалено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка видалення шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити XML-шаблон',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      console.log('Дублювання XML-шаблону:', templateId);
      
      // Спочатку отримуємо повні дані шаблону
      const { data: template, error: fetchError } = await supabase
        .from('template_xml')
        .select(`
          *,
          template_xml_parameters (*),
          template_currencies (*),
          template_categories (*),
          template_images (*)
        `)
        .eq('id', templateId)
        .single();

      if (fetchError || !template) {
        console.error('Помилка отримання шаблону для копіювання:', fetchError);
        throw fetchError || new Error('Шаблон не знайдено');
      }

      // Створюємо новий шаблон
      const { data: newTemplate, error: templateError } = await supabase
        .from('template_xml')
        .insert({
          name: `${template.name} (копія)`,
          structure: template.structure,
          is_active: template.is_active,
          shop_name: template.shop_name,
          shop_company: template.shop_company,
          shop_url: template.shop_url
        })
        .select()
        .single();

      if (templateError) {
        console.error('Помилка дублювання шаблону:', templateError);
        throw templateError;
      }

      // Копіюємо параметри
      if (template.template_xml_parameters && template.template_xml_parameters.length > 0) {
        const parametersToInsert = template.template_xml_parameters.map((param: any) => ({
          template_id: newTemplate.id,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type,
          parameter_category: param.parameter_category,
          is_active: param.is_active,
          is_required: param.is_required
        }));

        const { error: paramsError } = await supabase
          .from('template_xml_parameters')
          .insert(parametersToInsert);

        if (paramsError) {
          console.error('Помилка копіювання параметрів:', paramsError);
        }
      }

      // Копіюємо валюти
      if (template.template_currencies && template.template_currencies.length > 0) {
        const currenciesToInsert = template.template_currencies.map((currency: any) => ({
          template_id: newTemplate.id,
          currency_code: currency.currency_code,
          rate: currency.rate
        }));

        const { error: currenciesError } = await supabase
          .from('template_currencies')
          .insert(currenciesToInsert);

        if (currenciesError) {
          console.error('Помилка копіювання валют:', currenciesError);
        }
      }

      // Копіюємо категорії
      if (template.template_categories && template.template_categories.length > 0) {
        const categoriesToInsert = template.template_categories.map((category: any) => ({
          template_id: newTemplate.id,
          category_name: category.category_name,
          external_id: category.external_id,
          rz_id: category.rz_id
        }));

        const { error: categoriesError } = await supabase
          .from('template_categories')
          .insert(categoriesToInsert);

        if (categoriesError) {
          console.error('Помилка копіювання категорій:', categoriesError);
        }
      }

      // Копіюємо налаштування зображень
      if (template.template_images && template.template_images.length > 0) {
        const imagesToInsert = template.template_images.map((image: any) => ({
          template_id: newTemplate.id,
          image_field_name: image.image_field_name,
          is_multiple: image.is_multiple,
          max_count: image.max_count
        }));

        const { error: imagesError } = await supabase
          .from('template_images')
          .insert(imagesToInsert);

        if (imagesError) {
          console.error('Помилка копіювання налаштувань зображень:', imagesError);
        }
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно продубльовано з усіма даними',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка дублювання шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося продублювати XML-шаблон',
        variant: 'destructive',
        duration: 1000
      });
    }
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    duplicateTemplate: (template: XMLTemplate) => duplicateTemplateMutation.mutate(template.id),
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending
  };
};
