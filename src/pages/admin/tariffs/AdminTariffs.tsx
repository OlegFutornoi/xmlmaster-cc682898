// Компонент для управління тарифними планами в адмін-панелі
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, Clock, CheckSquare, Trash2, Copy } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const AdminTariffs = () => {
  const [tariffPlans, setTariffPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const fetchTariffPlans = async () => {
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('tariff_plans').select(`
          id, 
          name, 
          price, 
          created_at,
          duration_days,
          is_permanent,
          currencies (
            code, 
            name
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Помилка завантаження тарифних планів:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити тарифні плани",
          variant: "destructive"
        });
      } else {
        setTariffPlans(data || []);
      }
    } catch (error) {
      console.error('Помилка:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTariffPlans();
  }, []);
  const handleDeletePlan = async id => {
    setIsDeleting(true);
    try {
      console.log('Видалення тарифного плану з ID:', id);

      // Спочатку деактивуємо пов'язані підписки
      const {
        error: subsError
      } = await supabase.from('user_tariff_subscriptions').update({
        is_active: false
      }).eq('tariff_plan_id', id);
      if (subsError) {
        console.error('Помилка деактивації підписок:', subsError);
        toast({
          title: "Помилка",
          description: "Не вдалося деактивувати підписки: " + subsError.message,
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }

      // Видаляємо пов'язані записи з tariff_plan_items
      const {
        error: itemsError
      } = await supabase.from('tariff_plan_items').delete().eq('tariff_plan_id', id);
      if (itemsError) {
        console.error('Помилка видалення пов\'язаних елементів:', itemsError);
        toast({
          title: "Помилка",
          description: "Не вдалося видалити пов'язані елементи: " + itemsError.message,
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }

      // Потім видаляємо сам тарифний план
      const {
        error: planError
      } = await supabase.from('tariff_plans').delete().eq('id', id);
      if (planError) {
        console.error('Помилка видалення тарифного плану:', planError);
        toast({
          title: "Помилка",
          description: "Не вдалося видалити тарифний план: " + planError.message,
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }
      toast({
        title: "Успішно",
        description: "Тарифний план видалено"
      });

      // Оновлюємо список тарифних планів, видаляючи план локально
      setTariffPlans(prevPlans => prevPlans.filter(plan => plan.id !== id));
    } catch (error) {
      console.error('Помилка видалення тарифного плану:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити тарифний план: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const handleCopyPlan = async plan => {
    setIsCopying(true);
    try {
      console.log('Copying plan:', plan);

      // Отримуємо ID валюти з currency_id або отримуємо з бази даних
      let currencyId = null;
      if (!plan.currency_id) {
        // Отримуємо ID валюти з бази даних, якщо його немає в об'єкті plan
        const {
          data: planData,
          error: planFetchError
        } = await supabase.from('tariff_plans').select('currency_id').eq('id', plan.id).single();
        if (planFetchError) {
          throw new Error('Не вдалося отримати інформацію про валюту тарифного плану');
        }
        currencyId = planData.currency_id;
      } else {
        currencyId = plan.currency_id;
      }
      if (!currencyId) {
        throw new Error('ID валюти не знайдено');
      }

      // Створюємо копію тарифного плану
      const {
        data: newPlan,
        error: planError
      } = await supabase.from('tariff_plans').insert({
        name: `${plan.name} (копія)`,
        price: plan.price,
        duration_days: plan.duration_days,
        is_permanent: plan.is_permanent,
        currency_id: currencyId
      }).select().single();
      if (planError) {
        throw planError;
      }

      // Копіюємо пов'язані обмеження
      const {
        data: limitations,
        error: limitationsError
      } = await supabase.from('tariff_plan_limitations').select('limitation_type_id, value').eq('tariff_plan_id', plan.id);
      if (!limitationsError && limitations?.length > 0) {
        const newLimitations = limitations.map(item => ({
          tariff_plan_id: newPlan.id,
          limitation_type_id: item.limitation_type_id,
          value: item.value
        }));
        await supabase.from('tariff_plan_limitations').insert(newLimitations);
      }

      // Копіюємо пов'язані пункти
      const {
        data: items,
        error: itemsError
      } = await supabase.from('tariff_plan_items').select('tariff_item_id, is_active').eq('tariff_plan_id', plan.id);
      if (!itemsError && items?.length > 0) {
        const newItems = items.map(item => ({
          tariff_plan_id: newPlan.id,
          tariff_item_id: item.tariff_item_id,
          is_active: item.is_active
        }));
        await supabase.from('tariff_plan_items').insert(newItems);
      }
      toast({
        title: "Успішно",
        description: "Тарифний план скопійовано"
      });

      // Оновлюємо список тарифних планів
      fetchTariffPlans();
    } catch (error) {
      console.error('Помилка копіювання тарифного плану:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося скопіювати тарифний план: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex justify-between items-center w-full">
              <h1 className="text-xl font-semibold">
                Тарифи
              </h1>
              <Button onClick={() => navigate('/admin/tariffs/new')} id="add-tariff-button">
                <Plus className="mr-2 h-4 w-4" />
                Додати тариф
              </Button>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8">
            <Tabs defaultValue="plans">
              <TabsList className="mb-4">
                <TabsTrigger value="plans">Тарифні плани</TabsTrigger>
                <TabsTrigger value="currencies" onClick={() => navigate('/admin/tariffs/currencies')}>
                  Валюти
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="plans" className="space-y-4">
                {isLoading ? <div className="flex justify-center p-4">
                    <p>Завантаження...</p>
                  </div> : tariffPlans.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tariffPlans.map(plan => <Card key={plan.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle>{plan.name}</CardTitle>
                          <CardDescription>
                            {plan.price} {plan.currencies.code}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <div className="flex items-center text-sm text-muted-foreground mb-4">
                            {plan.is_permanent ? <div className="flex items-center">
                                <CheckSquare className="mr-2 h-4 w-4" />
                                <span>Постійний доступ</span>
                              </div> : <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Термін дії: {plan.duration_days} днів</span>
                              </div>}
                          </div>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => navigate(`/admin/tariffs/${plan.id}`)} id={`tariff-details-${plan.id}`}>
                              Деталі
                            </Button>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="secondary" size="icon" className="mr-2 h-9 w-9" onClick={() => handleCopyPlan(plan)} disabled={isCopying} id={`tariff-copy-${plan.id}`}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Копіювати тариф</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-9 w-9" disabled={isDeleting} id={`tariff-delete-${plan.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ця дія не може бути скасована. Буде видалено тарифний план "{plan.name}" та всі пов'язані з ним дані.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePlan(plan.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
                                    {isDeleting ? "Видалення..." : "Видалити"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div> : <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground mb-4">
                        Немає тарифних планів. Створіть свій перший тарифний план.
                      </p>
                      <Button onClick={() => navigate('/admin/tariffs/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Додати тариф
                      </Button>
                    </CardContent>
                  </Card>}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default AdminTariffs;