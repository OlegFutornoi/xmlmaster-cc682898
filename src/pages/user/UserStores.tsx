
// Компонент для відображення та управління магазинами користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PlusCircle, Store, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { usePlanLimitations } from '@/hooks/tariffs/usePlanLimitations';

interface UserStore {
  id: string;
  name: string;
  created_at: string;
}

const UserStores = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSubscription, refetchSubscriptions } = useUserSubscriptions();
  const [stores, setStores] = useState<UserStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storesLimit, setStoresLimit] = useState<number | null>(null);
  const [canCreateStore, setCanCreateStore] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<UserStore | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Використовуємо хук usePlanLimitations з правильним аргументом (може бути null)
  const { planLimitations, getLimitationByName } = usePlanLimitations(activeSubscription?.tariff_plan?.id || null);

  useEffect(() => {
    // Оновлюємо підписку при завантаженні сторінки
    refetchSubscriptions();
    fetchUserStores();
  }, []);

  // Окремий useEffect для оновлення обмежень після отримання даних магазинів та підписки
  useEffect(() => {
    if (activeSubscription && planLimitations.length > 0) {
      updateStoresLimitation();
    }
  }, [activeSubscription, planLimitations, stores.length]);

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
          variant: 'destructive'
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

  const updateStoresLimitation = () => {
    if (!activeSubscription) {
      setStoresLimit(0);
      setCanCreateStore(false);
      return;
    }
    
    try {
      // Отримуємо конкретне обмеження за назвою
      const storesLimitation = getLimitationByName('stores_count');
      if (storesLimitation) {
        const storesLimitValue = storesLimitation.value;
        console.log('Stores limit from limitation:', storesLimitValue);
        setStoresLimit(storesLimitValue);

        // Перевіряємо кількість магазинів строго менше ліміту
        setCanCreateStore(stores.length < storesLimitValue);
      } else {
        // Якщо обмеження не знайдено, встановлюємо значення 0
        console.log('No stores_count limitation found, setting to 0');
        setStoresLimit(0);
        setCanCreateStore(false);
      }
    } catch (error) {
      console.error('Error updating stores limitation:', error);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву магазину',
        variant: 'destructive'
      });
      return;
    }
    
    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти для створення магазину',
        variant: 'destructive'
      });
      return;
    }

    // Додаткова перевірка перед створенням - чи не перевищено ліміт
    if (storesLimit !== null && stores.length >= storesLimit) {
      toast({
        title: 'Помилка',
        description: 'Ви досягли ліміту створення магазинів. Оновіть тарифний план.',
        variant: 'destructive'
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
        description: 'Магазин успішно створено'
      });
      
      setNewStoreName('');
      setIsDialogOpen(false);
      fetchUserStores();
    } catch (error) {
      console.error('Error creating store:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити магазин',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async () => {
    if (!storeToDelete || !user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_stores')
        .delete()
        .eq('id', storeToDelete.id)
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Успішно',
        description: 'Магазин успішно видалено'
      });
      
      setIsDeleteDialogOpen(false);
      setStoreToDelete(null);
      fetchUserStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити магазин',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (store: UserStore) => {
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Магазини</h1>
        
        <div className="flex items-center gap-2">
          {storesLimit !== null && (
            <Badge variant="outline" className="flex items-center px-2 py-1 text-xs">
              <Store className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-muted-foreground">
                {stores.length} з {storesLimit}
              </span>
            </Badge>
          )}
          
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
                    id="create-store-button"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {canCreateStore ? "Створити магазин" : `Досягнуто ліміт магазинів (${storesLimit})`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {isLoading ? (
        <p>Завантаження магазинів...</p>
      ) : stores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stores.map(store => (
            <Card key={store.id} className="overflow-hidden transition-all duration-200 hover:shadow-md relative h-[120px]">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => openDeleteDialog(store)} 
                className="absolute top-1 right-1 text-red-500 hover:text-red-700 hover:bg-red-50 z-10 h-6 w-6"
                id={`delete-store-${store.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {store.name}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(new Date(store.created_at), "dd.MM.yyyy", { locale: uk })}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2 px-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7 px-2 w-full flex justify-between items-center"
                  id={`manage-store-${store.id}`}
                >
                  Керувати
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardDescription className="text-sm">
              Створіть свій перший магазин, щоб почати роботу
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateStore ? (
              <Button onClick={() => setIsDialogOpen(true)} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Створити магазин
              </Button>
            ) : (
              <p className="text-sm text-gray-600">
                Для створення магазину необхідно оновити тарифний план
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Діалог створення магазину */}
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
                onChange={e => setNewStoreName(e.target.value)} 
                placeholder="Введіть назву магазину" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleCreateStore} disabled={isSubmitting}>
              {isSubmitting ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити магазин?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити магазин "{storeToDelete?.name}"? 
              Ця дія не може бути скасована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteStore} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserStores;
