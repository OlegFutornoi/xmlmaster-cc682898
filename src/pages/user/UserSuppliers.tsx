// Компонент для відображення та керування постачальниками користувача
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash2, FileUp, LinkIcon, ExternalLink, File, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  file_path: string | null;
  created_at: string;
}

const UserSuppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>('url');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliersLimit, setSuppliersLimit] = useState<number | null>(null);
  const [canCreateSupplier, setCanCreateSupplier] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Окремий useEffect для викликання fetchUserLimitations після завантаження постачальників
  useEffect(() => {
    if (suppliers.length > 0 || !isLoading) {
      fetchUserLimitations();
    }
  }, [suppliers, isLoading]);

  const fetchSuppliers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Використовуємо any як тимчасове рішення для типізації
      const { data, error } = await (supabase as any)
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
        setSuppliers(data as Supplier[] || []);
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
        // Якщо немає активної підписки, користувач не може створювати постачальників
        setSuppliersLimit(0);
        setCanCreateSupplier(false);
        return;
      }

      // Отримуємо обмеження для активного тарифу користувача
      // Використовуємо any як тимчасове рішення для типізації
      const { data: limitationData, error: limitationError } = await (supabase as any)
        .from('tariff_plan_limitations')
        .select('value, suppliers_count')
        .eq('tariff_plan_id', subscriptionData.tariff_plan_id)
        .eq('suppliers_count', true)
        .maybeSingle();

      if (limitationError) {
        console.error('Error fetching limitations:', limitationError);
        return;
      }

      if (limitationData) {
        const suppliersLimitValue = limitationData.value;
        setSuppliersLimit(suppliersLimitValue);
        
        // Перевіряємо кількість постачальників строго менше ліміту
        setCanCreateSupplier(suppliers.length < suppliersLimitValue);
      } else {
        // Якщо обмеження не знайдено, встановлюємо значення 0
        setSuppliersLimit(0);
        setCanCreateSupplier(false);
      }
    } catch (error) {
      console.error('Error fetching limitations:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Перевірка типу файлу (XML, CSV)
      const allowedTypes = ['text/xml', 'text/csv', 'application/xml', 'application/csv'];
      if (!allowedTypes.includes(file.type) && 
          !file.name.endsWith('.xml') && 
          !file.name.endsWith('.csv')) {
        toast({
          title: 'Помилка',
          description: 'Підтримуються лише файли XML та CSV',
          variant: 'destructive',
        });
        return;
      }
      
      // Перевірка розміру файлу (макс. 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: 'Помилка',
          description: 'Розмір файлу не повинен перевищувати 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Перевірка валідації
    if (!supplierName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву постачальника',
        variant: 'destructive',
      });
      return;
    }

    // Перевірка для URL
    if (activeTab === 'url' && !supplierUrl.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть URL постачальника',
        variant: 'destructive',
      });
      return;
    }

    // Перевірка для файлу
    if (activeTab === 'file' && !selectedFile) {
      toast({
        title: 'Помилка',
        description: 'Оберіть файл постачальника',
        variant: 'destructive',
      });
      return;
    }

    // Перевірка ліміту постачальників
    if (suppliersLimit !== null && suppliers.length >= suppliersLimit) {
      toast({
        title: 'Помилка',
        description: 'Ви досягли ліміту створення постачальників. Оновіть тарифний план.',
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

    setIsSubmitting(true);

    try {
      let filePath = null;

      // Завантаження файлу, якщо обрано варіант з файлом
      if (activeTab === 'file' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const storagePath = `${user.id}/${fileName}`;

        // Завантаження файлу в сховище
        const { error: uploadError } = await supabase.storage
          .from('supplier_files')
          .upload(storagePath, selectedFile);

        if (uploadError) {
          throw uploadError;
        }

        filePath = storagePath;
      }

      // Створення запису постачальника
      // Використовуємо any як тимчасове рішення для типізації
      const { data, error } = await (supabase as any)
        .from('suppliers')
        .insert({
          user_id: user.id,
          name: supplierName.trim(),
          url: activeTab === 'url' ? supplierUrl.trim() : null,
          file_path: filePath
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Постачальника успішно додано',
      });

      // Очищаємо форму
      setSupplierName('');
      setSupplierUrl('');
      setSelectedFile(null);
      
      // Оновлюємо список постачальників
      fetchSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати постачальника',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete || !user) return;
    
    setIsDeleting(true);
    try {
      // Отримуємо інформацію про постачальника перед видаленням
      // Використовуємо any як тимчасове рішення для типізації
      const { data: supplierData, error: fetchError } = await (supabase as any)
        .from('suppliers')
        .select('file_path')
        .eq('id', supplierToDelete)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }

      // Видаляємо запис постачальника
      // Використовуємо any як тимчасове рішення для типізації
      const { error: deleteError } = await (supabase as any)
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete)
        .eq('user_id', user.id);
      
      if (deleteError) {
        throw deleteError;
      }

      // Якщо є файл, видаляємо його зі сховища
      if (supplierData && supplierData.file_path) {
        const { error: storageError } = await supabase.storage
          .from('supplier_files')
          .remove([supplierData.file_path]);
        
        if (storageError) {
          console.error('Error deleting supplier file:', storageError);
        }
      }
      
      toast({
        title: 'Успішно',
        description: 'Постачальника успішно видалено',
      });
      
      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
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

  const openDeleteDialog = (supplierId: string) => {
    setSupplierToDelete(supplierId);
    setIsDeleteDialogOpen(true);
  };

  const downloadSupplierFile = async (filePath: string, supplierName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('supplier_files')
        .download(filePath);
      
      if (error) {
        throw error;
      }

      // Створюємо URL для завантаження
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${supplierName.replace(/\s+/g, '_')}.${filePath.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити файл',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Постачальники</h1>
      </div>

      {suppliersLimit !== null && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">
                {suppliers.length} з {suppliersLimit} доступних постачальників
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {canCreateSupplier && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Додати нового постачальника</CardTitle>
            <CardDescription>
              Заповніть форму для додавання нового постачальника
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier-name">Назва постачальника</Label>
                <Input
                  id="supplier-name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Введіть назву постачальника"
                  disabled={isSubmitting}
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="url" className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Посилання
                  </TabsTrigger>
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Файл
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-url">URL постачальника</Label>
                    <Input
                      id="supplier-url"
                      value={supplierUrl}
                      onChange={(e) => setSupplierUrl(e.target.value)}
                      placeholder="Введіть URL постачальника"
                      type="url"
                      disabled={isSubmitting}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="file" className="space-y-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier-file">Файл постачальника</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="supplier-file"
                        type="file"
                        accept=".xml,.csv"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                        className="hidden"
                      />
                      <div className="flex gap-3 items-center">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('supplier-file')?.click()}
                          disabled={isSubmitting}
                        >
                          Обрати файл
                        </Button>
                        <span className="text-sm text-gray-500">
                          {selectedFile ? selectedFile.name : 'Файл не обрано'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Підтримувані формати: XML, CSV. Максимальний розмір: 5MB
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button 
                type="submit" 
                className="w-full mt-4" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Створення...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Додати постачальника
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map(supplier => (
            <Card key={supplier.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{supplier.name}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openDeleteDialog(supplier.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Створено: {format(new Date(supplier.created_at), "dd MMMM yyyy", { locale: uk })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {supplier.url ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <LinkIcon className="h-4 w-4" />
                    <a 
                      href={supplier.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm underline hover:text-blue-800 truncate max-w-[200px]"
                    >
                      {supplier.url}
                    </a>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                ) : supplier.file_path ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => downloadSupplierFile(supplier.file_path!, supplier.name)}
                  >
                    <FileUp className="h-4 w-4" />
                    Завантажити файл
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>У вас ще немає постачальників</CardTitle>
            <CardDescription>
              {canCreateSupplier 
                ? 'Створіть свого першого постачальника, щоб почати роботу'
                : 'Для створення постачальника необхідно оновити тарифний план'}
            </CardDescription>
          </CardHeader>
          {canCreateSupplier && (
            <CardFooter>
              <Button onClick={() => document.getElementById('supplier-name')?.focus()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Створити постачальника
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити постачальника?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити цього постачальника? 
              Ця дія не може бути скасована.
              {suppliers.find(s => s.id === supplierToDelete)?.file_path && (
                <p className="mt-2 text-red-500">
                  Файл постачальника також буде видалено.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
