
// Компонент для управління елементами тарифного плану
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Table,
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TariffItem {
  id: string;
  description: string;
}

interface PlanItem {
  id: string;
  tariff_item_id: string;
  is_active: boolean;
  tariff_item?: {
    id: string;
    description: string;
  };
}

interface TariffItemsProps {
  tariffPlanId: string | null;
}

const TariffItems: React.FC<TariffItemsProps> = ({ tariffPlanId }) => {
  const { toast } = useToast();
  const [tariffItems, setTariffItems] = useState<TariffItem[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [newItemText, setNewItemText] = useState<string>('');
  const [isCreatingNewItem, setIsCreatingNewItem] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tariffPlanId) {
      fetchTariffItems();
      fetchPlanItems();
    }
  }, [tariffPlanId]);

  const fetchTariffItems = async () => {
    const { data, error } = await supabase
      .from('tariff_items')
      .select('*')
      .order('description');
    
    if (error) {
      console.error('Error fetching tariff items:', error);
      return;
    }
    
    setTariffItems(data || []);
  };

  const fetchPlanItems = async () => {
    if (!tariffPlanId) return;
    
    const { data, error } = await supabase
      .from('tariff_plan_items')
      .select(`
        id,
        tariff_item_id,
        is_active,
        tariff_items:tariff_item_id (
          id,
          description
        )
      `)
      .eq('tariff_plan_id', tariffPlanId);
    
    if (error) {
      console.error('Error fetching plan items:', error);
      return;
    }
    
    setPlanItems(data || []);
  };

  const handleAddExistingItem = async () => {
    if (!tariffPlanId || !selectedItemId) {
      toast({
        title: 'Помилка',
        description: 'Виберіть пункт для додавання',
        variant: 'destructive',
      });
      return;
    }
    
    const existingItem = planItems.find(item => item.tariff_item_id === selectedItemId);
    if (existingItem) {
      toast({
        title: 'Помилка',
        description: 'Цей пункт вже додано до тарифного плану',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tariff_plan_items')
        .insert({
          tariff_plan_id: tariffPlanId,
          tariff_item_id: selectedItemId,
          is_active: true
        });
      
      if (error) throw error;
      
      fetchPlanItems();
      setSelectedItemId('');
      
      toast({
        title: 'Успішно',
        description: 'Пункт додано до тарифного плану',
      });
    } catch (error) {
      console.error('Error adding item to plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати пункт',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewItem = async () => {
    if (!newItemText.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть опис пункту',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Спочатку створюємо новий пункт
      const { data: itemData, error: itemError } = await supabase
        .from('tariff_items')
        .insert({
          description: newItemText.trim()
        })
        .select();
      
      if (itemError) throw itemError;
      
      if (!tariffPlanId || !itemData || itemData.length === 0) {
        toast({
          title: 'Помилка',
          description: 'Не вдалося створити пункт',
          variant: 'destructive',
        });
        return;
      }
      
      // Потім додаємо його до тарифного плану
      const newItemId = itemData[0].id;
      const { error: planItemError } = await supabase
        .from('tariff_plan_items')
        .insert({
          tariff_plan_id: tariffPlanId,
          tariff_item_id: newItemId,
          is_active: true
        });
      
      if (planItemError) throw planItemError;
      
      fetchTariffItems();
      fetchPlanItems();
      setNewItemText('');
      setIsCreatingNewItem(false);
      
      toast({
        title: 'Успішно',
        description: 'Новий пункт створено та додано до тарифного плану',
      });
    } catch (error) {
      console.error('Error creating new item:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося створити новий пункт',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleItemStatus = async (itemId: string, currentStatus: boolean) => {
    if (!itemId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tariff_plan_items')
        .update({ is_active: !currentStatus })
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Оновлюємо локальний стан
      setPlanItems(planItems.map(item => 
        item.id === itemId ? { ...item, is_active: !currentStatus } : item
      ));
      
      toast({
        title: 'Успішно',
        description: `Пункт ${!currentStatus ? 'активовано' : 'деактивовано'}`,
      });
    } catch (error) {
      console.error('Error toggling item status:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося змінити статус пункту',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!itemId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tariff_plan_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      setPlanItems(planItems.filter(item => item.id !== itemId));
      
      toast({
        title: 'Успішно',
        description: 'Пункт видалено з тарифного плану',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити пункт',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Отримуємо доступні пункти, які ще не додані до плану
  const availableTariffItems = tariffItems.filter(
    item => !planItems.some(planItem => planItem.tariff_item_id === item.id)
  );

  return (
    <div className="space-y-6">
      {/* Форма додавання існуючого або нового пункту */}
      {isCreatingNewItem ? (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Новий пункт тарифного плану</label>
            <div className="flex space-x-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Введіть опис пункту"
                className="flex-1"
              />
              <Button 
                onClick={handleCreateNewItem} 
                disabled={isLoading || !newItemText.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                Додати
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreatingNewItem(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Скасувати
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Існуючий пункт</label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Виберіть пункт" />
              </SelectTrigger>
              <SelectContent>
                {availableTariffItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1 flex space-x-2">
            <Button
              onClick={handleAddExistingItem}
              disabled={isLoading || !selectedItemId}
              className="flex-1"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Додати
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCreatingNewItem(true)}
              className="flex-1"
            >
              Створити новий
            </Button>
          </div>
        </div>
      )}

      {/* Таблиця існуючих пунктів */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пункт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[150px]">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  Немає пунктів для цього тарифного плану
                </TableCell>
              </TableRow>
            ) : (
              planItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.tariff_item?.description || 'Невідомо'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={() => handleToggleItemStatus(item.id, item.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TariffItems;
