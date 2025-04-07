
// Компонент для додавання тарифного плану через діалог
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { extendedSupabase } from '@/integrations/supabase/extended-client';
import { useToast } from '@/hooks/use-toast';
import { assignTariffPlan } from '@/services/tariffService';
import { PlanLimitationsList } from '@/components/admin/tariffs/PlanLimitationsList';
import { PlanLimitation } from '@/components/admin/tariffs/types';
import { ActiveSubscriptionInfo } from '@/components/admin/tariffs/ActiveSubscriptionInfo';
import { useActiveSubscription } from '@/hooks/tariffs/useActiveSubscription';
import { Check, X } from 'lucide-react';

interface AddTariffPlanDialogProps {
  userId: string;
  onSuccess: () => void;
}

const AddTariffPlanDialog: React.FC<AddTariffPlanDialogProps> = ({ userId, onSuccess }) => {
  const { toast } = useToast();
  const [tariffPlans, setTariffPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { activeSubscription, isLoading: subscriptionLoading } = useActiveSubscription(userId);

  useEffect(() => {
    if (isDialogOpen) {
      fetchTariffPlans();
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (selectedPlanId) {
      fetchPlanLimitations();
    } else {
      setPlanLimitations([]);
    }
  }, [selectedPlanId]);

  const fetchTariffPlans = async () => {
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

      if (error) throw error;
      setTariffPlans(data || []);
    } catch (error) {
      console.error('Error fetching tariff plans:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити тарифні плани",
        variant: "destructive",
      });
    }
  };

  const fetchPlanLimitations = async () => {
    if (!selectedPlanId) return;
    
    try {
      const { data, error } = await extendedSupabase
        .from('tariff_plan_limitations')
        .select(`
          value,
          limitation_types:limitation_type_id (name, description)
        `)
        .eq('tariff_plan_id', selectedPlanId);

      if (error) throw error;
      
      // Виправлене перетворення даних
      const formattedLimitations = (data || []).map(item => ({
        limitation_type: {
          name: item.limitation_types ? 
            (typeof item.limitation_types === 'object' && 'name' in item.limitation_types ? 
              item.limitation_types.name || '' : '') : '',
          description: item.limitation_types ? 
            (typeof item.limitation_types === 'object' && 'description' in item.limitation_types ? 
              item.limitation_types.description || '' : '') : ''
        },
        value: item.value
      }));
      
      setPlanLimitations(formattedLimitations);
    } catch (error) {
      console.error('Error fetching plan limitations:', error);
    }
  };

  const handleActivatePlan = async () => {
    if (!selectedPlanId) {
      toast({
        title: "Помилка",
        description: "Спочатку виберіть тарифний план",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await assignTariffPlan(
        userId, 
        selectedPlanId, 
        activeSubscription?.id
      );

      toast({
        title: "Успішно",
        description: "Тарифний план успішно призначено користувачу",
      });
      
      setIsDialogOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error activating plan:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося активувати тарифний план",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = tariffPlans.find(plan => plan.id === selectedPlanId);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Додати тариф</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Додати тарифний план</DialogTitle>
          <DialogDescription>
            Виберіть тарифний план для користувача.
          </DialogDescription>
        </DialogHeader>

        {!subscriptionLoading && activeSubscription && (
          <ActiveSubscriptionInfo subscription={activeSubscription} />
        )}

        <div className="grid gap-4 mt-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Доступні тарифні плани:</h3>
            <div className="grid grid-cols-1 gap-3">
              {tariffPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`
                    border rounded-lg p-3 cursor-pointer transition-colors
                    ${selectedPlanId === plan.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {selectedPlanId === plan.id ? (
                        <Check className="h-5 w-5 text-blue-500 mr-2" />
                      ) : (
                        <div className="h-5 w-5 border rounded-full mr-2"></div>
                      )}
                      <div>
                        <h4 className="font-medium">{plan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {plan.price} {plan.currencies.code} - 
                          {plan.is_permanent 
                            ? ' Постійний доступ' 
                            : ` ${plan.duration_days} днів`}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-semibold">
                      {plan.price} {plan.currencies.code}
                    </div>
                  </div>
                  
                  {selectedPlanId === plan.id && planLimitations.length > 0 && (
                    <div className="mt-3 ml-7">
                      <PlanLimitationsList planLimitations={planLimitations} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            <X className="h-4 w-4 mr-2" />
            Скасувати
          </Button>
          <Button onClick={handleActivatePlan} disabled={!selectedPlanId || isLoading}>
            {isLoading ? (
              "Активація..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Активувати
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTariffPlanDialog;
