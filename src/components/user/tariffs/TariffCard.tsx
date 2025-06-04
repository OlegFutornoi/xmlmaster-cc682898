
// Компонент картки тарифного плану
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check } from 'lucide-react';
import { TariffPlan } from '@/components/admin/tariffs/types';

interface TariffCardProps {
  plan: TariffPlan;
  isActive: boolean;
  onSelect: (planId: string) => void;
  onViewDetails: (planId: string) => void;
}

const TariffCard = ({ plan, isActive, onSelect, onViewDetails }: TariffCardProps) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 line-clamp-1">{plan.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {plan.is_permanent ? 'Постійний доступ' : `${plan.duration_days} днів`}
            </CardDescription>
          </div>
        </div>
        
        <div className="text-center py-2">
          <div className="text-2xl font-bold text-gray-900">
            {plan.price} {plan.currency.code}
          </div>
          {plan.description && (
            <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        <Button
          onClick={() => onViewDetails(plan.id)}
          variant="outline"
          size="sm"
          className="w-full border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
          id="view-details-button"
        >
          Детальніше
        </Button>
        
        {isActive ? (
          <Button
            disabled
            variant="outline"
            size="sm"
            className="w-full bg-emerald-100 text-emerald-700 border-emerald-200 cursor-not-allowed"
            id="active-plan-button"
          >
            <Check className="h-4 w-4 mr-2" />
            Активний план
          </Button>
        ) : (
          <Button
            onClick={() => onSelect(plan.id)}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            id="select-plan-button"
          >
            Обрати план
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TariffCard;
