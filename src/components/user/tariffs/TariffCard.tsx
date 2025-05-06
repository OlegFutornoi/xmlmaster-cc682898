// Компонент для відображення карточки тарифного плану
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Check, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TariffPlan } from '@/components/admin/tariffs/types';
import { useIsMobile } from '@/hooks/use-mobile';
interface TariffCardProps {
  plan: TariffPlan;
  isActive: boolean;
  onSelect: (planId: string) => void;
  onViewDetails: (planId: string) => void;
}
const TariffCard: React.FC<TariffCardProps> = ({
  plan,
  isActive,
  onSelect,
  onViewDetails
}) => {
  const isMobile = useIsMobile();

  // Розрахунок дати закінчення для відображення
  const getExpiryDate = () => {
    if (plan.is_permanent) {
      return null;
    }
    if (plan.duration_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + plan.duration_days);
      return format(futureDate, "d MMMM yyyy", {
        locale: uk
      });
    }
    return null;
  };
  const expiryDate = getExpiryDate();
  return <Card className={`
        transition-all duration-200 hover:shadow-md 
        ${isActive ? 'border-blue-500 ring-1 ring-blue-500' : ''}
      `} id={`tariff-card-${plan.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <Badge variant={plan.is_permanent ? "secondary" : "default"}>
            {plan.is_permanent ? 'Постійний' : expiryDate ? `До ${expiryDate}` : `${plan.duration_days} днів`}
          </Badge>
        </div>
        
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          {plan.price} {plan.currency.code}
        </div>
      </CardContent>
      
      <CardFooter className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
        <div className={`flex ${isMobile ? 'w-full justify-between' : ''}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => onViewDetails(plan.id)} id={`tariff-details-${plan.id}`}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Детальна інформація</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isMobile && <Button variant="outline" size="icon" onClick={() => onSelect(plan.id)} id={`tariff-select-icon-${plan.id}`} disabled={isActive}>
              <CheckCircle2 className={`h-4 w-4 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
            </Button>}
        </div>
        
        {!isMobile && <Button className="ml-2" variant={isActive ? "outline" : "default"} onClick={() => onSelect(plan.id)} id={`tariff-select-${plan.id}`} disabled={isActive}>
            {isActive ? <>
                <Check className="mr-2 h-4 w-4" />
                Активний тариф
              </> : 'Вибрати тариф'}
          </Button>}
      </CardFooter>
    </Card>;
};
export default TariffCard;