
// Компонент лейауту панелі користувача з боковим меню
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserAppSidebar } from './UserAppSidebar';

const UserDashboardLayout = () => {
  const { user } = useAuth();
  const { 
    activeSubscription, 
    isLoading: subscriptionsLoading, 
    hasActiveSubscription
  } = useUserSubscriptions();

  if (subscriptionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <UserAppSidebar hasActiveSubscription={hasActiveSubscription} />
        
        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger id="sidebar-trigger-button" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🏠</span>
                  </div>
                  <span className="font-semibold text-gray-900">Панель користувача</span>
                </div>
              </div>
              
              {activeSubscription && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Тариф:</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium">
                    {activeSubscription.tariff_plan.name}
                  </span>
                </div>
              )}
            </div>
          </header>
          
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboardLayout;
