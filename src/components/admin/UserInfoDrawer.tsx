
import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronUp, Trash2, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type UserInfoDrawerProps = {
  userId: string | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
};

type UserSubscription = {
  id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  tariff_plans: {
    id: string;
    name: string;
    price: number;
    is_permanent: boolean;
    duration_days: number | null;
    currencies: {
      code: string;
      name: string;
    };
  };
};

type TariffPlan = {
  id: string;
  name: string;
  price: number;
  is_permanent: boolean;
  duration_days: number | null;
  currencies: {
    code: string;
    name: string;
  };
};

const UserInfoDrawer = ({ userId, userName, isOpen, onClose }: UserInfoDrawerProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<TariffPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [confirmDeactivateDialogOpen, setConfirmDeactivateDialogOpen] = useState(false);

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserData();
      fetchSubscriptions();
    }
  }, [userId, isOpen]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося отримати дані користувача",
          variant: "destructive",
        });
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
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
        .eq('user_id', userId)
        .order('is_active', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося отримати дані про тарифні плани користувача",
          variant: "destructive",
        });
      } else {
        setSubscriptions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
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
          is_permanent,
          duration_days,
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
        // Фільтруємо плани, які вже є у користувача
        const userPlanIds = subscriptions.map(sub => sub.tariff_plans.id);
        const filteredPlans = data?.filter(plan => !userPlanIds.includes(plan.id)) || [];
        
        setAvailablePlans(filteredPlans);
        if (filteredPlans.length > 0) {
          setSelectedPlanId(filteredPlans[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteInactiveSubscriptions = async () => {
    if (!userId) return;
    
    try {
      setIsDeleting(true);
      const inactiveSubscriptions = subscriptions
        .filter(sub => !sub.is_active)
        .map(sub => sub.id);
        
      if (inactiveSubscriptions.length === 0) {
        toast({
          title: "Інформація",
          description: "Немає неактивних тарифних планів для видалення",
        });
        return;
      }
      
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .delete()
        .in('id', inactiveSubscriptions);

      if (error) {
        console.error('Error deleting subscriptions:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося видалити неактивні тарифні плани",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успішно",
          description: `Видалено ${inactiveSubscriptions.length} неактивних тарифних планів`,
        });
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddPlan = async () => {
    if (!userId || !selectedPlanId) return;
    
    try {
      setIsAddingPlan(true);
      
      const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        toast({
          title: "Помилка",
          description: "Обраний тариф не знайдено",
          variant: "destructive",
        });
        return;
      }
      
      let endDate = null;
      if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
        const startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
      }
      
      // Додати новий тарифний план як неактивний
      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .insert([
          {
            user_id: userId,
            tariff_plan_id: selectedPlanId,
            is_active: false, // Зробимо план неактивним при додаванні
            end_date: endDate
          }
        ])
        .select();

      if (error) {
        console.error('Error adding subscription:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося додати тарифний план користувачу",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успішно",
          description: "Тарифний план додано користувачу",
        });
        setAddPlanDialogOpen(false);
        fetchSubscriptions();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsAddingPlan(false);
    }
  };

  const handleActivatePlan = async (subscriptionId: string) => {
    try {
      // Спочатку деактивуємо всі інші плани
      const { error: deactivateError } = await supabase
        .from('user_tariff_subscriptions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) {
        console.error('Error deactivating other plans:', deactivateError);
        toast({
          title: "Помилка",
          description: "Не вдалося деактивувати інші тарифні плани",
          variant: "destructive",
        });
        return;
      }

      // Тепер активуємо вибраний план
      const { error: activateError } = await supabase
        .from('user_tariff_subscriptions')
        .update({ is_active: true })
        .eq('id', subscriptionId);

      if (activateError) {
        console.error('Error activating plan:', activateError);
        toast({
          title: "Помилка",
          description: "Не вдалося активувати тарифний план",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Успішно",
        description: "Тарифний план активовано",
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Постійний доступ';
    return format(new Date(dateString), "dd MMMM yyyy", { locale: uk });
  };

  if (!isOpen || !userId) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90vw] max-w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Інформація про користувача</SheetTitle>
          <SheetDescription>
            {userName} {user?.id && <span className="text-xs">({user.id})</span>}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
              <h3 className="text-lg font-medium">Тарифні плани</h3>
              <div className="flex flex-wrap gap-2">
                <Dialog open={addPlanDialogOpen} onOpenChange={(open) => {
                  setAddPlanDialogOpen(open);
                  if (open) fetchAvailablePlans();
                }}>
                  <Button variant="outline" size="sm" onClick={() => setAddPlanDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Додати план
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Додати тарифний план</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      {availablePlans.length === 0 ? (
                        <p className="text-center text-muted-foreground">
                          Немає доступних тарифних планів для додавання
                        </p>
                      ) : (
                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Виберіть тарифний план" />
                          </SelectTrigger>
                          <SelectContent>
                            {availablePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.name} - {plan.price} {plan.currencies.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddPlanDialogOpen(false)}>
                        Скасувати
                      </Button>
                      <Button 
                        onClick={handleAddPlan}
                        disabled={availablePlans.length === 0 || !selectedPlanId || isAddingPlan}
                      >
                        {isAddingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Додати
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteInactiveSubscriptions}
                  disabled={isDeleting || !subscriptions.some(sub => !sub.is_active)}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Видалити неактивні
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <p>Завантаження...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="bg-muted/50 p-4 rounded-md text-center">
                <p>Немає активних тарифних планів</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((subscription) => (
                  <div 
                    key={subscription.id} 
                    className={`p-4 rounded-md border ${
                      subscription.is_active ? 'bg-blue-50 border-blue-200' : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{subscription.tariff_plans.name}</span>
                          {subscription.is_active ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Активний</Badge>
                          ) : (
                            <Badge variant="outline">Неактивний</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.tariff_plans.price} {subscription.tariff_plans.currencies.code} •
                          {subscription.tariff_plans.is_permanent 
                            ? ' Постійний доступ' 
                            : ` ${subscription.tariff_plans.duration_days} днів`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm whitespace-nowrap">
                          {subscription.tariff_plans.is_permanent 
                            ? null
                            : <span>
                                До {formatDate(subscription.end_date)}
                              </span>
                          }
                        </div>
                        {!subscription.is_active && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleActivatePlan(subscription.id)}
                            className="whitespace-nowrap"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Активувати
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="details">
              <AccordionTrigger>Деталі користувача</AccordionTrigger>
              <AccordionContent>
                <dl className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-medium text-muted-foreground w-32">Email:</dt>
                    <dd>{user?.email || '—'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-medium text-muted-foreground w-32">Створено:</dt>
                    <dd>{user?.created_at ? formatDate(user.created_at) : '—'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-medium text-muted-foreground w-32">Останній вхід:</dt>
                    <dd>{user?.last_login ? formatDate(user.last_login) : 'Ніколи'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    <dt className="font-medium text-muted-foreground w-32">Статус:</dt>
                    <dd>
                      <Badge variant={user?.is_active ? "success" : "destructive"}>
                        {user?.is_active ? 'Активний' : 'Неактивний'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div>
            <Tabs defaultValue="plan-management">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="plan-management">Управління тарифами</TabsTrigger>
                <TabsTrigger value="usage-statistics" disabled>Статистика використання</TabsTrigger>
                <TabsTrigger value="payment-info" disabled>Платіжна інформація</TabsTrigger>
              </TabsList>
              <TabsContent value="plan-management" className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Тут будуть додаткові функції управління тарифними планами та підписками користувача.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserInfoDrawer;
