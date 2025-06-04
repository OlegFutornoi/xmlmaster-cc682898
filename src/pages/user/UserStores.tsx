
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

  useEffect(() => {
    refetchSubscriptions();
    fetchUserStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0 || !isLoading || activeSubscription) {
      fetchUserLimitations();
    }
  }, [stores, isLoading, activeSubscription]);

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

  const fetchUserLimitations = async () => {
    if (!user || !activeSubscription) {
      setStoresLimit(0);
      setCanCreateStore(false);
      return;
    }
    try {
      const { data: limitationData, error: limitationError } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', activeSubscription.tariff_plan.id)
        .eq('limitation_types.name', 'stores_count');

      if (limitationError) {
        console.error('Error fetching limitations:', limitationError);
        return;
      }

      if (limitationData && limitationData.length > 0) {
        const storesLimitValue = parseInt(limitationData[0].value);
        setStoresLimit(storesLimitValue);
        setCanCreateStore(stores.length < storesLimitValue);
      } else {
        setStoresLimit(0);
        setCanCreateStore(false);
      }
    } catch (error) {
      console.error('Error fetching limitations:', error);
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

  const resetDialog = () => {
    setNewStoreName('');
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Магазини</h1>
                <p className="text-gray-600">Керуйте своїми магазинами та налаштуйте інтеграції</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {storesLimit !== null && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1">
                  <Store className="h-4 w-4 mr-2" />
                  {stores.length} з {storesLimit}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!canCreateStore}
                      onClick={resetDialog}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg"
                      id="create-store-button"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Створити магазин
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {canCreateStore ? "Створити магазин" : `Досягнуто ліміт магазинів (${storesLimit})`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження магазинів...</p>
          </div>
        ) : stores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stores.map(store => (
              <Card key={store.id} className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-gray-900 line-clamp-1">{store.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {format(new Date(store.created_at), "dd.MM.yyyy", { locale: uk })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(store)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              id={`delete-store-${store.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Видалити</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    id={`manage-store-${store.id}`}
                    onClick={() => console.log('Manage store:', store.id)}
                  >
                    Керувати
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg max-w-2xl mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900">У вас ще немає магазинів</CardTitle>
              <CardDescription className="text-gray-600">
                Створіть свій перший магазин, щоб почати роботу з інтеграціями
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {canCreateStore ? (
                <Button
                  onClick={resetDialog}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg"
                >
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
      </div>

      {/* Dialog для створення магазину */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Створити новий магазин</DialogTitle>
            <DialogDescription className="text-gray-600">
              Введіть назву для вашого нового магазину
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="store-name" className="text-gray-700">Назва магазину</Label>
              <Input
                id="store-name"
                value={newStoreName}
                onChange={e => setNewStoreName(e.target.value)}
                placeholder="Введіть назву магазину"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-emerald-200 hover:bg-emerald-50">
              Скасувати
            </Button>
            <Button
              onClick={handleCreateStore}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {isSubmitting ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog підтвердження видалення */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Видалити магазин?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Ви впевнені, що хочете видалити магазин "{storeToDelete?.name}"? 
              Ця дія не може бути скасована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-200 hover:bg-emerald-50">Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
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
