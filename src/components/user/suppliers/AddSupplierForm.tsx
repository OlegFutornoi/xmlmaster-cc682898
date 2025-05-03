
// Компонент форми для додавання нового постачальника
import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

// Схема валідації для форми
const supplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Назва постачальника повинна містити мінімум 2 символи' })
    .max(100, { message: 'Назва постачальника не повинна перевищувати 100 символів' }),
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

// Визначаємо тип для даних постачальника на основі схеми валідації
type SupplierFormValues = z.infer<typeof supplierSchema>;

interface AddSupplierFormProps {
  onAddSupplier: (supplier: { name: string; url: string }) => Promise<boolean>;
}

// Компонент форми додавання постачальника
const AddSupplierForm: React.FC<AddSupplierFormProps> = ({ onAddSupplier }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      url: '',
    },
  });

  const onSubmit = async (values: SupplierFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onAddSupplier({
        name: values.name,
        url: values.url
      });
      if (success) {
        form.reset(); // Скидаємо форму у випадку успішного додавання
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Назва постачальника</FormLabel>
                <FormControl>
                  <Input 
                    id="supplier-name-input"
                    placeholder="Введіть назву постачальника" 
                    {...field}
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL файлу (XML або CSV)</FormLabel>
                <FormControl>
                  <Input 
                    id="supplier-url-input"
                    placeholder="https://example.com/products.xml" 
                    {...field}
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full md:w-auto"
          id="add-supplier-button"
        >
          {isSubmitting ? 'Додавання...' : 'Додати постачальника'}
        </Button>
      </form>
    </Form>
  );
};

export default AddSupplierForm;
