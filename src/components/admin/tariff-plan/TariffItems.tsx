
// Компонент для відображення та керування пунктами тарифного плану
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Trash2 } from "lucide-react";
import TariffItemsManager from "./TariffItemsManager";

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
  tariff_items: {
    id: string;
    description: string;
  };
}

const TariffItems: React.FC<PlanFormProps> = ({ planId, tariffPlanId, editMode = false }) => {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState<TariffItem[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);

  // Визначаємо ефективний ID плану (використовуємо один з двох)
  const effectivePlanId = planId || tariffPlanId;

  const fetchAvailableItems = async () => {
    try {
      // Отримуємо всі елементи тарифу
      const { data: allItems, error: allItemsError } = await supabase
        .from("tariff_items")
        .select("id, description")
        .order("description");

      if (allItemsError) throw allItemsError;

      // Отримуємо елементи, які вже додані до цього плану
      const { data: planItemsData, error: planItemsError } = await supabase
        .from("tariff_plan_items")
        .select("tariff_item_id")
        .eq("tariff_plan_id", effectivePlanId);

      if (planItemsError) throw planItemsError;

      // Фільтруємо доступні елементи (виключаємо ті, що вже додані)
      const usedItemIds = planItemsData?.map(item => item.tariff_item_id) || [];
      const available = allItems?.filter(item => !usedItemIds.includes(item.id)) || [];
      
      setAvailableItems(available);
    } catch (error) {
      console.error("Error fetching available items:", error);
    }
  };

  const fetchPlanItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tariff_plan_items")
        .select(`
          id, 
          is_active,
          tariff_items:tariff_item_id (id, description)
        `)
        .eq("tariff_plan_id", effectivePlanId);

      if (error) throw error;
      
      setPlanItems(data || []);
    } catch (error) {
      console.error("Error fetching plan items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchAvailableItems(), fetchPlanItems()]);
  };

  useEffect(() => {
    if (effectivePlanId) {
      refreshData();
    }
  }, [effectivePlanId]);

  const addItemToPlan = async () => {
    if (!selectedItemId) {
      toast({
        title: "Помилка",
        description: "Виберіть елемент для додавання",
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

      toast({
        title: "Успішно",
        description: "Пункт додано до тарифного плану",
      });

      setSelectedItemId("");
      await refreshData();
    } catch (error: any) {
      console.error("Error adding item to plan:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати пункт до тарифного плану",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItemFromPlan = async (planItemId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_plan_items")
        .delete()
        .eq("id", planItemId);

      if (error) throw error;

      toast({
        title: "Успішно",
        description: "Пункт видалено з тарифного плану",
      });

      await refreshData();
    } catch (error: any) {
      console.error("Error removing item from plan:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити пункт з тарифного плану",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Управління загальними елементами тарифу */}
      {editMode && (
        <TariffItemsManager onItemAdded={refreshData} />
      )}

      {/* Додавання елементів до плану */}
      {editMode && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Додати функцію до тарифного плану</h3>
          <div className="flex gap-2">
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="flex-1" id="tariff-item-select">
                <SelectValue placeholder="Виберіть функцію для додавання" />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addItemToPlan}
              disabled={isLoading || !selectedItemId}
              id="add-selected-item-button"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Додати
            </Button>
          </div>
        </div>
      )}

      {/* Список доданих елементів */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Функції тарифного плану</h3>
        {isLoading ? (
          <p>Завантаження...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pl-2">ID</th>
                <th className="text-left py-2">Функція</th>
                {editMode && <th className="text-right py-2 pr-2">Дії</th>}
              </tr>
            </thead>
            <tbody>
              {planItems.length > 0 ? (
                planItems.map((item) => (
                  <tr key={item.id} className="border-b" id={`plan-item-${item.id}`}>
                    <td className="py-2 pl-2">{item.id.substring(0, 8)}</td>
                    <td className="py-2">
                      {item.tariff_items?.description || "Невідомо"}
                    </td>
                    {editMode && (
                      <td className="py-2 pr-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromPlan(item.id)}
                          className="text-destructive h-8 w-8 p-0"
                          id={`remove-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={editMode ? 3 : 2} className="py-4 text-center">
                    Немає доданих функцій для тарифного плану
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TariffItems;
