
// Хук для роботи з XML-шаблонами в кабінеті користувача
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { XMLTemplate } from '@/types/xml-template';
import { useToast } from '@/hooks/use-toast';

export const useUserXMLTemplates = () => {
  const [templates, setTemplates] = useState<XMLTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      const { data, error } = await extendedSupabase
        .from('template_xml')
        .select(`
          *,
          parameters:template_xml_parameters(*),
          currencies:template_currencies(*),
          categories:template_categories(*),
          images:template_images(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити шаблони',
          variant: 'destructive'
        });
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити шаблони',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    isLoading,
    refetchTemplates: fetchTemplates
  };
};
