
// Компонент для відображення та управління постачальниками користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PlusCircle, Trash2, Pencil, ExternalLink, FilePlus, AlertCircle } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  created_at: string;
}

const UserSuppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSubscription, refetchSubscriptions } = useUserSubscriptions();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliersLimit, setSuppliersLimit] = useState<number | null>(null);
  const [canCreateSupplier, setCanCreateSupplier] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    // Оновлюємо підписку при кожному заході на сторінку
    const refreshData = async () => {
      if (user) {
        await refetchSubscriptions();
        await fetchUserSuppliers();
      }
    };
    
    refreshData();
    
    // Встановлюємо інтервал для регулярної перевірки підписки і обмежень
    const intervalId = setInterval(async () => {
      if (user) {
        await refetchSubscriptions();
        fetchUserLimitations();
      }
    }, 60000); // перевірка кожну хвилину
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  // Окремий useEffect для оновлення обмежень після оновлення підписки
  useEffect(() => {
    if (activeSubscription) {
      console.log('Active subscription updated, refreshing limitations');
      fetchUserLimitations();
    }
  }, [activeSubscription]);

  const fetchUserSuppliers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await extendedSupabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити постачальників',
          variant: 'destructive',
        });
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLimitations = async () => {
    if (!user || !activeSubscription) {
      setSuppliersLimit(0);
      setCanCreateSupplier(false);
      return;
    }
    
    try {
      console.log('Fetching limitations for tariff plan:', activeSubscription.tariff_plan.id);
      
      // Отримуємо обмеження для активного тарифу користувача
      const { data: limitationData, error: limitationError } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', activeSubscription.tariff_plan.id)
        .eq('limitation_types.name', 'suppliers_count');

      if (limitationError) {
        console.error('Error fetching limitations:', limitationError);
        return;
      }

      if (limitationData && limitationData.length > 0) {
        const suppliersLimitValue = parseInt(limitationData[0].value);
        console.log('Suppliers limit from DB:', suppliersLimitValue);
        setSuppliersLimit(suppliersLimitValue);
        
        // Перевіряємо кількість постачальників строго менше ліміту
        setCanCreateSupplier(suppliers.length < suppliersLimitValue);
      } else {
        // Якщо обмеження не знайдено, встановлюємо значення 0
        console.log('No suppliers limit found, setting to 0');
        setSuppliersLimit(0);
        setCanCreateSupplier(false);
      }
    } catch (error) {
      console.error('Error fetching limitations:', error);
    }
  };

  const validateUrl = (url: string): string => {
    if (!url) return '';
    try {
      new URL(url);
      return '';
    } catch (e: any) {
      return 'Невірний формат URL';
    }
  };

  const handleCreateSupplier = async () => {
    const urlError = validateUrl(supplierUrl);
    setUrlError(urlError);
    
    if (!supplierName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву постачальника',
        variant: 'destructive',
      });
      return;
    }

    if (urlError) {
      toast({
        title: 'Помилка',
        description: urlError,
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти для створення постачальника',
        variant: 'destructive',
      });
      return;
    }

    // Додаткова перевірка перед створенням - чи не перевищено ліміт
    if (suppliersLimit !== null && suppliers.length >= suppliersLimit) {
      toast({
        title: 'Помилка',
        description: 'Ви досягли ліміту створення постачальників. Оновіть тарифний план.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await extendedSupabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: supplierName.trim(),
          url: supplierUrl.trim() || null
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Постачальника успішно створено',
      });
      
      setSupplierName('');
      setSupplierUrl('');
      setUrlError('');
      setIsDialogOpen(false);
      fetchUserSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = async () => {
    if (!currentSupplier) return;
    
    const urlError = validateUrl(supplierUrl);
    setUrlError(urlError);
    
    if (!supplierName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву постачальника',
        variant: 'destructive',
      });
      return;
    }

    if (urlError) {
      toast({
        title: 'Помилка',
        description: urlError,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: supplierName.trim(),
          url: supplierUrl.trim() || null
        })
        .eq('id', currentSupplier.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Постачальника успішно оновлено',
      });
      
      setSupplierName('');
      setSupplierUrl('');
      setUrlError('');
      setIsDialogOpen(false);
      fetchUserSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete || !user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id)
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Успішно',
        description: 'Постачальника успішно видалено',
      });
      
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
      fetchUserSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setIsEditMode(true);
    setCurrentSupplier(supplier);
    setSupplierName(supplier.name);
    setSupplierUrl(supplier.url || '');
    setUrlError('');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Постачальники</h1>
        
        <div className="flex items-center gap-2">
          {suppliersLimit !== null && (
            <Badge variant="outline" className="flex items-center px-2 py-1 text-xs">
              <Package className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-muted-foreground">
                {suppliers.length} з {suppliersLimit}
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
                    disabled={!canCreateSupplier}
                    onClick={() => {
                      setIsEditMode(false);
                      setCurrentSupplier(null);
                      setSupplierName('');
                      setSupplierUrl('');
                      setUrlError('');
                      setIsDialogOpen(true);
                    }}
                    id="create-supplier-button"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {canCreateSupplier 
                  ? "Додати постачальника" 
                  : `Досягнуто ліміт постачальників (${suppliersLimit})`
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {isLoading ? (
        <p>Завантаження постачальників...</p>
      ) : suppliers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Назва</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Дата створення</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map(supplier => (
              <TableRow key={supplier.id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>
                  {supplier.url ? (
                    <a href={supplier.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Відкрити
                    </a>
                  ) : (
                    <span className="text-gray-500">Не вказано</span>
                  )}
                </TableCell>
                <TableCell>{format(new Date(supplier.created_at), "dd.MM.yyyy", { locale: uk })}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(supplier)}
                            id={`edit-supplier-${supplier.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Редагувати</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openDeleteDialog(supplier)}
                            id={`delete-supplier-${supplier.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Видалити</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">У вас ще немає постачальників</CardTitle>
            <CardDescription className="text-sm">
              Додайте своїх постачальників, щоб почати роботу
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateSupplier ? (
              <Button onClick={() => {
                  setIsEditMode(false);
                  setCurrentSupplier(null);
                  setSupplierName('');
                  setSupplierUrl('');
                  setUrlError('');
                  setIsDialogOpen(true);
                }} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Додати постачальника
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-gray-600">
                  Для додавання постачальників необхідно оновити тарифний план
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Діалог створення/редагування постачальника */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Редагувати постачальника' : 'Додати нового постачальника'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Змініть інформацію про постачальника' : 'Введіть дані нового постачальника'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier-name">Назва постачальника</Label>
              <Input 
                id="supplier-name" 
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Введіть назву постачальника"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier-url">URL (не обов'язково)</Label>
              <Input 
                id="supplier-url" 
                value={supplierUrl}
                onChange={(e) => setSupplierUrl(e.target.value)}
                placeholder="Введіть URL постачальника"
              />
              {urlError && <p className="text-red-500 text-sm">{urlError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Скасувати
            </Button>
            <Button 
              onClick={isEditMode ? handleEditSupplier : handleCreateSupplier}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Діалог підтвердження видалення */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити постачальника?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити постачальника "{supplierToDelete?.name}"? 
              Ця дія не може бути скасована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
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

export default UserSuppliers;
