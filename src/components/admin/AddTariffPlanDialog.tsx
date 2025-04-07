
// Компонент для додавання тарифного плану користувачу
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Інтерфейси для типізації 
interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

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

interface LimitationType {
  name: string;
  description: string;
}

interface PlanLimitation {
  limitation_type: LimitationType;
  value: number;
}

interface LimitationTypeResponse {
  limitation_types: {
    name: string;
    description: string;
  };
  value: number;
}

interface AddTariffPlanDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onTariffAdded?: () => void;
}

// Компонент для додавання тарифного плану користувачу
const AddTariffPlanDialog = ({ userId, isOpen, onClose, onTariffAdded }: AddTariffPlanDialogProps) => {
  const [tariffPlans, setTariffPlans] = useState<TariffPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const { toast } = useToast();

  // Завантажуємо тарифні плани
  useEffect(() => {
    const fetchTariffPlans = async () => {
      const { data, error } = await supabase
        .from('tariff_plans')
        .select(`
          id, 
          name, 
          price, 
          duration_days, 
          is_permanent,
          currencies:currency_id (
            name, 
            code
          )
        `)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching tariff plans:', error);
      } else {
        setTariffPlans(
          data?.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            duration_days: item.duration_days,
            is_permanent: item.is_permanent,
            currency: {
              name: item.currencies.name,
              code: item.currencies.code
            }
          })) || []
        );
      }
    };

    // Завантажуємо активну підписку користувача
    const fetchActiveSubscription = async () => {
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('user_tariff_subscriptions')
        .select(`
          id,
          start_date,
          end_date,
          is_active,
          tariff_plans (
            id,
            name,
            price,
            is_permanent,
            duration_days,
            currencies:currency_id (name, code)
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      } else {
        setActiveSubscription(data);
      }
    };

    if (isOpen) {
      fetchTariffPlans();
      fetchActiveSubscription();
    }
  }, [isOpen, userId]);

  // Отримуємо обмеження для вибраного тарифного плану
  useEffect(() => {
    if (!selectedPlanId) {
      setPlanLimitations([]);
      return;
    }

    const fetchPlanLimitations = async () => {
      const { data, error } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', selectedPlanId);

      if (error) {
        console.error('Error fetching plan limitations:', error);
      } else {
        // Виправлене перетворення даних
        const formattedLimitations = (data || []).map(item => ({
          limitation_type: {
            name: item.limitation_types?.name || '',
            description: item.limitation_types?.description || ''
          },
          value: item.value
        }));
        
        setPlanLimitations(formattedLimitations);
      }
    };

    fetchPlanLimitations();
  }, [selectedPlanId]);

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
      const selectedPlan = tariffPlans.find(plan => plan.id === selectedPlanId);
      
      if (!selectedPlan) {
        toast({
          title: "Помилка",
          description: "Тариф не знайдено",
          variant: "destructive",
        });
        return;
      }

      let endDate = null;
      if (!selectedPlan.is_permanent) {
        const startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (selectedPlan.duration_days || 0));
      }

      if (activeSubscription) {
        // Деактивуємо поточну підписку
        const { error: updateError } = await supabase
          .from('user_tariff_subscriptions')
          .update({ is_active: false })
          .eq('id', activeSubscription.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Створюємо нову підписку
      const { error } = await supabase
        .from('user_tariff_subscriptions')
        .insert({
          user_id: userId,
          tariff_plan_id: selectedPlanId,
          end_date: endDate,
          is_active: true
        });

      if (error) {
        throw error;
      }

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
        
        {activeSubscription && (
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <p className="font-medium text-blue-800">Поточний тарифний план:</p>
            <p>{activeSubscription.tariff_plans.name}</p>
            <p className="text-sm text-blue-600 mt-1">
              {activeSubscription.tariff_plans.is_permanent 
                ? "Постійний доступ" 
                : `Дійсний до: ${new Date(activeSubscription.end_date).toLocaleDateString()}`}
            </p>
          </div>
        )}
        
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
          
          {planLimitations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Обмеження:</h4>
              <ul className="text-sm space-y-1">
                {planLimitations.map((limitation, idx) => (
                  <li key={idx}>
                    {limitation.limitation_type.description || limitation.limitation_type.name}: {limitation.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
