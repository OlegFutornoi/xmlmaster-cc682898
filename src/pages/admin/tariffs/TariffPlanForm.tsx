// Компонент для створення та редагування тарифних планів
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
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  X,
  DollarSign,
  Clock,
  Tag,
  Search,
  Settings2,
  List,
  ListChecks,
  BoxesIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Currency {
  id: string;
  code: string;
  name: string;
}

interface TariffItem {
  id: string;
  description: string;
}

interface LimitationType {
  id: string;
  name: string;
  description: string;
  is_numeric: boolean;
}

interface PlanLimitation {
  id?: string;
  limitation_type_id: string;
  value: number;
  limitation_type?: LimitationType;
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
  const [activeTab, setActiveTab] = useState('basic');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [limitationTypes, setLimitationTypes] = useState<LimitationType[]>([]);
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [newLimitationTypeId, setNewLimitationTypeId] = useState('');
  const [newLimitationValue, setNewLimitationValue] = useState<number>(0);
  
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
            title: 'Помилк��',
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

  useEffect(() => {
    const fetchLimitationTypes = async () => {
      try {
        const { data, error } = await extendedSupabase
          .from('limitation_types')
          .select('id, name, description, is_numeric')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching limitation types:', error);
          toast({
            title: 'Помилка',
            description: 'Не вдалося завантажити список типів обмежень',
            variant: 'destructive',
          });
        } else {
          setLimitationTypes(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchLimitationTypes();
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
            
            const { data: itemsData, error: itemsError } = await supabase
              .from('tariff_plan_items')
              .select('id, tariff_item_id, is_active')
              .eq('tariff_plan_id', id);
              
            if (itemsError) {
              console.error('Error fetching tariff plan items:', itemsError);
            } else {
              setPlanItems(itemsData || []);
            }
            
            const { data: limitationsData, error: limitationsError } = await extendedSupabase
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
            
            if (limitationsError) {
              console.error('Error fetching tariff plan limitations:', limitationsError);
            } else {
              const typedLimitations: PlanLimitation[] = limitationsData?.map(item => ({
                id: item.id,
                limitation_type_id: item.limitation_type_id,
                value: item.value,
                limitation_type: {
                  id: item.limitation_types.id,
                  name: item.limitation_types.name, 
                  description: item.limitation_types.description,
                  is_numeric: item.limitation_types.is_numeric
                }
              })) || [];
              
              setPlanLimitations(typedLimitations);
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

  const filteredExistingItems = existingItems.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      const newItem = data[0];
      setExistingItems([...existingItems, newItem]);
      
      const newPlanItem = {
        id: '',
        tariff_item_id: newItem.id,
        is_active: true
      };
      setPlanItems([...planItems, newPlanItem]);
      
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

    if (planItems.some(item => item.tariff_item_id === selectedExistingItem)) {
      toast({
        title: 'Інформація',
        description: 'Ця функція вже додана до тарифу',
      });
      return;
    }

    const newPlanItem = {
      id: '',
      tariff_item_id: selectedExistingItem,
      is_active: true
    };
    setPlanItems([...planItems, newPlanItem]);
    
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

  const addLimitation = () => {
    if (!newLimitationTypeId) {
      toast({
        title: 'Помилка',
        description: 'Оберіть тип обмеження',
        variant: 'destructive',
      });
      return;
    }

    if (planLimitations.some(item => item.limitation_type_id === newLimitationTypeId)) {
      toast({
        title: 'Інформація',
        description: 'Це обмеження вже додано до тарифу',
      });
      return;
    }

    const limitationType = limitationTypes.find(type => type.id === newLimitationTypeId);

    const newLimitation: PlanLimitation = {
      id: '',
      limitation_type_id: newLimitationTypeId,
      value: newLimitationValue,
      limitation_type: limitationType
    };
    
    setPlanLimitations([...planLimitations, newLimitation]);
    setNewLimitationTypeId('');
    setNewLimitationValue(0);
    
    toast({
      title: 'Успіх',
      description: 'Обмеження додано',
    });
  };

  const updateLimitationValue = (index: number, value: number) => {
    const updatedLimitations = [...planLimitations];
    updatedLimitations[index].value = value;
    setPlanLimitations(updatedLimitations);
  };

  const removeLimitation = (index: number) => {
    const updatedLimitations = [...planLimitations];
    updatedLimitations.splice(index, 1);
    setPlanLimitations(updatedLimitations);
  };

  const getLimitationTypeDescription = (typeId: string) => {
    const type = limitationTypes.find(t => t.id === typeId);
    return type ? type.description || type.name : 'Невідоме обмеження';
  };

  const onSubmit = async (values: z.infer<typeof validationSchema>) => {
    setIsLoading(true);
    try {
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
      
      if (id && id !== 'new') {
        const { error } = await supabase
          .from('tariff_plans')
          .update(tariffPlanData)
          .eq('id', id);
          
        if (error) {
          throw error;
        }
        
        planId = id;
        
        const { error: deleteError } = await supabase
          .from('tariff_plan_items')
          .delete()
          .eq('tariff_plan_id', planId);
          
        if (deleteError) {
          console.error('Error deleting existing plan items:', deleteError);
        }
        
        const { error: deleteLimitationsError } = await extendedSupabase
          .from('tariff_plan_limitations')
          .delete()
          .eq('tariff_plan_id', planId);
          
        if (deleteLimitationsError) {
          console.error('Error deleting existing plan limitations:', deleteLimitationsError);
        }
      } else {
        const { data, error } = await supabase
          .from('tariff_plans')
          .insert([tariffPlanData])
          .select();
          
        if (error) {
          throw error;
        }
        
        planId = data[0].id;
      }
      
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
      
      if (planLimitations.length > 0) {
        const limitationsToInsert = planLimitations.map(limitation => ({
          tariff_plan_id: planId,
          limitation_type_id: limitation.limitation_type_id,
          value: limitation.value
        }));
        
        const { error: limitationsError } = await extendedSupabase
          .from('tariff_plan_limitations')
          .insert(limitationsToInsert);
          
        if (limitationsError) {
          console.error('Error saving plan limitations:', limitationsError);
          toast({
            title: 'Увага',
            description: 'Тарифний план збережено, але виникла помилка при збереженні обмежень тарифу',
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

  const availableLimitationTypes = limitationTypes.filter(
    type => !planLimitations.some(limitation => limitation.limitation_type_id === type.id)
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-full">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin/tariffs')}
        className="mb-6 group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Назад до тарифів
      </Button>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-2xl font-bold">
            {id && id !== 'new' ? 'Редагувати тариф' : 'Створити тариф'}
          </CardTitle>
          <CardDescription>
            Налаштуйте параметри тарифного пл��ну та функції, доступні в рамках цього тарифу
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col md:flex-row w-full">
                <div className="md:w-64 p-4 border-r md:min-h-[600px]">
                  <TabsList className="flex flex-col h-auto w-full bg-transparent justify-start items-start space-y-1 p-0">
                    <TabsTrigger 
                      value="basic" 
                      className="w-full justify-start text-left px-3 data-[state=active]:bg-accent data-[state=active]:font-medium"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Основна інформація
                    </TabsTrigger>
                    <TabsTrigger 
                      value="features" 
                      className="w-full justify-start text-left px-3 data-[state=active]:bg-accent data-[state=active]:font-medium"
                    >
                      <ListChecks className="h-4 w-4 mr-2" />
                      Функції тарифу
                    </TabsTrigger>
                    <TabsTrigger 
                      value="limitations" 
                      className="w-full justify-start text-left px-3 data-[state=active]:bg-accent data-[state=active]:font-medium"
                    >
                      <BoxesIcon className="h-4 w-4 mr-2" />
                      Обмеження магазину
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="flex-1 w-full">
                  <TabsContent value="basic" className="p-6 w-full space-y-6 mt-0">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Назва тарифу</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Введіть назву тарифу"
                              {...field}
                              className="max-w-md"
                            />
                          </FormControl>
                          <FormDescription>
                            Вкажіть коротку та зрозумілу назву тарифного плану
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ціна</FormLabel>
                            <FormControl>
                              <div className="flex items-center max-w-xs">
                                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                  min="0"
                                  step="0.01"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Вкажіть 0 для безкоштовного тарифу
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
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="max-w-xs">
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
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">Термін дії тарифу</h3>
                      
                      <FormField
                        control={form.control}
                        name="is_permanent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Постійний доступ</FormLabel>
                              <FormDescription>
                                Якщо обрано, користувачі отримають необмежений доступ до функцій тарифу бе�� терміну дії
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="duration_days"
                        render={({ field }) => (
                          <FormItem className="max-w-xs">
                            <FormLabel>Термін дії (днів)</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <Input
                                  type="number"
                                  placeholder="Кількість днів"
                                  {...field}
                                  value={field.value === null ? '' : field.value}
                                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                  disabled={form.watch('is_permanent')}
                                  min="1"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Кількість днів дії тарифу після активації
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="features" className="p-6 w-full space-y-6 mt-0">
                    <div className="flex flex-col space-y-4">
                      <h3 className="text-lg font-medium">Додати нову функцію</h3>
                      
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="flex space-x-2">
                            <Textarea
                              placeholder="Опис нової функції тарифу"
                              value={newItemDescription}
                              onChange={(e) => setNewItemDescription(e.target.value)}
                              className="flex-grow resize-none"
                            />
                            <Button 
                              type="button" 
                              onClick={addNewItem}
                              variant="secondary"
                              className="shrink-0 self-stretch"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <h3 className="text-lg font-medium mt-4">Додати існуючу функцію</h3>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="search"
                                placeholder="Пошук функцій..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            
                            <ScrollArea className="h-60 rounded border">
                              <div className="p-4 space-y-2">
                                {filteredExistingItems.length === 0 ? (
                                  <p className="text-center text-muted-foreground py-4">
                                    Не знайдено функцій відповідно до пошуку
                                  </p>
                                ) : (
                                  filteredExistingItems.map((item) => (
                                    <div 
                                      key={item.id} 
                                      className={`
                                        flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer
                                        ${planItems.some(i => i.tariff_item_id === item.id) ? 'bg-accent/50' : ''}
                                      `}
                                      onClick={() => {
                                        if (!planItems.some(i => i.tariff_item_id === item.id)) {
                                          const newPlanItem = {
                                            id: '',
                                            tariff_item_id: item.id,
                                            is_active: true
                                          };
                                          setPlanItems([...planItems, newPlanItem]);
                                          
                                          toast({
                                            title: 'Функцію додано',
                                            description: 'Функцію успішно додано до тарифу',
                                          });
                                        }
                                      }}
                                    >
                                      <span>{item.description}</span>
                                      {planItems.some(i => i.tariff_item_id === item.id) && (
                                        <Badge variant="secondary">
                                          <Check className="h-3.5 w-3.5 mr-1" />
                                          Додано
                                        </Badge>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <h3 className="text-lg font-medium mt-4">Функції тарифу ({planItems.length})</h3>
                      
                      <Card>
                        <CardContent className="pt-6">
                          {planItems.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Опис</TableHead>
                                  <TableHead className="w-[100px] text-center">Акт��вна</TableHead>
                                  <TableHead className="w-[80px] text-right">Дії</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {planItems.map((item, index) => (
                                  <TableRow key={index} className="group">
                                    <TableCell>{getItemDescription(item.tariff_item_id)}</TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        type="button"
                                        variant={item.is_active ? "outline" : "ghost"}
                                        size="sm"
                                        onClick={() => toggleItemActive(index)}
                                      >
                                        {item.is_active ? 
                                          <Check className="h-4 w-4 text-green-500" /> : 
                                          <X className="h-4 w-4 text-red-500" />}
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeItem(index)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <List className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">
                                Ще немає функцій у цьому тарифі
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Додайте функції з існуючого списку або створіть нові
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="limitations" className="p-6 w-full space-y-6 mt-0">
                    <div className="flex flex-col space-y-4">
                      <h3 className="text-lg font-medium">Додати нове обмеження</h3>
                      
                      <Card className="border-dashed">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="col-span-1 md:col-span-2">
                              <Select
                                value={newLimitationTypeId}
                                onValueChange={setNewLimitationTypeId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть тип обмеження" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableLimitationTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.description || type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="Значення"
                                value={newLimitationValue}
                                onChange={(e) => setNewLimitationValue(Number(e.target.value))}
                                min="0"
                                className="flex-grow"
                              />
                              <Button 
                                type="button" 
                                onClick={addLimitation}
                                variant="secondary"
                                className="shrink-0"
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            * Значення 0 означає, що функціонал недоступний
                          </p>
                        </CardContent>
                      </Card>
                      
                      <h3 className="text-lg font-medium mt-4">Обмеження тарифу ({planLimitations.length})</h3>
                      
                      <Card>
                        <CardContent className="pt-6">
                          {planLimitations.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Найменування</TableHead>
                                  <TableHead className="w-[150px]">Значення</TableHead>
                                  <TableHead className="w-[80px] text-right">Дії</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {planLimitations.map((limitation, index) => (
                                  <TableRow key={index} className="group">
                                    <TableCell>
                                      {getLimitationTypeDescription(limitation.limitation_type_id)}
                                    </TableCell>
                                    <TableCell>
                                      <Input 
                                        type="number"
                                        min="0"
                                        value={limitation.value}
                                        onChange={(e) => updateLimitationValue(index, Number(e.target.value))}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeLimitation(index)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <BoxesIcon className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-muted-foreground">
                                Ще немає обмежень у цьому тарифі
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Додайте обмеження, щоб контролювати можливості користувачів
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
            
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/tariffs')}
              >
                Скасувати
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Збереження...' : 'Зберегти тариф'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default TariffPlanForm;
