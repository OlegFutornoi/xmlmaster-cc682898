// Головна сторінка для управління тарифними планами в адмін-панелі
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TariffCard from '@/components/admin/tariffs/TariffCard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import TariffItemsManager from '@/components/admin/tariffs/TariffItemsManager';

const AdminTariffs = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tariffPlans, setTariffPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchTariffPlans();
  }, []);

  const fetchTariffPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
          id,
          name,
          description,
          price,
          duration_days,
          is_permanent,
          currencies (
            code
          )
        `);

      if (error) {
        console.error('Error fetching tariff plans:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити тарифні плани',
          variant: 'destructive',
        });
        return;
      }

      setTariffPlans(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTariffPlan = async (id) => {
    setDeletingPlanId(id);
    try {
      const { error } = await supabase
        .from('tariff_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tariff plan:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося видалити тарифний план',
          variant: 'destructive',
        });
        return;
      }

      // Після успішного видалення оновлюємо список тарифів
      fetchTariffPlans();
      toast({
        title: 'Успішно',
        description: 'Тарифний план видалено',
      });
    } finally {
      setDeletingPlanId(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900">
              Тарифні плани
            </h1>
          </header>

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-4 md:p-8'}`}>
            <div className="space-y-6">
              {/* Кнопка додавання нового тарифу */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Управління тарифами</h2>
                  <p className="text-sm text-muted-foreground">
                    Створюйте та редагуйте тарифні плани
                  </p>
                </div>
                <Button onClick={() => navigate('/admin/tariffs/new')} id="add-tariff-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Новий тариф
                </Button>
              </div>

              {/* Компонент управління пунктами тарифів */}
              <TariffItemsManager />

              {/* Існуючий код для відображення тарифів */}
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {tariffPlans.length > 0 ? (
                    tariffPlans.map((plan) => (
                      <TariffCard
                        key={plan.id}
                        plan={plan}
                        onEdit={() => navigate(`/admin/tariffs/${plan.id}`)}
                        onDelete={() => deleteTariffPlan(plan.id)}
                        isDeleting={deletingPlanId === plan.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Немає створених тарифних планів</p>
                      <Button onClick={() => navigate('/admin/tariffs/new')} variant="outline">
                        Створити перший тариф
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminTariffs;
