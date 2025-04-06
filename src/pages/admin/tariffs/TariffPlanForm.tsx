
// Компонент для редагування та створення тарифних планів в адмін-панелі
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, Plus, Save, ArrowLeft, Info, Settings, Package, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  price: z.number(),
  currency_id: z.string(),
  duration_days: z.number().nullable(),
  is_permanent: z.boolean().default(false),
});

interface Limitation {
  id?: string;
  limitation_type_id: string;
  limitation_type: {
    id: string;
    name: string;
    description: string;
    is_numeric: boolean;
  };
  value: number;
}

interface LimitationType {
  id: string;
  name: string;
  description: string;
  is_numeric: boolean;
}

const TariffPlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [limitationTypes, setLimitationTypes] = useState<LimitationType[]>([]);
  const [limitations, setLimitations] = useState<Limitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // Додано стан для активної вкладки

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      currency_id: "",
      duration_days: null,
      is_permanent: false,
    },
  });

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setCurrencies(data || []);
      } catch (error) {
        console.error('Error fetching currencies:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити валюти',
          variant: 'destructive',
        });
      }
    };

    const fetchLimitationTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('limitation_types')
          .select('*');

        if (error) throw error;
        setLimitationTypes(data || []);
      } catch (error) {
        console.error('Error fetching limitation types:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити типи обмежень',
          variant: 'destructive',
        });
      }
    };

    fetchCurrencies();
    fetchLimitationTypes();
  }, [toast]);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchTariffPlan = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('tariff_plans')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          if (data) {
            form.setValue('name', data.name);
            form.setValue('price', data.price);
            form.setValue('currency_id', data.currency_id);
            form.setValue('duration_days', data.duration_days);
            form.setValue('is_permanent', data.is_permanent);
          }
        } catch (error) {
          console.error('Error fetching tariff plan:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити тарифний план',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchTariffPlan();
    } else {
      setIsLoading(false);
    }
  }, [id, form, toast]);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchPlanLimitations = async () => {
        try {
          const { data, error } = await extendedSupabase
            .from('tariff_plan_limitations')
            .select(`
              id,
              limitation_type_id,
              value,
              limitation_types:limitation_type_id (
                id,
                name,
                description,
                is_numeric
              )
            `)
            .eq('tariff_plan_id', id);

          if (error) throw error;

          if (data) {
            const formattedLimitations = data.map(item => ({
              id: item.id,
              limitation_type_id: item.limitation_type_id,
              limitation_type: {
                id: item.limitation_types.id,
                name: item.limitation_types.name,
                description: item.limitation_types.description,
                is_numeric: item.limitation_types.is_numeric,
              },
              value: item.value,
            }));
            setLimitations(formattedLimitations);
          }
        } catch (error) {
          console.error('Error fetching plan limitations:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити обмеження тарифного плану',
            variant: 'destructive',
          });
        }
      };

      fetchPlanLimitations();
    }
  }, [id, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Перевірка обов'язкових полів
      if (!values.name || !values.currency_id || values.price === undefined) {
        toast({
          title: "Помилка",
          description: "Заповніть всі обов'язкові поля",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const tariffPlanData = {
        name: values.name,
        price: values.price,
        currency_id: values.currency_id,
        duration_days: values.is_permanent ? null : values.duration_days,
        is_permanent: values.is_permanent,
      };

      if (id === 'new') {
        const { data: newPlan, error: createError } = await supabase
          .from('tariff_plans')
          .insert(tariffPlanData)
          .select()
          .single();

        if (createError) throw createError;

        await Promise.all(
          limitations.map(async (limitation) => {
            const { error: limitationError } = await supabase
              .from('tariff_plan_limitations')
              .insert({
                tariff_plan_id: newPlan.id,
                limitation_type_id: limitation.limitation_type_id,
                value: limitation.value,
              });

            if (limitationError) throw limitationError;
          })
        );

        toast({
          title: 'Успішно',
          description: 'Тарифний план створено',
        });
        navigate('/admin/tariffs');
      } else {
        const { error: updateError } = await supabase
          .from('tariff_plans')
          .update(tariffPlanData)
          .eq('id', id);

        if (updateError) throw updateError;

        await Promise.all(
          limitations.map(async (limitation) => {
            if (limitation.id) {
              const { error: limitationError } = await supabase
                .from('tariff_plan_limitations')
                .update({
                  limitation_type_id: limitation.limitation_type_id,
                  value: limitation.value,
                })
                .eq('id', limitation.id);

              if (limitationError) throw limitationError;
            } else {
              const { error: limitationError } = await supabase
                .from('tariff_plan_limitations')
                .insert({
                  tariff_plan_id: id,
                  limitation_type_id: limitation.limitation_type_id,
                  value: limitation.value,
                });

              if (limitationError) throw limitationError;
            }
          })
        );

        toast({
          title: 'Успішно',
          description: 'Тарифний план оновлено',
        });
        navigate('/admin/tariffs');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLimitation = useCallback(() => {
    setLimitations([
      ...limitations,
      {
        limitation_type_id: '',
        limitation_type: {
          id: '',
          name: '',
          description: '',
          is_numeric: true,
        },
        value: 0,
      },
    ]);
  }, [limitations]);

  const handleLimitationChange = useCallback(
    (index: number, field: string, value: any) => {
      const updatedLimitations = [...limitations];

      if (field === 'limitation_type_id') {
        const selectedLimitationType = limitationTypes.find((lt) => lt.id === value);
        updatedLimitations[index] = {
          ...updatedLimitations[index],
          limitation_type_id: value,
          limitation_type: {
            id: selectedLimitationType?.id || '',
            name: selectedLimitationType?.name || '',
            description: selectedLimitationType?.description || '',
            is_numeric: selectedLimitationType?.is_numeric || true,
          },
        };
      } else {
        updatedLimitations[index] = {
          ...updatedLimitations[index],
          value: parseFloat(value),
        };
      }

      setLimitations(updatedLimitations);
    },
    [limitations, limitationTypes]
  );

  const handleDeleteLimitation = useCallback(
    (index: number) => {
      const updatedLimitations = [...limitations];
      updatedLimitations.splice(index, 1);
      setLimitations(updatedLimitations);
    },
    [limitations]
  );

  if (isLoading) {
    return <p>Завантаження...</p>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate('/admin/tariffs')} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад до тарифів
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b dark:from-gray-800 dark:to-gray-700">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            {id === 'new' ? 'Створити тарифний план' : 'Редагувати тарифний план'}
          </CardTitle>
          <CardDescription>
            Налаштуйте параметри тарифного плану для користувачів системи
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="info" className="p-6" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 grid grid-cols-3 gap-4">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Основна інформація
                </TabsTrigger>
                <TabsTrigger value="functions" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Функції
                </TabsTrigger>
                <TabsTrigger value="limitations" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Обмеження
                </TabsTrigger>
              </TabsList>

              {/* Вкладка з основною інформацією */}
              <TabsContent value="info" className="space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Назва</FormLabel>
                        <FormControl>
                          <Input placeholder="Назва тарифного плану" {...field} className="focus-visible:ring-indigo-500" />
                        </FormControl>
                        <FormDescription>
                          Це назва тарифного плану, яку бачитимуть користувачі.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Ціна</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ціна тарифного плану" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="focus-visible:ring-indigo-500"
                            />
                          </FormControl>
                          <FormDescription>
                            Вкажіть ціну тарифного плану.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Валюта</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="focus:ring-indigo-500">
                                <SelectValue placeholder="Виберіть валюту" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.id} value={currency.id}>
                                  {currency.name} ({currency.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Виберіть валюту для тарифного плану.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <FormField
                    control={form.control}
                    name="is_permanent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Постійний доступ</FormLabel>
                          <FormDescription>
                            Увімкніть, якщо тарифний план надає постійний доступ.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!form.watch("is_permanent") && (
                    <FormField
                      control={form.control}
                      name="duration_days"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-base">Тривалість (в днях)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Тривалість тарифного плану в днях" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              className="focus-visible:ring-indigo-500"
                            />
                          </FormControl>
                          <FormDescription>
                            Вкажіть тривалість тарифного плану в днях.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Вкладка з функціями */}
              <TabsContent value="functions" className="space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Функції тарифного плану</h3>
                  <p className="text-gray-500 mb-4">
                    Налаштуйте функції, які будуть доступні користувачам цього тарифного плану.
                  </p>
                  
                  {/* Тут буде форма для функцій тарифу */}
                  <div className="p-8 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 opacity-30 mb-2" />
                    <p>Функціональність буде додана в майбутніх оновленнях</p>
                  </div>
                </div>
              </TabsContent>

              {/* Вкладка з обмеженнями */}
              <TabsContent value="limitations" className="space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Обмеження тарифного плану</h3>
                    <Button 
                      type="button" 
                      onClick={handleAddLimitation} 
                      variant="outline"
                      className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" />
                      Додати обмеження
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {limitations.length === 0 ? (
                      <div className="text-center p-8 border-2 border-dashed rounded-lg">
                        <Layers className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">У цього тарифу ще немає обмежень</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleAddLimitation} 
                          className="mt-4 border-indigo-200 hover:bg-indigo-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Додати перше обмеження
                        </Button>
                      </div>
                    ) : (
                      limitations.map((limitation, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="bg-gray-50 pb-2 pt-4">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-base font-medium">
                                Обмеження #{index + 1}
                              </CardTitle>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteLimitation(index)}
                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Видалити
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`limitation-type-${index}`}>Тип обмеження</Label>
                                <Select
                                  value={limitation.limitation_type_id}
                                  onValueChange={(value) => handleLimitationChange(index, 'limitation_type_id', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Виберіть тип обмеження" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {limitationTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        {type.description || type.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor={`limitation-value-${index}`}>Значення</Label>
                                <Input
                                  type="number"
                                  id={`limitation-value-${index}`}
                                  value={limitation.value}
                                  onChange={(e) => handleLimitationChange(index, 'value', e.target.value)}
                                  placeholder="Введіть значення"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/tariffs')}>
                Скасувати
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Збереження...' : 'Зберегти'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default TariffPlanForm;
