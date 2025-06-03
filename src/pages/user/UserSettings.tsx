
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Settings, User, Mail, Shield, Bell, Palette, Globe } from 'lucide-react';

const UserSettings = () => {
  const { user } = useAuth();

  useEffect(() => {
    console.log('UserSettings component mounted');
  }, []);

  const settingSections = [
    {
      title: "Профіль користувача",
      description: "Управління особистою інформацією",
      icon: User,
      color: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      title: "Безпека",
      description: "Налаштування паролю та безпеки",
      icon: Shield,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    {
      title: "Сповіщення",
      description: "Керування повідомленнями",
      icon: Bell,
      color: "bg-purple-50 text-purple-600 border-purple-100"
    },
    {
      title: "Інтерфейс",
      description: "Персоналізація зовнішнього вигляду",
      icon: Palette,
      color: "bg-orange-50 text-orange-600 border-orange-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 md:px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Налаштування</h1>
            <p className="text-gray-600">Управління налаштуваннями вашого акаунту</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8">
        {/* Profile Card */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="h-5 w-5 text-blue-600" />
              Інформація профілю
            </CardTitle>
            <CardDescription>
              Оновіть свою особисту інформацію та налаштування акаунту
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email адреса</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email адресу неможливо змінити</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700">Ім'я користувача</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Введіть ваше ім'я"
                  className="focus:border-blue-400 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="pt-4">
              <Button className="bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600">
                Зберегти зміни
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Налаштування акаунту</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingSections.map((section, index) => (
              <Card key={index} className="border-0 shadow-sm bg-white hover:shadow-md transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-gray-900">{section.title}</CardTitle>
                  <CardDescription className="text-gray-600 text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-emerald-600" />
              Безпека та конфіденційність
            </CardTitle>
            <CardDescription>
              Налаштування безпеки вашого акаунту
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-700">Поточний пароль</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Введіть поточний пароль"
                  className="focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700">Новий пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Введіть новий пароль"
                  className="focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                Змінити пароль
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Globe className="h-5 w-5 text-purple-600" />
              Налаштування інтерфейсу
            </CardTitle>
            <CardDescription>
              Персоналізуйте свій досвід роботи
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Мова інтерфейсу</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-purple-400 focus:ring-purple-400">
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Часовий пояс</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:border-purple-400 focus:ring-purple-400">
                  <option value="Europe/Kiev">Київ (UTC+2)</option>
                  <option value="Europe/London">Лондон (UTC+0)</option>
                  <option value="America/New_York">Нью-Йорк (UTC-5)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 shadow-sm bg-red-50 border border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Небезпечна зона</CardTitle>
            <CardDescription className="text-red-600">
              Ці дії незворотні. Будьте обережні.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
              Видалити акаунт
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSettings;
