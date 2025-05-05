
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
            <CardHeader>
              <CardTitle className="text-xl">
                Основна інформація про тарифний план
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TariffDetailsForm form={form} currencies={currencies} />
            </CardContent>
            {id && (
              <CardFooter>
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
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>Функції тарифного плану</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {id && <TariffItems tariffPlanId={id} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limitations">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex justify-between items-center">
                <span>Обмеження тарифного плану</span>
                <div className="flex items-center space-x-2">
                  <LimitationTypeButton 
                    onLimitationTypeAdded={() => {
                      // Можемо тут оновити список типів обмежень, якщо потрібно
                    }} 
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {id && <TariffLimitations tariffPlanId={id} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Form>
  );
};

export default TariffTabsContent;
