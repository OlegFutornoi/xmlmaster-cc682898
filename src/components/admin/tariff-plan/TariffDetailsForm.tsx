
// Компонент для редагування основної інформації тарифного плану
import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from 'react-hook-form';

interface Currency {
  id: string;
  code: string;
  name: string;
}

interface TariffDetailsFormProps {
  form: UseFormReturn<any>;
  currencies: Currency[];
}

const TariffDetailsForm: React.FC<TariffDetailsFormProps> = ({
  form,
  currencies
}) => {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Назва тарифного плану</FormLabel>
            <FormControl>
              <Input placeholder="Введіть назву" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="price"
        render={({ field }) => {
          return (
            <FormItem>
              <FormLabel>Ціна</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Введіть ціну"
                  {...field}
                  value={field.value}
                  onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      
      <FormField
        control={form.control}
        name="currency_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Валюта</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Виберіть валюту" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="is_permanent"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Постійний тариф</FormLabel>
              <div className="text-sm text-muted-foreground">
                Тариф активний постійно, без терміну дії
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {!form.getValues("is_permanent") && (
        <FormField
          control={form.control}
          name="duration_days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тривалість (днів)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Введіть кількість днів"
                  {...field}
                  value={field.value || ''}
                  onChange={e => field.onChange(parseInt(e.target.value) || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default TariffDetailsForm;
