
// Компонент для відображення поточної підписки користувача
import React from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Infinity, AlertCircle, Store, RefreshCw } from 'lucide-react';
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
  onRefresh?: () => void;
}

const CurrentSubscription: React.FC<CurrentSubscriptionProps> = ({
  subscription,
  onRefresh
}) => {
  const navigate = useNavigate();
  
  // Функція для перевірки чи підписка дійсно активна
  const isSubscriptionCurrentlyValid = (sub: Subscription): boolean => {
    if (!sub.is_active) {
      return false;
    }

    if (sub.tariff_plan.is_permanent) {
      return true;
    }

    if (sub.end_date) {
      const currentTime = new Date().getTime();
      const endTime = new Date(sub.end_date).getTime();
      return currentTime <= endTime;
    }

    return false;
  };

  if (!subscription) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Немає активного тарифу</AlertTitle>
        <AlertDescription>
          Виберіть тарифний план, щоб почати користуватися всіма можливостями системи.
        </AlertDescription>
      </Alert>
    );
  }

  const isCurrentlyValid = isSubscriptionCurrentlyValid(subscription);

  // Якщо підписка в базі активна, але насправді прострочена
  if (subscription.is_active && !isCurrentlyValid) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Тариф закінчився</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>Ваш тарифний план "{subscription.tariff_plan.name}" закінчився. Оберіть новий план для продовження роботи.</span>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="ml-2"
              id="refresh-subscription-button"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Визначаємо термін дії підписки
  const getSubscriptionTermDisplay = () => {
    if (!isCurrentlyValid) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          Закінчився
        </Badge>
      );
    }

    if (subscription.tariff_plan.is_permanent) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Infinity className="h-3 w-3 text-green-500" />
          Постійний доступ
        </Badge>
      );
    } else if (subscription.end_date) {
      const endDate = parseISO(subscription.end_date);
      const now = new Date();
      
      if (isValid(endDate)) {
        const timeLeft = endDate.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const isExpiringSoon = hoursLeft < 24 && hoursLeft > 0;
        
        return (
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1 text-xs ${
              isExpiringSoon 
                ? 'text-amber-600 border-amber-300' 
                : 'text-green-600 border-green-300'
            }`}
          >
            <Clock className={`h-3 w-3 ${
              isExpiringSoon ? 'text-amber-500' : 'text-green-500'
            }`} />
            {isExpiringSoon 
              ? `Закінчується ${format(endDate, "d MMMM 'о' HH:mm", { locale: uk })}`
              : `До ${format(endDate, "d MMMM yyyy 'о' HH:mm", { locale: uk })}`
            }
          </Badge>
        );
      }
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1 text-xs">
        <Clock className="h-3 w-3" />
        Активний тариф
      </Badge>
    );
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="py-0 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{subscription.tariff_plan.name}</span>
          {subscription.tariff_plan.price > 0 && (
            <Badge variant="secondary" className="text-sm">
              {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getSubscriptionTermDisplay()}
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRefresh}
              title="Оновити статус підписки"
              id="refresh-status-button"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          {isCurrentlyValid && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/user/dashboard/stores')} 
              id="go-to-stores-button"
            >
              <Store className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default CurrentSubscription;
