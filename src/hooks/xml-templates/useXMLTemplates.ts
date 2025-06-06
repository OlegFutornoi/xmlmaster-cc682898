
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XMLTemplate } from '@/types/xml-template';
import { toast } from '@/hooks/use-toast';

interface CreateTemplateData {
  name: string;
  structure: Record<string, any>;
  is_active: boolean;
}

export const useXMLTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ['xml-templates'],
    queryFn: async () => {
      console.log('Завантаження XML-шаблонів...');
      
      const { data, error } = await supabase
        .from('template_xml')
        .select(`
          *,
          template_xml_parameters (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка завантаження шаблонів:', error);
        throw error;
      }

      console.log('XML-шаблони завантажено:', data);
      return data as XMLTemplate[];
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      console.log('Створення XML-шаблону:', templateData);
      
      const { data, error } = await supabase
        .from('template_xml')
        .insert(templateData)
        .select()
        .single();

      if (error) {
        console.error('Помилка створення шаблону:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно створено',
        duration: 1000
      });
    },
    onError: (error) => {
      console.error('Помилка створення шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити XML-шаблон',
        variant: 'destructive',
        duration: 1000
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
    mutationFn: async (template: XMLTemplate) => {
      console.log('Дублювання XML-шаблону:', template.id);
      
      const duplicatedTemplate: CreateTemplateData = {
        name: `${template.name} (копія)`,
        structure: template.structure,
        is_active: template.is_active
      };

      const { data, error } = await supabase
        .from('template_xml')
        .insert(duplicatedTemplate)
        .select()
        .single();

      if (error) {
        console.error('Помилка дублювання шаблону:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xml-templates'] });
      toast({
        title: 'Успіх',
        description: 'XML-шаблон успішно продубльовано',
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
    duplicateTemplate: duplicateTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending
  };
};
