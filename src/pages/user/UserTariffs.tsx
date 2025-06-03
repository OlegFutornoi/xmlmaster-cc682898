
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
import { CreditCard } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }
  
  const selectedPlan = tariffPlans.find(plan => plan.id === selectedPlanId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Тарифні плани</h1>
              <p className="text-gray-600">Оберіть найкращий план для ваших потреб</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto ${isMobile ? 'px-4 py-6' : 'px-6 py-8'}`} id="user-tariffs-container">
        <div className="mb-8">
          <CurrentSubscription subscription={activeSubscription} />
        </div>

        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступні тарифи</h2>
            <p className="text-gray-600">Оберіть тарифний план що відповідає вашим потребам</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};

export default UserTariffs;
