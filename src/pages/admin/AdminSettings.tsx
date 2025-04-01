
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

const formSchema = z.object({
  username: z.string().min(3, 'Ім\'я користувача повинно містити щонайменше 3 символи'),
  password: z.string().min(4, 'Пароль повинен містити щонайменше 4 символи'),
});

const AdminSettings = () => {
  const { admin, changeCredentials } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Налаштування</h1>
        
        <div className="max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Зміна облікових даних</CardTitle>
              <CardDescription>
                Оновіть ім'я користувача та пароль для адміністративного доступу
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Нове ім'я користувача</FormLabel>
                        <FormControl>
                          <Input placeholder="Введіть нове ім'я користувача" {...field} />
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
                        <FormLabel>Новий пароль</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Введіть новий пароль" {...field} />
                        </FormControl>
                        <FormDescription>
                          Пароль повинен містити щонайменше 4 символи
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Збереження..." : "Зберегти зміни"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
