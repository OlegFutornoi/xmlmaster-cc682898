
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2 } from 'lucide-react';
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

      fetchPlanLimitations();
    }
  }, [id, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (id === 'new') {
        const { data: newPlan, error: createError } = await supabase
          .from('tariff_plans')
          .insert({
            name: values.name,
            price: values.price,
            currency_id: values.currency_id,
            duration_days: values.duration_days,
            is_permanent: values.is_permanent,
          })
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
          .update({
            name: values.name,
            price: values.price,
            currency_id: values.currency_id,
            duration_days: values.duration_days,
            is_permanent: values.is_permanent,
          })
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
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/admin/tariffs')}>
          Назад до тарифів
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{id === 'new' ? 'Створити тарифний план' : 'Редагувати тарифний план'}</CardTitle>
          <CardDescription>Введіть інформацію про тарифний план</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва</FormLabel>
                    <FormControl>
                      <Input placeholder="Назва тарифного плану" {...field} />
                    </FormControl>
                    <FormDescription>
                      Це назва тарифного плану, яку бачитимуть користувачі.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ціна</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ціна тарифного плану" {...field} />
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
                    <FormLabel>Валюта</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тривалість (в днях)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Тривалість тарифного плану в днях" {...field} disabled={form.watch("is_permanent")} />
                    </FormControl>
                    <FormDescription>
                      Вкажіть тривалість тарифного плану в днях.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_permanent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Постійний доступ</FormLabel>
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

              <Separator />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Обмеження</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddLimitation}>
                    Додати обмеження
                  </Button>
                </div>
                {limitations.map((limitation, index) => (
                  <Card key={index} className="mb-4">
                    <CardContent className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`limitation-type-${index}`}>Тип обмеження</Label>
                          <Select
                            value={limitation.limitation_type_id}
                            onValueChange={(value) => handleLimitationChange(index, 'limitation_type_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть тип обмеження" />
                            </SelectTrigger>
                            <SelectContent>
                              {limitationTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
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
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteLimitation(index)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Видалити
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Збереження...' : 'Зберегти'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffPlanForm;
