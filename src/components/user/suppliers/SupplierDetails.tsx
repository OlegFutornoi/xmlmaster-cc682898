
// Компонент діалогу з деталями постачальника
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Calendar, Clock, FileText, Link, PackageCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Тип для постачальника
interface Supplier {
  id: string;
  name: string;
  url: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;
  product_count: number;
}

interface SupplierDetailsProps {
  supplierId: string;
  onClose: () => void;
}

// Компонент деталей постачальника
const SupplierDetails: React.FC<SupplierDetailsProps> = ({ supplierId, onClose }) => {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Завантажуємо дані постачальника при монтуванні компонента
  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', supplierId)
          .single();
          
        if (error) {
          toast.error('Помилка завантаження даних постачальника');
          onClose();
          return;
        }
        
        setSupplier(data);
      } catch (error) {
        console.error('Помилка:', error);
        toast.error('Сталася помилка при завантаженні даних');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSupplier();
  }, [supplierId, onClose]);

  // Функція для визначення типу файлу
  const getFileType = (url: string | null): string => {
    if (!url) return 'Не вказано';
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith('.xml')) return 'XML';
    if (lowercaseUrl.endsWith('.csv')) return 'CSV';
    return 'Невідомий формат';
  };
  
  // Функція для переходу до товарів постачальника
  const viewProducts = () => {
    onClose();
    navigate(`/user/suppliers/${supplierId}/products`);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg" id="supplier-details-dialog">
        <DialogHeader>
          <DialogTitle>Деталі постачальника</DialogTitle>
          <DialogDescription>
            Детальна інформація про постачальника та його файл
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : supplier ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" id="supplier-name">{supplier.name}</h3>
                <Badge variant={supplier.is_active ? "default" : "outline"}>
                  {supplier.is_active ? "Активний" : "Неактивний"}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Створено
                </div>
                <div id="supplier-created-at">
                  {new Date(supplier.created_at).toLocaleDateString('uk-UA')}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-muted-foreground flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Оновлено
                </div>
                <div id="supplier-updated-at">
                  {new Date(supplier.updated_at).toLocaleDateString('uk-UA')}
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center">
                <Link className="h-4 w-4 mr-2" />
                URL файлу
              </div>
              <div className="p-2 bg-muted rounded text-sm break-all" id="supplier-url">
                {supplier.url || 'Не вказано'}
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs">Тип файлу:</div>
                <Badge variant="outline">{getFileType(supplier.url)}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center">
                <PackageCheck className="h-4 w-4 mr-2" />
                Товари
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-lg font-semibold" id="supplier-product-count">
                  {supplier.product_count}
                </div>
                <div className="text-sm text-muted-foreground">товарів у базі даних</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2">Постачальника не знайдено</p>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Закрити
          </Button>
          {supplier && (
            <Button 
              onClick={viewProducts}
              className="w-full sm:w-auto"
              id="view-products-button"
            >
              Переглянути товари
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierDetails;
