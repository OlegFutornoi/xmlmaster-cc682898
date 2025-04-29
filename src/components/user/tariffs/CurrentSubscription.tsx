// Компонент відображення інформації про поточну підписку користувача
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Subscription {
  id: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  tariff_plan: {
    id: string;
    name: string;
    price: number;
    is_permanent: boolean;
    duration_days: number | null;
    currency: {
      code: string;
      name: string;
    }
  }
}

interface CurrentSubscriptionProps {
  subscription: Subscription | null;
}

const CurrentSubscription: React.FC<CurrentSubscriptionProps> = ({ subscription }) => {
  if (!subscription) {
    return (
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          У вас немає активного тарифного плану. Оберіть тариф нижче.
        </AlertDescription>
      </Alert>
    );
  }
  
  const { tariff_plan, end_date, start_date } = subscription;
  
  // Розраховуємо залишок днів для тарифів з обмеженим терміном дії
  let daysLeft = null;
  if (end_date) {
    const endDate = new Date(end_date);
    const today = new Date();
    daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <Card className="bg-white">
      <CardContent className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
            {tariff_plan.name}
          </Badge>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <span className="whitespace-nowrap">
            Ціна: {tariff_plan.price} {tariff_plan.currency.code}
          </span>
        </div>
        
        {tariff_plan.is_permanent ? (
          <div className="text-sm text-gray-600">
            <span className="whitespace-nowrap">Безстроковий тариф</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600 whitespace-nowrap">
              Початок: {format(new Date(start_date), "dd MMM yyyy", { locale: uk })}
            </span>
            <span className="text-gray-600 whitespace-nowrap">
              Закінчення: {format(new Date(end_date as string), "dd MMM yyyy", { locale: uk })}
            </span>
            {daysLeft !== null && (
              <Badge variant={daysLeft < 5 ? "warning" : "default"} className="whitespace-nowrap">
                {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'} залишилось
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentSubscription;
