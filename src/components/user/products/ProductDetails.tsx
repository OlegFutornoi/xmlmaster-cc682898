
// Компонент для відображення деталей товару
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ProductAttribute, ProductImage } from '@/types/supplier';
import { getProductDetails } from '@/services/supplierService';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

// Компонент галереї зображень
const ImageGallery = ({ images }: { images: ProductImage[] }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Встановлюємо перше зображення як вибране при монтуванні компонента
  useEffect(() => {
    if (images && images.length > 0) {
      const mainImage = images.find(img => img.is_main);
      setSelectedImage(mainImage ? mainImage.image_url : images[0].image_url);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="bg-muted rounded-lg flex items-center justify-center h-[300px] mb-4">
        <div className="text-center text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2" />
          <p>Немає зображень</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-muted rounded-lg mb-4 flex items-center justify-center h-[300px] md:h-[400px]">
        {selectedImage ? (
          <img 
            src={selectedImage} 
            alt="Товар" 
            className="h-full w-full object-contain rounded-lg"
            id="product-main-image"
          />
        ) : (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="mx-auto h-12 w-12 mb-2" />
            <p>Зображення не завантажилось</p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <div 
              key={image.id || index}
              className={`
                h-16 w-16 rounded-md overflow-hidden cursor-pointer
                ${selectedImage === image.image_url ? 'ring-2 ring-primary' : 'opacity-70'}
              `}
              onClick={() => setSelectedImage(image.image_url)}
              id={`thumbnail-${index}`}
            >
              <img 
                src={image.image_url} 
                alt={`Превью ${index + 1}`} 
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент таблиці характеристик
const AttributesTable = ({ attributes }: { attributes: ProductAttribute[] }) => {
  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        У цього товару немає характеристик
      </div>
    );
  }

  return (
    <Table id="product-attributes-table">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Характеристика</TableHead>
          <TableHead>Значення</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attributes.map((attr, index) => (
          <TableRow key={attr.id || index} id={`attribute-row-${index}`}>
            <TableCell className="font-medium">{attr.attribute_name}</TableCell>
            <TableCell>{attr.attribute_value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Компонент відображення даних товару
const ProductDetails = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Завантажуємо дані товару при монтуванні компонента
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!productId) {
        toast.error('ID товару не вказано');
        navigate('/user/suppliers');
        return;
      }

      setIsLoading(true);
      const result = await getProductDetails(productId);

      if (result.success && result.product) {
        setProduct(result.product);
      } else {
        navigate('/user/suppliers');
      }

      setIsLoading(false);
    };

    loadProductDetails();
  }, [productId, navigate]);

  // Функція для форматування ціни
  const formatPrice = (price?: number | null) => {
    if (price === undefined || price === null) return '-';
    return price.toLocaleString('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Якщо завантажуємось, показуємо скелетон
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="flex items-center mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-40 ml-4" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Товар не знайдено</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Повернутися назад
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="mb-6"
        id="back-button"
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Назад до списку
      </Button>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <ImageGallery images={product.images || []} />
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2" id="product-title">{product.name}</h1>
          
          {product.category_name && (
            <div className="mb-4">
              <Badge variant="outline">{product.category_name}</Badge>
            </div>
          )}

          <div className="flex items-baseline gap-4 mb-4">
            <span className="text-2xl font-bold" id="product-price">
              {formatPrice(product.price)} {product.currency}
            </span>
            
            {product.old_price && (
              <span className="text-lg text-muted-foreground line-through" id="product-old-price">
                {formatPrice(product.old_price)} {product.currency}
              </span>
            )}
            
            {product.sale_price && (
              <span className="text-lg text-green-600 font-semibold" id="product-sale-price">
                {formatPrice(product.sale_price)} {product.currency}
              </span>
            )}
          </div>

          {product.manufacturer && (
            <p className="mb-4 text-muted-foreground">
              <strong>Виробник:</strong> {product.manufacturer}
            </p>
          )}

          {product.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Опис</h2>
              <p className="text-muted-foreground" id="product-description">
                {product.description}
              </p>
            </div>
          )}

          <Button className="w-full md:w-auto" id="add-to-store-button">
            <ShoppingCart className="mr-2 h-4 w-4" /> Додати в магазин
          </Button>
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Деталі товару</CardTitle>
          <CardDescription>Характеристики та додаткова інформація</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="attributes">
            <TabsList className="mb-4">
              <TabsTrigger value="attributes">Характеристики</TabsTrigger>
              <TabsTrigger value="additional">Додаткова інформація</TabsTrigger>
            </TabsList>
            <TabsContent value="attributes">
              <AttributesTable attributes={product.attributes || []} />
            </TabsContent>
            <TabsContent value="additional">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">ID товару</h3>
                  <p className="text-muted-foreground">{product.id}</p>
                </div>
                <div>
                  <h3 className="font-medium">Дата створення</h3>
                  <p className="text-muted-foreground">
                    {product.created_at && new Date(product.created_at).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Дата оновлення</h3>
                  <p className="text-muted-foreground">
                    {product.updated_at && new Date(product.updated_at).toLocaleDateString('uk-UA')}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetails;
