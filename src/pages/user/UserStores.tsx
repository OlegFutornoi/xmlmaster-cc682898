
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const UserStores = () => {
  useEffect(() => {
    console.log('UserStores component mounted');
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Магазини</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Керування магазинами
          </CardTitle>
          <CardDescription>
            Додавайте та керуйте своїми магазинами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Цей розділ призначений для управління вашими магазинами та інтеграціями.
            Тут ви зможете підключати різні платформи та налаштовувати синхронізацію даних.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStores;
