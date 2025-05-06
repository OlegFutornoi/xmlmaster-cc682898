
// Компонент для відображення детальної інформації про тарифний план у діалоговому вікні
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import PlanLimitationsList from '@/components/admin/tariffs/PlanLimitationsList';
import { TariffPlan, PlanLimitation } from '@/components/admin/tariffs/types';
import { format, parseISO, isValid } from 'date-fns';
import { uk } from 'date-fns/locale';

interface PlanConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: TariffPlan | null;
  planItems: any[];
  planLimitations: PlanLimitation[];
  activeSubscription: any;
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
  // Якщо немає вибраного плану, не відображати діалогове вікно
  if (!selectedPlan) return null;
  
  // Визначаємо, чи є вибраний тариф активним
  const isActivePlan = activeSubscription?.tariff_plan.id === selectedPlan.id;
  
  // Форматування дати закінчення для відображення
  const getExpiryDate = (subscription: any) => {
    if (!subscription) return null;
    
    if (subscription.tariff_plan.is_permanent) {
      return "Постійний доступ";
    }
    
    if (subscription.end_date) {
      const endDate = parseISO(subscription.end_date);
      if (isValid(endDate)) {
        return format(endDate, "d MMMM yyyy", { locale: uk });
      }
    }
    
    return null;
  };
  
  // Розрахунок дати закінчення на основі тривалості тарифного плану
  const calculateExpiryDate = (durationDays: number) => {
    if (!durationDays) return null;
    
    const future = new Date();
    future.setDate(future.getDate() + durationDays);
    return format(future, "d MMMM yyyy", { locale: uk });
  };

  const expiryDate = isActivePlan
    ? getExpiryDate(activeSubscription)
    : selectedPlan.is_permanent
      ? "Постійний доступ"
      : calculateExpiryDate(selectedPlan.duration_days || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{selectedPlan.name}</DialogTitle>
          <DialogDescription>
            {selectedPlan.is_permanent 
              ? "Постійний тарифний план з необмеженим терміном дії"
              : `Тарифний план з терміном дії ${selectedPlan.duration_days} днів`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2">
          <div className="text-2xl font-bold">
            {selectedPlan.price} {selectedPlan.currency.code}
          </div>
          
          <div className="flex items-center text-sm">
            {selectedPlan.is_permanent ? (
              <CheckCircle2 className="text-green-500 mr-1 h-4 w-4" />
            ) : (
              <Clock className="text-amber-500 mr-1 h-4 w-4" />
            )}
            <span>
              {expiryDate ? `Дійсний до: ${expiryDate}` : `Тривалість: ${selectedPlan.duration_days} днів`}
            </span>
          </div>
        </div>
        
        <ScrollArea className="max-h-[55vh] mt-2">
          <div className="space-y-4">
            {planItems?.length > 0 && (
              <div className="border rounded-md p-3">
                <h3 className="text-sm font-medium mb-2">Включені функції:</h3>
                <ul className="space-y-1">
                  {planItems.map((item, idx) => (
                    <li key={idx} className="text-sm flex items-center">
                      <CheckCircle2 className="text-green-500 mr-2 h-4 w-4" />
                      {item.tariff_items?.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {planLimitations?.length > 0 && (
              <div>
                <PlanLimitationsList planLimitations={planLimitations} />
              </div>
            )}
            
            {isActivePlan && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  Цей тарифний план вже активовано.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Закрити
          </Button>
          
          {!isActivePlan && (
            <Button
              onClick={onActivate}
              disabled={isActivating}
              className="w-full sm:w-auto"
            >
              {isActivating ? "Активація..." : "Активувати тариф"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanConfirmDialog;
