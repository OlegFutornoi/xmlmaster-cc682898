
// Компонент для відображення та управління магазинами користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, PlusCircle, Store, Trash2, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { useUserXMLTemplates } from '@/hooks/xml-templates/useUserXMLTemplates';
import StoreTemplateEditor from '@/components/user/stores/StoreTemplateEditor';

interface UserStore {
  id: string;
  name: string;
  template_id: string | null;
  created_at: string;
}

const UserStores = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSubscription, refetchSubscriptions } = useUserSubscriptions();
  const { templates, isLoading: templatesLoading } = useUserXMLTemplates();
  const [stores, setStores] = useState<UserStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storesLimit, setStoresLimit] = useState<number | null>(null);
  const [canCreateStore, setCanCreateStore] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<UserStore | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStore, setEditingStore] = useState<UserStore | null>(null);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);

  // Функція для копіювання параметрів шаблону в магазин з виправленням дублювання
  const copyTemplateParametersToStore = async (templateId: string, storeId: string) => {
    try {
      console.log('Copying template parameters for template:', templateId, 'to store:', storeId);
      
      // Спочатку видаляємо існуючі параметри для цього магазину
      const { error: deleteError } = await extendedSupabase
        .from('store_template_parameters')
        .delete()
        .eq('store_id', storeId);

      if (deleteError) {
        console.error('Error deleting existing store parameters:', deleteError);
        // Не кидаємо помилку, продовжуємо
      }

      const { data: templateParams, error } = await extendedSupabase
        .from('template_xml_parameters')
        .select('*')
        .eq('template_id', templateId);

      if (error) {
        console.error('Error fetching template parameters:', error);
        throw error;
      }

      console.log('Template parameters found:', templateParams);

      if (templateParams && templateParams.length > 0) {
        const storeParams = templateParams.map(param => ({
          store_id: storeId,
          template_id: templateId,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type,
          parameter_category: param.parameter_category,
          is_active: param.is_active,
          is_required: true // ВСІ ПАРАМЕТРИ ОБОВ'ЯЗКОВІ ЗА ЗАМОВЧУВАННЯМ
        }));

        const { error: insertError } = await extendedSupabase
          .from('store_template_parameters')
          .insert(storeParams);

        if (insertError) {
          console.error('Error inserting store parameters:', insertError);
          throw insertError;
        }

        console.log('Successfully copied', storeParams.length, 'parameters to store');
      }
    } catch (error) {
      console.error('Error copying template parameters:', error);
      throw error;
    }
  };

  useEffect(() => {
    refetchSubscriptions();
    if (user) {
      fetchUserStores();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeSubscription) {
      fetchUserLimitations();
    }
  }, [activeSubscription, user]);

  // Оновлюємо можливість створення після завантаження магазинів та лімітів
  useEffect(() => {
    if (storesLimit !== null && !isLoading) {
      setCanCreateStore(stores.length < storesLimit);
      console.log('Updated canCreateStore:', stores.length < storesLimit, 'stores:', stores.length, 'limit:', storesLimit);
    }
  }, [stores.length, storesLimit, isLoading]);

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
        setStores([]);
      } else {
        console.log('Fetched stores:', data?.length || 0);
        setStores(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserLimitations = async () => {
    if (!user || !activeSubscription) {
      console.log('No user or active subscription for limitations');
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
        console.log('Stores limit from DB:', storesLimitValue);
        setStoresLimit(storesLimitValue);
      } else {
        console.log('No stores limit found, setting to 0');
        setStoresLimit(0);
        setCanCreateStore(false);
      }
    } catch (error) {
      console.error('Error fetching limitations:', error);
      setStoresLimit(0);
      setCanCreateStore(false);
    }
  };

  const handleCreateStore = async () => {
    console.log('=== CREATE STORE START ===');
    console.log('isSubmitting:', isSubmitting);
    console.log('canCreateStore:', canCreateStore);
    console.log('stores.length:', stores.length);
    console.log('storesLimit:', storesLimit);

    // Блокуємо повторні виклики
    if (isSubmitting) {
      console.log('Already submitting, blocking duplicate call');
      return;
    }

    // Перевіряємо назву магазину
    if (!newStoreName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть назву магазину',
        variant: 'destructive'
      });
      return;
    }
    
    // Перевіряємо аутентифікацію
    if (!user) {
      toast({
        title: 'Помилка',
        description: 'Вам потрібно увійти для створення магазину',
        variant: 'destructive'
      });
      return;
    }

    // КРИТИЧНО: Перевіряємо ліміт ДО початку створення
    if (storesLimit !== null && stores.length >= storesLimit) {
      console.log('BLOCKING: Store limit exceeded', stores.length, 'vs', storesLimit);
      toast({
        title: 'Помилка',
        description: `Ви досягли ліміту створення магазинів (${storesLimit}). Оновіть тарифний план.`,
        variant: 'destructive'
      });
      return;
    }

    // Якщо не можемо створювати - блокуємо
    if (!canCreateStore) {
      console.log('BLOCKING: canCreateStore is false');
      toast({
        title: 'Помилка',
        description: 'Неможливо створити магазин. Перевірте ваш тарифний план.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const templateIdToSave = selectedTemplateId === 'none' ? null : selectedTemplateId;
      
      console.log('Creating store with data:', {
        user_id: user.id,
        name: newStoreName.trim(),
        template_id: templateIdToSave
      });

      const { data, error } = await extendedSupabase
        .from('user_stores')
        .insert({
          user_id: user.id,
          name: newStoreName.trim(),
          template_id: templateIdToSave
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating store:', error);
        throw new Error(`Помилка створення магазину: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from store creation');
        throw new Error('Не отримано дані про створений магазин');
      }

      console.log('Store created successfully:', data);

      // Якщо вибрано шаблон, копіюємо його параметри
      if (templateIdToSave && data) {
        console.log('Copying template parameters...');
        try {
          await copyTemplateParametersToStore(templateIdToSave, data.id);
          console.log('Template parameters copied successfully');
          
          toast({
            title: 'Успішно',
            description: 'Магазин та параметри шаблону успішно створено'
          });
        } catch (paramError) {
          console.error('Error copying template parameters:', paramError);
          toast({
            title: 'Попередження',
            description: 'Магазин створено, але виникла помилка з параметрами шаблону. Спробуйте скопіювати параметри пізніше.',
            variant: 'default'
          });
        }
      } else {
        toast({
          title: 'Успішно',
          description: 'Магазин успішно створено'
        });
      }
      
      // Очищуємо форму та закриваємо діалог
      setNewStoreName('');
      setSelectedTemplateId('none');
      setIsDialogOpen(false);
      
      // Оновлюємо список магазинів
      await fetchUserStores();
      
    } catch (error) {
      console.error('Error in store creation process:', error);
      toast({
        title: 'Помилка',
        description: error instanceof Error ? error.message : 'Не вдалося створити магазин',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      console.log('=== CREATE STORE END ===');
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

  const openDeleteDialog = (e: React.MouseEvent, store: UserStore) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete store clicked:', store.id);
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };

  const resetDialog = () => {
    setNewStoreName('');
    setSelectedTemplateId('none');
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (store: UserStore) => {
    setEditingStore(store);
    setIsTemplateEditorOpen(true);
  };

  const handleManageStore = (e: React.MouseEvent, storeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Manage store:', storeId);
    toast({
      title: 'Функція в розробці',
      description: 'Управління магазином буде додано пізніше'
    });
  };

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return 'Шаблон не вибрано';
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Невідомий шаблон';
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
                      disabled={!canCreateStore || isSubmitting}
                      onClick={resetDialog}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg"
                      id="create-store-button"
                      type="button"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Створення...' : 'Створити магазин'}
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
                
                <CardHeader className="pb-3 relative z-10">
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
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getTemplateName(store.template_id)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 relative z-20">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTemplate(store)}
                              className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 relative z-30"
                              id={`edit-template-${store.id}`}
                              type="button"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Налаштувати шаблон</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => openDeleteDialog(e, store)}
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 relative z-30"
                              id={`delete-store-${store.id}`}
                              type="button"
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
                <CardContent className="pt-0 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    id={`manage-store-${store.id}`}
                    onClick={(e) => handleManageStore(e, store.id)}
                    type="button"
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
                  type="button"
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsDialogOpen(open);
        }
      }}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Створити новий магазин</DialogTitle>
            <DialogDescription className="text-gray-600">
              Введіть назву та виберіть шаблон для вашого нового магазину
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
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-select" className="text-gray-700">XML шаблон</Label>
              <Select 
                value={selectedTemplateId} 
                onValueChange={setSelectedTemplateId}
                disabled={isSubmitting}
              >
                <SelectTrigger id="template-select" className="border-emerald-200 focus:border-emerald-400">
                  <SelectValue placeholder="Виберіть шаблон (необов'язково)" />
                </SelectTrigger>
                <SelectContent>
                  {templatesLoading ? (
                    <SelectItem value="loading" disabled>Завантаження...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">Без шаблону</SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              className="border-emerald-200 hover:bg-emerald-50"
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleCreateStore}
              disabled={isSubmitting || !newStoreName.trim() || !canCreateStore}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
              type="button"
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

      {/* Редактор шаблону магазину */}
      {editingStore && (
        <StoreTemplateEditor 
          store={editingStore}
          isOpen={isTemplateEditorOpen}
          onOpenChange={setIsTemplateEditorOpen}
        />
      )}
    </div>
  );
};

export default UserStores;
