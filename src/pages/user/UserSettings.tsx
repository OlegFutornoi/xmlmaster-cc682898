
// Компонент для відображення та зміни налаштувань користувача
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from '@/components/user/UserAvatar';

const UserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    // Перевірка валідації полів
    if (!username.trim()) {
      toast({
        title: 'Помилка',
        description: 'Ім\'я користувача не може бути пустим',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Оновлюємо тільки username, так як email вимагає підтвердження
      const { error } = await supabase
        .from('users')
        .update({ username })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Успішно',
        description: 'Профіль оновлено',
      });
      
      // Оновлюємо дані користувача в локальному сховищі
      const updatedUser = { ...user, username };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Перезавантажуємо сторінку, щоб оновити дані користувача
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося оновити профіль',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Налаштування</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Налаштування профілю
            </CardTitle>
            <CardDescription>
              Управління особистими даними вашого профілю
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <UserAvatar size="lg" showUpload={true} />
              
              <div className="space-y-4 flex-1">
                <div className="grid gap-2">
                  <Label htmlFor="username">Ім'я користувача</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled={true}
                    title="Зміна email наразі недоступна"
                  />
                  <p className="text-xs text-muted-foreground">
                    Зміна email наразі недоступна
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleUpdateProfile}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Інші налаштування
            </CardTitle>
            <CardDescription>
              Управління додатковими налаштуваннями облікового запису
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              В цьому розділі ви зможете керувати іншими налаштуваннями вашого облікового запису.
              Функціональність буде додана пізніше.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSettings;
