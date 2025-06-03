
// Компонент для відображення і редагування обмежень тарифного плану
import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { usePlanLimitations } from '@/hooks/tariffs/usePlanLimitations';
import { PlanLimitation } from './types';

interface PlanLimitationsListProps {
  selectedPlanId?: string;
  planLimitations?: PlanLimitation[];
}

export const PlanLimitationsList = ({ selectedPlanId, planLimitations: propsPlanLimitations }: PlanLimitationsListProps) => {
  // Використовуємо хук лише якщо передано selectedPlanId
  const { planLimitations: hookPlanLimitations, updateLimitationValue } = 
    selectedPlanId ? usePlanLimitations(selectedPlanId) : { planLimitations: [], updateLimitationValue: null };
  
  // Визначаємо, які дані обмежень використовувати
  const limitations = propsPlanLimitations || hookPlanLimitations;
  
  const [editingLimitation, setEditingLimitation] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const { toast } = useToast();

  const handleStartEdit = (limitation: PlanLimitation) => {
    setEditingLimitation(limitation.id);
    setEditValue(String(limitation.value));
  };

  const handleCancelEdit = () => {
    setEditingLimitation(null);
    setEditValue('');
  };

  const handleSaveEdit = async (limitationId: string) => {
    if (!updateLimitationValue) {
      toast({
        title: 'Помилка',
        description: 'Редагування недоступне в режимі перегляду',
        variant: 'destructive',
      });
      return;
    }
    
    const numValue = Number(editValue);
    
    if (isNaN(numValue) || numValue < 0) {
      toast({
        title: 'Помилка',
        description: 'Значення має бути додатнім числом',
        variant: 'destructive',
      });
      return;
    }
    
    const success = await updateLimitationValue(limitationId, numValue);
    
    if (success) {
      toast({
        title: 'Успіх',
        description: 'Значення обмеження оновлено',
      });
      setEditingLimitation(null);
    } else {
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити значення обмеження',
        variant: 'destructive',
      });
    }
  };

  if (limitations.length === 0) {
    return <p className="text-sm text-muted-foreground">Немає обмежень для цього тарифного плану</p>;
  }

  return (
    <div className="space-y-2" id="plan-limitations-list">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {limitations.map((limitation) => (
          <div 
            key={limitation.id}
            className="flex items-center justify-between p-2 border rounded-md"
            id={`limitation-${limitation.id}`}
          >
            <div className="flex-1">
              <p className="font-medium">{limitation.limitation_type.name}</p>
              <p className="text-sm text-muted-foreground">{limitation.limitation_type.description}</p>
            </div>
            
            {updateLimitationValue && editingLimitation === limitation.id ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-20 h-8"
                  min={0}
                  id={`limitation-value-input-${limitation.id}`}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSaveEdit(limitation.id)}
                  id={`save-limitation-${limitation.id}`}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCancelEdit}
                  id={`cancel-limitation-${limitation.id}`}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{limitation.value}</span>
                {updateLimitationValue && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleStartEdit(limitation)}
                    id={`edit-limitation-${limitation.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanLimitationsList;
