
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserX, Calendar, Trash2 } from 'lucide-react';

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
} from '@/components/ui/dialog';

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Безстроково';
    return format(new Date(dateString), 'd MMMM yyyy', { locale: uk });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Інформація про користувача</SheetTitle>
          <SheetDescription>
            Деталі користувача {userName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Тарифні плани</h3>
            
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
