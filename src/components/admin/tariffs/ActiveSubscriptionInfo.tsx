
// Компонент для відображення поточної активної підписки
import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { uk } from 'date-fns/locale';

interface ActiveSubscriptionInfoProps {
  activeSubscription: any;
}

const ActiveSubscriptionInfo: React.FC<ActiveSubscriptionInfoProps> = ({ activeSubscription }) => {
  if (!activeSubscription) return null;
  
  // Форматування дати закінчення підписки
  const formatEndDate = () => {
    if (activeSubscription.tariff_plans.is_permanent) {
      return "Постійний доступ";
    }
    
    if (activeSubscription.end_date) {
      const endDate = parseISO(activeSubscription.end_date);
      if (isValid(endDate)) {
        return `Дійсний до: ${format(endDate, "d MMMM yyyy", { locale: uk })}`;
      }
    }
    
    return "Дата закінчення не вказана";
  };
  
  return (
    <div className="bg-blue-50 p-4 rounded-md mb-4">
      <p className="font-medium text-blue-800">Поточний тарифний план:</p>
      <p>{activeSubscription.tariff_plans.name}</p>
      <p className="text-sm text-blue-600 mt-1">{formatEndDate()}</p>
    </div>
  );
};

export default ActiveSubscriptionInfo;
