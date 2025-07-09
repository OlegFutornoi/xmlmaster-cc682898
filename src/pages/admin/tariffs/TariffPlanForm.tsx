
// Компонент для створення та редагування тарифних планів
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTariffForm } from '@/hooks/tariffs/useTariffForm';
import TariffFormSidebar from '@/components/admin/tariff-plan/TariffFormSidebar';
import TariffTabsContent from '@/components/admin/tariff-plan/TariffTabsContent';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const TariffPlanForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const isMobile = useIsMobile();
  
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

  // Переконуємося, що форма буде повністю перевантажена при зміні id
  useEffect(() => {
    if (id) {
      console.log('Tariff ID changed, refreshing form data:', id);
    }
  }, [id]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900">
              {id ? 'Редагування тарифного плану' : 'Новий тарифний план'}
            </h1>
          </header>

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-4 md:p-8'}`}>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Горизонтальні таби та кнопки управління */}
                <TariffFormSidebar 
                  form={form}
                  id={id}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                />
                
                {/* Контент вкладок */}
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
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TariffPlanForm;
