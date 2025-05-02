
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlanFormProps } from "./types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, Trash2 } from "lucide-react";

const TariffItems: React.FC<PlanFormProps> = ({ planId, editMode = false }) => {
  const [newItem, setNewItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itemsList, setItemsList] = useState<any[]>([]);

  // Завантажуємо наявні елементи тарифу при першому рендері
  useState(() => {
    if (planId) {
      fetchTariffItems();
    }
  });

  const fetchTariffItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("tariff_plan_items")
      .select(`
        id, 
        is_active,
        tariff_plans:tariff_plan_id (id, name),
        tariff_items:tariff_item_id (id, description)
      `)
      .eq("tariff_plan_id", planId);

    if (error) {
      console.error("Error fetching tariff items:", error);
    } else {
      setItemsList(data || []);
    }
    setIsLoading(false);
  };

  const addItem = async () => {
    if (!newItem.trim()) {
      toast({
        title: "Помилка",
        description: "Назва пункту не може бути порожньою",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Спочатку створюємо новий елемент у таблиці tariff_items
      const { data: itemData, error: itemError } = await supabase
        .from("tariff_items")
        .insert({ description: newItem.trim() })
        .select("id")
        .single();

      if (itemError) throw itemError;

      // Потім прив'язуємо його до тарифного плану
      const { error: relationError } = await supabase
        .from("tariff_plan_items")
        .insert({
          tariff_plan_id: planId,
          tariff_item_id: itemData.id,
          is_active: true,
        });

      if (relationError) throw relationError;

      await fetchTariffItems();
      setNewItem("");
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

  const removeItem = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_plan_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchTariffItems();
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
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Введіть назву пункту тарифу"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={addItem}
                  disabled={isLoading}
                  size="icon"
                  className="rounded-full"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Створити новий пункт</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                <tr key={item.id} className="border-b">
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
