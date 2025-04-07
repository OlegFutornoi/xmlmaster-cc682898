
// Компонент для відображення списку обмежень тарифного плану
import React from 'react';
import { PlanLimitation } from './types';

interface PlanLimitationsListProps {
  planLimitations: PlanLimitation[];
}

const PlanLimitationsList: React.FC<PlanLimitationsListProps> = ({ planLimitations }) => {
  if (!planLimitations.length) return null;
  
  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium mb-2">Обмеження:</h4>
      <ul className="text-sm space-y-1">
        {planLimitations.map((limitation, idx) => (
          <li key={idx}>
            {limitation.limitation_type.description || limitation.limitation_type.name}: {limitation.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanLimitationsList;
