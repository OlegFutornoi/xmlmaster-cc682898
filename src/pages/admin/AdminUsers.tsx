
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';

import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from '@/components/ui/dialog';

const formSchema = z.object({
  username: z.string().min(3, 'Ім\'я користувача повинно містити щонайменше 3 символи'),
  password: z.string().min(4, 'Пароль повинен містити щонайменше 4 символи'),
});

const AdminUsers = () => {
  const { admins, addAdmin, removeAdmin } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      await addAdmin(values.username, values.password);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (adminId: string) => {
    setAdminToDelete(adminId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (adminToDelete) {
      await removeAdmin(adminToDelete);
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Управління адміністраторами</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Додати нового адміністратора</CardTitle>
              <CardDescription>
                Створіть обліковий запис для нового адміністратора
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
                        <FormLabel>Ім'я користувача</FormLabel>
                        <FormControl>
                          <Input placeholder="Введіть ім'я користувача" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Пароль</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Введіть пароль" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Додавання..." : "Додати адміністратора"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Список адміністраторів</CardTitle>
              <CardDescription>
                Управління існуючими адміністраторами
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Ім'я користувача</TableHead>
                    <TableHead className="text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.id}</TableCell>
                      <TableCell>{admin.username}</TableCell>
                      <TableCell className="text-right">
                        {admin.id !== '1' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(admin.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Видалити адміністратора?</DialogTitle>
              <DialogDescription>
                Ця дія видалить обліковий запис адміністратора. Цю дію неможливо відмінити.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Скасувати
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Видалити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminUsers;
