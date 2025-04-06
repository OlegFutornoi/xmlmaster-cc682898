
// Компонент для відображення та управління магазинами користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PlusCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface UserStore {
  id: string;
  name: string;
  created_at: string;
}

interface LimitationValue {
  limitation_type: {
    name: string;
    description: string;
  };
  value: number;
}

const UserStores = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stores, setStores] = useState<UserStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storesLimit, setStoresLimit] = useState<number | null>(null);
  const [canCreateStore, setCanCreateStore] = useState(false);

  useEffect(() => {
    console.log('UserStores component mounted');
    fetchUserStores();
    fetchUserLimitations();
  }, []);

  const fetchUserStores = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await extendedSupabase
        .from('user_stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stores:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити магазини',
          variant: 'destructive',
        });
      } else {
        setStores(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLimitations = async () => {
    if (!user) return;
    
    try {
      // Спочатку отримуємо активну підписку користувача
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_tariff_subscriptions')
        .select('tariff_plan_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching active subscription:', subscriptionError);
        return;
      }

      if (!subscriptionData) {
        // Якщо немає активної підписки, користувач не може створювати магазини
        setStoresLimit(0);
        setCanCreateStore(false);
        return;
      }

      // Отримуємо обмеження для активного тарифу користувача
      const { data: limitationData, error: limitationError } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', subscriptionData.tariff_plan_id)
        .eq('limitation_types.name', 'stores_count');

      if (limitationError) {
        console.error('Error fetching limitations:', limitationError);
        return;
      }

      if (limitationData && limitationData.length > 0) {
        const storesLimitValue = limitationData[0].value;
        setStoresLimit(storesLimitValue);
        
        // Перевіряємо, чи може користувач створити ще один магазин
        setCanCreateStore(storesLimitValue > 0 && (stores.length < storesLimitValue));
      } else {
        // Якщо обмеження не знайдено, встановлюємо значення 0
        setStoresLimit(0);
        setCanCreateStore(false);
      }
    } catch (error) {
      console.error('Error fetching limitations:', error);
    }
  };

  useEffect(() => {
    // Оновлюємо стан canCreateStore коли змінюється кількість магазинів
    if (storesLimit !== null) {
      setCanCreateStore(storesLimit > 0 && (stores.length < storesLimit));
    }
  }, [stores.length, storesLimit]);

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву магазину',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти для створення магазину',
        variant: 'destructive',
      });
      return;
    }

    if (!canCreateStore) {
      toast({
        title: 'Помилка',
        description: 'Ви досягли ліміту створення магазинів. Оновіть тарифний план.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await extendedSupabase
        .from('user_stores')
        .insert({
          user_id: user.id,
          name: newStoreName.trim()
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Магазин успішно створено',
      });
      
      setNewStoreName('');
      setIsDialogOpen(false);
      fetchUserStores();
      fetchUserLimitations();
    } catch (error) {
      console.error('Error creating store:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити магазин',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Магазини</h1>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full"
                  disabled={!canCreateStore}
                  onClick={() => setIsDialogOpen(true)}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {canCreateStore 
                ? "Створити магазин" 
                : "Функціонал не доступний"
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {storesLimit !== null && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">
                {stores.length} з {storesLimit} доступних магазинів
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoading ? (
        <p>Завантаження магазинів...</p>
      ) : stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <Card key={store.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {store.name}
                </CardTitle>
                <CardDescription>
                  Створено: {format(new Date(store.created_at), "dd MMMM yyyy", { locale: uk })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Керувати магазином
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>У вас ще немає магазинів</CardTitle>
            <CardDescription>
              Створіть свій перший магазин, щоб почати роботу
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateStore ? (
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Створити магазин
              </Button>
            ) : (
              <p className="text-gray-600">
                Для створення магазину необхідно оновити тарифний план
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити новий магазин</DialogTitle>
            <DialogDescription>
              Введіть назву для вашого нового магазину
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="store-name">Назва магазину</Label>
              <Input 
                id="store-name" 
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Введіть назву магазину"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button 
              onClick={handleCreateStore}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserStores;
