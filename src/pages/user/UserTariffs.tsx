
// Компонент для відображення та управління тарифами користувача
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useTariffPlans } from '@/hooks/tariffs/useTariffPlans';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { usePlanDetails } from '@/hooks/tariffs/usePlanDetails';
import { activateUserPlan } from '@/services/subscriptionService';
import TariffCard from '@/components/user/tariffs/TariffCard';
import CurrentSubscription from '@/components/user/tariffs/CurrentSubscription';
import SubscriptionHistory from '@/components/user/tariffs/SubscriptionHistory';
import PlanConfirmDialog from '@/components/user/tariffs/PlanConfirmDialog';
import { useIsMobile } from '@/hooks/use-mobile';

const UserTariffs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const {
    tariffPlans,
    isLoading: plansLoading
  } = useTariffPlans();
  const {
    activeSubscription,
    subscriptionHistory,
    isLoading: subscriptionsLoading,
    refetchSubscriptions
  } = useUserSubscriptions();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const {
    planLimitations,
    planItems,
    isLoading: detailsLoading
  } = usePlanDetails(selectedPlanId);

  const handlePlanClick = (planId: string) => {
    setSelectedPlanId(planId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleViewDetails = (planId: string) => {
    setSelectedPlanId(planId);
    setIsConfirmDialogOpen(true);
  };

  const handleActivatePlan = async () => {
    if (!selectedPlanId || !user) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося активувати тарифний план',
        variant: 'destructive'
      });
      return;
    }
    setIsActivating(true);
    try {
      await activateUserPlan(user.id, selectedPlanId, activeSubscription?.id || null);
      toast({
        title: 'Успішно',
        description: 'Тариф активовано'
      });

      // Оновлюємо список підписок після активації
      await refetchSubscriptions();
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error activating plan:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося активувати тарифний план',
        variant: 'destructive'
      });
    } finally {
      setIsActivating(false);
    }
  };

  if (subscriptionsLoading || plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <p>Завантаження...</p>
      </div>
    );
  }
  
  const selectedPlan = tariffPlans.find(plan => plan.id === selectedPlanId) || null;

  return (
    <div className={`container mx-auto ${isMobile ? 'px-3 py-3' : 'px-4 py-4'}`} id="user-tariffs-container">
      <div className="mb-4">
        <CurrentSubscription subscription={activeSubscription} />
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Доступні тарифи</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tariffPlans.map(plan => (
            <TariffCard 
              key={plan.id} 
              plan={plan} 
              isActive={activeSubscription?.tariff_plan.id === plan.id} 
              onSelect={handlePlanClick}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>

      <SubscriptionHistory history={subscriptionHistory} />

      <PlanConfirmDialog 
        open={isConfirmDialogOpen} 
        onOpenChange={setIsConfirmDialogOpen} 
        selectedPlan={selectedPlan} 
        planItems={planItems} 
        planLimitations={planLimitations} 
        activeSubscription={activeSubscription} 
        isActivating={isActivating} 
        onActivate={handleActivatePlan} 
      />
    </div>
  );
};

export default UserTariffs;
