
// Компонент для створення та редагування тарифних планів
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTariffForm } from '@/hooks/tariffs/useTariffForm';
import TariffFormSidebar from '@/components/admin/tariff-plan/TariffFormSidebar';
import TariffTabsContent from '@/components/admin/tariff-plan/TariffTabsContent';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Skeleton } from '@/components/ui/skeleton';

const TariffPlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  
  const { 
    form, 
    currencies, 
    isSubmitting,
    isLoading,
    onSubmit 
  } = useTariffForm(id);

  const handleSubmit = () => {
    form.handleSubmit(() => onSubmit(navigate))();
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
          {id ? 'Редагування тарифного плану' : 'Новий тарифний план'}
        </h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-3">
              <TariffFormSidebar 
                form={form}
                id={id}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </div>
            <div className="md:col-span-9">
              <TariffTabsContent
                form={form}
                id={id}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currencies={currencies}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TariffPlanForm;
