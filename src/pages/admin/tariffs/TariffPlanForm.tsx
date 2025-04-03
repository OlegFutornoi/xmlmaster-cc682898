
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  id: string;
  code: string;
  name: string;
}

interface TariffItem {
  id: string;
  description: string;
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
  const [existingItems, setExistingItems] = useState<TariffItem[]>([]);
  const [planItems, setPlanItems] = useState<Array<{id: string; tariff_item_id: string; is_active: boolean}>>([]);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedExistingItem, setSelectedExistingItem] = useState('');
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

  // Fetch currencies
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

  // Fetch existing tariff items
  useEffect(() => {
    const fetchTariffItems = async () => {
      try {
        const { data, error } = await supabase
          .from('tariff_items')
          .select('id, description')
          .order('description', { ascending: true });

        if (error) {
          console.error('Error fetching tariff items:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити список функцій тарифів',
            variant: 'destructive',
          });
        } else {
          setExistingItems(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTariffItems();
  }, [toast]);

  // Fetch tariff plan and its items
  useEffect(() => {
    const fetchTariffPlan = async () => {
      if (id && id !== 'new') {
        setIsLoading(true);
        try {
          // Fetch tariff plan
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
            
            // Fetch tariff plan items
            const { data: itemsData, error: itemsError } = await supabase
              .from('tariff_plan_items')
              .select('id, tariff_item_id, is_active')
              .eq('tariff_plan_id', id);
              
            if (itemsError) {
              console.error('Error fetching tariff plan items:', itemsError);
            } else {
              setPlanItems(itemsData || []);
            }
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
    ]).nullable(),
  });

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: formValues,
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset(formValues);
  }, [formValues, form]);

  const addNewItem = async () => {
    if (!newItemDescription.trim()) {
      toast({
        title: 'Помилка',
        description: 'Опис функції не може бути порожнім',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create new tariff item
      const { data, error } = await supabase
        .from('tariff_items')
        .insert([{ description: newItemDescription.trim() }])
        .select();

      if (error) {
        console.error('Error creating tariff item:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося створити функцію тарифу',
          variant: 'destructive',
        });
        return;
      }

      // Add to existing items
      const newItem = data[0];
      setExistingItems([...existingItems, newItem]);
      
      // Add to plan items
      const newPlanItem = {
        id: '', // Temporary ID, will be set after saving the plan
        tariff_item_id: newItem.id,
        is_active: true
      };
      setPlanItems([...planItems, newPlanItem]);
      
      // Clear input
      setNewItemDescription('');
      
      toast({
        title: 'Успіх',
        description: 'Функцію тарифу додано',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Помилка',
        description: 'Сталася помилка при створенні функції тарифу',
        variant: 'destructive',
      });
    }
  };

  const addExistingItem = () => {
    if (!selectedExistingItem) {
      toast({
        title: 'Помилка',
        description: 'Оберіть функцію тарифу',
        variant: 'destructive',
      });
      return;
    }

    // Check if item already added
    if (planItems.some(item => item.tariff_item_id === selectedExistingItem)) {
      toast({
        title: 'Інформація',
        description: 'Ця функція вже додана до тарифу',
      });
      return;
    }

    // Add to plan items
    const newPlanItem = {
      id: '', // Temporary ID, will be set after saving the plan
      tariff_item_id: selectedExistingItem,
      is_active: true
    };
    setPlanItems([...planItems, newPlanItem]);
    
    // Clear selection
    setSelectedExistingItem('');
    
    toast({
      title: 'Успіх',
      description: 'Функцію тарифу додано',
    });
  };

  const toggleItemActive = (index: number) => {
    const updatedItems = [...planItems];
    updatedItems[index].is_active = !updatedItems[index].is_active;
    setPlanItems(updatedItems);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...planItems];
    updatedItems.splice(index, 1);
    setPlanItems(updatedItems);
  };

  const getItemDescription = (itemId: string) => {
    const item = existingItems.find(i => i.id === itemId);
    return item ? item.description : 'Невідома функція';
  };

  const onSubmit = async (values: z.infer<typeof validationSchema>) => {
    setIsLoading(true);
    try {
      // Fix duration_days based on is_permanent value
      if (values.is_permanent) {
        values.duration_days = null;
      } else if (!values.duration_days) {
        toast({
          title: 'Помилка',
          description: 'Вкажіть термін дії тарифу або відмітьте \'Постійний доступ\'',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const tariffPlanData = {
        name: values.name,
        price: values.price,
        currency_id: values.currency_id,
        is_permanent: values.is_permanent,
        duration_days: values.duration_days,
      };

      let planId;
      
      // Save tariff plan
      if (id && id !== 'new') {
        // Update existing plan
        const { error } = await supabase
          .from('tariff_plans')
          .update(tariffPlanData)
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        planId = id;
        
        // Remove all existing plan items to avoid conflicts
        const { error: deleteError } = await supabase
          .from('tariff_plan_items')
          .delete()
          .eq('tariff_plan_id', planId);
          
        if (deleteError) {
          console.error('Error deleting existing plan items:', deleteError);
        }
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('tariff_plans')
          .insert([tariffPlanData])
          .select();
          
        if (error) {
          throw error;
        }
        
        planId = data[0].id;
      }
      
      // Save plan items if there are any
      if (planItems.length > 0) {
        const itemsToInsert = planItems.map(item => ({
          tariff_plan_id: planId,
          tariff_item_id: item.tariff_item_id,
          is_active: item.is_active
        }));
        
        const { error: itemsError } = await supabase
          .from('tariff_plan_items')
          .insert(itemsToInsert);
          
        if (itemsError) {
          console.error('Error saving plan items:', itemsError);
          toast({
            title: 'Увага',
            description: 'Тарифний план збережено, але виникла помилка при збереженні функцій тарифу',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Успіх',
        description: 'Тарифний план успішно збережено',
      });
      navigate('/admin/tariffs');
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

      <Card className="flex-1 mb-6">
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
                          onCheckedChange={field.onChange}
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

              <div className="pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Функції тарифу</h3>
                
                <div className="space-y-6">
                  {/* Add new item */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Створити нову функцію</CardTitle>
                      <CardDescription>
                        Створіть нову функцію тарифного плану
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Опис функції тарифу"
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          className="flex-grow"
                        />
                        <Button 
                          type="button" 
                          onClick={addNewItem}
                          className="self-start"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Додати
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Add existing item */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Додати існуючу функцію</CardTitle>
                      <CardDescription>
                        Додайте до тарифу існуючу функцію
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Select
                          value={selectedExistingItem}
                          onValueChange={setSelectedExistingItem}
                        >
                          <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Оберіть функцію" />
                          </SelectTrigger>
                          <SelectContent>
                            {existingItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          onClick={addExistingItem}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Додати
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Items list */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Функції тарифу</CardTitle>
                      <CardDescription>
                        Список функцій, включених до тарифного плану
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {planItems.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Опис</TableHead>
                              <TableHead className="w-[100px] text-center">Активна</TableHead>
                              <TableHead className="w-[100px] text-right">Дії</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {planItems.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{getItemDescription(item.tariff_item_id)}</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    type="button"
                                    variant={item.is_active ? "success" : "destructive"}
                                    size="sm"
                                    onClick={() => toggleItemActive(index)}
                                  >
                                    {item.is_active ? <Check size={16} /> : <X size={16} />}
                                  </Button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          Ще немає функцій у цьому тарифі
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
