
// Компонент головної панелі користувача
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { tryActivateDefaultPlan } from '@/services/subscriptionService';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    activeSubscription, 
    isLoading: subscriptionsLoading, 
    hasActiveSubscription,
    refetchSubscriptions 
  } = useUserSubscriptions();

  // Логування стану для діагностики
  console.log('UserDashboard render:', {
    subscriptionsLoading,
    hasActiveSubscription,
    subscriptionName: activeSubscription?.tariff_plan.name,
    userId: user?.id
  });

  useEffect(() => {
    const initializeSubscription = async () => {
      if (!user?.id || subscriptionsLoading) {
        return;
      }

      console.log('Initializing subscription for user:', user.id);

      // Перевіряємо тільки після завантаження підписок
      if (!hasActiveSubscription) {
        console.log('No active subscription found, trying to activate demo plan');
        const demoSubscription = await tryActivateDefaultPlan(user.id);
        if (demoSubscription) {
          console.log('Demo plan activated:', demoSubscription);
          // Перезавантажуємо підписки після активації
          await refetchSubscriptions();
        }
      } else {
        console.log('User has active subscription:', activeSubscription?.tariff_plan.name);
      }
    };

    // Ініціалізуємо підписку тільки один раз після завантаження
    initializeSubscription();
  }, [user?.id, subscriptionsLoading, hasActiveSubscription]); // Видалили activeSubscription з залежностей

  // Блокуємо доступ до дашборду якщо немає активної підписки
  useEffect(() => {
    if (!subscriptionsLoading && !hasActiveSubscription) {
      console.log('No active subscription, redirecting to tariffs');
      navigate('/user/dashboard/tariffs', { replace: true });
    }
  }, [subscriptionsLoading, hasActiveSubscription, navigate]);

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

  if (!hasActiveSubscription) {
    return null; // Перенаправлення відбудеться через useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🏠</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Панель користувача</h1>
              <p className="text-gray-600">Вітаємо у вашому персональному кабінеті</p>
            </div>
          </div>

          {activeSubscription && (
            <div className="bg-emerald-50 rounded-xl p-6 mb-8 border border-emerald-200">
              <h2 className="text-lg font-semibold text-emerald-800 mb-2">Поточний тариф</h2>
              <p className="text-emerald-700">
                {activeSubscription.tariff_plan.name} 
                {activeSubscription.tariff_plan.is_permanent 
                  ? ' (Постійний доступ)' 
                  : activeSubscription.end_date 
                    ? ` до ${new Date(activeSubscription.end_date).toLocaleDateString('uk-UA')}` 
                    : ''
                }
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-blue-600 text-xl">🏪</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Магазини</h3>
              <p className="text-gray-600 text-sm mb-4">Керування вашими магазинами</p>
              <button 
                onClick={() => navigate('/user/dashboard/stores')}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                id="go-to-stores-link"
              >
                Перейти →
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-green-600 text-xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Постачальники</h3>
              <p className="text-gray-600 text-sm mb-4">Керування постачальниками</p>
              <button 
                onClick={() => navigate('/user/dashboard/suppliers')}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
                id="go-to-suppliers-link"
              >
                Перейти →
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-purple-600 text-xl">💳</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Тарифи</h3>
              <p className="text-gray-600 text-sm mb-4">Керування тарифними планами</p>
              <button 
                onClick={() => navigate('/user/dashboard/tariffs')}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                id="go-to-tariffs-link"
              >
                Перейти →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
