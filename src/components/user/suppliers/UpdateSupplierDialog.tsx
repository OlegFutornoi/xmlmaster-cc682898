
// Компонент діалогу оновлення URL постачальника
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FileType } from '@/types/supplier';
import { validateFileUrl } from '@/utils/fileProcessing';
import { toast } from 'sonner';

// Схема валідації URL
const urlSchema = z.object({
  url: z
    .string()
    .url({ message: 'Будь ласка, введіть коректну URL-адресу' })
    .refine(
      (value) => {
        const lowercaseUrl = value.toLowerCase();
        return lowercaseUrl.endsWith('.xml') || lowercaseUrl.endsWith('.csv');
      },
      {
        message: 'URL повинен вказувати на файл формату XML або CSV',
      }
    ),
});

interface Supplier {
  id: string;
  name: string;
  url: string | null;
  [key: string]: any;
}

interface UpdateSupplierDialogProps {
  supplier: Supplier;
  onClose: () => void;
  onUpdate: (supplierId: string, updates: Partial<Supplier>) => Promise<boolean>;
}

// Компонент діалогу оновлення URL постачальника
const UpdateSupplierDialog: React.FC<UpdateSupplierDialogProps> = ({
  supplier,
  onClose,
  onUpdate,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: supplier.url || '',
    },
  });

  // Функція для перевірки доступності файлу
  const validateFile = async (url: string): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      // Перевіряємо URL та формат файлу
      const { valid, fileType, message } = validateFileUrl(url);
      
      if (!valid) {
        toast.error(message);
        return false;
      }
      
      // Перевіряємо доступність файлу
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        toast.error(`Файл недоступний: ${response.status} ${response.statusText}`);
        return false;
      }
      
      // Файл доступний, визначаємо його тип
      toast.success(`Файл формату ${fileType} доступний`);
      return true;
    } catch (error) {
      console.error('Помилка валідації файлу:', error);
      toast.error('Не вдалося перевірити доступність файлу');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdate = async (values: z.infer<typeof urlSchema>) => {
    // Перевіряємо доступність файлу перед оновленням постачальника
    const isFileValid = await validateFile(values.url);
    
    if (!isFileValid) {
      return;
    }
    
    setIsUpdating(true);
    try {
      const success = await onUpdate(supplier.id, { url: values.url });
      if (success) {
        onClose();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent id="update-supplier-dialog">
        <DialogHeader>
          <DialogTitle>Оновити файл постачальника</DialogTitle>
          <DialogDescription>
            Оновіть URL-адресу файлу для постачальника "{supplier.name}".
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL файлу (XML або CSV)</FormLabel>
                  <FormControl>
                    <Input 
                      id="update-supplier-url-input"
                      placeholder="https://example.com/products.xml" 
                      {...field} 
                      disabled={isUpdating || isValidating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating || isValidating}>
                Скасувати
              </Button>
              <Button type="submit" disabled={isUpdating || isValidating}>
                {isUpdating 
                  ? 'Оновлення...' 
                  : isValidating 
                  ? 'Перевірка файлу...' 
                  : 'Оновити URL'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSupplierDialog;
