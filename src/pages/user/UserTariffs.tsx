
// Компонент для відображення та управління тарифами користувача
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Format } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { format } from 'date-fns'; 
import { uk } from 'date-fns/locale';

import {
  AlertCircle,
  ArrowUpCircle,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  Infinity,
  LucideIcon,
  PackagePlus,
  RefreshCcw,
  X,
  Zap,
} from "lucide-react";

interface Subscription {
  id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  tariff_plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number | null;
    is_permanent: boolean;
    currency: {
      code: string;
    }
  }
}

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number | null;
  is_permanent: boolean;
  currency: {
    name: string;
    code: string;
  };
}

interface TariffItem {
  id: string;
  description: string;
  is_active: boolean;
}

interface PlanLimitation {
  limitation_type: {
    name: string;
    description: string;
  };
  value: number;
}

const UserTariffs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availablePlans, setAvailablePlans] = useState<TariffPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [planItems, setPlanItems] = useState<TariffItem[]>([]);

  useEffect(() => {
    fetchUserSubscriptions();
    fetchAvailablePlans();
  }, []);

  const fetchUserSubscriptions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Отримуємо активну підписку
      const { data: activeData, error: activeError } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          is_active,
          start_date,
          end_date,
          tariff_plans:tariff_plan_id (
            id,
            name,
            price,
            duration_days,
            is_permanent,
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (activeError) throw activeError;

      // Перетворюємо дані
      if (activeData) {
        const formattedActive = {
          id: activeData.id,
          is_active: activeData.is_active,
          start_date: activeData.start_date,
          end_date: activeData.end_date,
          tariff_plan: {
            id: activeData.tariff_plans.id,
            name: activeData.tariff_plans.name,
            price: activeData.tariff_plans.price,
            duration_days: activeData.tariff_plans.duration_days,
            is_permanent: activeData.tariff_plans.is_permanent,
            currency: {
              code: activeData.tariff_plans.currencies.code
            }
          }
        };
        setActiveSubscription(formattedActive);
      }

      // Отримуємо історію підписок
      const { data: historyData, error: historyError } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          is_active,
          start_date,
          end_date,
          tariff_plans:tariff_plan_id (
            id,
            name,
            price,
            duration_days,
            is_permanent,
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', false)
        .order('start_date', { ascending: false });

      if (historyError) throw historyError;

      if (historyData) {
        const formattedHistory = historyData.map(item => ({
          id: item.id,
          is_active: item.is_active,
          start_date: item.start_date,
          end_date: item.end_date,
          tariff_plan: {
            id: item.tariff_plans.id,
            name: item.tariff_plans.name,
            price: item.tariff_plans.price,
            duration_days: item.tariff_plans.duration_days,
            is_permanent: item.tariff_plans.is_permanent,
            currency: {
              code: item.tariff_plans.currencies.code
            }
          }
        }));
        setSubscriptionHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити інформацію про підписки',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
          id, 
          name, 
          price, 
          duration_days, 
          is_permanent,
          currencies:currency_id (
            name, 
            code
          )
        `)
        .order('price', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedPlans = data.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration_days: plan.duration_days,
          is_permanent: plan.is_permanent,
          currency: {
            name: plan.currencies.name,
            code: plan.currencies.code
          }
        }));
        setAvailablePlans(formattedPlans);
      }
    } catch (error) {
      console.error('Error fetching tariff plans:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити доступні тарифні плани',
        variant: 'destructive',
      });
    }
  };

  const fetchPlanDetails = async (planId: string) => {
    // Отримуємо обмеження для тарифного плану
    try {
      const { data: limitationsData, error: limitationsError } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', planId);

      if (limitationsError) throw limitationsError;

      // Отримуємо пункти для тарифного плану
      const { data: itemsData, error: itemsError } = await supabase
        .from('tariff_plan_items')
        .select(`
          tariff_items:tariff_item_id (id, description),
          is_active
        `)
        .eq('tariff_plan_id', planId);

      if (itemsError) throw itemsError;

      if (limitationsData) {
        const formattedLimitations = limitationsData.map(item => ({
          limitation_type: {
            name: item.limitation_types?.name || '',
            description: item.limitation_types?.description || '',
          },
          value: item.value,
        }));
        setPlanLimitations(formattedLimitations);
      }

      if (itemsData) {
        const formattedItems = itemsData
          .filter(item => item.is_active) // відображаємо лише активні пункти
          .map(item => ({
            id: item.tariff_items.id,
            description: item.tariff_items.description,
            is_active: item.is_active
          }));
        setPlanItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити деталі тарифного плану',
        variant: 'destructive',
      });
    }
  };

  const handlePlanClick = (planId: string) => {
    setSelectedPlanId(planId);
    fetchPlanDetails(planId);
    setIsConfirmDialogOpen(true);
  };

  const handleActivatePlan = async () => {
    if (!selectedPlanId || !user) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося активувати тарифний план',
        variant: 'destructive',
      });
      return;
    }

    setIsActivating(true);
    try {
      const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        toast({
          title: 'Помилка',
          description: 'Обраний тарифний план не знайдено',
          variant: 'destructive',
        });
        return;
      }

      // Розрахунок дати закінчення
      let endDate = null;
      if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
        const startDate = new Date();
        endDate = new Date();
        endDate.setDate(startDate.getDate() + selectedPlan.duration_days);
      }

      // Деактивуємо поточну підписку
      if (activeSubscription) {
        const { error: updateError } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .eq('id', activeSubscription.id);

        if (updateError) throw updateError;
      }

      // Створюємо нову підписку
      const { error: createError } = await supabase
        .from('user_tariff_subscriptions')
        .insert({
          user_id: user.id,
          tariff_plan_id: selectedPlanId,
          end_date: endDate,
          is_active: true
        });

      if (createError) throw createError;

      toast({
        title: 'Успішно',
        description: 'Тариф активовано',
      });

      const { data: subscription, error: fetchError } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          is_active,
          start_date,
          end_date,
          tariff_plans:tariff_plan_id (
            id,
            name,
            price,
            duration_days,
            is_permanent,
            currencies:currency_id (code)
          )
        `)
        .eq('user_id', user.id)
        .eq('tariff_plan_id', selectedPlanId)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (subscription) {
        setActiveSubscription({
          id: subscription.id,
          is_active: subscription.is_active,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          tariff_plan: {
            id: subscription.tariff_plans.id,
            name: subscription.tariff_plans.name,
            price: subscription.tariff_plans.price,
            duration_days: subscription.tariff_plans.duration_days,
            is_permanent: subscription.tariff_plans.is_permanent,
            currency: {
              code: subscription.tariff_plans.currencies.code
            }
          }
        });
      }

      fetchUserSubscriptions();
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося активувати тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return <p>Завантаження...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Тарифні плани</h1>
      
      {/* Активний тарифний план */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Поточний тариф</h2>
        {activeSubscription ? (
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeSubscription.tariff_plan.name}</CardTitle>
                  <CardDescription>
                    Активовано: {format(new Date(activeSubscription.start_date), "d MMMM yyyy", { locale: uk })}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg py-1">
                  {activeSubscription.tariff_plan.price} {activeSubscription.tariff_plan.currency.code}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                {activeSubscription.tariff_plan.is_permanent ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Infinity className="h-3.5 w-3.5" />
                    Постійний доступ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Закінчується: {activeSubscription.end_date 
                      ? format(new Date(activeSubscription.end_date), "d MMMM yyyy", { locale: uk })
                      : 'Не вказано'
                    }
                  </Badge>
                )}
              </div>
              
              <Button onClick={() => navigate('/user/stores')} className="mb-4">
                Керувати магазинами
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Немає активного тарифу</CardTitle>
              <CardDescription>
                Виберіть тарифний план, щоб почати користуватися всіма можливостями системи.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Увага</AlertTitle>
                <AlertDescription>
                  Для створення та управління магазинами необхідно активувати тарифний план.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Доступні тарифні плани */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Доступні тарифи</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans.map(plan => (
            <Card 
              key={plan.id} 
              className={`
                transition-all duration-200 hover:shadow-md 
                ${activeSubscription?.tariff_plan.id === plan.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}
              `}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  <Badge variant={plan.is_permanent ? "secondary" : "default"}>
                    {plan.is_permanent ? 'Постійний' : `${plan.duration_days} днів`}
                  </Badge>
                </div>
                <CardDescription>
                  {plan.is_permanent 
                    ? 'Необмежений доступ до всіх функцій' 
                    : `Доступ на ${plan.duration_days} днів`}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="text-2xl font-bold mb-4">
                  {plan.price} {plan.currency.code}
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={activeSubscription?.tariff_plan.id === plan.id ? "outline" : "default"}
                  onClick={() => handlePlanClick(plan.id)}
                >
                  {activeSubscription?.tariff_plan.id === plan.id 
                    ? 'Активний тариф' 
                    : 'Вибрати тариф'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Історія підписок */}
      {subscriptionHistory.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Історія підписок</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Назва тарифу</TableHead>
                    <TableHead>Дата активації</TableHead>
                    <TableHead>Дата закінчення</TableHead>
                    <TableHead>Ціна</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{subscription.tariff_plan.name}</TableCell>
                      <TableCell>{format(new Date(subscription.start_date), "d MMMM yyyy", { locale: uk })}</TableCell>
                      <TableCell>
                        {subscription.end_date 
                          ? format(new Date(subscription.end_date), "d MMMM yyyy", { locale: uk })
                          : 'Постійний доступ'
                        }
                      </TableCell>
                      <TableCell>
                        {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Діалог підтвердження активації тарифу */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Підтвердження активації тарифу</DialogTitle>
            <DialogDescription>
              Перегляньте деталі обраного тарифного плану перед активацією.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlanId && (
            <div className="py-4">
              <div className="space-y-6">
                {/* Деталі тарифного плану */}
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    {availablePlans.find(p => p.id === selectedPlanId)?.name}
                  </h3>
                  <p className="text-2xl font-bold mb-2">
                    {availablePlans.find(p => p.id === selectedPlanId)?.price}{' '}
                    {availablePlans.find(p => p.id === selectedPlanId)?.currency.code}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    {availablePlans.find(p => p.id === selectedPlanId)?.is_permanent ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Infinity className="h-3.5 w-3.5" />
                        Постійний доступ
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {availablePlans.find(p => p.id === selectedPlanId)?.duration_days} днів
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Включені пункти */}
                {planItems.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Включені послуги:</h4>
                    <ul className="space-y-2">
                      {planItems.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Обмеження */}
                {planLimitations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Обмеження:</h4>
                    <ul className="space-y-2">
                      {planLimitations.map((limitation, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span>
                            {limitation.limitation_type.description || limitation.limitation_type.name}: <strong>{limitation.value}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activeSubscription && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Увага</AlertTitle>
                    <AlertDescription>
                      При активації нового тарифу, ваш поточний тариф "{activeSubscription.tariff_plan.name}" буде деактивовано.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button 
              onClick={handleActivatePlan}
              disabled={isActivating}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {isActivating ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                  Активація...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Активувати тариф
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTariffs;
