
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const AdminDashboard = () => {
  const { admin } = useAdminAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Ласкаво просимо, {admin?.username}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>XmlMaster</CardTitle>
              <CardDescription>Адміністративна панель</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Тут ви можете керувати адміністраторами системи, налаштовувати параметри
                та переглядати статистику.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Управління користувачами</CardTitle>
              <CardDescription>Перейдіть до сторінки "Користувачі"</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Додавайте нових користувачів та керуйте їх правами доступу.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Налаштування</CardTitle>
              <CardDescription>Перейдіть до сторінки "Налаштування"</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Змінюйте логін та пароль адміністратора системи.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
