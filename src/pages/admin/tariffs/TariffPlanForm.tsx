
// Компонент для створення та редагування тарифних планів
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTariffForm } from '@/hooks/tariffs/useTariffForm';
import TariffFormSidebar from '@/components/admin/tariff-plan/TariffFormSidebar';
import TariffTabsContent from '@/components/admin/tariff-plan/TariffTabsContent';

const TariffPlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  
  const { 
    form, 
    currencies, 
    isSubmitting, 
    onSubmit 
  } = useTariffForm(id);

  const handleSubmit = () => {
    form.handleSubmit(() => onSubmit(navigate))();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {id ? 'Редагування тарифного плану' : 'Новий тарифний план'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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
    </div>
  );
};

export default TariffPlanForm;
