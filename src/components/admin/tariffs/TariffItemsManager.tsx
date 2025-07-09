
// Компонент для управління загальними пунктами тарифів
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TariffItem {
  id: string;
  description: string;
  created_at: string;
}

const TariffItemsManager = () => {
  const [items, setItems] = useState<TariffItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tariff_items")
        .select("*")
        .order("description");

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching tariff items:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити пункти тарифів",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const createItem = async () => {
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
      const { error } = await supabase
        .from("tariff_items")
        .insert({ description: newItemName.trim() });

      if (error) throw error;

      await fetchItems();
      setNewItemName("");
      setIsDialogOpen(false);
      toast({
        title: "Успішно",
        description: "Пункт тарифу створено",
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

  const updateItem = async (id: string, newDescription: string) => {
    if (!newDescription.trim()) {
      toast({
        title: "Помилка",
        description: "Назва пункту не може бути порожньою",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_items")
        .update({ description: newDescription.trim() })
        .eq("id", id);

      if (error) throw error;

      await fetchItems();
      setEditingItemId(null);
      setEditingItemName("");
      toast({
        title: "Успішно",
        description: "Пункт тарифу оновлено",
      });
    } catch (error: any) {
      console.error("Error updating tariff item:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося оновити пункт тарифу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    // Перевіряємо, чи використовується цей пункт в якихось тарифах
    const { data: usageData, error: usageError } = await supabase
      .from("tariff_plan_items")
      .select("id")
      .eq("tariff_item_id", id);

    if (usageError) {
      console.error("Error checking item usage:", usageError);
      toast({
        title: "Помилка",
        description: "Не вдалося перевірити використання пункту",
        variant: "destructive",
      });
      return;
    }

    if (usageData && usageData.length > 0) {
      toast({
        title: "Неможливо видалити",
        description: "Цей пункт використовується в тарифних планах",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("tariff_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchItems();
      toast({
        title: "Успішно",
        description: "Пункт тарифу видалено",
      });
    } catch (error: any) {
      console.error("Error deleting tariff item:", error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити пункт тарифу",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (item: TariffItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.description);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditingItemName("");
  };

  return (
    <Card id="tariff-items-manager">
      <CardHeader>
        <CardTitle>Управління пунктами тарифів</CardTitle>
        <CardDescription>
          Створюйте та редагуйте пункти, які можуть бути додані до тарифних планів
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Кнопка створення нового пункту */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" id="create-tariff-item-button">
                <Plus className="h-4 w-4 mr-2" />
                Створити новий пункт
              </Button>
            </DialogTrigger>
            <DialogContent id="create-tariff-item-dialog">
              <DialogHeader>
                <DialogTitle>Створити новий пункт тарифу</DialogTitle>
                <DialogDescription>
                  Введіть назву нового пункту тарифу
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  id="new-tariff-item-input"
                  placeholder="Введіть назву пункту"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                  Скасувати
                </Button>
                <Button onClick={createItem} disabled={isLoading || !newItemName.trim()} id="save-tariff-item-button">
                  {isLoading ? "Створення..." : "Створити"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Список пунктів */}
          {isLoading ? (
            <p>Завантаження...</p>
          ) : (
            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg" id={`tariff-item-row-${item.id}`}>
                    <div className="flex-1">
                      {editingItemId === item.id ? (
                        <Input
                          value={editingItemName}
                          onChange={(e) => setEditingItemName(e.target.value)}
                          disabled={isLoading}
                          id={`edit-item-input-${item.id}`}
                        />
                      ) : (
                        <span>{item.description}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {editingItemId === item.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateItem(item.id, editingItemName)}
                            disabled={isLoading}
                            id={`save-edit-${item.id}`}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                            disabled={isLoading}
                            id={`cancel-edit-${item.id}`}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(item)}
                            disabled={isLoading}
                            id={`edit-item-${item.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id)}
                            disabled={isLoading}
                            className="text-destructive"
                            id={`delete-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Немає створених пунктів тарифів
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TariffItemsManager;
