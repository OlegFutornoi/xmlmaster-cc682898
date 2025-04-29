
// Компонент для відображення бічної панелі форми тарифного плану
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Settings, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
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
    <Form {...form}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Керування тарифним планом
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full" 
            orientation="vertical"
          >
            <TabsList className="flex flex-col items-stretch w-full h-auto space-y-2">
              <TabsTrigger value="details" className="flex justify-start">
                <Info className="h-4 w-4 mr-2" />
                Основна інформація
              </TabsTrigger>
              
              <TabsTrigger value="items" className="flex justify-start" disabled={!id}>
                <ListChecks className="h-4 w-4 mr-2" />
                Функції
              </TabsTrigger>
              
              <TabsTrigger value="limitations" className="flex justify-start" disabled={!id}>
                <Settings className="h-4 w-4 mr-2" />
                Обмеження
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex items-center space-x-4 justify-between w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/admin/dashboard/tariffs')}
            >
              Назад
            </Button>
            {!id && (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Збереження...' : 'Зберегти'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </Form>
  );
};

export default TariffFormSidebar;
