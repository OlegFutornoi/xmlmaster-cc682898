
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

interface TariffItem {
  id: string;
  description: string;
}

interface TariffPlanItem {
  id?: string;
  tariff_item_id: string;
  is_active: boolean;
  tariff_item: TariffItem;
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
  const [activeTab, setActiveTab] = useState("info");
  
  // Для тарифних пунктів
  const [tariffItems, setTariffItems] = useState<TariffItem[]>([]);
  const [planItems, setPlanItems] = useState<TariffPlanItem[]>([]);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

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
    
    const fetchTariffItems = async () => {
      try {
        const { data, error } = await supabase
          .from('tariff_items')
          .select('*')
          .order('description', { ascending: true });

        if (error) throw error;
        setTariffItems(data || []);
      } catch (error) {
        console.error('Error fetching tariff items:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити пункти тарифних планів',
          variant: 'destructive',
        });
      }
    };

    fetchCurrencies();
    fetchLimitationTypes();
    fetchTariffItems();
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
                id: item.limitation_types?.id || '',
                name: item.limitation_types?.name || '',
                description: item.limitation_types?.description || '',
                is_numeric: item.limitation_types?.is_numeric || true,
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
      
      // Завантаження пунктів тарифного плану
      const fetchPlanItems = async () => {
        try {
          const { data, error } = await supabase
            .from('tariff_plan_items')
            .select(`
              id,
              tariff_item_id,
              is_active,
              tariff_items:tariff_item_id (
                id, 
                description
              )
            `)
            .eq('tariff_plan_id', id);

          if (error) throw error;

          if (data) {
            const formattedItems = data.map(item => ({
              id: item.id,
              tariff_item_id: item.tariff_item_id,
              is_active: item.is_active,
              tariff_item: {
                id: item.tariff_items.id,
                description: item.tariff_items.description
              }
            }));
            setPlanItems(formattedItems);
          }
        } catch (error) {
          console.error('Error fetching plan items:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити пункти тарифного плану',
            variant: 'destructive',
          });
        }
      };

      fetchPlanLimitations();
      fetchPlanItems();
    }
  }, [id, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
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

        // Зберігаємо обмеження
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
        
        // Зберігаємо пункти тарифного плану
        await Promise.all(
          planItems.map(async (item) => {
            const { error: itemError } = await supabase
              .from('tariff_plan_items')
              .insert({
                tariff_plan_id: newPlan.id,
                tariff_item_id: item.tariff_item_id,
                is_active: item.is_active,
              });

            if (itemError) throw itemError;
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

        // Оновлюємо обмеження
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
        
        // Оновлюємо пункти тарифного плану: спочатку видаляємо всі
        const { error: deleteError } = await supabase
          .from('tariff_plan_items')
          .delete()
          .eq('tariff_plan_id', id);
        
        if (deleteError) throw deleteError;
        
        // Потім додаємо всі поточні пункти
        await Promise.all(
          planItems.map(async (item) => {
            const { error: itemError } = await supabase
              .from('tariff_plan_items')
              .insert({
                tariff_plan_id: id,
                tariff_item_id: item.tariff_item_id,
                is_active: item.is_active,
              });

            if (itemError) throw itemError;
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
        if (selectedLimitationType) {
          updatedLimitations[index] = {
            ...updatedLimitations[index],
            limitation_type_id: value,
            limitation_type: {
              id: selectedLimitationType.id,
              name: selectedLimitationType.name,
              description: selectedLimitationType.description,
              is_numeric: selectedLimitationType.is_numeric,
            },
          };
        }
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
  
  // Функції для роботи з пунктами тарифного плану
  const handleAddNewTariffItem = async () => {
    if (!newItemDescription.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть опис пункту тарифного плану',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('tariff_items')
        .insert({ description: newItemDescription.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      // Додаємо новий пункт до списку всіх пунктів
      setTariffItems([...tariffItems, data]);
      
      // Додаємо новий пункт до списку пунктів плану
      setPlanItems([
        ...planItems,
        {
          tariff_item_id: data.id,
          is_active: true,
          tariff_item: {
            id: data.id,
            description: data.description
          }
        }
      ]);
      
      setNewItemDescription('');
      toast({
        title: 'Успішно',
        description: 'Пункт тарифного плану створено',
      });
    } catch (error) {
      console.error('Error creating tariff item:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити пункт тарифного плану',
        variant: 'destructive',
      });
    }
  };
  
  const handleAddExistingItem = () => {
    if (!selectedItemId) {
      toast({
        title: 'Помилка',
        description: 'Виберіть пункт тарифного плану',
        variant: 'destructive',
      });
      return;
    }
    
    // Перевіряємо, чи вже є такий пункт у плані
    const existingItem = planItems.find(item => item.tariff_item_id === selectedItemId);
    if (existingItem) {
      toast({
        title: 'Інформація',
        description: 'Цей пункт вже додано до тарифного плану',
      });
      return;
    }
    
    const selectedItem = tariffItems.find(item => item.id === selectedItemId);
    if (selectedItem) {
      setPlanItems([
        ...planItems,
        {
          tariff_item_id: selectedItem.id,
          is_active: true,
          tariff_item: {
            id: selectedItem.id,
            description: selectedItem.description
          }
        }
      ]);
      
      setSelectedItemId('');
      toast({
        title: 'Успішно',
        description: 'Пункт додано до тарифного плану',
      });
    }
  };
  
  const toggleItemActive = (index: number) => {
    const updatedItems = [...planItems];
    updatedItems[index] = {
      ...updatedItems[index],
      is_active: !updatedItems[index].is_active
    };
    setPlanItems(updatedItems);
  };
  
  const deleteItem = (index: number) => {
    const updatedItems = [...planItems];
    updatedItems.splice(index, 1);
    setPlanItems(updatedItems);
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row h-full">
            <Tabs 
              defaultValue="info" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full flex flex-col lg:flex-row"
            >
              {/* Вертикальні вкладки зліва */}
              <div className="w-full lg:w-56 shrink-0 border-r">
                <TabsList className="flex lg:flex-col p-2 gap-1 h-auto w-full">
                  <TabsTrigger 
                    className="flex items-center justify-start gap-2 py-3 px-4 w-full data-[state=active]:bg-indigo-50" 
                    value="info"
                  >
                    <Info className="w-4 h-4" />
                    Основна інформація
                  </TabsTrigger>
                  <TabsTrigger 
                    className="flex items-center justify-start gap-2 py-3 px-4 w-full data-[state=active]:bg-indigo-50" 
                    value="functions"
                  >
                    <Package className="w-4 h-4" />
                    Функції
                  </TabsTrigger>
                  <TabsTrigger 
                    className="flex items-center justify-start gap-2 py-3 px-4 w-full data-[state=active]:bg-indigo-50" 
                    value="limitations"
                  >
                    <Layers className="w-4 h-4" />
                    Обмеження
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="flex-1 p-6">
                <TabsContent value="info" className="space-y-6 mt-0">
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

                <TabsContent value="functions" className="space-y-6 mt-0">
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Функції тарифного плану</h3>
                    <p className="text-gray-500 mb-4">
                      Налаштуйте функції, які будуть доступні користувачам цього тарифного плану.
                    </p>
                    
                    {/* Форма додавання нового пункту тарифного плану */}
                    <div className="mb-6 p-4 border border-dashed rounded-md">
                      <h4 className="text-md font-medium mb-3">Додати новий пункт</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-item">Опис пункту</Label>
                          <div className="flex mt-1 gap-2">
                            <Input
                              id="new-item"
                              placeholder="Введіть опис пункту тарифного плану"
                              value={newItemDescription}
                              onChange={(e) => setNewItemDescription(e.target.value)}
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              onClick={handleAddNewTariffItem} 
                              variant="outline"
                              className="shrink-0"
                            >
                              Додати
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="existing-item">Або виберіть існуючий</Label>
                          <div className="flex mt-1 gap-2">
                            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Виберіть пункт" />
                              </SelectTrigger>
                              <SelectContent>
                                {tariffItems.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.description}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              onClick={handleAddExistingItem} 
                              variant="outline"
                              className="shrink-0"
                            >
                              Додати
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Список пунктів тарифного плану */}
                    {planItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60%]">Опис</TableHead>
                              <TableHead className="w-[20%]">Активний</TableHead>
                              <TableHead className="w-[20%] text-right">Дії</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planItems.map((item, index) => (
                              <TableRow key={index} className={!item.is_active ? "opacity-60" : ""}>
                                <TableCell className="font-medium">
                                  {item.tariff_item.description}
                                </TableCell>
                                <TableCell>
                                  <Switch 
                                    checked={item.is_active} 
                                    onCheckedChange={() => toggleItemActive(index)}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteItem(index)}
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed rounded-lg">
                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">У цього тарифу ще немає пунктів</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="limitations" className="space-y-6 mt-0">
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
                      <div className="space-y-2">
                        <div className="space-y-4">
                          {limitations.map((limitation, index) => (
                            <div 
                              key={index} 
                              className="flex flex-col sm:flex-row gap-4 items-start border p-4 rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <Label htmlFor={`limitation-type-${index}`}>Тип обмеження</Label>
                                <Select
                                  value={limitation.limitation_type_id}
                                  onValueChange={(value) => handleLimitationChange(index, 'limitation_type_id', value)}
                                >
                                  <SelectTrigger id={`limitation-type-${index}`} className="mt-1.5">
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
                              
                              <div className="w-full sm:w-32">
                                <Label htmlFor={`limitation-value-${index}`}>Значення</Label>
                                <Input
                                  id={`limitation-value-${index}`}
                                  type="number"
                                  value={limitation.value}
                                  onChange={(e) => handleLimitationChange(index, 'value', e.target.value)}
                                  placeholder="Введіть значення"
                                  className="mt-1.5"
                                />
                              </div>
                              
                              <div className="self-end sm:self-center mt-2 sm:mt-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLimitation(index)}
                                  className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-center mt-4">
                          <Button 
                            type="button" 
                            onClick={handleAddLimitation} 
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Додати ще обмеження
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
        
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/tariffs')}>
            Скасувати
          </Button>
          <Button 
            type="button" 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TariffPlanForm;
