
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

  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: supplier.url || '',
    },
  });

  const handleUpdate = async (values: z.infer<typeof urlSchema>) => {
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
                      disabled={isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUpdating}>
                Скасувати
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Оновлення...' : 'Оновити URL'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateSupplierDialog;
