
// Хук для роботи з XML-шаблонами в кабінеті користувача
import { useState, useEffect } from 'react';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { XMLTemplate } from '@/types/xml-template';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export const useUserXMLTemplates = () => {
  const { toast } = useToast();

  const { 
    data: templates, 
    isLoading, 
    error,
    refetch: refetchTemplates 
  } = useQuery({
    queryKey: ['xmlTemplates'],
    queryFn: async () => {
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
        throw error;
      }

      return data || [];
    },
    // Збільшуємо staleTime для шаблонів
    staleTime: 15 * 60 * 1000, // 15 хвилин
    // Вимикаємо автоматичний рефетч
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити шаблони',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  return {
    templates: templates || [],
    isLoading,
    refetchTemplates
  };
};
