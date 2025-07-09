
// Компонент для управління загальними елементами тарифу
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface TariffItem {
  id: string;
  description: string;
  created_at: string;
}

interface TariffItemsManagerProps {
  onItemAdded?: () => void;
}

const TariffItemsManager: React.FC<TariffItemsManagerProps> = ({ onItemAdded }) => {
  const [items, setItems] = useState<TariffItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<TariffItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tariff_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching tariff items:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити елементи тарифу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Назва елементу не може бути порожньою',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tariff_items')
        .insert({ description: newItemName.trim() });

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Елемент тарифу додано',
      });

      setNewItemName('');
      setIsDialogOpen(false);
      await fetchItems();
      onItemAdded?.();
    } catch (error: any) {
      console.error('Error adding tariff item:', error);
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося додати елемент тарифу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async () => {
    if (!editingItem || !editItemName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Назва елементу не може бути порожньою',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tariff_items')
        .update({ description: editItemName.trim() })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Елемент тарифу оновлено',
      });

      setEditingItem(null);
      setEditItemName('');
      setIsEditDialogOpen(false);
      await fetchItems();
      onItemAdded?.();
    } catch (error: any) {
      console.error('Error updating tariff item:', error);
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося оновити елемент тарифу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    // Перевіряємо, чи використовується елемент в тарифних планах
    const { data: usageData, error: usageError } = await supabase
      .from('tariff_plan_items')
      .select('id')
      .eq('tariff_item_id', itemId)
      .limit(1);

    if (usageError) {
      console.error('Error checking item usage:', usageError);
      toast({
        title: 'Помилка',
        description: 'Не вдалося перевірити використання елементу',
        variant: 'destructive',
      });
      return;
    }

    if (usageData && usageData.length > 0) {
      toast({
        title: 'Неможливо видалити',
        description: 'Цей елемент використовується в тарифних планах',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('tariff_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Успішно',
        description: 'Елемент тарифу видалено',
      });

      await fetchItems();
      onItemAdded?.();
    } catch (error: any) {
      console.error('Error deleting tariff item:', error);
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося видалити елемент тарифу',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (item: TariffItem) => {
    setEditingItem(item);
    setEditItemName(item.description);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Управління елементами тарифу</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" id="add-tariff-item-button">
                <Plus className="h-4 w-4 mr-2" />
                Додати елемент
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Додати новий елемент тарифу</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Назва елементу тарифу"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  id="new-item-input"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Скасувати
                  </Button>
                  <Button onClick={addItem} disabled={isLoading} id="confirm-add-item">
                    {isLoading ? 'Додавання...' : 'Додати'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Завантаження...</p>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded" id={`item-${item.id}`}>
                <span>{item.description}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(item)}
                    id={`edit-item-${item.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive"
                    id={`delete-item-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Немає елементів тарифу</p>
        )}

        {/* Діалог редагування */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редагувати елемент тарифу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Назва елементу тарифу"
                value={editItemName}
                onChange={(e) => setEditItemName(e.target.value)}
                id="edit-item-input"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button onClick={updateItem} disabled={isLoading} id="confirm-edit-item">
                  {isLoading ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TariffItemsManager;
