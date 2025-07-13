
// Компонент для відображення поточної підписки користувача
import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Infinity, AlertCircle, Store } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Subscription {
  id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  tariff_plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number | null;
    is_permanent: boolean;
    currency: {
      code: string;
    };
  };
}

interface CurrentSubscriptionProps {
  subscription: Subscription | null;
}

const CurrentSubscription: React.FC<CurrentSubscriptionProps> = ({
  subscription
}) => {
  const navigate = useNavigate();
  
  if (!subscription) {
    return <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Немає активного тарифу</AlertTitle>
        <AlertDescription>
          Виберіть тарифний план, щоб почати користуватися всіма можливостями системи.
        </AlertDescription>
      </Alert>;
  }

  // Визначаємо термін дії підписки
  const getSubscriptionTermDisplay = () => {
    if (!subscription.is_active) {
      return <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Неактивний
        </Badge>;
    }

    if (subscription.tariff_plan.is_permanent) {
      return <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Infinity className="h-3 w-3 text-green-500" />
          Постійний доступ
        </Badge>;
    } else if (subscription.end_date) {
      // Перевіряємо валідність дати закінчення та чи не прострочена підписка
      const endDate = parseISO(subscription.end_date);
      const now = new Date();
      
      if (isValid(endDate)) {
        const isExpired = now.getTime() > endDate.getTime();
        const timeLeft = endDate.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        
        return <Badge 
          variant="outline" 
          className={`flex items-center gap-1 text-xs ${isExpired ? 'text-red-600 border-red-300' : hoursLeft < 24 ? 'text-amber-600 border-amber-300' : 'text-green-600 border-green-300'}`}
        >
          <Clock className={`h-3 w-3 ${isExpired ? 'text-red-500' : hoursLeft < 24 ? 'text-amber-500' : 'text-green-500'}`} />
          {isExpired 
            ? `Закінчився ${format(endDate, "d MMMM yyyy 'о' HH:mm", { locale: uk })}`
            : `До ${format(endDate, "d MMMM yyyy 'о' HH:mm", { locale: uk })}`
          }
        </Badge>;
      }
    }

    // Якщо немає валідної дати закінчення
    return <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Активний тариф
      </Badge>;
  };
  
  return <Card className="mb-4">
      <CardHeader className="py-0 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{subscription.tariff_plan.name}</span>
          {subscription.tariff_plan.price > 0 && <Badge variant="secondary" className="text-sm">
              {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
            </Badge>}
        </div>
        <div className="flex items-center gap-2">
          {getSubscriptionTermDisplay()}
          <Button variant="ghost" size="icon" onClick={() => navigate('/user/dashboard/stores')} id="go-to-stores-button">
            <Store className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>;
};

export default CurrentSubscription;
