
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSubscriptions } from '@/hooks/tariffs/useUserSubscriptions';
import { Package, Store, FileText, Settings, Upload, BarChart3, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserHome = () => {
  const { user } = useAuth();
  const { activeSubscription } = useUserSubscriptions();

  const stats = [
    {
      title: "Постачальники",
      value: "3",
      change: "+1 цього місяця",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Магазини",
      value: "2",
      change: "Підключено",
      icon: Store,
      color: "text-emerald-600"
    },
    {
      title: "XML файли",
      value: "12",
      change: "+4 нових",
      icon: FileText,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "Завантажити XML",
      description: "Завантажте новий XML файл від постачальника для обробки",
      icon: Upload,
      href: "/user/dashboard/suppliers",
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Керувати магазинами",
      description: "Додайте нові магазини або налаштуйте існуючі інтеграції",
      icon: Store,
      href: "/user/dashboard/stores",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Переглянути тарифи",
      description: "Оновіть свій тарифний план або переглядайте використання",
      icon: BarChart3,
      href: "/user/dashboard/tariffs",
      color: "bg-purple-50 text-purple-600 border-purple-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Ласкаво просимо до XML Master!
            </h1>
            <p className="text-gray-600 mt-1">
              Керуйте своїми XML файлами та інтеграціями з магазинами
            </p>
          </div>
          {activeSubscription && (
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm">
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                <Zap className="h-3 w-3 inline mr-1" />
                {activeSubscription.tariff_plans?.name || 'Активний план'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Швидкі дії</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.href}>
                <Card className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group h-full">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg text-gray-900">{action.title}</CardTitle>
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Остання активність
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">XML файл завантажено</p>
                  <p className="text-xs text-gray-500">2 години тому</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Store className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Магазин синхронізовано</p>
                  <p className="text-xs text-gray-500">5 годин тому</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan */}
          {activeSubscription && (
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  Поточний тариф
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {activeSubscription.tariff_plans?.name || 'Активний план'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Активний до {new Date(activeSubscription.end_date || '').toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link to="/user/dashboard/tariffs">
                      <Button variant="outline" size="sm" className="w-full">
                        Переглянути деталі
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Section */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Потрібна допомога?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ознайомтеся з документацією або зв'яжіться з нашою службою підтримки для отримання допомоги.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    Документація
                  </Button>
                  <Button variant="outline" size="sm">
                    Підтримка
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserHome;
