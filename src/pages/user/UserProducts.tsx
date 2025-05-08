// Компонент для роботи з товарами
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Upload, 
  Check,
  X,
  Plus,
  Tag,
  Image as ImageIcon,
  Edit,
  Eye,
  Trash,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Save,
  Undo2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import { FilterIcon } from 'lucide-react';

// Типи для даних
interface UserStore {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  file_path: string | null;
}

interface Category {
  id: string;
  name: string;
  selected: boolean;
  products: Product[];
}

interface ProductAttribute {
  name: string;
  value: string;
}

interface Product {
  id: string;
  external_id?: string;
  name: string;
  price: number;
  old_price?: number;
  sale_price?: number;
  description?: string;
  selected: boolean;
  category_id: string;
  images: string[];
  vendor?: string;
  vendor_code?: string;
  stock_quantity?: number;
  sku?: string;
  attributes: ProductAttribute[];
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
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);
  
  // Стани для режиму перегляду перед збереженням
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
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

  // Завантаження файлу з посилання постачальника
  const loadFileFromUrl = async () => {
    if (!selectedSupplier) return;
    
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (!supplier || !supplier.url) {
      toast({
        title: 'Помилка',
        description: 'У постачальника не вказано URL для завантаження файлу',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoadingFile(true);
    setUploadStatus('parsing');
    setIsParsingFile(true);
    
    try {
      // Зробимо запит до URL постачальника
      const response = await fetch(supplier.url);
      if (!response.ok) {
        throw new Error(`Помилка HTTP: ${response.status}`);
      }
      
      const xmlText = await response.text();
      parseXml(xmlText);
    } catch (error) {
      console.error('Error loading file from URL:', error);
      setUploadStatus('error');
      setIsParsingFile(false);
      
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити файл з URL постачальника',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Універсальна функція для парсингу XML
  const parseXml = async (xmlText: string) => {
    try {
      // Емуляція процесу парсингу з прогресом
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Парсимо XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      console.log('XML parsed:', xmlDoc);
      
      // Масиви для категорій та товарів
      const parsedCategories: Category[] = [];
      const parsedProducts: Product[] = [];
      const categoryMap: { [key: string]: string } = {}; // Для зберігання відповідності id -> name
      
      // Спроба знайти категорії в різних форматах
      // 1. Формат YML - категорії у <categories><category>
      const ymlCategories = xmlDoc.querySelectorAll('categories > category');
      if (ymlCategories.length > 0) {
        console.log('Found YML categories:', ymlCategories.length);
        
        ymlCategories.forEach((element, index) => {
          const id = element.getAttribute('id') || `category-${index}`;
          const name = element.textContent || `Category ${index}`;
          
          parsedCategories.push({
            id,
            name,
            selected: false,
            products: []
          });
          
          categoryMap[id] = name;
        });
      }
      
      // 2. Інший формат - категорії як окремі теги
      if (ymlCategories.length === 0) {
        const simpleCategories = xmlDoc.querySelectorAll('category');
        if (simpleCategories.length > 0) {
          console.log('Found simple categories:', simpleCategories.length);
          
          simpleCategories.forEach((element, index) => {
            const id = element.getAttribute('id') || `category-${index}`;
            const name = element.textContent || `Category ${index}`;
            
            parsedCategories.push({
              id,
              name,
              selected: false,
              products: []
            });
            
            categoryMap[id] = name;
          });
        }
      }
      
      // Вивести в консоль знайдені категорії
      console.log('Parsed categories:', parsedCategories);
      console.log('Category map:', categoryMap);
      
      // Спроба знайти товари в різних форматах
      // 1. Формат YML - товари в <offers><offer>
      const ymlOffers = xmlDoc.querySelectorAll('offers > offer');
      if (ymlOffers.length > 0) {
        console.log('Found YML offers:', ymlOffers.length);
        
        ymlOffers.forEach((offer, index) => {
          const id = offer.getAttribute('id') || `product-${index}`;
          const name = offer.querySelector('name')?.textContent || `Product ${index}`;
          const priceElement = offer.querySelector('price');
          const price = priceElement ? parseFloat(priceElement.textContent || '0') : 0;
          const oldPriceElement = offer.querySelector('oldprice') || offer.querySelector('old_price');
          const oldPrice = oldPriceElement ? parseFloat(oldPriceElement.textContent || '0') : undefined;
          const salePriceElement = offer.querySelector('sale_price');
          const salePrice = salePriceElement ? parseFloat(salePriceElement.textContent || '0') : undefined;
          const description = offer.querySelector('description')?.textContent || '';
          const categoryId = offer.querySelector('categoryId')?.textContent || '';
          const vendor = offer.querySelector('vendor')?.textContent || undefined;
          const vendorCode = offer.querySelector('vendorCode')?.textContent || undefined;
          const stockQuantity = offer.querySelector('stock_quantity')?.textContent || undefined;
          const sku = offer.querySelector('sku')?.textContent || undefined;
          
          // Зображення товару - можуть бути як <picture> так і <image>
          const images: string[] = [];
          
          // Перевіряємо теги <picture>
          const pictureElements = offer.querySelectorAll('picture');
          if (pictureElements.length > 0) {
            pictureElements.forEach(pic => {
              if (pic.textContent) {
                images.push(pic.textContent);
              }
            });
          }
          
          // Якщо немає <picture>, перевіряємо теги <image>
          if (images.length === 0) {
            const imageElements = offer.querySelectorAll('image');
            imageElements.forEach(img => {
              if (img.textContent) {
                images.push(img.textContent);
              }
            });
          }
          
          // Збираємо атрибути товару (параметри)
          const attributes: ProductAttribute[] = [];
          const paramElements = offer.querySelectorAll('param');
          
          paramElements.forEach(param => {
            const name = param.getAttribute('name') || '';
            const value = param.textContent || '';
            if (name && value) {
              attributes.push({
                name,
                value
              });
            }
          });
          
          parsedProducts.push({
            id,
            external_id: id,
            name,
            price,
            old_price: oldPrice,
            sale_price: salePrice,
            description,
            selected: false,
            category_id: categoryId,
            images,
            vendor,
            vendor_code: vendorCode,
            stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
            sku,
            attributes
          });
        });
      }
      
      // 2. Формат з <item> тег замість <offer>
      if (parsedProducts.length === 0) {
        const itemElements = xmlDoc.querySelectorAll('item');
        if (itemElements.length > 0) {
          console.log('Found item elements:', itemElements.length);
          
          itemElements.forEach((item, index) => {
            const id = item.getAttribute('id') || `product-${index}`;
            const name = item.querySelector('name')?.textContent || `Product ${index}`;
            
            // Ціна може бути в різних тегах
            let price = 0;
            const priceElements = ['price', 'priceusd', 'priceUSD', 'priceUah'];
            for (const priceTag of priceElements) {
              const priceElement = item.querySelector(priceTag);
              if (priceElement && priceElement.textContent) {
                price = parseFloat(priceElement.textContent);
                break;
              }
            }
            
            // Додаткові ціни
            const oldPriceElement = item.querySelector('oldprice') || item.querySelector('old_price') || item.querySelector('priceOld');
            const oldPrice = oldPriceElement ? parseFloat(oldPriceElement.textContent || '0') : undefined;
            
            const salePriceElement = item.querySelector('sale_price') || item.querySelector('salePrice');
            const salePrice = salePriceElement ? parseFloat(salePriceElement.textContent || '0') : undefined;
            
            const description = item.querySelector('description')?.textContent || '';
            const categoryId = item.querySelector('categoryId')?.textContent || '';
            const vendor = item.querySelector('vendor')?.textContent || undefined;
            const vendorCode = item.querySelector('vendorCode')?.textContent || undefined;
            const stockQuantity = item.querySelector('stock_quantity')?.textContent || undefined;
            const sku = item.querySelector('sku')?.textContent || item.querySelector('article')?.textContent || undefined;
            
            // Зображення товару
            const images: string[] = [];
            
            // Перевіряємо різні типи тегів для зображень
            ['image', 'picture', 'img'].forEach(imgTag => {
              const imgElements = item.querySelectorAll(imgTag);
              imgElements.forEach(img => {
                if (img.textContent) {
                  images.push(img.textContent);
                }
              });
            });
            
            // Збираємо атрибути товару (параметри)
            const attributes: ProductAttribute[] = [];
            const paramElements = item.querySelectorAll('param');
            
            paramElements.forEach(param => {
              const name = param.getAttribute('name') || '';
              const value = param.textContent || '';
              if (name && value) {
                attributes.push({
                  name,
                  value
                });
              }
            });
            
            parsedProducts.push({
              id,
              external_id: id,
              name,
              price,
              old_price: oldPrice,
              sale_price: salePrice,
              description,
              selected: false,
              category_id: categoryId,
              images,
              vendor,
              vendor_code: vendorCode,
              stock_quantity: stockQuantity ? parseInt(stockQuantity) : undefined,
              sku,
              attributes
            });
          });
        }
      }
      
      // Вивести в консоль знайдені товари
      console.log('Parsed products:', parsedProducts);
      
      // Додаємо товари до відповідних категорій
      parsedCategories.forEach(category => {
        category.products = parsedProducts.filter(product => product.category_id === category.id);
      });
      
      // Якщо категорій не знайдено, але є товари, створюємо категорію "Без категорії"
      if (parsedCategories.length === 0 && parsedProducts.length > 0) {
        const defaultCategory = {
          id: 'default',
          name: 'Без категорії',
          selected: false,
          products: parsedProducts
        };
        parsedCategories.push(defaultCategory);
        
        // Оновлюємо категорії товарів
        parsedProducts.forEach(product => {
          product.category_id = 'default';
        });
      }
      
      setParsedData({
        categories: parsedCategories,
        products: parsedProducts
      });
      
      setUploadStatus('success');
      setIsParsingFile(false);
      
      toast.success(`Файл оброблено: знайдено ${parsedCategories.length} категорій та ${parsedProducts.length} товарів`);
    } catch (error) {
      console.error('Error parsing XML:', error);
      setUploadStatus('error');
      setIsParsingFile(false);
      
      toast.error('Не вдалося обробити XML файл');
    }
  };

  // Функція для завантаження XML файлу з комп'ютера
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadStatus('parsing');
    setIsParsingFile(true);
    
    // Створюємо читача файлів
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (!e.target?.result) return;
      const xmlText = e.target.result as string;
      parseXml(xmlText);
    };
    
    reader.onerror = () => {
      setUploadStatus('error');
      setIsParsingFile(false);
      
      toast.error('Не вдалося прочитати файл');
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
  
  // Вибір всіх товарів в категорії
  const selectAllInCategory = (categoryId: string) => {
    const updatedCategories = parsedData?.categories.map(category => {
      if (category.id === categoryId) {
        // Встановлюємо всі товари в категорії як вибрані
        const updatedProducts = category.products.map(product => ({ 
          ...product, 
          selected: true 
        }));
        
        return {
          ...category,
          products: updatedProducts,
          selected: updatedProducts.length > 0
        };
      }
      return category;
    });
    
    if (updatedCategories) {
      // Оновлюємо список продуктів
      const allProducts = updatedCategories.flatMap(c => c.products);
      
      setParsedData({
        categories: updatedCategories,
        products: allProducts
      });
      
      // Оновлюємо список вибраних категорій
      const newSelectedCategories = updatedCategories
        .filter(category => category.selected)
        .map(category => category.id);
        
      setSelectedCategories(newSelectedCategories);
      
      // Оновлюємо список вибраних продуктів
      const newSelectedProducts = allProducts
        .filter(product => product.selected)
        .map(product => product.id);
        
      setSelectedProducts(newSelectedProducts);
    }
  };
  
  // Скасування вибору всіх товарів в категорії
  const deselectAllInCategory = (categoryId: string) => {
    const updatedCategories = parsedData?.categories.map(category => {
      if (category.id === categoryId) {
        // Встановлюємо всі товари в категорії як не вибрані
        const updatedProducts = category.products.map(product => ({ 
          ...product, 
          selected: false 
        }));
        
        return {
          ...category,
          products: updatedProducts,
          selected: false
        };
      }
      return category;
    });
    
    if (updatedCategories) {
      // Оновлюємо список продуктів
      const allProducts = updatedCategories.flatMap(c => c.products);
      
      setParsedData({
        categories: updatedCategories,
        products: allProducts
      });
      
      // Оновлюємо список вибраних категорій
      const newSelectedCategories = updatedCategories
        .filter(category => category.selected)
        .map(category => category.id);
        
      setSelectedCategories(newSelectedCategories);
      
      // Оновлюємо список вибраних продуктів
      const newSelectedProducts = allProducts
        .filter(product => product.selected)
        .map(product => product.id);
        
      setSelectedProducts(newSelectedProducts);
    }
  };

  // Функція для переходу в режим перегляду товарів
  const showProductsPreview = () => {
    // Отримуємо всі вибрані товари
    const selectedProductsData = parsedData?.products.filter(product => product.selected) || [];
    
    // Перевіряємо обмеження кількості товарів
    if (selectedProductsData.length > remainingProductsLimit) {
      toast.error(`Ви можете додати лише ${remainingProductsLimit} товарів. Вибрано: ${selectedProductsData.length}`);
      return;
    }
    
    // Встановлюємо дані для перегляду
    setPreviewProducts(selectedProductsData);
    setCurrentPreviewIndex(0);
    setIsPreviewMode(true);
  };

  // Функція для збереження вибраних товарів
  const saveSelectedProducts = async () => {
    if (!selectedStore || !selectedSupplier || !previewProducts.length) return;
    
    setIsSaving(true);
    
    try {
      // Для кожного товару з вибраних
      for (const product of previewProducts) {
        // 1. Спочатку перевіряємо, чи існує категорія, якщо ні - створюємо
        let categoryId = product.category_id;
        const categoryName = parsedData?.categories.find(c => c.id === product.category_id)?.name || 'Без категорії';
        
        // Шукаємо категорію за назвою і магазином
        const { data: existingCategories, error: categoryError } = await extendedSupabase
          .from('product_categories')
          .select('id')
          .eq('name', categoryName)
          .eq('store_id', selectedStore)
          .eq('user_id', user?.id);
          
        if (categoryError) throw categoryError;
        
        if (!existingCategories?.length) {
          // Створюємо нову категорію
          const { data: newCategory, error } = await extendedSupabase
            .from('product_categories')
            .insert({
              name: categoryName,
              user_id: user?.id,
              store_id: selectedStore,
              supplier_id: selectedSupplier,
              external_id: product.category_id
            })
            .select('id')
            .single();
            
          if (error) throw error;
          categoryId = newCategory.id;
        } else {
          categoryId = existingCategories[0].id;
        }
        
        // 2. Зберігаємо товар
        const { data: savedProduct, error: productError } = await extendedSupabase
          .from('products')
          .insert({
            name: product.name,
            description: product.description || null,
            price: product.price,
            old_price: product.old_price,
            sale_price: product.sale_price,
            stock_quantity: product.stock_quantity || 0,
            sku: product.sku,
            vendor: product.vendor,
            vendor_code: product.vendor_code,
            external_id: product.external_id,
            category_id: categoryId,
            supplier_id: selectedSupplier,
            store_id: selectedStore,
            user_id: user?.id
          })
          .select()
          .single();
          
        if (productError) throw productError;
        
        // 3. Зберігаємо зображення товару
        if (product.images?.length) {
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
        
        // 4. Зберігаємо атрибути товару
        if (product.attributes?.length) {
          const productAttributes = product.attributes.map(attr => ({
            product_id: savedProduct.id,
            attribute_name: attr.name,
            attribute_value: attr.value
          }));
          
          const { error: attributesError } = await extendedSupabase
            .from('product_attributes')
            .insert(productAttributes);
            
          if (attributesError) {
            console.error('Error saving product attributes:', attributesError);
          }
        }
      }
      
      // Оновлюємо лічильник товарів у магазині
      fetchStoreProductsCount();
      
      // Оновлюємо лічильник товарів у постачальника
      const { error: supplierError } = await extendedSupabase
        .from('suppliers')
        .update({ product_count: previewProducts.length })
        .eq('id', selectedSupplier);
      
      if (supplierError) {
        console.error('Error updating supplier product count:', supplierError);
      }
      
      toast.success(`Додано ${previewProducts.length} товарів до магазину`);
      
      // Скидаємо дані після збереження
      setParsedData(null);
      setSelectedCategories([]);
      setSelectedProducts([]);
      setIsPreviewMode(false);
      setPreviewProducts([]);
      
    } catch (error) {
      console.error('Error saving products:', error);
      toast.error('Не вдалося зберегти товари');
    } finally {
      setIsSaving(false);
    }
  };

  // Пересування між товарами у режимі перегляду
  const goToPrevProduct = () => {
    setCurrentPreviewIndex(prev => Math.max(0, prev - 1));
  };
  
  const goToNextProduct = () => {
    setCurrentPreviewIndex(prev => Math.min(previewProducts.length - 1, prev + 1));
  };

  // Фільтрація категорій за пошуком
  const filteredCategories = parsedData?.categories
    .filter(category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!hideEmptyCategories || category.products.length > 0)
    ) || [];

  // Фільтрація продуктів за пошуком та категоріями
  const filteredProducts = parsedData?.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (product.vendor && product.vendor.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  // Функція форматування ціни
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 2,
    }).format(price);
  }

  // Отримуємо поточний продукт для перегляду
  const currentProduct = previewProducts[currentPreviewIndex];

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
          
          {/* Кнопки для завантаження */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedStore || !selectedSupplier}
                  id="upload-xml-button"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  З комп'ютера
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Завантажити XML-файл з комп'ютера
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary" 
                  onClick={loadFileFromUrl}
                  disabled={!selectedStore || !selectedSupplier || !suppliers.find(s => s.id === selectedSupplier)?.url}
                  id="load-from-url-button"
                  size="sm"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  З сайту
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Завантажити XML-файл з URL постачальника
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {supplier.url && <span className="ml-2 text-xs text-green-600">(є URL)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Основний контент сторінки */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-3">Завантаження...</span>
        </div>
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
              <ShoppingBag className="h-4 w-4 mr-2" />
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
              <Tag className="h-4 w-4 mr-2" />
              Перейти до сторінки постачальників
            </Button>
          </CardContent>
        </Card>
      ) : !selectedStore || !selectedSupplier ? (
        <div className="text-center py-8">
          <p>Будь ласка, виберіть магазин і постачальника для продовження</p>
        </div>
      ) : !canAddProducts ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Товари магазину</span>
              <Badge variant="destructive" className="px-2 py-1">
                Ліміт товарів вичерпано
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-4 border rounded bg-red-50">
              <X className="h-10 w-10 text-red-500 mb-2" />
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
          </CardContent>
        </Card>
      ) : !parsedData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Імпорт товарів</span>
              <Badge variant="secondary" className="px-2 py-1">
                Доступно для додавання: {remainingProductsLimit}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="secondary"
                  className="flex-grow-0"
                  id="upload-xml-central-button"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Завантажити XML з комп'ютера
                </Button>
                
                <Button 
                  onClick={loadFileFromUrl}
                  variant="outline"
                  className="flex-grow-0"
                  id="load-url-central-button"
                  disabled={!suppliers.find(s => s.id === selectedSupplier)?.url}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Завантажити XML з сайту постачальника
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Завантажте XML-файл від постачальника для імпорту товарів
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle>Вибір товарів для імпорту</CardTitle>
              <Badge variant={selectedProducts.length > 0 ? "default" : "secondary"} className="px-2 py-1">
                Вибрано: {selectedProducts.length} товарів
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Пошук та фільтрація */}
            <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
              <div className="flex items-center gap-2 w-full md:w-auto">
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
              
              <div className="flex items-center gap-2 ml-auto">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-empty"
                    checked={hideEmptyCategories}
                    onCheckedChange={(checked) => {
                      setHideEmptyCategories(checked as boolean);
                    }}
                  />
                  <label
                    htmlFor="hide-empty"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Приховати порожні категорії
                  </label>
                </div>
              </div>
            </div>
            
            {/* Статистика і вибрані товари */}
            <div className="flex justify-between items-center mb-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {parsedData.products.length} товарів
                </Badge>
                <Badge variant="outline">
                  {parsedData.categories.length} категорій
                </Badge>
              </div>
              <div>
                <Button 
                  onClick={showProductsPreview}
                  disabled={selectedProducts.length === 0 || selectedProducts.length > remainingProductsLimit}
                  size="sm"
                  variant="default"
                  id="preview-products-button"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Переглянути та зберегти
                </Button>
              </div>
            </div>
            
            {/* Двоколоночний вид для категорій та товарів */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
              {/* Ліва колонка - категорії */}
              <div className="border rounded-md p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
                <div className="font-semibold mb-2 text-sm">Категорії</div>
                {filteredCategories.length > 0 ? (
                  <div className="space-y-2">
                    {filteredCategories.map(category => (
                      <div 
                        key={category.id} 
                        className={`p-2 rounded-md cursor-pointer ${
                          selectedCategories.includes(category.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Checkbox 
                              checked={category.selected} 
                              id={`category-${category.id}`}
                            />
                            <label 
                              htmlFor={`category-${category.id}`}
                              className="ml-2 font-medium text-sm cursor-pointer flex-1"
                            >
                              {category.name}
                            </label>
                          </div>
                          <Badge variant="outline">
                            {category.products.length}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectAllInCategory(category.id);
                            }}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Вибрати всі
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              deselectAllInCategory(category.id);
                            }}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Очистити
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">Немає категорій, що відповідають пошуку</p>
                )}
              </div>
              
              {/* Права колонка - товари */}
              <div className="border rounded-md p-2 overflow-hidden md:col-span-2">
                <div className="font-semibold mb-2 text-sm flex justify-between">
                  <span>Товари</span>
                  <Badge variant="outline" className="ml-2">
                    {filteredProducts.length} товарів
                  </Badge>
                </div>
                
                {filteredProducts.length > 0 ? (
                  <div className="overflow-y-auto max-h-[calc(100vh-330px)]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-16"></TableHead>
                          <TableHead>Назва</TableHead>
                          <TableHead className="hidden md:table-cell">Виробник</TableHead>
                          <TableHead className="text-right">Ціна</TableHead>
                          <TableHead className="hidden md:table-cell text-right">Кількість</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map(product => (
                          <TableRow 
                            key={product.id}
                            className={product.selected ? 'bg-blue-50' : ''}
                          >
                            <TableCell className="p-2">
                              <Checkbox 
                                checked={product.selected} 
                                id={`product-${product.id}`}
                                onCheckedChange={() => handleProductSelect(product.id)}
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              {product.images.length > 0 ? (
                                <div className="w-12 h-12 rounded overflow-hidden border">
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <ImageIcon className="text-gray-400 h-5 w-5" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{product.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                ID: {product.id}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="text-sm">{product.vendor || '-'}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-sm font-medium text-blue-700">{formatPrice(product.price)}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-right">
                              {product.stock_quantity !== undefined ? (
                                <Badge variant={product.stock_quantity > 0 ? "outline" : "secondary"}>
                                  {product.stock_quantity}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[calc(100vh-350px)]">
                    <FilterIcon className="text-gray-400 h-10 w-10 mb-2" />
                    <p className="text-gray-500">
                      Немає товарів, що відповідають критеріям пошуку
                    </p>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                      }}
                    >
                      Скинути фільтри
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Діалог перегляду товарів перед збереженням */}
      <Dialog 
        open={isPreviewMode} 
        onOpenChange={(open) => {
          if (!isSaving) {
            setIsPreviewMode(open);
            if (!open) {
              setPreviewProducts([]);
            }
          }
        }}
      >
        <DialogContent className="overflow-y-auto max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row justify-between items-center">
            <div>
              <DialogTitle>Перегляд товарів перед збереженням</DialogTitle>
              <DialogDescription>
                Товар {currentPreviewIndex + 1} з {previewProducts.length}
              </DialogDescription>
            </div>
          </DialogHeader>
          
          {currentProduct && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Товар для перегляду */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Ліва частина - зображення */}
                <div className="flex flex-col">
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border mb-4 max-h-[300px]">
                    {currentProduct.images && currentProduct.images.length > 0 ? (
                      <Carousel className="w-full">
                        <CarouselContent>
                          {currentProduct.images.map((imageUrl, idx) => (
                            <CarouselItem key={idx} className="flex justify-center items-center">
                              <img 
                                src={imageUrl} 
                                alt={`${currentProduct.name} - зображення ${idx + 1}`} 
                                className="object-contain w-full h-full max-h-[300px]" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {currentProduct.images.length > 1 && (
                          <>
                            <CarouselPrevious />
                            <CarouselNext />
                          </>
                        )}
                      </Carousel>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                        <span className="text-gray-500">Немає зображень</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Мініатюри зображень */}
                  {currentProduct.images && currentProduct.images.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {currentProduct.images.map((imageUrl, idx) => (
                        <div key={idx} className="w-16 h-16 border rounded overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`Мініатюра ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Права частина - інформація про товар */}
                <div className="flex flex-col">
                  {/* Код товару */}
                  <div className="text-xs text-gray-500 mb-1">
                    Код товару: {currentProduct.sku || currentProduct.external_id || 'Не вказано'}
                  </div>
                  
                  {/* Назва товару */}
                  <h2 className="text-xl font-semibold mb-3">{currentProduct.name}</h2>
                  
                  {/* Виробник */}
                  {currentProduct.vendor && (
                    <div className="flex items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">Виробник:</span>
                      <Badge variant="outline" className="ml-2">{currentProduct.vendor}</Badge>
                    </div>
                  )}
                  
                  {/* Ціни */}
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 mr-2">Ціна:</span>
                      <span className="text-lg font-bold text-blue-700">{formatPrice(currentProduct.price)}</span>
                    </div>
                    
                    {currentProduct.old_price && currentProduct.old_price > currentProduct.price && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Стара ціна:</span>
                        <span className="text-sm line-through text-gray-500">{formatPrice(currentProduct.old_price)}</span>
                      </div>
                    )}
                    
                    {currentProduct.sale_price && currentProduct.sale_price < currentProduct.price && (
                      <div className="flex items-center">
                        <span className="text-sm text-green-600 mr-2">Акційна ціна:</span>
                        <span className="text-sm font-medium text-green-600">{formatPrice(currentProduct.sale_price)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Наявність */}
                  <div className="flex items-center mb-4">
                    <span className="text-sm font-medium text-gray-700 mr-2">Наявність:</span>
                    <Badge variant={currentProduct.stock_quantity && currentProduct.stock_quantity > 0 ? "success" : "secondary"}>
                      {currentProduct.stock_quantity && currentProduct.stock_quantity > 0 
                        ? `В наявності (${currentProduct.stock_quantity} шт.)` 
                        : "Немає в наявності"}
                    </Badge>
                  </div>
                  
                  {/* Опис товару */}
                  {currentProduct.description && (
                    <div className="mb-4">
                      <h3 className="text-md font-medium mb-2">Опис</h3>
                      <div 
                        className="text-sm text-gray-700 bg-gray-50 p-3 rounded overflow-y-auto max-h-[100px]"
                        dangerouslySetInnerHTML={{ __html: currentProduct.description }}
                      ></div>
                    </div>
                  )}
                  
                  {/* Характеристики товару */}
                  {currentProduct.attributes && currentProduct.attributes.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-2">Характеристики</h3>
                      <ScrollArea className="border rounded max-h-[150px]">
                        <div className="p-3">
                          <table className="w-full">
                            <tbody>
                              {currentProduct.attributes.map((attr, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                  <td className="py-1 px-2 text-sm font-medium text-gray-700">{attr.name}</td>
                                  <td className="py-1 px-2 text-sm">{attr.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Нижня панель з кнопками */}
          <DialogFooter className="flex justify-between items-center mt-4">
            {/* Ліва кнопка - Повернутися */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPreviewMode(false)}
                    disabled={isSaving}
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Повернутися
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Повернутися до вибору товарів
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Центральна навігація */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToPrevProduct}
                disabled={currentPreviewIndex === 0 || isSaving}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-gray-500 mx-2">
                {currentPreviewIndex + 1} / {previewProducts.length}
              </span>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={goToNextProduct}
                disabled={currentPreviewIndex === previewProducts.length - 1 || isSaving}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Права кнопка - Зберегти */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default"
                    onClick={saveSelectedProducts}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                        Зберігаємо...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Додати товари
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Додати всі товари до магазину
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
