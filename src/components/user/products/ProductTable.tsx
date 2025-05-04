
// Компонент для відображення таблиці товарів
import { useMemo, useState } from 'react';
import { Product } from '@/types/supplier';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, FileSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onViewDetails: (productId: string) => void;
}

// Компонент таблиці товарів
const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  onViewDetails
}) => {
  const [sortField, setSortField] = useState<keyof Product>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  // Функція сортування
  const toggleSort = (field: keyof Product) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Сортуємо товари
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      if (sortField === 'price' || sortField === 'old_price' || sortField === 'sale_price') {
        const aValue = a[sortField] as number || 0;
        const bValue = b[sortField] as number || 0;
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const aValue = String(a[sortField] || '').toLowerCase();
        const bValue = String(b[sortField] || '').toLowerCase();
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
    });
  }, [products, sortField, sortDirection]);

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
      <div className="space-y-4">
        <div className="bg-muted/20 p-8 text-center rounded-md">
          <FileSearch className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Завантаження товарів...</p>
        </div>
      </div>
    );
  }

  // Якщо товарів немає
  if (products.length === 0) {
    return (
      <div className="bg-muted/20 p-8 text-center rounded-md">
        <FileSearch className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 font-medium">Товари відсутні</p>
        <p className="text-muted-foreground">У постачальника немає товарів або вони не були імпортовані</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table id="products-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">#</TableHead>
              <TableHead className="w-[80px]">Фото</TableHead>
              <TableHead 
                className="min-w-[200px] cursor-pointer"
                onClick={() => toggleSort('name')}
              >
                Назва {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Категорія</TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort('manufacturer')}
              >
                Виробник {sortField === 'manufacturer' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="cursor-pointer text-right"
                onClick={() => toggleSort('price')}
              >
                Ціна {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right">Стара ціна</TableHead>
              <TableHead className="text-right">Акційна ціна</TableHead>
              <TableHead>Валюта</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product, index) => (
              <TableRow key={product.id} id={`product-row-${product.id}`}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {product.images && product.images.length > 0 ? (
                    <div className="h-12 w-12 rounded overflow-hidden">
                      <img 
                        src={product.images.find(img => img.is_main)?.image_url || product.images[0].image_url} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-muted flex items-center justify-center rounded">
                      <FileSearch className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto" 
                    onClick={() => product.id && onViewDetails(product.id)}
                  >
                    {product.name}
                  </Button>
                </TableCell>
                <TableCell>
                  {product.category_name ? (
                    <Badge variant="outline">{product.category_name}</Badge>
                  ) : (
                    "Без категорії"
                  )}
                </TableCell>
                <TableCell>{product.manufacturer || "—"}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPrice(product.price)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground line-through">
                  {product.old_price ? formatPrice(product.old_price) : "—"}
                </TableCell>
                <TableCell className="text-right text-green-600 font-semibold">
                  {product.sale_price ? formatPrice(product.sale_price) : "—"}
                </TableCell>
                <TableCell>{product.currency}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => product.id && onViewDetails(product.id)}
                    id={`view-product-${product.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">Переглянути</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductTable;
