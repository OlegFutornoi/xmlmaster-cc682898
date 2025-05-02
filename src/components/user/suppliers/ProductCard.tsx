
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  inStock: number;
  [key: string]: any;
}

interface ProductCardProps {
  product: Product;
  onClose: () => void;
}

// Компонент картки товару
const ProductCard: React.FC<ProductCardProps> = ({ product, onClose }) => {
  // Моковані додаткові дані про товар
  const productDetails = {
    brand: 'BestBrand',
    model: 'X-1000',
    specifications: [
      { label: 'Вага', value: '200 г' },
      { label: 'Розміри', value: '150 x 70 x 8 мм' },
      { label: 'Колір', value: 'Чорний' },
      { label: 'Гарантія', value: '12 місяців' },
    ],
    features: [
      'Висока якість',
      'Надійний механізм',
      'Стійкість до подряпин',
      'Водонепроникність',
    ]
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]" id="product-details-dialog">
        <DialogHeader>
          <DialogTitle>Деталі товару</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Зображення товару */}
            <div className="aspect-square rounded-lg overflow-hidden bg-muted/20">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Інформація про товар */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{product.price} ₴</span>
                <Badge variant={product.inStock > 0 ? "success" : "destructive"}>
                  {product.inStock > 0 ? `В наявності: ${product.inStock}` : "Немає в наявності"}
                </Badge>
              </div>

              <p className="text-muted-foreground">{product.description}</p>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Бренд:</span>
                    <div className="font-medium">{productDetails.brand}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Модель:</span>
                    <div className="font-medium">{productDetails.model}</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-semibold mb-2">Характеристики:</h3>
                  <div className="grid grid-cols-2 gap-y-2">
                    {productDetails.specifications.map((spec, index) => (
                      <div key={index}>
                        <span className="text-sm text-muted-foreground">{spec.label}:</span>
                        <div className="font-medium">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <h3 className="font-semibold mb-2">Особливості:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {productDetails.features.map((feature, index) => (
                      <li key={index} className="text-muted-foreground">{feature}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCard;
