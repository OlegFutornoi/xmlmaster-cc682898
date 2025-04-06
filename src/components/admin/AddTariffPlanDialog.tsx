
// Компонент для додавання тарифного плану користувачу
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number | null;
  is_permanent: boolean;
  currency: {
    code: string;
    name: string;
  };
}

interface AddTariffPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTariffAdded: () => void;
}

export const AddTariffPlanDialog: React.FC<AddTariffPlanDialogProps> = ({
  isOpen,
  onClose,
  userId,
  onTariffAdded,
}) => {
  const [tariffPlans, setTariffPlans] = useState<TariffPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTariffPlans();
    }
  }, [isOpen]);

  const fetchTariffPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
          id,
          name,
          price,
          duration_days,
          is_permanent,
          currencies:currency_id (code, name)
        `)
        .order('price', { ascending: true });

      if (error) {
        throw error;
      }

      // Трансформуємо отримані дані для відповідності інтерфейсу TariffPlan
      const transformedData = data.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        is_permanent: plan.is_permanent,
        currency: plan.currencies // Перейменовуємо currencies на currency
      })) as TariffPlan[];
      
      setTariffPlans(transformedData);
      
      // Встановлюємо перший план як вибраний за замовчуванням
      if (transformedData && transformedData.length > 0) {
        setSelectedPlanId(transformedData[0].id);
      }
    } catch (error) {
      console.error('Помилка завантаження тарифних планів:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося завантажити тарифні плани',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTariff = async () => {
    if (!selectedPlanId) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, виберіть тарифний план',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Отримуємо дані про вибраний тарифний план для правильного обчислення дати закінчення
      const selectedPlan = tariffPlans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        throw new Error('Тарифний план не знайдено');
      }

      // Встановлюємо дату закінчення для непостійних тарифів
      let endDate = null;
      if (!selectedPlan.is_permanent && selectedPlan.duration_days) {
        const startDate = new Date();
        endDate = addDays(startDate, selectedPlan.duration_days);
      }

      // Створюємо нову підписку (неактивну за замовчуванням)
      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .insert({
          user_id: userId,
          tariff_plan_id: selectedPlanId,
          is_active: false,  // неактивний за замовчуванням
          end_date: endDate
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: 'Успішно',
        description: 'Тарифний план додано',
      });
      
      onTariffAdded();
    } catch (error) {
      console.error('Помилка додавання тарифного плану:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося додати тарифний план',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Додати тарифний план</DialogTitle>
          <DialogDescription>
            Виберіть тарифний план для користувача
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <p>Завантаження тарифних планів...</p>
            </div>
          ) : tariffPlans.length === 0 ? (
            <div className="text-center py-4">
              <p>Немає доступних тарифних планів</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="tariff-plan">Тарифний план</Label>
                <Select 
                  value={selectedPlanId} 
                  onValueChange={setSelectedPlanId}
                >
                  <SelectTrigger id="tariff-plan">
                    <SelectValue placeholder="Виберіть тарифний план" />
                  </SelectTrigger>
                  <SelectContent>
                    {tariffPlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price} {plan.currency.code} 
                        {plan.is_permanent 
                          ? ' (безстроково)' 
                          : ` (${plan.duration_days} днів)`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPlanId && (
                <div className="border p-3 rounded-md bg-muted/30">
                  <h4 className="font-medium mb-2">Інформація про тарифний план</h4>
                  {(() => {
                    const plan = tariffPlans.find(p => p.id === selectedPlanId);
                    if (!plan) return null;
                    
                    return (
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Назва:</span> {plan.name}</p>
                        <p>
                          <span className="font-medium">Ціна:</span> {plan.price} {plan.currency.code}
                        </p>
                        <p>
                          <span className="font-medium">Тривалість:</span> {plan.is_permanent 
                            ? 'Безстроково' 
                            : `${plan.duration_days} днів`
                          }
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Скасувати
          </Button>
          <Button 
            onClick={handleAddTariff} 
            disabled={!selectedPlanId || loading || isSubmitting}
          >
            {isSubmitting ? 'Додавання...' : 'Додати тарифний план'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
