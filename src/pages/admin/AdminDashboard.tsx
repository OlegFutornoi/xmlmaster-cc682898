
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Users, Settings, BarChart3, Shield, Zap, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const { admin } = useAdminAuth();
  const isMobile = useIsMobile();

  const stats = [
    {
      title: "Активні користувачі",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Тарифні плани",
      value: "8",
      change: "+2",
      icon: BarChart3,
      color: "text-emerald-600"
    },
    {
      title: "Доходи",
      value: "$12,450",
      change: "+18%",
      icon: TrendingUp,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      title: "Управління користувачами",
      description: "Додавайте нових користувачів та керуйте їх правами доступу",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Тарифні плани",
      description: "Налаштовуйте та керуйте тарифними планами системи",
      icon: BarChart3,
      href: "/admin/tariffs",
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Системні налаштування",
      description: "Змінюйте логін та пароль адміністратора системи",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-purple-50 text-purple-600 border-purple-100"
    }
  ];

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Ласкаво просимо, {admin?.username}!
              </h1>
              <p className="text-gray-600 mt-1">
                Керуйте системою XML Master з цієї панелі
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4" />
              Адміністративний доступ
            </div>
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
                      <p className="text-sm text-emerald-600 mt-1">
                        {stat.change} від минулого місяця
                      </p>
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
                <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group">
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
              ))}
            </div>
          </div>

          {/* System Status */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Zap className="h-5 w-5 text-emerald-600" />
                Статус системи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Сервер</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600">Онлайн</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">База даних</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600">Підключена</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">XML Обробка</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-emerald-600">Активна</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Останнє оновлення</span>
                    <span className="text-sm text-gray-600">2 хвилини тому</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
