
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Shield, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  username: z.string().min(3, 'Ім\'я користувача повинно містити щонайменше 3 символи'),
  password: z.string().min(4, 'Пароль повинен містити щонайменше 4 символи'),
});

const AdminSettings = () => {
  const { admin, changeCredentials } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      await changeCredentials(values.username, values.password);
      form.reset();
      toast({
        title: "Успішно",
        description: "Облікові дані змінено",
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити облікові дані",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AdminSidebar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Налаштування адміністратора</h2>
            <p className="text-gray-600">Оновіть облікові дані для адміністративного доступу</p>
          </div>

          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="p-8 space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Нове ім'я користувача</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Введіть нове ім'я користувача" 
                            className="h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400" 
                            {...field} 
                            id="username-input"
                          />
                        </FormControl>
                        <FormDescription>
                          Поточне ім'я: <strong>{admin?.username}</strong>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Новий пароль</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Введіть новий пароль" 
                            className="h-12 border-gray-200 focus:border-slate-400 focus:ring-slate-400" 
                            {...field} 
                            id="password-input"
                          />
                        </FormControl>
                        <FormDescription>
                          Пароль повинен містити щонайменше 4 символи
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={isSubmitting}
                    id="submit-button"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                        Збереження...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Зберегти зміни
                      </div>
                    )}
                  </Button>
                </CardContent>
              </form>
            </Form>
          </Card>
          
          {/* Декоративні елементи */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-indigo-500/10 rounded-full blur-lg pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
