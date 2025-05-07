
// Компонент для відображення контенту вкладок тарифного плану
import React from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { UseFormReturn } from 'react-hook-form';

import TariffDetailsForm from './TariffDetailsForm';
import TariffLimitations from './TariffLimitations';
import TariffItems from './TariffItems';
import LimitationTypeButton from './LimitationTypeButton';

interface TariffTabsContentProps {
  form: UseFormReturn<any>;
  id: string | undefined;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currencies: any[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

const TariffTabsContent: React.FC<TariffTabsContentProps> = ({
  form,
  id,
  activeTab,
  setActiveTab,
  currencies,
  isSubmitting,
  onSubmit
}) => {
  return (
    <Form {...form}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="details">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl break-words">
                Основна інформація про тарифний план
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <TariffDetailsForm form={form} currencies={currencies} />
            </CardContent>
            {id && (
              <CardFooter className="p-4 md:p-6">
                <Button
                  type="button"
                  className="ml-auto"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex justify-between items-center flex-wrap gap-2">
                <span className="break-words">Функції тарифного плану</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {id && <TariffItems tariffPlanId={id} editMode={true} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limitations">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl flex justify-between items-center flex-wrap gap-2">
                <span className="break-words">Обмеження тарифного плану</span>
                <div className="flex items-center">
                  <LimitationTypeButton 
                    onLimitationTypeAdded={() => {
                      // Можемо тут оновити список типів обмежень, якщо потрібно
                    }} 
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {id && <TariffLimitations tariffPlanId={id} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Form>
  );
};

export default TariffTabsContent;
