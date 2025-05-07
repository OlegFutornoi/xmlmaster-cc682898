
// Компонент для додавання тарифного плану користувачу
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Імпорт створених компонентів та хуків
import ActiveSubscriptionInfo from './tariffs/ActiveSubscriptionInfo';
import PlanLimitationsList from './tariffs/PlanLimitationsList';
import { useTariffPlans } from '@/hooks/tariffs/useTariffPlans';
import { useActiveSubscription } from '@/hooks/tariffs/useActiveSubscription';
import { usePlanLimitations } from '@/hooks/tariffs/usePlanLimitations';
import { assignTariffPlan } from '@/services/tariffService';

interface AddTariffPlanDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onTariffAdded?: () => void;
}

// Компонент для додавання тарифного плану користувачу
const AddTariffPlanDialog = ({ userId, isOpen, onClose, onTariffAdded }: AddTariffPlanDialogProps) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Використовуємо створені хуки
  const { tariffPlans } = useTariffPlans();
  const { activeSubscription } = useActiveSubscription(userId, isOpen);
  const { planLimitations } = usePlanLimitations(selectedPlanId);

  // Обробник додавання тарифного плану користувачу
  const handleAssignTariffPlan = async () => {
    if (!selectedPlanId) {
      toast({
        title: "Помилка",
        description: "Будь ласка, виберіть тарифний план",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await assignTariffPlan(
        userId, 
        selectedPlanId, 
        activeSubscription?.id
      );

      toast({
        title: "Успішно",
        description: "Тарифний план призначено користувачу",
      });
      
      onClose();
      setSelectedPlanId('');
      
      if (onTariffAdded) {
        onTariffAdded();
      }
      
    } catch (error) {
      console.error('Error assigning tariff plan:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося призначити тарифний план",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Призначити тарифний план</DialogTitle>
          <DialogDescription>
            Виберіть тарифний план для користувача
          </DialogDescription>
        </DialogHeader>
        
        <ActiveSubscriptionInfo activeSubscription={activeSubscription} />
        
        <div className="py-4">
          <div className="mb-4">
            <label htmlFor="tariff-plan" className="block text-sm font-medium text-gray-700 mb-1">
              Тарифний план
            </label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Виберіть тарифний план" />
              </SelectTrigger>
              <SelectContent>
                {tariffPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({plan.price} {plan.currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <PlanLimitationsList selectedPlanId={selectedPlanId} />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Скасувати</Button>
          <Button 
            onClick={handleAssignTariffPlan}
            disabled={isSubmitting || !selectedPlanId}
          >
            {isSubmitting ? 'Обробка...' : 'Призначити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTariffPlanDialog;
