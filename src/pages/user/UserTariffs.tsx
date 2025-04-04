import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Info, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UserTariffs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tariffPlans, setTariffPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [tariffItems, setTariffItems] = useState([]);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchActiveSubscription = async () => {
      if (user) {
        try {
          console.log('Fetching active subscription for user:', user.id);
          const { data: subscription, error } = await supabase
            .from('user_tariff_subscriptions')
            .select(`
              id,
              start_date,
              end_date,
              is_active,
              tariff_plans (
                id,
                name,
                price,
                is_permanent,
                duration_days,
                currencies (name, code)
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            console.error('Error fetching subscription:', error);
            toast({
              title: "Помилка",
              description: "Не вдалося завантажити дані про підписку",
              variant: "destructive",
            });
          } else {
            console.log('Active subscription:', subscription);
            setActiveSubscription(subscription);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    fetchActiveSubscription();
  }, [user, toast]);

  useEffect(() => {
    const fetchTariffPlans = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tariff_plans')
          .select(`
            id, 
            name, 
            price, 
            duration_days,
            is_permanent,
            currencies (
              code, 
              name
            )
          `)
          .order('price', { ascending: true });

        if (error) {
          console.error('Error fetching tariff plans:', error);
          toast({
            title: "Помилка",
            description: "Не вдалося завантажити тарифні плани",
            variant: "destructive",
          });
        } else {
          setTariffPlans(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTariffPlans();
  }, [toast]);

  const fetchTariffItems = async (planId) => {
    try {
      const { data, error } = await supabase
        .from('tariff_plan_items')
        .select(`
          id,
          is_active,
          tariff_item_id,
          tariff_items (id, description)
        `)
        .eq('tariff_plan_id', planId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching tariff items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const openPlanDetails = async (planId) => {
    try {
      const items = await fetchTariffItems(planId);
      const plan = tariffPlans.find(p => p.id === planId);
      
      setSelectedPlanDetails(plan);
      setTariffItems(items);
    } catch (error) {
      console.error('Error loading plan details:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити деталі тарифу",
        variant: "destructive",
      });
    }
  };

  const subscribeToPlan = async (planId) => {
    if (!user) {
      toast({
        title: "Помилка",
        description: "Ви не авторизовані",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      console.log('Subscribing to plan:', planId, 'for user:', user.id);
      const selectedPlan = tariffPlans.find(plan => plan.id === planId);
      
      if (!selectedPlan) {
        toast({
          title: "Помилка",
          description: "Тариф не знайдено",
          variant: "destructive",
        });
        return;
      }

      let endDate = null;
      if (!selectedPlan.is_permanent) {
        const startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
      }

      if (activeSubscription) {
        console.log('Deactivating current subscription:', activeSubscription.id);
        const { error: updateError } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .eq('id', activeSubscription.id);

        if (updateError) {
          console.error('Error deactivating current subscription:', updateError);
          toast({
            title: "Помилка",
            description: "Не вдалося деактивувати поточну підписку: " + updateError.message,
            variant: "destructive",
          });
          setIsSubscribing(false);
          return;
        }
      }

      console.log('Inserting new subscription with data:', {
        user_id: user.id,
        tariff_plan_id: planId,
        end_date: endDate,
        is_active: true
      });

      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .insert({
          user_id: user.id,
          tariff_plan_id: planId,
          end_date: endDate,
          is_active: true
        })
        .select();

      if (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося активувати тариф: " + error.message,
          variant: "destructive",
        });
        setIsSubscribing(false);
        return;
      }

      console.log('Subscription created successfully:', data);
      
      toast({
        title: "Успішно",
        description: "Тариф активовано",
      });

      const { data: subscription, error: fetchError } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          start_date,
          end_date,
          is_active,
          tariff_plans (
            id,
            name,
            price,
            is_permanent,
            duration_days,
            currencies (name, code)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching new subscription:', fetchError);
      } else {
        setActiveSubscription(subscription);
      }

      navigate('/user/dashboard');
    } catch (error) {
      console.error('Error subscribing to plan:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося активувати тариф",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Тарифи</h1>
      
      {activeSubscription && (
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              Активний тариф
            </CardTitle>
            <CardDescription>
              {activeSubscription.tariff_plans.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ціна:</p>
                <p className="font-medium">
                  {activeSubscription.tariff_plans.price} {activeSubscription.tariff_plans.currencies.code}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Тип доступу:</p>
                <p className="font-medium">
                  {activeSubscription.tariff_plans.is_permanent 
                    ? "Постійний доступ" 
                    : `${activeSubscription.tariff_plans.duration_days} днів`}
                </p>
              </div>
              {!activeSubscription.tariff_plans.is_permanent && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Дійсний до:</p>
                  <p className="font-medium">
                    {format(new Date(activeSubscription.end_date), "dd MMMM yyyy", { locale: uk })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Завантаження тарифів...</p>
        ) : (
          tariffPlans.map((plan) => (
            <Card key={plan.id} className="flex flex-col h-full transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price === 0 
                    ? "Демонстраційний" 
                    : `${plan.price} ${plan.currencies?.code || ""}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center gap-2 mb-4">
                  {plan.is_permanent ? (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                      Постійний доступ
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {plan.duration_days} днів
                    </Badge>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <Info className="w-4 h-4 inline-block mr-1" />
                  {plan.price === 0 
                    ? `Демонстраційний тариф на ${plan.duration_days} днів` 
                    : plan.is_permanent 
                      ? "Цей тариф надає постійний доступ до всіх функцій" 
                      : `Цей тариф дійсний протягом ${plan.duration_days} днів`}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline"
                      onClick={() => openPlanDetails(plan.id)}
                      className="w-full sm:w-auto"
                    >
                      Деталі
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{selectedPlanDetails?.name}</SheetTitle>
                      <SheetDescription>
                        {selectedPlanDetails?.price === 0
                          ? "Демонстраційний"
                          : `${selectedPlanDetails?.price} ${selectedPlanDetails?.currencies?.code || ""}`}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-2">Доступ:</h4>
                      <Badge className={selectedPlanDetails?.is_permanent 
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-200" 
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"}>
                        {selectedPlanDetails?.is_permanent 
                          ? "Постійний доступ" 
                          : `${selectedPlanDetails?.duration_days} днів`}
                      </Badge>
                      
                      <h4 className="text-sm font-medium mb-2 mt-4">Доступні функції:</h4>
                      {tariffItems.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Опис функції</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tariffItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.tariff_items.description}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground">Немає доступних функцій</p>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <SheetClose asChild>
                        <Button>Закрити</Button>
                      </SheetClose>
                    </div>
                  </SheetContent>
                </Sheet>
                
                <Button 
                  onClick={() => subscribeToPlan(plan.id)} 
                  className="w-full sm:w-auto"
                  disabled={activeSubscription?.tariff_plans.id === plan.id || isSubscribing}
                  variant={activeSubscription?.tariff_plans.id === plan.id ? "outline" : "default"}
                >
                  {isSubscribing 
                    ? "Обробка..." 
                    : activeSubscription?.tariff_plans.id === plan.id 
                      ? "Активний" 
                      : "Вибрати"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default UserTariffs;
