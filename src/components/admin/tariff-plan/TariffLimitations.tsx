
// Компонент для управління обмеженнями тарифного плану
import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
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
            <SelectTrigger>
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
          />
        </div>
        
        <div className="md:col-span-1">
          <Button
            onClick={handleAddLimitation}
            disabled={isLoading || !selectedLimitationTypeId}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Додати обмеження
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип обмеження</TableHead>
              <TableHead>Опис</TableHead>
              <TableHead>Значення</TableHead>
              <TableHead className="w-[100px]">Дії</TableHead>
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
                  <TableCell>{limitation.limitation_type?.name || 'Невідомо'}</TableCell>
                  <TableCell>{limitation.limitation_type?.description || 'Без опису'}</TableCell>
                  <TableCell>{limitation.value}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteLimitation(limitation.id)}
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

export default TariffLimitations;
