
import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';

const AdminTariffs = () => {
  const [tariffPlans, setTariffPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
            created_at,
            currencies (
              code, 
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tariff plans:', error);
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
  }, []);

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
                      <div className="flex justify-end mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => navigate(`/admin/tariffs/${plan.id}`)}
                        >
                          Деталі
                        </Button>
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
