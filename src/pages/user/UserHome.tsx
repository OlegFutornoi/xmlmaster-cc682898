
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';

const UserHome = () => {
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_tariff_subscriptions')
            .select(`
              id,
              start_date,
              end_date,
              is_active,
              tariff_plans (
                id,
                name,
                price,
                is_permanent,
                duration_days,
                currencies (name, code)
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            console.error('Error fetching subscription:', error);
          } else {
            setActiveSubscription(data);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    fetchSubscription();
  }, [user]);

  // Функція для форматування дати закінчення підписки
  const formatEndDate = (subscription) => {
    if (!subscription || !subscription.tariff_plans) return '';
    
    if (subscription.end_date) {
      return format(new Date(subscription.end_date), "dd MMMM yyyy", { locale: uk });
    } else if (subscription.start_date && subscription.tariff_plans.duration_days) {
      // Якщо end_date відсутня, але є start_date і duration_days, обчислюємо дату закінчення
      const startDate = new Date(subscription.start_date);
      const endDate = addDays(startDate, subscription.tariff_plans.duration_days);
      return format(endDate, "dd MMMM yyyy", { locale: uk });
    }
    
    return '';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Ласкаво просимо, {user?.username}!</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>XML Master</CardTitle>
            <CardDescription>
              Ваш інструмент для роботи з XML файлами постачальників
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              За допомогою цієї платформи ви зможете легко обробляти XML файли від постачальників,
              конвертувати їх у потрібний формат та завантажувати вибрані товари у ваш інтернет-магазин.
            </p>
          </CardContent>
        </Card>

        {activeSubscription && (
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Ваш тарифний план
              </CardTitle>
              <CardDescription>
                Інформація про ваш поточний тариф
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-700">
                    {activeSubscription.tariff_plans.name}
                  </h3>
                  <p className="text-sm text-blue-600">
                    {activeSubscription.tariff_plans.price > 0 
                      ? `${activeSubscription.tariff_plans.price} ${activeSubscription.tariff_plans.currencies.code}` 
                      : "Демонстраційний тариф"}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {activeSubscription.tariff_plans.is_permanent ? (
                    <Badge className="bg-green-100 text-green-800">
                      Постійний доступ
                    </Badge>
                  ) : (
                    <>
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Термін дії: {activeSubscription.tariff_plans.duration_days} днів
                      </Badge>
                      <p className="text-sm text-gray-600">
                        до {formatEndDate(activeSubscription)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Швидкий старт</CardTitle>
          <CardDescription>
            Кроки для початку роботи з платформою
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 pl-2">
            <li className="text-gray-700">
              <span className="font-medium">Підключіть свій магазин</span> - налаштуйте інтеграцію з вашою платформою електронної комерції
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Додайте постачальників</span> - вкажіть джерела XML-файлів для імпорту товарів
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Налаштуйте картування полів</span> - вкажіть як конвертувати дані між різними форматами
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Запустіть імпорт</span> - почніть процес завантаження товарів у ваш магазин
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHome;
