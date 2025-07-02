import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
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
  password: z.string().min(4, 'Пароль повинен містити щонайменше 4 символи')
});
const AdminSettings = () => {
  const {
    admin,
    changeCredentials
  } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await changeCredentials(values.username, values.password);
      form.reset();
      toast({
        title: "Успішно",
        description: "Облікові дані змінено"
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити облікові дані",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Налаштування адміністратора</h1>
                
              </div>
            </div>
          </header>
          
          <div className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Зміна облікових даних
                      </CardTitle>
                      <CardDescription>
                        Введіть нові дані для адміністративного доступу
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="username" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Нове ім'я користувача</FormLabel>
                            <FormControl>
                              <Input placeholder="Введіть нове ім'я користувача" {...field} id="username-input" />
                            </FormControl>
                            <FormDescription>
                              Поточне ім'я: <strong>{admin?.username}</strong>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>} />
                      <FormField control={form.control} name="password" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Новий пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Введіть новий пароль" {...field} id="password-input" />
                            </FormControl>
                            <FormDescription>
                              Пароль повинен містити щонайменше 4 символи
                            </FormDescription>
                            <FormMessage />
                          </FormItem>} />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={isSubmitting} id="submit-button" className="w-full">
                        {isSubmitting ? <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                            Збереження...
                          </div> : <div className="flex items-center justify-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Зберегти зміни
                          </div>}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default AdminSettings;