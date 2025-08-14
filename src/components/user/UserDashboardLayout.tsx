
// Компонент лейауту панелі користувача з навігацією
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const UserDashboardLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isOnTariffs = location.pathname === '/user/dashboard/tariffs';
  const shouldShowNavigation = hasActiveSubscription || isOnTariffs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {shouldShowNavigation && (
        <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🏠</span>
                </div>
                <span className="font-semibold text-gray-900">Панель користувача</span>
              </div>
              
              <nav className="flex items-center gap-4">
                <Button
                  variant={location.pathname === '/user/dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/user/dashboard')}
                  id="nav-dashboard-button"
                >
                  Головна
                </Button>
                <Button
                  variant={location.pathname === '/user/dashboard/tariffs' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/user/dashboard/tariffs')}
                  id="nav-tariffs-button"
                >
                  Тарифи
                </Button>
                {hasActiveSubscription && (
                  <>
                    <Button
                      variant={location.pathname === '/user/dashboard/stores' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => navigate('/user/dashboard/stores')}
                      id="nav-stores-button"
                    >
                      Магазини
                    </Button>
                    <Button
                      variant={location.pathname === '/user/dashboard/suppliers' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => navigate('/user/dashboard/suppliers')}
                      id="nav-suppliers-button"
                    >
                      Постачальники
                    </Button>
                  </>
                )}
              </nav>
            </div>
            
            {activeSubscription && (
              <Badge variant="outline" className="text-xs">
                {activeSubscription.tariff_plan.name}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <Outlet />
    </div>
  );
};

export default UserDashboardLayout;
