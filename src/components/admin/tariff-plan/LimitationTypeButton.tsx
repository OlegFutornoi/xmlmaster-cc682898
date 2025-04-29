
// Компонент кнопки для додавання нового типу обмеження
import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LimitationTypeButtonProps {
  onLimitationTypeAdded?: () => void;
}

const LimitationTypeButton: React.FC<LimitationTypeButtonProps> = ({ onLimitationTypeAdded }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isNumeric, setIsNumeric] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Помилка',
        description: 'Назва типу обмеження обов\'язкова',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('limitation_types')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_numeric: isNumeric
        })
        .select();

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Тип обмеження створено',
      });

      // Очищаємо поля вводу
      setName('');
      setDescription('');
      setIsNumeric(true);
      setIsOpen(false);
      
      // Сповіщаємо батьківський компонент про нові дані
      if (onLimitationTypeAdded) {
        onLimitationTypeAdded();
      }
    } catch (error) {
      console.error('Error creating limitation type:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити тип обмеження',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto">
          <PlusCircle className="h-4 w-4 mr-2" />
          Додати тип обмеження
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Новий тип обмеження</DialogTitle>
          <DialogDescription>
            Створіть новий тип обмеження для тарифних планів
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Назва</Label>
            <Input
              id="name"
              placeholder="Введіть назву типу"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Опис</Label>
            <Input
              id="description"
              placeholder="Введіть опис (не обов'язково)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is-numeric"
              checked={isNumeric}
              onCheckedChange={setIsNumeric}
            />
            <Label htmlFor="is-numeric">Числове значення</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Скасувати
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Збереження...' : 'Зберегти'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LimitationTypeButton;
