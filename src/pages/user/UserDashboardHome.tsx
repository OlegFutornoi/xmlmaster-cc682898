
// Головна сторінка панелі користувача
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Truck, 
  CreditCard, 
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';

const UserDashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    activeSubscription, 
    hasActiveSubscription,
    isLoading 
  } = useUserSubscriptions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="user-dashboard-home">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ласкаво просимо, {user?.email}!
        </h1>
        <p className="text-gray-600">
          Керуйте своїми магазинами та постачальниками в одному місці
        </p>
      </div>

      {/* Subscription Status */}
      {hasActiveSubscription ? (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <CreditCard className="h-5 w-5" />
              Активна підписка
            </CardTitle>
            <CardDescription>
              Ваш поточний тарифний план: <strong>{activeSubscription?.tariff_plan.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-emerald-700">
                Підписка активна до: {new Date(activeSubscription?.ends_at).toLocaleDateString('uk-UA')}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/user/dashboard/tariffs')}
                id="view-tariffs-button"
              >
                Переглянути тарифи
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <CreditCard className="h-5 w-5" />
              Оберіть тарифний план
            </CardTitle>
            <CardDescription>
              Для доступу до всіх функцій потрібно активувати підписку
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/user/dashboard/tariffs')}
              className="bg-orange-600 hover:bg-orange-700"
              id="activate-subscription-button"
            >
              Обрати тариф
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={!hasActiveSubscription ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-blue-600" />
              Магазини
            </CardTitle>
            <CardDescription>
              Керування вашими магазинами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/user/dashboard/stores')}
              disabled={!hasActiveSubscription}
              id="manage-stores-button"
            >
              {hasActiveSubscription ? 'Керувати магазинами' : 'Потрібна підписка'}
            </Button>
          </CardContent>
        </Card>

        <Card className={!hasActiveSubscription ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5 text-green-600" />
              Постачальники
            </CardTitle>
            <CardDescription>
              Керування постачальниками
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/user/dashboard/suppliers')}
              disabled={!hasActiveSubscription}
              id="manage-suppliers-button"
            >
              {hasActiveSubscription ? 'Керувати постачальниками' : 'Потрібна підписка'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Статистика
            </CardTitle>
            <CardDescription>
              Аналітика та звіти
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Скоро буде доступно
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboardHome;
