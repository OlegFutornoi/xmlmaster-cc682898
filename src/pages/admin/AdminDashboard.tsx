
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminDashboard = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Ласкаво просимо, {admin?.username}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>XML Marketplace Connector</CardTitle>
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
              <CardTitle>Управління адміністраторами</CardTitle>
              <CardDescription>Перейдіть до сторінки "Адміністратори"</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Додавайте нових адміністраторів та керуйте їх правами доступу.
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
