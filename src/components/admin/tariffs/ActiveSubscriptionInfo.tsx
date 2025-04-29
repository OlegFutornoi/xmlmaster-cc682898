
// Компонент для відображення поточної активної підписки
import React from 'react';

interface ActiveSubscriptionInfoProps {
  activeSubscription: any;
}

const ActiveSubscriptionInfo: React.FC<ActiveSubscriptionInfoProps> = ({ activeSubscription }) => {
  if (!activeSubscription) return null;
  
  return (
    <div className="bg-blue-50 p-4 rounded-md mb-4">
      <p className="font-medium text-blue-800">Поточний тарифний план:</p>
      <p>{activeSubscription.tariff_plans.name}</p>
      <p className="text-sm text-blue-600 mt-1">
        {activeSubscription.tariff_plans.is_permanent 
          ? "Постійний доступ" 
          : `Дійсний до: ${new Date(activeSubscription.end_date).toLocaleDateString()}`}
      </p>
    </div>
  );
};

export default ActiveSubscriptionInfo;
