
// Компонент для підтвердження активації тарифного плану
import React from 'react';
import { Check, Clock, AlertCircle, RefreshCcw, Zap, Infinity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TariffPlan } from '@/components/admin/tariffs/types';
import PlanLimitationsList from '@/components/admin/tariffs/PlanLimitationsList';
import { PlanLimitation } from '@/components/admin/tariffs/types';

interface TariffItem {
  id: string;
  description: string;
  is_active: boolean;
}

interface Subscription {
  id: string;
  tariff_plan: {
    id: string;
    name: string;
  }
}

interface PlanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: TariffPlan | null;
  planItems: TariffItem[];
  planLimitations: PlanLimitation[];
  activeSubscription: Subscription | null;
  isActivating: boolean;
  onActivate: () => void;
}

const PlanConfirmDialog: React.FC<PlanConfirmDialogProps> = ({
  open,
  onOpenChange,
  selectedPlan,
  planItems,
  planLimitations,
  activeSubscription,
  isActivating,
  onActivate
}) => {
  if (!selectedPlan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Підтвердження активації тарифу</DialogTitle>
          <DialogDescription>
            Перегляньте деталі обраного тарифного плану перед активацією.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">{selectedPlan.name}</h3>
              <p className="text-2xl font-bold mb-2">
                {selectedPlan.price} {selectedPlan.currency.code}
              </p>
              <div className="flex items-center gap-2 mb-4">
                {selectedPlan.is_permanent ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Infinity className="h-3.5 w-3.5" />
                    Постійний доступ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {selectedPlan.duration_days} днів
                  </Badge>
                )}
              </div>
            </div>
            
            {planItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Включені послуги:</h4>
                <ul className="space-y-2">
                  {planItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {planLimitations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Обмеження:</h4>
                <PlanLimitationsList planLimitations={planLimitations} />
              </div>
            )}
            
            {activeSubscription && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Увага</AlertTitle>
                <AlertDescription>
                  При активації нового тарифу, ваш поточний тариф "{activeSubscription.tariff_plan.name}" буде деактивовано.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
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

export default PlanConfirmDialog;
