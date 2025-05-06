
// Компонент для відображення та управління постачальниками користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Edit, Trash2, ExternalLink } from 'lucide-react';
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
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useIsMobile } from '@/hooks/use-mobile';

// Схема валідації для форми постачальника
const supplierSchema = z.object({
  name: z.string().min(2, "Назва повинна містити щонайменше 2 символи"),
  url: z.string()
    .url("Неправильний формат URL")
    .refine(
      (url) => {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.xml') || 
               lowerUrl.endsWith('.csv') || 
               lowerUrl.includes('xml') || 
               lowerUrl.includes('csv');
      }, 
      { message: "URL повинен вказувати на XML або CSV файл" }
    ).optional().or(z.literal(''))
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  created_at: string;
  is_active: boolean;
  product_count: number;
}

const getFileTypeFromUrl = (url: string | null): string => {
  if (!url) return 'Не вказано';
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.endsWith('.xml') || lowerUrl.includes('xml')) {
    return 'XML';
  } else if (lowerUrl.endsWith('.csv') || lowerUrl.includes('csv')) {
    return 'CSV';
  }
  
  return 'Невідомий';
};

const UserSuppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliersLimit, setSuppliersLimit] = useState<number | null>(null);
  const [canCreateSupplier, setCanCreateSupplier] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      url: ''
    }
  });

  useEffect(() => {
    fetchUserSuppliers();
  }, []);

  // Окремий useEffect для викликання fetchUserLimitations після завантаження постачальників
  useEffect(() => {
    if (suppliers.length > 0 || !isLoading) {
      fetchUserLimitations();
    }
  }, [suppliers, isLoading]);

  // Встановлюємо значення форми при редагуванні
  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        name: editingSupplier.name,
        url: editingSupplier.url || ''
      });
    } else {
      form.reset({
        name: '',
        url: ''
      });
    }
  }, [editingSupplier, form]);

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
        console.error('Помилка отримання постачальників:', error);
        toast({
          title: 'Помилка',
          description: 'Не вдалося завантажити постачальників',
          variant: 'destructive',
        });
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Помилка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLimitations = async () => {
    if (!user) return;
    
    try {
      // Отримуємо активну підписку користувача
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_tariff_subscriptions')
        .select('tariff_plan_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Помилка отримання активної підписки:', subscriptionError);
        return;
      }

      if (!subscriptionData) {
        // Якщо немає активної підписки, користувач не може створювати постачальників
        setSuppliersLimit(0);
        setCanCreateSupplier(false);
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
        .eq('limitation_types.name', 'suppliers_count');

      if (limitationError) {
        console.error('Помилка отримання обмежень:', limitationError);
        return;
      }

      if (limitationData && limitationData.length > 0) {
        const suppliersLimitValue = limitationData[0].value;
        setSuppliersLimit(suppliersLimitValue);
        
        // Перевіряємо кількість постачальників строго менше ліміту
        setCanCreateSupplier(suppliers.length < suppliersLimitValue);
      } else {
        // Якщо обмеження не знайдено, встановлюємо значення 0
        setSuppliersLimit(0);
        setCanCreateSupplier(false);
      }
    } catch (error) {
      console.error('Помилка отримання обмежень:', error);
    }
  };

  const handleSaveSupplier = async (values: SupplierFormValues) => {
    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти для створення постачальника',
        variant: 'destructive',
      });
      return;
    }

    // Додаткова перевірка перед створенням - чи не перевищено ліміт
    if (!editingSupplier && suppliersLimit !== null && suppliers.length >= suppliersLimit) {
      toast({
        title: 'Помилка',
        description: 'Ви досягли ліміту створення постачальників. Оновіть тарифний план.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        // Оновлення існуючого постачальника
        const { error } = await extendedSupabase
          .from('suppliers')
          .update({
            name: values.name,
            url: values.url || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSupplier.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Успішно',
          description: 'Постачальника успішно оновлено',
        });
      } else {
        // Створення нового постачальника
        const { error } = await extendedSupabase
          .from('suppliers')
          .insert({
            user_id: user.id,
            name: values.name,
            url: values.url || null
          });

        if (error) throw error;

        toast({
          title: 'Успішно',
          description: 'Постачальника успішно створено',
        });
      }
      
      form.reset();
      setIsDialogOpen(false);
      setEditingSupplier(null);
      fetchUserSuppliers();
    } catch (error) {
      console.error('Помилка збереження постачальника:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
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
      console.error('Помилка видалення постачальника:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSupplier(null);
    form.reset({
      name: '',
      url: ''
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Постачальники</h1>
        
        <div className="flex items-center gap-2">
          {suppliersLimit !== null && (
            <Badge variant="outline" className="flex items-center px-2 py-1 text-xs">
              <FileText className="h-3 w-3 mr-1 text-blue-600" />
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
                    onClick={openCreateDialog}
                    id="create-supplier-button"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {canCreateSupplier 
                  ? "Створити постачальника" 
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
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Тип файлу</TableHead>
                  <TableHead>К-ть товарів</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id} id={`supplier-row-${supplier.id}`}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>
                      {supplier.url ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline">
                            {getFileTypeFromUrl(supplier.url)}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a 
                                  href={supplier.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs max-w-[200px] break-all">{supplier.url}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <Badge variant="outline">Не вказано</Badge>
                      )}
                    </TableCell>
                    <TableCell>{supplier.product_count}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditSupplier(supplier)}
                        id={`edit-supplier-${supplier.id}`}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteDialog(supplier)}
                        id={`delete-supplier-${supplier.id}`}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">У вас ще немає постачальників</CardTitle>
            <CardDescription className="text-sm">
              Додайте постачальників для імпорту товарів
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canCreateSupplier ? (
              <Button onClick={openCreateDialog} size="sm" id="add-first-supplier">
                <Plus className="mr-2 h-4 w-4" />
                Додати постачальника
              </Button>
            ) : (
              <p className="text-sm text-gray-600">
                Для додавання постачальників необхідно оновити тарифний план
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Діалог створення/редагування постачальника */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Редагувати постачальника' : 'Додати постачальника'}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier 
                ? 'Відредагуйте інформацію про постачальника' 
                : 'Введіть інформацію про нового постачальника'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSupplier)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Назва постачальника</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Введіть назву постачальника" 
                        id="supplier-name-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Посилання на файл (XML або CSV)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="https://example.com/feed.xml" 
                        id="supplier-url-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Скасувати
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? 'Збереження...' 
                    : editingSupplier 
                      ? 'Зберегти зміни' 
                      : 'Додати постачальника'
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
