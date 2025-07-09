
// Компонент для відображення горизонтальних табів тарифного плану
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Settings, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UseFormReturn } from 'react-hook-form';

interface TariffFormSidebarProps {
  form: UseFormReturn<any>;
  id: string | undefined;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const TariffFormSidebar: React.FC<TariffFormSidebarProps> = ({
  form,
  id,
  activeTab,
  setActiveTab,
  isSubmitting,
  onSubmit
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      {/* Горизонтальні таби */}
      <Tabs 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2" id="details-tab">
            <Info className="h-4 w-4" />
            Основна інформація
          </TabsTrigger>
          
          <TabsTrigger value="items" className="flex items-center gap-2" disabled={!id} id="items-tab">
            <ListChecks className="h-4 w-4" />
            Функції
          </TabsTrigger>
          
          <TabsTrigger value="limitations" className="flex items-center gap-2" disabled={!id} id="limitations-tab">
            <Settings className="h-4 w-4" />
            Обмеження
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Кнопки управління */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate('/admin/tariffs')}
          id="back-button"
        >
          Назад
        </Button>
        
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          id="save-button"
        >
          {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
        </Button>
      </div>
    </div>
  );
};

export default TariffFormSidebar;
