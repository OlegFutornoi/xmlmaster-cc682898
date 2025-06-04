// Компонент для відображення та управління постачальниками користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PlusCircle, Trash2, Pencil, ExternalLink, AlertCircle, History } from 'lucide-react';
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
    const refreshData = async () => {
      if (user) {
        await refetchSubscriptions();
        await fetchUserSuppliers();
      }
    };
    
    refreshData();
    
    const intervalId = setInterval(async () => {
      if (user) {
        await refetchSubscriptions();
        fetchUserLimitations();
      }
    }, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

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
        setCanCreateSupplier(suppliers.length < suppliersLimitValue);
      } else {
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
    console.log('Opening edit dialog for supplier:', supplier);
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

  const resetDialog = () => {
    setIsEditMode(false);
    setCurrentSupplier(null);
    setSupplierName('');
    setSupplierUrl('');
    setUrlError('');
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Постачальники</h1>
                <p className="text-gray-600">Керуйте своїми постачальниками та XML інтеграціями</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              {suppliersLimit !== null && (
                <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-700 px-3 py-1">
                  <Package className="h-4 w-4 mr-2" />
                  {suppliers.length} з {suppliersLimit}
                </Badge>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={!canCreateSupplier}
                      onClick={resetDialog}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg"
                      id="create-supplier-button"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Додати постачальника
                    </Button>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Завантаження постачальників...</p>
          </div>
        ) : suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {suppliers.map(supplier => (
              <Card key={supplier.id} className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-gray-900 line-clamp-1">{supplier.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {format(new Date(supplier.created_at), "dd.MM.yyyy", { locale: uk })}
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
                              onClick={() => openEditDialog(supplier)}
                              className="h-8 w-8 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
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
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              id={`delete-supplier-${supplier.id}`}
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
                  {supplier.url ? (
                    <a
                      href={supplier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Відкрити URL
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">URL не вказано</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg max-w-2xl mx-auto">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-900">У вас ще немає постачальників</CardTitle>
              <CardDescription className="text-gray-600">
                Додайте своїх постачальників, щоб почати роботу з XML файлами
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {canCreateSupplier ? (
                <Button
                  onClick={resetDialog}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Додати постачальника
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <p className="text-gray-600">
                    Для додавання постачальників необхідно оновити тарифний план
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog створення/редагування постачальника */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {isEditMode ? 'Редагувати постачальника' : 'Додати нового постачальника'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isEditMode ? 'Змініть інформацію про постачальника' : 'Введіть дані нового постачальника'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier-name" className="text-gray-700">Назва постачальника</Label>
              <Input
                id="supplier-name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Введіть назву постачальника"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier-url" className="text-gray-700">URL (не обов'язково)</Label>
              <Input
                id="supplier-url"
                value={supplierUrl}
                onChange={(e) => setSupplierUrl(e.target.value)}
                placeholder="Введіть URL постачальника"
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
              {urlError && <p className="text-red-500 text-sm">{urlError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-emerald-200 hover:bg-emerald-50"
            >
              Скасувати
            </Button>
            <Button
              onClick={isEditMode ? handleEditSupplier : handleCreateSupplier}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              {isSubmitting ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog підтвердження видалення */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Видалити постачальника?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Ви впевнені, що хочете видалити постачальника "{supplierToDelete?.name}"? 
              Ця дія не може бути скасована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-200 hover:bg-emerald-50">Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
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

export default UserSuppliers;
