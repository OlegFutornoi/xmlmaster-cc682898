
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, FileSearch, ChevronDown, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

interface SupplierDetailsProps {
  supplierId: string;
  onClose: () => void;
}

// Моковані дані для демонстрації
const mockCategories = [
  { id: 'cat1', name: 'Електроніка', productCount: 45 },
  { id: 'cat2', name: 'Одяг', productCount: 32 },
  { id: 'cat3', name: 'Меблі', productCount: 12 },
  { id: 'cat4', name: 'Спорт', productCount: 18 },
  { id: 'cat5', name: 'Книги', productCount: 27 },
];

const mockProducts = [
  { 
    id: 'p1', 
    name: 'Смартфон Samsung Galaxy S21', 
    price: 25999, 
    categoryId: 'cat1',
    image: 'https://via.placeholder.com/200',
    description: 'Потужний смартфон з великим екраном та якісною камерою',
    inStock: 15
  },
  { 
    id: 'p2', 
    name: 'Ноутбук Lenovo ThinkPad', 
    price: 38500, 
    categoryId: 'cat1',
    image: 'https://via.placeholder.com/200',
    description: 'Надійний ноутбук для бізнесу з довгим часом автономної роботи',
    inStock: 8
  },
  { 
    id: 'p3', 
    name: 'Футболка чоловіча', 
    price: 599, 
    categoryId: 'cat2',
    image: 'https://via.placeholder.com/200',
    description: 'Комфортна футболка з бавовни',
    inStock: 50
  },
  { 
    id: 'p4', 
    name: 'Диван кутовий', 
    price: 15999, 
    categoryId: 'cat3',
    image: 'https://via.placeholder.com/200',
    description: 'Зручний кутовий диван для вашої вітальні',
    inStock: 3
  }
];

// Компонент деталей постачальника
const SupplierDetails: React.FC<SupplierDetailsProps> = ({ supplierId, onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [supplier, setSupplier] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState(mockCategories);
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showEmptyCategories, setShowEmptyCategories] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Отримуємо інформацію про постачальника
  useEffect(() => {
    const fetchSupplierDetails = async () => {
      if (!user || !supplierId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Помилка при завантаженні даних постачальника:', error);
        } else {
          setSupplier(data);
        }
      } catch (error) {
        console.error('Помилка:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplierDetails();
  }, [supplierId, user]);

  // Функція для перемикання розгорнутого стану категорії
  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Фільтруємо категорії
  const filteredCategories = categories.filter(category => {
    if (!showEmptyCategories && category.productCount === 0) return false;
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Фільтруємо продукти
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Контент для вкладки категорій
  const renderCategoriesContent = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="w-full md:w-1/2">
          <Label htmlFor="search-categories">Пошук категорій</Label>
          <Input
            id="search-categories"
            placeholder="Введіть назву категорії..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="show-empty-categories"
            type="checkbox"
            checked={showEmptyCategories}
            onChange={(e) => setShowEmptyCategories(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="show-empty-categories" className="cursor-pointer">
            Показувати пусті категорії
          </Label>
        </div>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <FileSearch className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-semibold">Категорії не знайдено</h3>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="mb-4 border rounded-lg">
                <div
                  className="flex items-center justify-between p-3 bg-muted/20 cursor-pointer"
                  onClick={() => toggleCategoryExpanded(category.id)}
                >
                  <div className="flex items-center">
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">{category.productCount} товарів</Badge>
                </div>
                
                {expandedCategories.includes(category.id) && (
                  <div className="p-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setActiveTab('products');
                      }}
                    >
                      Переглянути товари
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Контент для вкладки продуктів
  const renderProductsContent = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1">
          <Label htmlFor="search-products">Пошук товарів</Label>
          <Input
            id="search-products"
            placeholder="Введіть назву товару..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => setSelectedCategory(null)}
            size="sm"
            className="flex items-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            {selectedCategory 
              ? `Фільтр: ${categories.find(c => c.id === selectedCategory)?.name}` 
              : "Всі категорії"}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <FileSearch className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-2 text-lg font-semibold">Товари не знайдено</h3>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="aspect-square mb-2 bg-muted/20 rounded-md overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold">{product.price} ₴</span>
                  <Badge variant={product.inStock > 0 ? "outline" : "destructive"}>
                    {product.inStock > 0 ? `В наявності: ${product.inStock}` : "Немає в наявності"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[650px] max-h-[90vh]" id="supplier-details-dialog">
          <DialogHeader>
            <DialogTitle>
              {isLoading ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                `Деталі постачальника: ${supplier?.name || 'Невідомий'}`
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-[500px] w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Назва постачальника</Label>
                  <div className="font-medium">{supplier?.name}</div>
                </div>
                <div>
                  <Label>URL файлу</Label>
                  <div className="font-medium truncate">{supplier?.url || 'Не вказано'}</div>
                </div>
              </div>

              <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="categories">Категорії</TabsTrigger>
                  <TabsTrigger value="products">Товари</TabsTrigger>
                </TabsList>
                <TabsContent value="categories" className="space-y-4 mt-4">
                  {renderCategoriesContent()}
                </TabsContent>
                <TabsContent value="products" className="space-y-4 mt-4">
                  {renderProductsContent()}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Компонент для відображення картки товару */}
      {selectedProduct && (
        <ProductCard product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </>
  );
};

export default SupplierDetails;
