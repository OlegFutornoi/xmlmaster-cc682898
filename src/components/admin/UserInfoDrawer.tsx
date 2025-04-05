
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserX, Calendar, Trash2, Plus } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface UserSubscription {
  id: string;
  created_at: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  tariff_plan: {
    name: string;
    price: number;
    is_permanent: boolean;
    duration_days: number | null;
    currency: {
      code: string;
      name: string;
    }
  }
}

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  is_permanent: boolean;
  duration_days: number | null;
  currency: {
    code: string;
    name: string;
  }
}

interface UserInfoDrawerProps {
  userId: string | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserInfoDrawer: React.FC<UserInfoDrawerProps> = ({
  userId,
  userName,
  isOpen,
  onClose,
}) => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [addPlanDialogOpen, setAddPlanDialogOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<TariffPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 3;

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserSubscriptions();
    }
  }, [isOpen, userId, page]);

  const fetchUserSubscriptions = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data: subscriptionsData, error, count } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          *,
          tariff_plan:tariff_plans(
            name, 
            price, 
            is_permanent, 
            duration_days,
            currency:currencies(code, name)
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        throw error;
      }
      
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      setSubscriptions(subscriptionsData as UserSubscription[]);
    } catch (error) {
      console.error('Помилка завантаження підписок користувача:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося отримати інформацію про тарифні плани користувача',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    setLoadingPlans(true);
    try {
      const { data: plansData, error } = await supabase
        .from('tariff_plans')
        .select(`
          id,
          name,
          price,
          is_permanent,
          duration_days,
          currency:currencies(code, name)
        `)
        .order('price', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setAvailablePlans(plansData as TariffPlan[]);
      
      // Встановлюємо перший план як вибраний за замовчуванням
      if (plansData && plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }
    } catch (error) {
      console.error('Помилка завантаження доступних тарифних планів:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося отримати інформацію про доступні тарифні плани',
        variant: 'destructive',
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleToggleSubscription = async (subscriptionId: string, isCurrentlyActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', subscriptionId);

      if (error) {
        throw error;
      }

      // Оновлюємо стан локально
      setSubscriptions(prevSubscriptions =>
        prevSubscriptions.map(sub =>
          sub.id === subscriptionId ? { ...sub, is_active: !isCurrentlyActive } : sub
        )
      );

      toast({
        title: 'Успішно',
        description: !isCurrentlyActive 
          ? 'Тарифний план активовано' 
          : 'Тарифний план деактивовано',
      });
    } catch (error) {
      console.error('Помилка оновлення статусу підписки:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося змінити статус тарифного плану',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClick = (subscriptionId: string) => {
    setSubscriptionToDelete(subscriptionId);
    setConfirmDeleteDialogOpen(true);
  };

  const handleDeleteSubscription = async () => {
    if (!subscriptionToDelete) return;
    
    try {
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .delete()
        .eq('id', subscriptionToDelete);

      if (error) {
        throw error;
      }

      // Оновлюємо стан локально і оновлюємо список підписок
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.filter(sub => sub.id !== subscriptionToDelete)
      );
      
      toast({
        title: 'Успішно',
        description: 'Тарифний план видалено',
      });
      
      // Перезавантажуємо дані, якщо список став порожній або для оновлення пагінації
      if (subscriptions.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUserSubscriptions();
      }
    } catch (error) {
      console.error('Помилка видалення підписки:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити тарифний план',
        variant: 'destructive',
      });
    } finally {
      setConfirmDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };

  const handleAddPlan = async () => {
    if (!userId || !selectedPlanId) return;
    
    try {
      // Знаходимо вибраний план
      const selectedPlan = availablePlans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        throw new Error('Вибраний тарифний план не знайдено');
      }
      
      const startDate = new Date();
      let endDate = null;
      
      // Розраховуємо дату закінчення
      if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + selectedPlan.duration_days);
      }
      
      // Додаємо підписку для користувача
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .insert([
          {
            user_id: userId,
            tariff_plan_id: selectedPlanId,
            start_date: startDate.toISOString(),
            end_date: endDate ? endDate.toISOString() : null,
            is_active: true // Відразу активуємо
          }
        ]);

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Успішно',
        description: 'Тарифний план додано та активовано',
      });
      
      // Оновлюємо список підписок
      fetchUserSubscriptions();
    } catch (error) {
      console.error('Помилка додавання тарифного плану:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати тарифний план',
        variant: 'destructive',
      });
    } finally {
      setAddPlanDialogOpen(false);
    }
  };
  
  const handleDeleteAllInactive = async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('is_active', false);

      if (error) {
        throw error;
      }
      
      toast({
        title: 'Успішно',
        description: 'Всі неактивні тарифні плани видалено',
      });
      
      // Оновлюємо список підписок
      fetchUserSubscriptions();
    } catch (error) {
      console.error('Помилка видалення неактивних підписок:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити неактивні тарифні плани',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Безстроково';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: uk });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[90vw] max-w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Інформація про користувача</SheetTitle>
          <SheetDescription>
            Деталі користувача {userName}
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
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Додати план
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Додати тарифний план</DialogTitle>
                      <DialogDescription>
                        Виберіть тарифний план для користувача {userName}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {loadingPlans ? (
                      <div className="flex justify-center py-4">
                        <p>Завантаження тарифних планів...</p>
                      </div>
                    ) : (
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan">Тарифний план</Label>
                          <Select 
                            value={selectedPlanId} 
                            onValueChange={(value) => setSelectedPlanId(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть тарифний план" />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.name} - {plan.price} {plan.currency.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {selectedPlanId && (
                          <div className="text-sm">
                            <p className="font-semibold">Деталі плану:</p>
                            {(() => {
                              const plan = availablePlans.find(p => p.id === selectedPlanId);
                              return plan ? (
                                <div className="space-y-1 mt-2">
                                  <p>Ціна: {plan.price} {plan.currency.code}</p>
                                  <p>Тривалість: {plan.is_permanent ? 
                                    'Безстроковий' : 
                                    `${plan.duration_days} днів`}
                                  </p>
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setAddPlanDialogOpen(false)}
                      >
                        Скасувати
                      </Button>
                      <Button 
                        onClick={handleAddPlan} 
                        disabled={!selectedPlanId || loadingPlans}
                      >
                        Додати
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleDeleteAllInactive}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Видалити неактивні
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-6">
                <p>Завантаження...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Користувач не має тарифних планів</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {subscriptions.map((subscription) => (
                  <Card key={subscription.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span>{subscription.tariff_plan.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          subscription.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {subscription.is_active ? 'Активний' : 'Неактивний'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Початок дії: {formatDate(subscription.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {subscription.tariff_plan.is_permanent 
                              ? 'Безстроковий тариф' 
                              : `Закінчується: ${formatDate(subscription.end_date)}`}
                          </span>
                        </div>
                        <div className="mt-3 text-base">
                          Ціна: {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant={subscription.is_active ? "warning" : "success"}
                            size="sm"
                            onClick={() => handleToggleSubscription(subscription.id, subscription.is_active)}
                            className="flex-1"
                          >
                            {subscription.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Деактивувати
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Активувати
                              </>
                            )}
                          </Button>
                          
                          {!subscription.is_active && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(subscription.id)}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Видалити
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={page <= 1 ? 'pointer-events-none opacity-50' : ''} 
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            isActive={page === i + 1}
                            onClick={() => setPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
          
          {/* Підготовлений контейнер для майбутньої інформації про платежі */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Платежі</h3>
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Інформація про платежі буде доступна в майбутньому</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SheetContent>
      
      {/* Діалог підтвердження видалення */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Видалити тарифний план?</DialogTitle>
            <DialogDescription>
              Ви впевнені, що хочете видалити цей тарифний план? Цю дію неможливо відмінити.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubscription}>
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default UserInfoDrawer;
