
// Компонент для створення та редагування тарифних планів
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Info, Settings, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Імпорт нових компонентів
import TariffDetailsForm from '@/components/admin/tariff-plan/TariffDetailsForm';
import TariffLimitations from '@/components/admin/tariff-plan/TariffLimitations';
import TariffItems from '@/components/admin/tariff-plan/TariffItems';
import LimitationTypeButton from '@/components/admin/tariff-plan/LimitationTypeButton';

// Схема валідації форми
const tariffFormSchema = z.object({
  name: z.string().min(1, { message: 'Назва тарифного плану обов\'язкова' }),
  price: z.number().min(0, { message: 'Ціна повинна бути не меншою за 0' }),
  currency_id: z.string().min(1, { message: 'Виберіть валюту' }),
  is_permanent: z.boolean(),
  duration_days: z.number().nullable().optional(),
});

const TariffPlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof tariffFormSchema>>({
    resolver: zodResolver(tariffFormSchema),
    defaultValues: {
      name: '',
      price: 0,
      currency_id: '',
      is_permanent: false,
      duration_days: null,
    },
  });

  // Завантажуємо валюти при відкритті сторінки
  useEffect(() => {
    fetchCurrencies();
    
    if (id) {
      fetchTariffPlan();
    }
  }, [id]);

  const fetchCurrencies = async () => {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (error) {
      console.error('Error fetching currencies:', error);
      return;
    }
    
    setCurrencies(data || []);
  };

  const fetchTariffPlan = async () => {
    const { data, error } = await supabase
      .from('tariff_plans')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching tariff plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити тарифний план',
        variant: 'destructive',
      });
      return;
    }
    
    form.reset({
      name: data.name,
      price: data.price,
      currency_id: data.currency_id,
      is_permanent: data.is_permanent,
      duration_days: data.duration_days,
    });
  };

  const onSubmit = async (values: z.infer<typeof tariffFormSchema>) => {
    setIsSubmitting(true);
    
    try {
      if (id) {
        // Оновлення існуючого тарифу
        const { error } = await supabase
          .from('tariff_plans')
          .update({
            name: values.name,
            price: values.price,
            currency_id: values.currency_id,
            is_permanent: values.is_permanent,
            duration_days: values.is_permanent ? null : values.duration_days,
          })
          .eq('id', id);
          
        if (error) throw error;
        
        toast({
          title: 'Успішно',
          description: 'Тарифний план оновлено',
        });
      } else {
        // Створення нового тарифу
        const { error } = await supabase.from('tariff_plans').insert({
          name: values.name,
          price: values.price,
          currency_id: values.currency_id,
          is_permanent: values.is_permanent,
          duration_days: values.is_permanent ? null : values.duration_days,
        });
        
        if (error) throw error;
        
        toast({
          title: 'Успішно',
          description: 'Тарифний план створено',
        });
        
        navigate('/admin/dashboard/tariffs');
      }
    } catch (error) {
      console.error('Error saving tariff plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {id ? 'Редагування тарифного плану' : 'Новий тарифний план'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <Form {...form}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Керування тарифним планом
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full" orientation="vertical">
                  <TabsList className="flex flex-col items-stretch w-full h-auto space-y-2">
                    <TabsTrigger value="details" className="flex justify-start">
                      <Info className="h-4 w-4 mr-2" />
                      Основна інформація
                    </TabsTrigger>
                    
                    <TabsTrigger value="items" className="flex justify-start" disabled={!id}>
                      <ListChecks className="h-4 w-4 mr-2" />
                      Функції
                    </TabsTrigger>
                    
                    <TabsTrigger value="limitations" className="flex justify-start" disabled={!id}>
                      <Settings className="h-4 w-4 mr-2" />
                      Обмеження
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
              <CardFooter>
                <div className="flex items-center space-x-4 justify-between w-full">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate('/admin/dashboard/tariffs')}
                  >
                    Назад
                  </Button>
                  {!id && (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Збереження...' : 'Зберегти'}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </Form>
        </div>
        <div className="md:col-span-9">
          <Form {...form}>
            <Tabs defaultValue="details" className="w-full">
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Основна інформація про тарифний план
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TariffDetailsForm form={form} currencies={currencies} />
                  </CardContent>
                  {id && (
                    <CardFooter>
                      <Button
                        type="button"
                        className="ml-auto"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex justify-between items-center">
                      <span>Функції тарифного плану</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {id && <TariffItems tariffPlanId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="limitations">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex justify-between items-center">
                      <span>Обмеження тарифного плану</span>
                      <div className="flex items-center space-x-2">
                        <LimitationTypeButton 
                          onLimitationTypeAdded={() => {
                            // Можемо тут оновити список типів обмежень, якщо потрібно
                          }} 
                        />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {id && <TariffLimitations tariffPlanId={id} />}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default TariffPlanForm;
