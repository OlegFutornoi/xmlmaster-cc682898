
// Компонент для управління обмеженнями тарифного плану
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface LimitationType {
  id: string;
  name: string;
  description: string;
  is_numeric: boolean;
}

interface PlanLimitation {
  id: string;
  limitation_type_id: string;
  value: number;
  limitation_type: LimitationType;
}

interface TariffLimitationsProps {
  tariffPlanId: string | null;
}

const TariffLimitations: React.FC<TariffLimitationsProps> = ({ tariffPlanId }) => {
  const { toast } = useToast();
  const [limitationTypes, setLimitationTypes] = useState<LimitationType[]>([]);
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [selectedLimitationTypeId, setSelectedLimitationTypeId] = useState<string>('');
  const [limitationValue, setLimitationValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingLimitationId, setEditingLimitationId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    if (!tariffPlanId) return;
    
    fetchLimitationTypes();
    fetchPlanLimitations();
  }, [tariffPlanId]);

  const fetchLimitationTypes = async () => {
    const { data, error } = await supabase
      .from('limitation_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching limitation types:', error);
      return;
    }
    
    setLimitationTypes(data || []);
  };

  const fetchPlanLimitations = async () => {
    if (!tariffPlanId) return;
    
    const { data, error } = await supabase
      .from('tariff_plan_limitations')
      .select(`
        id,
        limitation_type_id,
        value,
        limitation_types:limitation_type_id (
          id,
          name,
          description,
          is_numeric
        )
      `)
      .eq('tariff_plan_id', tariffPlanId);
    
    if (error) {
      console.error('Error fetching plan limitations:', error);
      return;
    }
    
    // Перетворюємо отримані дані у правильний формат
    const formattedData = data?.map(item => ({
      id: item.id,
      limitation_type_id: item.limitation_type_id,
      value: item.value,
      limitation_type: item.limitation_types as LimitationType
    })) || [];
    
    setPlanLimitations(formattedData);
  };

  const handleAddLimitation = async () => {
    if (!tariffPlanId || !selectedLimitationTypeId) {
      toast({
        title: 'Помилка',
        description: 'Виберіть тип обмеження',
        variant: 'destructive',
      });
      return;
    }
    
    // Перевіряємо, чи існує вже таке обмеження
    const existingLimitation = planLimitations.find(
      limit => limit.limitation_type_id === selectedLimitationTypeId
    );
    
    if (existingLimitation) {
      toast({
        title: 'Помилка',
        description: 'Таке обмеження вже існує для цього тарифу',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tariff_plan_limitations')
        .insert({
          tariff_plan_id: tariffPlanId,
          limitation_type_id: selectedLimitationTypeId,
          value: limitationValue
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: 'Успішно',
        description: 'Обмеження додано',
      });
      
      // Оновлюємо список обмежень
      fetchPlanLimitations();
      
      // Очищаємо поля вводу
      setSelectedLimitationTypeId('');
      setLimitationValue(0);
    } catch (error) {
      console.error('Error adding limitation:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати обмеження',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLimitation = async (limitationId: string) => {
    if (!limitationId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tariff_plan_limitations')
        .delete()
        .eq('id', limitationId);
      
      if (error) throw error;
      
      // Оновлюємо список обмежень
      setPlanLimitations(planLimitations.filter(limit => limit.id !== limitationId));
      
      toast({
        title: 'Успішно',
        description: 'Обмеження видалено',
      });
    } catch (error) {
      console.error('Error deleting limitation:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити обмеження',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (limitation: PlanLimitation) => {
    setEditingLimitationId(limitation.id);
    setEditValue(limitation.value);
  };

  const handleCancelEdit = () => {
    setEditingLimitationId(null);
  };

  const handleSaveEdit = async (limitationId: string) => {
    if (!limitationId) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('tariff_plan_limitations')
        .update({ value: editValue })
        .eq('id', limitationId);
      
      if (error) throw error;
      
      // Оновлюємо список обмежень
      setPlanLimitations(planLimitations.map(limit => 
        limit.id === limitationId ? { ...limit, value: editValue } : limit
      ));
      
      toast({
        title: 'Успішно',
        description: 'Значення обмеження оновлено',
      });
      
      // Закриваємо режим редагування
      setEditingLimitationId(null);
    } catch (error) {
      console.error('Error updating limitation value:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити значення обмеження',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Фільтруємо типи обмежень, щоб показати тільки ті, які ще не використовуються
  const availableLimitationTypes = limitationTypes.filter(
    type => !planLimitations.some(limit => limit.limitation_type_id === type.id)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-1">Тип обмеження</label>
          <Select
            value={selectedLimitationTypeId}
            onValueChange={setSelectedLimitationTypeId}
            disabled={availableLimitationTypes.length === 0}
          >
            <SelectTrigger id="limitation-type-select" className="w-full">
              <SelectValue placeholder="Виберіть тип" />
            </SelectTrigger>
            <SelectContent>
              {availableLimitationTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.description || type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-1">
          <label className="block text-sm font-medium mb-1">Значення</label>
          <Input
            type="number"
            min="0"
            value={limitationValue}
            onChange={(e) => setLimitationValue(parseInt(e.target.value) || 0)}
            id="limitation-value-input"
          />
        </div>
        
        <div className="md:col-span-1">
          <Button
            onClick={handleAddLimitation}
            disabled={isLoading || !selectedLimitationTypeId}
            className="w-full"
            id="add-limitation-button"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Додати обмеження
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип обмеження</TableHead>
              <TableHead>Опис</TableHead>
              <TableHead>Значення</TableHead>
              <TableHead className="w-[120px]">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planLimitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Немає обмежень для цього тарифу
                </TableCell>
              </TableRow>
            ) : (
              planLimitations.map((limitation) => (
                <TableRow key={limitation.id}>
                  <TableCell className="max-w-[150px] truncate">{limitation.limitation_type?.name || 'Невідомо'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{limitation.limitation_type?.description || 'Без опису'}</TableCell>
                  <TableCell>
                    {editingLimitationId === limitation.id ? (
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        className="w-20 h-8"
                        id={`edit-limitation-value-${limitation.id}`}
                      />
                    ) : (
                      <span>{limitation.value}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {editingLimitationId === limitation.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSaveEdit(limitation.id)}
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            id={`save-limitation-edit-${limitation.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            id={`cancel-limitation-edit-${limitation.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(limitation)}
                            className="h-8 w-8 hover:bg-blue-50"
                            id={`start-limitation-edit-${limitation.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLimitation(limitation.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            id={`delete-limitation-${limitation.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

export default TariffLimitations;
