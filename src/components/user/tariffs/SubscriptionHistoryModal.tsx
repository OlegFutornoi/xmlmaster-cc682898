
// Компонент модального вікна для відображення історії підписок
import React from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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

interface SubscriptionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: Subscription[];
}

const SubscriptionHistoryModal: React.FC<SubscriptionHistoryModalProps> = ({ 
  open, 
  onOpenChange, 
  history 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-sm border-emerald-100 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Історія підписок</DialogTitle>
          <DialogDescription className="text-gray-600">
            Перегляньте всі попередні підписки
          </DialogDescription>
        </DialogHeader>
        
        {history.length > 0 ? (
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва тарифу</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата активації</TableHead>
                  <TableHead>Дата закінчення</TableHead>
                  <TableHead>Ціна</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">{subscription.tariff_plan.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={subscription.is_active ? "default" : "secondary"}
                        className={subscription.is_active 
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                          : "bg-gray-100 text-gray-600 border-gray-200"
                        }
                      >
                        {subscription.is_active ? 'Активна' : 'Завершена'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscription.start_date), "d MMMM yyyy", { locale: uk })}
                    </TableCell>
                    <TableCell>
                      {subscription.end_date 
                        ? format(new Date(subscription.end_date), "d MMMM yyyy", { locale: uk })
                        : subscription.tariff_plan.is_permanent ? 'Постійний доступ' : '—'
                      }
                    </TableCell>
                    <TableCell>
                      {subscription.tariff_plan.price} {subscription.tariff_plan.currency.code}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Історія підписок порожня</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionHistoryModal;
