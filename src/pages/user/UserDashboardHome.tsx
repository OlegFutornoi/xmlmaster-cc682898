
// Компонент головної сторінки панелі користувача
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store, Truck, CreditCard, Settings, Calendar, Clock } from 'lucide-react';

const UserDashboardHome = () => {
  const { user } = useAuth();
  const { activeSubscription, hasActiveSubscription } = useUserSubscriptions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const quickActions = [
    {
      title: 'Магазини',
      description: 'Керуйте своїми магазинами та налаштуваннями',
      icon: Store,
      href: '/user/dashboard/stores',
      disabled: !hasActiveSubscription,
    },
    {
      title: 'Постачальники',
      description: 'Налаштуйте інтеграції з постачальниками',
      icon: Truck,
      href: '/user/dashboard/suppliers',
      disabled: !hasActiveSubscription,
    },
    {
      title: 'Тарифи',
      description: 'Переглядайте та керуйте підписками',
      icon: CreditCard,
      href: '/user/dashboard/tariffs',
      disabled: false,
    },
    {
      title: 'Налаштування',
      description: 'Налаштування профілю та системи',
      icon: Settings,
      href: '/user/dashboard/settings',
      disabled: !hasActiveSubscription,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-emerald-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Вітаємо, {user?.email}!
        </h1>
        <p className="text-gray-600">
          Керуйте своїми магазинами та інтеграціями з постачальниками через XML Master
        </p>
      </div>

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Статус підписки
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActiveSubscription && activeSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{activeSubscription.tariff_plan.name}</p>
                  <p className="text-sm text-gray-600">
                    Активна підписка
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  Активна
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Дата початку</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(activeSubscription.start_date)}
                    </p>
                  </div>
                </div>
                
                {activeSubscription.end_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Дата завершення</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(activeSubscription.end_date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">У вас немає активної підписки</p>
              <Button asChild>
                <Link to="/user/dashboard/tariffs">
                  Переглянути тарифи
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Швидкі дії</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title} 
                className={`transition-all duration-200 ${
                  action.disabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-md cursor-pointer'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${action.disabled ? 'text-gray-400' : 'text-emerald-600'}`} />
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {action.description}
                  </CardDescription>
                  {action.disabled ? (
                    <Button variant="outline" disabled className="w-full">
                      Потрібна підписка
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to={action.href}>
                        Перейти
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardHome;
