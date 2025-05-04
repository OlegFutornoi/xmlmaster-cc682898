
// Сторінка для відображення товарів постачальника
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Product, ProductCategory, Supplier } from '@/types/supplier';
import { getSupplierProducts, updateSupplierProducts } from '@/services/supplierService';
import ProductTable from '@/components/user/products/ProductTable';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  RefreshCw, 
  FileSearch,
  FilterX,
  Filter
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Сторінка товарів постачальника
const SupplierProducts = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Фільтри
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Завантажуємо дані постачальника при монтуванні компонента
  useEffect(() => {
    if (!supplierId || !user) return;
    
    const loadSupplierData = async () => {
      setIsLoading(true);
      
      try {
        // Отримуємо інформацію про постачальника
        const { data: supplierData, error: supplierError } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .eq('user_id', user.id)
          .single();
        
        if (supplierError || !supplierData) {
          toast.error('Постачальника не знайдено');
          navigate('/user/suppliers');
          return;
        }
        
        setSupplier(supplierData);
        
        // Отримуємо товари та категорії постачальника
        const { products, categories } = await getSupplierProducts(supplierId);
        
        setProducts(products);
        setCategories(categories);
      } catch (error) {
        console.error("Помилка завантаження даних:", error);
        toast.error('Сталася помилка при завантаженні даних');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSupplierData();
  }, [supplierId, user, navigate]);
  
  // Функція для оновлення товарів постачальника
  const handleUpdateProducts = async () => {
    if (!supplier || !supplier.url || !user) {
      toast.error('Для оновлення товарів потрібно вказати URL файлу постачальника');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const result = await updateSupplierProducts(supplier.id, user.id, supplier.url);
      
      if (result.success) {
        toast.success(result.message);
        
        // Оновлюємо дані після успішного оновлення
        const { products: updatedProducts, categories: updatedCategories } = 
          await getSupplierProducts(supplier.id);
        
        setProducts(updatedProducts);
        setCategories(updatedCategories);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Помилка оновлення товарів:", error);
      toast.error('Сталася помилка при оновленні товарів');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Функція для перегляду деталей товару
  const handleViewProductDetails = (productId: string) => {
    navigate(`/user/products/${productId}`);
  };
  
  // Фільтруємо товари за категорією та пошуковим запитом
  const filteredProducts = products.filter(product => {
    const matchesCategory = 
      selectedCategory === 'all' || 
      product.category_id === selectedCategory;
    
    const matchesSearch = 
      !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.manufacturer && 
       product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });
  
  // Якщо завантажуємось, показуємо скелетон
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Skeleton className="h-32 w-full mb-6" />
        
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full mb-2" />
        ))}
      </div>
    );
  }
  
  if (!supplier) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Постачальника не знайдено</p>
        <Button onClick={() => navigate('/user/suppliers')} className="mt-4">
          Повернутися до списку постачальників
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user/suppliers')}
              className="mb-2"
              id="back-to-suppliers-button"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Назад до постачальників
            </Button>
            <h1 className="text-2xl font-bold" id="supplier-name">{supplier.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={supplier.is_active ? "default" : "outline"}>
                {supplier.is_active ? "Активний" : "Неактивний"}
              </Badge>
              <Badge variant="secondary">
                {supplier.product_count} товарів
              </Badge>
            </div>
          </div>
          
          <Button 
            onClick={handleUpdateProducts} 
            disabled={isUpdating || !supplier.url}
            className="shrink-0"
            id="update-products-button"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Оновлення...' : 'Оновити товари'}
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Товари постачальника</CardTitle>
            <CardDescription>
              Список товарів, імпортованих від постачальника {supplier.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Пошук за назвою або виробником..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  id="search-products-input"
                />
              </div>
              
              <div className="w-full sm:w-auto">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-[200px]" id="category-filter">
                    <SelectValue placeholder="Виберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Всі категорії</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id || ''}>
                        {category.name} ({category.product_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(selectedCategory !== 'all' || searchQuery) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  title="Очистити фільтри"
                  id="clear-filters-button"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {filteredProducts.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <FileSearch className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Товари не знайдено</h3>
                <p className="text-muted-foreground">
                  Спробуйте змінити фільтри або оновити дані постачальника
                </p>
              </div>
            ) : (
              <ProductTable 
                products={filteredProducts} 
                isLoading={isLoading} 
                onViewDetails={handleViewProductDetails}
              />
            )}
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              Показано {filteredProducts.length} з {products.length} товарів
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SupplierProducts;
