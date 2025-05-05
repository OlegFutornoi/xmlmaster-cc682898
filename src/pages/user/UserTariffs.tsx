// Компонент для відображення тарифних планів користувача
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTariffPlans } from '@/hooks/tariffs/useTariffPlans';
import { useActiveSubscription } from '@/hooks/tariffs/useActiveSubscription';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CurrentSubscription from '@/components/user/tariffs/CurrentSubscription';

const UserTariffs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tariffPlans, isLoading: isLoadingTariffPlans } = useTariffPlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { activeSubscription, isLoading: isLoadingActiveSubscription } = useActiveSubscription(user?.id || '', isDialogOpen);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/user/login');
    }
  }, [user, navigate]);

  const handleSubscribe = async (tariffPlanId: string) => {
    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти, щоб підписатися на тарифний план',
        variant: 'destructive',
      });
      return;
    }

    setIsSubscribing(true);

    try {
      // Перевірка, чи вже є активна підписка
      if (activeSubscription) {
        toast({
          title: 'Помилка',
          description: 'У вас вже є активна підписка. Будь ласка, скасуйте її спочатку.',
          variant: 'destructive',
        });
        return;
      }

      // Створення нової підписки
      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .insert([
          {
            user_id: user.id,
            tariff_plan_id: tariffPlanId,
            start_date: new Date().toISOString(),
            is_active: true,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Ви успішно підписалися на тарифний план',
      });

      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error subscribing to tariff plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося підписатися на тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Тарифні плани</h1>

      {isLoadingActiveSubscription ? (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activeSubscription ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Поточна підписка</CardTitle>
            <CardDescription>Інформація про вашу поточну підписку</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrentSubscription subscription={activeSubscription as any} openDialog={() => setIsDialogOpen(true)} />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>У вас немає активної підписки</CardTitle>
            <CardDescription>Оберіть тарифний план, щоб почати користуватися сервісом</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingTariffPlans ? (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          tariffPlans.map((tariffPlan) => (
            <Card key={tariffPlan.id}>
              <CardHeader>
                <CardTitle>{tariffPlan.name}</CardTitle>
                <CardDescription>
                  {tariffPlan.is_permanent
                    ? 'Безстроковий тариф'
                    : `Тариф на ${tariffPlan.duration_days} днів`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tariffPlan.price} {tariffPlan.currency.code}
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => handleSubscribe(tariffPlan.id)}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Підписка...
                    </>
                  ) : (
                    'Підписатися'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Підписка активована</DialogTitle>
            <DialogDescription>
              Вітаємо, ви успішно підписалися на тарифний план!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserTariffs;
