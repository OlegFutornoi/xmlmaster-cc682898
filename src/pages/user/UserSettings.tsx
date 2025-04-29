
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const UserSettings = () => {
  useEffect(() => {
    console.log('UserSettings component mounted');
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Налаштування</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Налаштування профілю
          </CardTitle>
          <CardDescription>
            Управління налаштуваннями вашого акаунту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            В цьому розділі ви можете змінити налаштування вашого профілю,
            включаючи особисту інформацію, параметри облікового запису та інші опції.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettings;
