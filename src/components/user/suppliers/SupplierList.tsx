
// Компонент списку постачальників
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Trash2, 
  RefreshCw, 
  FileText, 
  ChevronRight,
  FileSearch,
  PackageOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierDetails from './SupplierDetails';
import DeleteSupplierDialog from './DeleteSupplierDialog';
import UpdateSupplierDialog from './UpdateSupplierDialog';

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

interface SupplierListProps {
  suppliers: Supplier[];
  isLoading: boolean;
  onUpdateSupplier: (supplierId: string, updates: Partial<Supplier>) => Promise<boolean>;
  onDeleteSupplier: (supplierId: string) => Promise<boolean>;
}

// Компонент списку постачальників
const SupplierList: React.FC<SupplierListProps> = ({ 
  suppliers, 
  isLoading,
  onUpdateSupplier,
  onDeleteSupplier
}) => {
  const navigate = useNavigate();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToUpdate, setSupplierToUpdate] = useState<Supplier | null>(null);

  // Функція для визначення типу файлу
  const getFileType = (url: string | null): string => {
    if (!url) return 'Невідомо';
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith('.xml')) return 'XML';
    if (lowercaseUrl.endsWith('.csv')) return 'CSV';
    return 'Невідомо';
  };

  // Функція для перемикання активності постачальника
  const toggleSupplierStatus = async (supplier: Supplier) => {
    const newStatus = !supplier.is_active;
    await onUpdateSupplier(supplier.id, { is_active: newStatus });
  };
  
  // Функція для перегляду товарів постачальника
  const viewSupplierProducts = (supplierId: string) => {
    navigate(`/user/suppliers/${supplierId}/products`);
  };

  // Якщо завантажуємо дані, показуємо скелетон
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/6" />
            <div className="ml-auto flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Якщо немає постачальників, показуємо повідомлення
  if (suppliers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
        <h3 className="mt-4 text-lg font-semibold">Постачальники відсутні</h3>
        <p className="text-muted-foreground mt-1">
          Додайте свого першого постачальника через форму вище
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table id="suppliers-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Назва постачальника</TableHead>
              <TableHead>Тип файлу</TableHead>
              <TableHead>Товари</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id} id={`supplier-row-${supplier.id}`}>
                <TableCell 
                  className="font-medium cursor-pointer hover:text-primary"
                  onClick={() => setSelectedSupplierId(supplier.id)}
                >
                  <div className="flex items-center">
                    <ChevronRight className="h-4 w-4 mr-2" />
                    {supplier.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getFileType(supplier.url) === 'XML' ? (
                      <div className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded">XML</div>
                    ) : getFileType(supplier.url) === 'CSV' ? (
                      <div className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded">CSV</div>
                    ) : (
                      <div className="bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded">Невідомо</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {supplier.product_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    id={`supplier-status-${supplier.id}`}
                    checked={supplier.is_active}
                    onCheckedChange={() => toggleSupplierStatus(supplier)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      id={`view-supplier-${supplier.id}`}
                      title="Переглянути деталі"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Переглянути</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewSupplierProducts(supplier.id)}
                      id={`view-products-${supplier.id}`}
                      title="Переглянути товари"
                    >
                      <PackageOpen className="h-4 w-4" />
                      <span className="sr-only">Товари</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSupplierToUpdate(supplier)}
                      id={`update-supplier-${supplier.id}`}
                      title="Оновити URL"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="sr-only">Оновити</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSupplierToDelete(supplier)}
                      id={`delete-supplier-${supplier.id}`}
                      title="Видалити"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Видалити</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Діалог з деталями постачальника */}
      {selectedSupplierId && (
        <SupplierDetails
          supplierId={selectedSupplierId}
          onClose={() => setSelectedSupplierId(null)}
        />
      )}

      {/* Діалог підтвердження видалення */}
      {supplierToDelete && (
        <DeleteSupplierDialog
          supplier={supplierToDelete}
          onClose={() => setSupplierToDelete(null)}
          onDelete={onDeleteSupplier}
        />
      )}

      {/* Діалог оновлення URL постачальника */}
      {supplierToUpdate && (
        <UpdateSupplierDialog
          supplier={supplierToUpdate}
          onClose={() => setSupplierToUpdate(null)}
          onUpdate={onUpdateSupplier}
        />
      )}
    </div>
  );
};

export default SupplierList;
