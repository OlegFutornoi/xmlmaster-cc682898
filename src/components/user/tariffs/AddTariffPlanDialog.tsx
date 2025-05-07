
// Компонент для додавання нового тарифного плану для користувача
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, Check, RefreshCcw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useActiveSubscription } from '@/hooks/tariffs/useActiveSubscription';
import { usePlanLimitations } from '@/hooks/tariffs/usePlanLimitations';
import PlanLimitationsList from '@/components/admin/tariffs/PlanLimitationsList';
import ActiveSubscriptionInfo from '@/components/admin/tariffs/ActiveSubscriptionInfo';
import { PlanLimitation } from '@/components/admin/tariffs/types';

interface TariffPlan {
  id: string;
  name: string;
  price: number;
  is_permanent: boolean;
  currency_code: string;
  duration_days: number | null;
}

interface TariffDialogProps {
  open: boolean;
  userId: string;
  selectedPlan: TariffPlan | null;
  onOpenChange: (open: boolean) => void;
  onActivate: () => Promise<void>;
  isActivating: boolean;
}

export const AddTariffPlanDialog: React.FC<TariffDialogProps> = ({
  open,
  userId,
  selectedPlan,
  onOpenChange,
  onActivate,
  isActivating
}) => {
  const [planLimitations, setPlanLimitations] = useState<PlanLimitation[]>([]);
  const { activeSubscription, isLoading: isLoadingSubscription } = useActiveSubscription(userId, open);
  
  const { planLimitations: fetchedLimitations } = usePlanLimitations(
    selectedPlan?.id || ''
  );

  useEffect(() => {
    if (fetchedLimitations) {
      setPlanLimitations(fetchedLimitations);
    }
  }, [fetchedLimitations]);

  if (!selectedPlan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Підтвердження активації тарифу</DialogTitle>
          <DialogDescription>
            Перегляньте деталі обраного тарифного плану
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {activeSubscription && (
            <ActiveSubscriptionInfo activeSubscription={activeSubscription} />
          )}
          
          <div>
            <h3 className="text-lg font-medium">{selectedPlan.name}</h3>
            <p className="text-2xl font-bold my-2">
              {selectedPlan.price} {selectedPlan.currency_code}
            </p>
            <Badge variant="outline">
              {selectedPlan.is_permanent 
                ? "Постійний доступ" 
                : `${selectedPlan.duration_days} днів`}
            </Badge>
            
            {/* Список обмежень */}
            {planLimitations.length > 0 && (
              <PlanLimitationsList planLimitations={planLimitations} />
            )}
            
            {activeSubscription && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Увага</AlertTitle>
                <AlertDescription>
                  При активації нового тарифу, ваш поточний тариф буде деактивовано.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button 
            onClick={onActivate}
            disabled={isActivating}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            {isActivating ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" />
                Активація...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Активувати тариф
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTariffPlanDialog;
