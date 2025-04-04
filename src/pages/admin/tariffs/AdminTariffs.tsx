
import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, Clock, CheckSquare, Trash2 } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminTariffs = () => {
  const [tariffPlans, setTariffPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planToDelete, setPlanToDelete] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchTariffPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
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
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка завантаження тарифних планів:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося завантажити тарифні плани",
          variant: "destructive",
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

  const handleDeletePlan = async (id) => {
    try {
      // Спочатку видаляємо пов'язані записи з tariff_plan_items
      const { error: itemsError } = await supabase
        .from('tariff_plan_items')
        .delete()
        .eq('tariff_plan_id', id);

      if (itemsError) {
        throw itemsError;
      }

      // Потім видаляємо сам тарифний план
      const { error: planError } = await supabase
        .from('tariff_plans')
        .delete()
        .eq('id', id);

      if (planError) {
        throw planError;
      }

      toast({
        title: "Успішно",
        description: "Тарифний план видалено",
        variant: "success",
      });

      // Оновлюємо список тарифних планів
      fetchTariffPlans();
    } catch (error) {
      console.error('Помилка видалення тарифного плану:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося видалити тарифний план",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Тарифи</h1>
          <Button onClick={() => navigate('/admin/tariffs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Додати тариф
          </Button>
        </div>

        <Tabs defaultValue="plans">
          <TabsList className="mb-4">
            <TabsTrigger value="plans">Тарифні плани</TabsTrigger>
            <TabsTrigger value="currencies" onClick={() => navigate('/admin/tariffs/currencies')}>
              Валюти
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <p>Завантаження...</p>
              </div>
            ) : tariffPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tariffPlans.map((plan) => (
                  <Card key={plan.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.price} {plan.currencies.code}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        {plan.is_permanent ? (
                          <div className="flex items-center">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            <span>Постійний доступ</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>Термін дії: {plan.duration_days} днів</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => navigate(`/admin/tariffs/${plan.id}`)}
                        >
                          Деталі
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                            >
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
                              <AlertDialogAction 
                                onClick={() => handleDeletePlan(plan.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Видалити
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
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
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AdminTariffs;
