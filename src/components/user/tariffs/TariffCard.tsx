
// Компонент для відображення карточки тарифного плану
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TariffPlan } from '@/components/admin/tariffs/types';

interface TariffCardProps {
  plan: TariffPlan;
  isActive: boolean;
  onSelect: (planId: string) => void;
}

const TariffCard: React.FC<TariffCardProps> = ({ plan, isActive, onSelect }) => {
  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md 
        ${isActive ? 'border-blue-500 ring-1 ring-blue-500' : ''}
      `}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <Badge variant={plan.is_permanent ? "secondary" : "default"}>
            {plan.is_permanent ? 'Постійний' : `${plan.duration_days} днів`}
          </Badge>
        </div>
        <CardDescription>
          {plan.is_permanent 
            ? 'Необмежений доступ до всіх функцій' 
            : `Доступ на ${plan.duration_days} днів`}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="text-2xl font-bold mb-4">
          {plan.price} {plan.currency.code}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isActive ? "outline" : "default"}
          onClick={() => onSelect(plan.id)}
        >
          {isActive ? 'Активний тариф' : 'Вибрати тариф'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TariffCard;
