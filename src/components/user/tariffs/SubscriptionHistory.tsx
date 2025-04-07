
// Компонент для відображення історії підписок користувача
import React from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface SubscriptionHistoryProps {
  history: Subscription[];
}

const SubscriptionHistory: React.FC<SubscriptionHistoryProps> = ({ history }) => {
  if (!history.length) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Історія підписок</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва тарифу</TableHead>
                <TableHead>Дата активації</TableHead>
                <TableHead>Дата закінчення</TableHead>
                <TableHead>Ціна</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>{subscription.tariff_plan.name}</TableCell>
                  <TableCell>{format(new Date(subscription.start_date), "d MMMM yyyy", { locale: uk })}</TableCell>
                  <TableCell>
                    {subscription.end_date 
                      ? format(new Date(subscription.end_date), "d MMMM yyyy", { locale: uk })
                      : 'Постійний доступ'
                    }
                  </TableCell>
                  <TableCell>
                    {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionHistory;
