
// Сторінка налаштувань користувача
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield } from 'lucide-react';

const UserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Тут буде логіка збереження налаштувань
      await new Promise(resolve => setTimeout(resolve, 1000)); // Симуляція запиту
      
      toast({
        title: "Успішно",
        description: "Налаштування збережено",
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" id="settings-title">Налаштування</h1>
        <p className="text-gray-600">Керуйте налаштуваннями свого облікового запису</p>
      </div>

      <div className="grid gap-6">
        {/* Інформація про профіль */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Профіль користувача
            </CardTitle>
            <CardDescription>
              Основна інформація про ваш обліковий запис
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Ім'я користувача</Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Для зміни основної інформації зверніться до адміністратора
            </p>
          </CardContent>
        </Card>

        {/* Налаштування безпеки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Безпека
            </CardTitle>
            <CardDescription>
              Налаштування безпеки вашого облікового запису
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Зміна паролю</h3>
                <p className="text-sm text-gray-600">Оновіть свій пароль для підвищення безпеки</p>
              </div>
              <Button variant="outline" id="change-password-button">
                Змінити пароль
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Двофакторна автентифікація</h3>
                <p className="text-sm text-gray-600">Додатковий рівень захисту для вашого акаунту</p>
              </div>
              <Button variant="outline" disabled id="2fa-button">
                Налаштувати
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Налаштування сповіщень */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Сповіщення
            </CardTitle>
            <CardDescription>
              Налаштуйте, які сповіщення ви хочете отримувати
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email сповіщення</h4>
                  <p className="text-sm text-gray-600">Отримувати сповіщення на email</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Включено
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Сповіщення про підписку</h4>
                  <p className="text-sm text-gray-600">Повідомлення про закінчення підписки</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Включено
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Кнопка збереження */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
            id="save-settings-button"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Збереження...
              </>
            ) : (
              'Зберегти налаштування'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
