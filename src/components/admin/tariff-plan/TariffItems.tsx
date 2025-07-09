
// Компонент для відображення та керування пунктами тарифного плану
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Визначаємо власний інтерфейс для пропсів компонента
interface PlanFormProps {
  planId?: string;
  tariffPlanId?: string;  // Додаємо альтернативний проп для сумісності
  editMode?: boolean;
}

interface TariffItem {
  id: string;
  description: string;
}

interface PlanItem {
  id: string;
  is_active: boolean;
  tariff_plans: { id: string; name: string } | null;
  tariff_items: { id: string; description: string } | null;
}

const TariffItems: React.FC<PlanFormProps> = ({ planId, tariffPlanId, editMode = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [itemsList, setItemsList] = useState<PlanItem[]>([]);
  const [availableItems, setAvailableItems] = useState<TariffItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [newItemName, setNewItemName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Визначаємо ефективний ID плану (використовуємо один з двох)
  const effectivePlanId = planId || tariffPlanId;

  const fetchTariffItems = async () => {
    if (!effectivePlanId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tariff_plan_items")
      .select(`
        id, 
        is_active,
        tariff_plans:tariff_plan_id (id, name),
        tariff_items:tariff_item_id (id, description)
      `)
      .eq("tariff_plan_id", effectivePlanId);

    if (error) {
      console.error("Error fetching tariff items:", error);
    } else {
      setItemsList(data || []);
    }
    setIsLoading(false);
  };

  const fetchAvailableItems = async () => {
    if (!effectivePlanId) return;

    // Отримуємо всі доступні пункти
    const { data: allItems, error: allItemsError } = await supabase
      .from("tariff_items")
      .select("id, description")
      .order("description");

    if (allItemsError) {
      console.error("Error fetching all tariff items:", allItemsError);
      return;
    }

    // Отримуємо пункти, які вже додані до поточного тарифу
    const { data: usedItems, error: usedItemsError } = await supabase
      .from("tariff_plan_items")
      .select("tariff_item_id")
      .eq("tariff_plan_id", effectivePlanId);

    if (usedItemsError) {
      console.error("Error fetching used tariff items:", usedItemsError);
      return;
    }

    // Фільтруємо доступні пункти, виключаючи вже використані
    const usedItemIds = usedItems?.map(item => item.tariff_item_id) || [];
    const available = allItems?.filter(item => !usedItemIds.includes(item.id)) || [];
    
    setAvailableItems(available);
  };

  useEffect(() => {
    if (effectivePlanId) {
      fetchTariffItems();
      fetchAvailableItems();
    }
  }, [effectivePlanId]);

  const addExistingItem = async () => {
    if (!selectedItemId || !effectivePlanId) {
      toast({
        title: "Помилка",
        description: "Виберіть пункт для додавання",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_plan_items")
        .insert({
          tariff_plan_id: effectivePlanId,
          tariff_item_id: selectedItemId,
          is_active: true,
        });

      if (error) throw error;

      await fetchTariffItems();
      await fetchAvailableItems();
      setSelectedItemId("");
      toast({
        title: "Успішно",
        description: "Пункт тарифу додано",
      });
    } catch (error: any) {
      console.error("Error adding tariff item:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати пункт тарифу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewItem = async () => {
    if (!newItemName.trim()) {
      toast({
        title: "Помилка",
        description: "Назва пункту не може бути порожньою",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: itemData, error: itemError } = await supabase
        .from("tariff_items")
        .insert({ description: newItemName.trim() })
        .select("id")
        .single();

      if (itemError) throw itemError;

      // Оновлюємо список доступних пунктів
      await fetchAvailableItems();
      setNewItemName("");
      setIsDialogOpen(false);
      toast({
        title: "Успішно",
        description: "Новий пункт створено і доданий до списку",
      });
    } catch (error: any) {
      console.error("Error creating tariff item:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити пункт тарифу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_plan_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchTariffItems();
      await fetchAvailableItems();
      toast({
        title: "Успішно",
        description: "Пункт тарифу видалено",
      });
    } catch (error: any) {
      console.error("Error removing tariff item:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити пункт тарифу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {editMode && (
        <div className="space-y-4">
          {/* Додавання існуючого пункту */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={isLoading}>
                <SelectTrigger id="existing-item-select">
                  <SelectValue placeholder="Виберіть пункт для додавання" />
                </SelectTrigger>
                <SelectContent>
                  {availableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    id="add-existing-item-button"
                    onClick={addExistingItem}
                    disabled={isLoading || !selectedItemId}
                    size="icon"
                    className="rounded-full"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Додати вибраний пункт</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Кнопка для створення нового пункту */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" id="create-new-item-button">
                <Plus className="h-4 w-4 mr-2" />
                Створити новий пункт
              </Button>
            </DialogTrigger>
            <DialogContent id="create-item-dialog">
              <DialogHeader>
                <DialogTitle>Створити новий пункт тарифу</DialogTitle>
                <DialogDescription>
                  Введіть назву нового пункту. Він буде доступний для всіх тарифних планів.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  id="new-item-name-input"
                  placeholder="Введіть назву пункту тарифу"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Скасувати
                </Button>
                <Button onClick={createNewItem} disabled={isLoading || !newItemName.trim()} id="save-new-item-button">
                  {isLoading ? "Створення..." : "Створити"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isLoading ? (
        <p>Завантаження...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pl-2">ID</th>
              <th className="text-left py-2">Пункт</th>
              <th className="text-right py-2 pr-2">Дії</th>
            </tr>
          </thead>
          <tbody>
            {itemsList.length > 0 ? (
              itemsList.map((item) => (
                <tr key={item.id} className="border-b" id={`tariff-item-${item.id}`}>
                  <td className="py-2 pl-2">{item.id.substring(0, 8)}</td>
                  <td className="py-2">
                    {item.tariff_items?.description || "Невідомо"}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    {editMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive h-8 w-8 p-0"
                        id={`delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-center">
                  Немає доданих пунктів для тарифного плану
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TariffItems;
