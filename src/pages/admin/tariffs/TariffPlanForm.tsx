
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  id: string;
  code: string;
  name: string;
}

interface TariffPlanFormValues {
  name: string;
  price: number;
  currency_id: string;
  is_permanent: boolean;
  duration_days: number | null;
}

const TariffPlanForm = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<TariffPlanFormValues>({
    name: '',
    price: 0,
    currency_id: '',
    is_permanent: false,
    duration_days: null,
  });

  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('id, code, name')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching currencies:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити список валют',
            variant: 'destructive',
          });
        } else {
          setCurrencies(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: 'Помилка',
          description: 'Сталася помилка при завантаженні валют',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, [toast]);

  useEffect(() => {
    const fetchTariffPlan = async () => {
      if (id && id !== 'new') {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('tariff_plans')
            .select('*')
            .eq('id', id)
            .single();

          if (error) {
            console.error('Error fetching tariff plan:', error);
            toast({
              title: 'Помилка',
              description: 'Не вдалося завантажити дані тарифу',
              variant: 'destructive',
            });
          } else if (data) {
            setFormValues({
              name: data.name,
              price: data.price,
              currency_id: data.currency_id,
              is_permanent: data.is_permanent,
              duration_days: data.duration_days,
            });
          }
        } catch (error) {
          console.error('Error:', error);
          toast({
            title: 'Помилка',
            description: 'Сталася помилка при завантаженні тарифу',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // For new tariff plans, just initialize with default values and skip loading
        setIsLoading(false);
      }
    };

    fetchTariffPlan();
  }, [id, toast]);

  const validationSchema = z.object({
    name: z.string({ required_error: "Вкажіть назву тарифу" }).min(2, "Назва повинна мати мінімум 2 символи"),
    price: z.union([
      z.number({ required_error: "Вкажіть ціну" }), 
      z.string().refine(val => !isNaN(Number(val)), "Ціна повинна бути числом").transform(val => Number(val))
    ]),
    currency_id: z.string({ required_error: "Оберіть валюту" }),
    is_permanent: z.boolean().default(false),
    duration_days: z.union([
      z.number().positive("Значення повинно бути більше нуля").nullable(),
      z.string().refine(val => !val || !isNaN(Number(val)), "Термін дії повинен бути числом")
        .transform(val => val ? Number(val) : null)
    ]).nullable()
      .refine(val => val !== null || formValues.is_permanent, {
        message: "Вкажіть термін дії тарифу або відмітьте 'Постійний доступ'",
      }),
  });

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: formValues,
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset(formValues);
  }, [formValues, form]);

  const onSubmit = async (values: z.infer<typeof validationSchema>) => {
    setIsLoading(true);
    try {
      const tariffPlanData = {
        name: values.name,
        price: values.price,
        currency_id: values.currency_id,
        is_permanent: values.is_permanent,
        duration_days: values.is_permanent ? null : values.duration_days,
      };

      let response;
      if (id && id !== 'new') {
        response = await supabase
          .from('tariff_plans')
          .update(tariffPlanData)
          .eq('id', id);
      } else {
        response = await supabase
          .from('tariff_plans')
          .insert([tariffPlanData]);
      }

      if (response.error) {
        console.error('Error saving tariff plan:', response.error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося зберегти тарифний план',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Успіх',
          description: 'Тарифний план успішно збережено',
        });
        navigate('/admin/tariffs');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Помилка',
        description: 'Сталася помилка при збереженні тарифного плану',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/tariffs')}
        className="self-start mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад до тарифів
      </Button>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>{id && id !== 'new' ? 'Редагувати тариф' : 'Створити тариф'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Вкажіть назву тарифу"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Назва тарифного плану
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ціна</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Вкажіть ціну тарифу"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                            min="0"
                            step="0.01"
                          />
                        </FormControl>
                        <FormDescription>
                          Ціна тарифу (вкажіть 0 для демонстраційного тарифу)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="currency_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Валюта</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть валюту" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.id}>
                                {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_permanent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue('duration_days', null);
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Постійний доступ</FormLabel>
                        <FormDescription>
                          Якщо вибрано, тариф надає постійний доступ без обмеження за часом
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Термін дії (днів)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Вкажіть кількість днів"
                          {...field}
                          value={field.value === null ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                          disabled={form.watch('is_permanent')}
                          min="1"
                        />
                      </FormControl>
                      <FormDescription>
                        Кількість днів, протягом яких буде діяти тариф
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Збереження...' : 'Зберегти'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TariffPlanForm;
