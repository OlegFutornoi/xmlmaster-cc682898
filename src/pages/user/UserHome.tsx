
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UserHome = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Ласкаво просимо, {user?.username}!</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>XML Marketplace Connector</CardTitle>
          <CardDescription>
            Ваш інструмент для роботи з XML файлами постачальників
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            За допомогою цієї платформи ви зможете легко обробляти XML файли від постачальників,
            конвертувати їх у потрібний формат та завантажувати вибрані товари у ваш інтернет-магазин.
          </p>
          <p className="text-gray-600 mt-4">
            Скоро тут з'являться додаткові функції. Слідкуйте за оновленнями!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHome;
