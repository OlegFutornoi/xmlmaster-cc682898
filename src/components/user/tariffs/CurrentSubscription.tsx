
// Компонент для відображення поточної підписки користувача
import React from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Infinity } from 'lucide-react';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    }
  }
}

interface CurrentSubscriptionProps {
  subscription: Subscription | null;
}

const CurrentSubscription: React.FC<CurrentSubscriptionProps> = ({ subscription }) => {
  const navigate = useNavigate();

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Немає активного тарифу</CardTitle>
          <CardDescription>
            Виберіть тарифний план, щоб почати користуватися всіма можливостями системи.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Увага</AlertTitle>
            <AlertDescription>
              Для створення та управління магазинами необхідно активувати тарифний план.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{subscription.tariff_plan.name}</CardTitle>
            <CardDescription>
              Активовано: {format(new Date(subscription.start_date), "d MMMM yyyy", { locale: uk })}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg py-1">
            {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          {subscription.tariff_plan.is_permanent ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Infinity className="h-3.5 w-3.5" />
              Постійний доступ
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Закінчується: {subscription.end_date 
                ? format(new Date(subscription.end_date), "d MMMM yyyy", { locale: uk })
                : 'Не вказано'
              }
            </Badge>
          )}
        </div>
        
        <Button onClick={() => navigate('/user/dashboard/stores')} className="mb-4">
          Керувати магазинами
        </Button>
      </CardContent>
    </Card>
  );
};

export default CurrentSubscription;
