
// Компонент для відображення списку обмежень тарифного плану
import React from 'react';
import { PlanLimitation } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PlanLimitationsListProps {
  planLimitations: PlanLimitation[];
}

const PlanLimitationsList: React.FC<PlanLimitationsListProps> = ({ planLimitations }) => {
  if (!planLimitations.length) return null;
  
  return (
    <div className="mt-4" id="plan-limitations-list">
      <h4 className="text-sm font-medium mb-2">Обмеження:</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Параметр</TableHead>
            <TableHead>Значення</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {planLimitations.map((limitation, idx) => (
            <TableRow key={idx} id={`limitation-row-${idx}`}>
              <TableCell>{limitation.limitation_type.description || limitation.limitation_type.name}</TableCell>
              <TableCell>{limitation.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlanLimitationsList;
