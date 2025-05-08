
// Компонент для роботи з товарами
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Upload, 
  Filter, 
  Store, 
  Package, 
  AlertCircle,
  Save,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { usePlanLimitations } from '@/hooks/tariffs/usePlanLimitations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

// Типи для даних
interface UserStore {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  url: string | null;
}

interface Category {
  id: string;
  name: string;
  selected: boolean;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  selected: boolean;
  category_id: string;
  images: string[];
}

interface ParsedData {
  categories: Category[];
  products: Product[];
}

const UserProducts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { activeSubscription } = useUserSubscriptions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Стани для зберігання даних
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<UserStore[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [storeProductsCount, setStoreProductsCount] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [selectedTab, setSelectedTab] = useState('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Обмеження за тарифним планом
  const { getLimitationValueByName } = usePlanLimitations(activeSubscription?.tariff_plan?.id || null);
  const productsLimit = getLimitationValueByName('products_count');
  const remainingProductsLimit = productsLimit > 0 ? productsLimit - storeProductsCount : 0;
  const canAddProducts = remainingProductsLimit > 0;

  // Завантажуємо дані при монтуванні компонента
  useEffect(() => {
    if (user) {
      fetchUserStores();
      fetchUserSuppliers();
    }
  }, [user]);

  // Завантажуємо кількість товарів у вибраному магазині
  useEffect(() => {
    if (selectedStore) {
      fetchStoreProductsCount();
    } else {
      setStoreProductsCount(0);
    }
  }, [selectedStore]);

  // Функція для отримання магазинів користувача
  const fetchUserStores = async () => {
    try {
      const { data, error } = await extendedSupabase
        .from('user_stores')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setStores(data || []);
      
      // Вибираємо перший магазин за замовчуванням
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити магазини',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для отримання постачальників користувача
  const fetchUserSuppliers = async () => {
    try {
      const { data, error } = await extendedSupabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити постачальників',
        variant: 'destructive'
      });
    }
  };

  // Функція для отримання кількості товарів у магазині
  const fetchStoreProductsCount = async () => {
    if (!selectedStore) return;
    
    try {
      const { data, error, count } = await extendedSupabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', selectedStore);
        
      if (error) throw error;
      setStoreProductsCount(count || 0);
    } catch (error) {
      console.error('Error fetching store products count:', error);
    }
  };

  // Функція для завантаження XML файлу
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadDialogOpen(true);
    setUploadStatus('parsing');
    setIsParsingFile(true);
    
    // Створюємо читача файлів
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      
      try {
        // Емуляція процесу парсингу з прогресом
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise(resolve => setTimeout(resolve, 150)); // Емуляція часу обробки
        }
        
        // Парсимо XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(e.target.result as string, 'text/xml');
        
        // Отримуємо категорії
        const categoriesElements = xmlDoc.getElementsByTagName('category');
        const parsedCategories: Category[] = [];
        
        for (let i = 0; i < categoriesElements.length; i++) {
          const element = categoriesElements[i];
          if (element.textContent) {
            parsedCategories.push({
              id: element.getAttribute('id') || `category-${i}`,
              name: element.textContent,
              selected: false,
              products: []
            });
          }
        }
        
        // Отримуємо товари
        const offersElements = xmlDoc.getElementsByTagName('offer');
        const parsedProducts: Product[] = [];
        
        for (let i = 0; i < offersElements.length; i++) {
          const offer = offersElements[i];
          
          const name = offer.getElementsByTagName('name')[0]?.textContent || `Product ${i}`;
          const price = parseFloat(offer.getElementsByTagName('price')[0]?.textContent || '0');
          const description = offer.getElementsByTagName('description')[0]?.textContent || '';
          const categoryId = offer.getElementsByTagName('categoryId')[0]?.textContent || '';
          
          // Зображення товару
          const pictureElements = offer.getElementsByTagName('picture');
          const images: string[] = [];
          
          for (let j = 0; j < pictureElements.length; j++) {
            if (pictureElements[j].textContent) {
              images.push(pictureElements[j].textContent!);
            }
          }
          
          parsedProducts.push({
            id: offer.getAttribute('id') || `product-${i}`,
            name,
            price,
            description,
            selected: false,
            category_id: categoryId,
            images
          });
        }
        
        // Додамо товари до відповідних категорій
        parsedCategories.forEach(category => {
          category.products = parsedProducts.filter(product => product.category_id === category.id);
        });
        
        setParsedData({
          categories: parsedCategories,
          products: parsedProducts
        });
        
        setUploadStatus('success');
        setIsParsingFile(false);
        
        toast({
          title: 'Успішно',
          description: `Файл оброблено: знайдено ${parsedCategories.length} категорій та ${parsedProducts.length} товарів`,
        });
        
      } catch (error) {
        console.error('Error parsing XML:', error);
        setUploadStatus('error');
        setIsParsingFile(false);
        
        toast({
          title: 'Помилка',
          description: 'Не вдалося обробити XML файл',
          variant: 'destructive'
        });
      }
    };
    
    reader.onerror = () => {
      setUploadStatus('error');
      setIsParsingFile(false);
      
      toast({
        title: 'Помилка',
        description: 'Не вдалося прочитати файл',
        variant: 'destructive'
      });
    };
    
    reader.readAsText(file);
  };

  // Обробка зміни стану вибору категорії
  const handleCategorySelect = (categoryId: string) => {
    const updatedCategories = parsedData?.categories.map(category => {
      if (category.id === categoryId) {
        const newSelected = !category.selected;
        
        // Також оновлюємо продукти в цій категорії
        category.products.forEach(product => {
          product.selected = newSelected;
        });
        
        return { ...category, selected: newSelected };
      }
      return category;
    });
    
    if (updatedCategories) {
      setParsedData(prev => ({ 
        ...prev!, 
        categories: updatedCategories 
      }));
      
      // Оновлюємо список вибраних категорій
      const newSelectedCategories = updatedCategories
        .filter(category => category.selected)
        .map(category => category.id);
        
      setSelectedCategories(newSelectedCategories);
      
      // Оновлюємо список вибраних продуктів
      const newSelectedProducts = [];
      for (const category of updatedCategories) {
        if (category.selected) {
          for (const product of category.products) {
            if (product.selected) {
              newSelectedProducts.push(product.id);
            }
          }
        }
      }
      setSelectedProducts(newSelectedProducts);
    }
  };

  // Обробка зміни стану вибору продукту
  const handleProductSelect = (productId: string) => {
    const updatedProducts = parsedData?.products.map(product => {
      if (product.id === productId) {
        return { ...product, selected: !product.selected };
      }
      return product;
    });
    
    if (updatedProducts) {
      setParsedData(prev => ({ 
        ...prev!, 
        products: updatedProducts 
      }));
      
      // Перераховуємо вибрані продукти
      const newSelectedProducts = updatedProducts
        .filter(product => product.selected)
        .map(product => product.id);
        
      setSelectedProducts(newSelectedProducts);
    }
  };

  // Функція для збереження вибраних товарів
  const saveSelectedProducts = async () => {
    if (!selectedStore || !parsedData) return;
    
    const selectedProductsData = parsedData.products.filter(product => product.selected);
    
    // Перевіряємо обмеження кількості товарів
    if (selectedProductsData.length > remainingProductsLimit) {
      toast({
        title: 'Перевищено ліміт',
        description: `Ви можете додати лише ${remainingProductsLimit} товарів. Вибрано: ${selectedProductsData.length}`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Підготовка даних для збереження
      const productsToSave = selectedProductsData.map(product => ({
        user_id: user?.id,
        store_id: selectedStore,
        supplier_id: selectedSupplier,
        name: product.name,
        description: product.description || null,
        price: product.price,
        category_id: product.category_id,
        created_at: new Date().toISOString()
      }));
      
      // Зберігаємо товари
      const { data, error } = await extendedSupabase
        .from('products')
        .insert(productsToSave)
        .select();
        
      if (error) throw error;
      
      // Зберігаємо зображення товарів
      for (let i = 0; i < selectedProductsData.length; i++) {
        const product = selectedProductsData[i];
        const savedProduct = data[i];
        
        if (product.images.length > 0) {
          // Зберігаємо посилання на зображення
          const productImages = product.images.map((imageUrl, index) => ({
            product_id: savedProduct.id,
            image_url: imageUrl,
            is_main: index === 0 // Перше зображення - головне
          }));
          
          const { error: imagesError } = await extendedSupabase
            .from('product_images')
            .insert(productImages);
            
          if (imagesError) {
            console.error('Error saving product images:', imagesError);
          }
        }
      }
      
      // Оновлюємо лічильник товарів
      fetchStoreProductsCount();
      
      toast({
        title: 'Успішно',
        description: `Додано ${selectedProductsData.length} товарів до магазину`,
      });
      
      // Скидаємо дані після збереження
      setParsedData(null);
      setSelectedCategories([]);
      setSelectedProducts([]);
      setIsUploadDialogOpen(false);
      
    } catch (error) {
      console.error('Error saving products:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти товари',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Фільтрація категорій за пошуком
  const filteredCategories = parsedData?.categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Фільтрація продуктів за пошуком та категоріями
  const filteredProducts = parsedData?.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Якщо вибрано категорії, фільтруємо за ними, інакше показуємо всі продукти, що відповідають пошуку
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(product.category_id);
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Групування товарів за категоріями
  const productsByCategory: {[key: string]: Product[]} = {};
  
  if (parsedData?.products) {
    parsedData.products.forEach(product => {
      if (!productsByCategory[product.category_id]) {
        productsByCategory[product.category_id] = [];
      }
      productsByCategory[product.category_id].push(product);
    });
  }

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Товари</h1>
        
        <div className="flex items-center gap-2">
          {/* Значок ліміту товарів */}
          {productsLimit > 0 && (
            <Badge variant="outline" className="flex items-center px-2 py-1 text-xs">
              <ShoppingBag className="h-3 w-3 mr-1 text-blue-600" />
              <span className="text-muted-foreground">
                {storeProductsCount} з {productsLimit}
              </span>
            </Badge>
          )}
          
          {/* Кнопка завантаження XML */}
          <Button 
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedStore || !selectedSupplier}
            id="upload-xml-button"
          >
            <Upload className="h-4 w-4 mr-2" />
            Завантажити XML
          </Button>
          <input 
            type="file" 
            accept=".xml" 
            onChange={handleFileUpload} 
            ref={fileInputRef}
            className="hidden" 
          />
        </div>
      </div>
      
      {/* Селектори для вибору магазину і постачальника */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Виберіть магазин:
          </label>
          <Select 
            value={selectedStore || ''} 
            onValueChange={(value) => setSelectedStore(value)}
          >
            <SelectTrigger className="w-full" id="store-selector">
              <SelectValue placeholder="Виберіть магазин" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Виберіть постачальника:
          </label>
          <Select 
            value={selectedSupplier || ''} 
            onValueChange={(value) => setSelectedSupplier(value)}
          >
            <SelectTrigger className="w-full" id="supplier-selector">
              <SelectValue placeholder="Виберіть постачальника" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Основний контент сторінки */}
      {isLoading ? (
        <p>Завантаження...</p>
      ) : stores.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Немає магазинів</CardTitle>
            <CardDescription>
              Для роботи з товарами необхідно спочатку створити магазин
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/user/dashboard/stores')} 
              variant="secondary"
            >
              <Store className="h-4 w-4 mr-2" />
              Перейти до сторінки магазинів
            </Button>
          </CardContent>
        </Card>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Немає постачальників</CardTitle>
            <CardDescription>
              Для роботи з товарами необхідно спочатку додати постачальника
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/user/dashboard/suppliers')} 
              variant="secondary"
            >
              <Package className="h-4 w-4 mr-2" />
              Перейти до сторінки постачальників
            </Button>
          </CardContent>
        </Card>
      ) : !selectedStore || !selectedSupplier ? (
        <Card>
          <CardHeader>
            <CardTitle>Виберіть магазин і постачальника</CardTitle>
            <CardDescription>
              Для роботи з товарами необхідно вибрати магазин і постачальника
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Товари магазину</span>
              <Badge variant={canAddProducts ? "secondary" : "destructive"} className="px-2 py-1">
                {canAddProducts 
                  ? `Доступно для додавання: ${remainingProductsLimit}` 
                  : "Ліміт товарів вичерпано"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Керуйте товарами магазину, завантажуючи їх з XML-файлів
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!canAddProducts ? (
              <div className="flex flex-col items-center p-4 border rounded bg-red-50">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <p className="font-medium text-center">
                  Ви досягли ліміту товарів для цього магазину
                </p>
                <p className="text-sm text-gray-600 text-center mt-1">
                  Оновіть тарифний план, щоб додати більше товарів
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate('/user/dashboard/tariffs')}
                >
                  Перейти до тарифних планів
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="mx-auto"
                  id="upload-xml-central-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Завантажити XML-файл
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  Завантажте XML-файл від постачальника для імпорту товарів
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Діалог обробки завантаженого XML */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        if (!isParsingFile && !isSaving) {
          setIsUploadDialogOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isParsingFile 
                ? 'Обробка XML файлу...' 
                : uploadStatus === 'error' 
                  ? 'Помилка обробки файлу' 
                  : 'Вибір товарів для імпорту'}
            </DialogTitle>
            <DialogDescription>
              {isParsingFile 
                ? 'Зачекайте будь ласка, триває обробка файлу...' 
                : uploadStatus === 'error' 
                  ? 'Сталася помилка під час обробки файлу. Спробуйте іще раз.' 
                  : 'Виберіть категорії та товари для додавання до магазину'}
            </DialogDescription>
          </DialogHeader>
          
          {isParsingFile ? (
            <div className="flex flex-col items-center py-10">
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% завершено</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center py-10">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center">Не вдалося обробити файл. Перевірте формат XML та спробуйте знову.</p>
            </div>
          ) : parsedData && (
            <>
              {/* Пошук та фільтрація */}
              <div className="mb-4 flex items-center gap-2">
                <Input
                  placeholder="Пошук за назвою товару чи категорії..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  id="search-input"
                />
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setSearchQuery('')}
                  disabled={!searchQuery}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Вкладки для перегляду категорій та товарів */}
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="products" className="flex-1">
                    Товари ({filteredProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="flex-1">
                    Категорії ({filteredCategories.length})
                  </TabsTrigger>
                </TabsList>
                
                {/* Вкладка з товарами */}
                <TabsContent value="products" className="max-h-[50vh] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">Немає товарів, що відповідають критеріям пошуку</p>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-2 text-sm font-medium text-gray-500">
                        <span>Вибрано: {selectedProducts.length} товарів</span>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(productsByCategory).map(([categoryId, products]) => {
                          // Перевіряємо, чи є відфільтровані товари в цій категорії
                          const categoryProducts = products.filter(p => 
                            filteredProducts.some(fp => fp.id === p.id)
                          );
                          
                          if (categoryProducts.length === 0) return null;
                          
                          // Знаходимо категорію
                          const category = parsedData.categories.find(c => c.id === categoryId);
                          
                          return (
                            <Accordion type="single" collapsible key={categoryId}>
                              <AccordionItem value={categoryId}>
                                <AccordionTrigger className="py-2">
                                  <div className="flex items-center">
                                    <span>{category?.name || "Без категорії"}</span>
                                    <Badge variant="secondary" className="ml-2">
                                      {categoryProducts.length}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-1">
                                    {categoryProducts.map(product => (
                                      <div 
                                        key={product.id} 
                                        className={`rounded-md p-2 flex items-center gap-2 ${
                                          product.selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        <Checkbox 
                                          id={`product-${product.id}`} 
                                          checked={product.selected}
                                          onCheckedChange={() => handleProductSelect(product.id)}
                                        />
                                        <div className="flex-1 ml-2">
                                          <label 
                                            htmlFor={`product-${product.id}`}
                                            className="flex justify-between cursor-pointer"
                                          >
                                            <span className="font-medium">{product.name}</span>
                                            <span className="text-blue-600 font-medium">
                                              {product.price.toFixed(2)} грн
                                            </span>
                                          </label>
                                          {product.description && (
                                            <p className="text-xs text-gray-500 truncate">
                                              {product.description.substring(0, 100)}
                                              {product.description.length > 100 ? '...' : ''}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* Вкладка з категоріями */}
                <TabsContent value="categories" className="max-h-[50vh] overflow-y-auto">
                  {filteredCategories.length === 0 ? (
                    <p className="text-center py-10 text-gray-500">Немає категорій, що відповідають критеріям пошуку</p>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-2 text-sm font-medium text-gray-500">
                        <span>Вибрано: {selectedCategories.length} категорій</span>
                      </div>
                      
                      <div className="space-y-2">
                        {filteredCategories.map(category => (
                          <div 
                            key={category.id} 
                            className={`rounded-md p-3 flex items-center gap-2 ${
                              category.selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Checkbox 
                              id={`category-${category.id}`} 
                              checked={category.selected}
                              onCheckedChange={() => handleCategorySelect(category.id)}
                            />
                            <div className="flex-1 ml-2">
                              <label 
                                htmlFor={`category-${category.id}`}
                                className="flex justify-between cursor-pointer"
                              >
                                <span className="font-medium">{category.name}</span>
                                <Badge variant="outline">
                                  {category.products.length} товарів
                                </Badge>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
          
          <DialogFooter>
            {isParsingFile || uploadStatus === 'error' ? (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadStatus('idle');
                  setUploadProgress(0);
                }}
                disabled={isParsingFile}
              >
                Закрити
              </Button>
            ) : (
              <>
                <div className="mr-auto text-sm text-gray-500">
                  {selectedProducts.length > 0 ? (
                    selectedProducts.length <= remainingProductsLimit ? (
                      <span className="flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Обрано: {selectedProducts.length} товарів
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Перевищено ліміт на {selectedProducts.length - remainingProductsLimit} товарів
                      </span>
                    )
                  ) : (
                    <span>Виберіть товари для імпорту</span>
                  )}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadDialogOpen(false)}
                  disabled={isSaving}
                >
                  Скасувати
                </Button>
                
                <Button 
                  onClick={saveSelectedProducts}
                  disabled={selectedProducts.length === 0 || selectedProducts.length > remainingProductsLimit || isSaving}
                  id="save-products-button"
                >
                  {isSaving ? (
                    <>Збереження...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Зберегти вибрані товари
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProducts;

// Допоміжна функція для навігації
function navigate(path: string) {
  window.location.href = path;
}
