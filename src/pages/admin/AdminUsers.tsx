import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserCheck, UserX } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import UserInfoDrawer from '@/components/admin/UserInfoDrawer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
type User = {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};
const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToToggleAccess, setUserToToggleAccess] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false);
  const rowsPerPage = 10;
  const {
    toast
  } = useToast();
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Calculate range for pagination
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      const {
        data,
        error,
        count
      } = await supabase.from('users').select('*', {
        count: 'exact'
      }).range(from, to).order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      if (count !== null) {
        setTotalPages(Math.ceil(count / rowsPerPage));
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося отримати список користувачів',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, [page]);
  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };
  const handleToggleAccessClick = (user: User) => {
    setUserToToggleAccess(user);
    setIsAccessDialogOpen(true);
  };
  const handleUserNameClick = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setIsUserInfoOpen(true);
  };
  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const {
        error
      } = await supabase.from('users').delete().eq('id', userToDelete);
      if (error) {
        throw error;
      }
      toast({
        title: 'Успішно',
        description: 'Користувача видалено'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити користувача',
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };
  const confirmToggleAccess = async () => {
    if (!userToToggleAccess) return;
    try {
      const newStatus = !userToToggleAccess.is_active;
      const {
        error
      } = await supabase.from('users').update({
        is_active: newStatus
      }).eq('id', userToToggleAccess.id);
      if (error) {
        throw error;
      }
      toast({
        title: 'Успішно',
        description: newStatus ? 'Доступ користувача активовано' : 'Доступ користувача деактивовано'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user access:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося змінити статус користувача',
        variant: 'destructive'
      });
    } finally {
      setIsAccessDialogOpen(false);
      setUserToToggleAccess(null);
    }
  };
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ніколи';
    return new Date(dateString).toLocaleString('uk-UA');
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 px-[10px] md:text-xl">
                Управління користувачами
              </h1>
              
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle>Список користувачів</CardTitle>
                <CardDescription>
                  Управління зареєстрованими користувачами
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center p-8">
                    <p>Завантаження...</p>
                  </div> : users.length === 0 ? <div className="text-center p-8">
                    <p>Немає зареєстрованих користувачів</p>
                  </div> : <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ім'я користувача</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Дата реєстрації</TableHead>
                          <TableHead>Останній вхід</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="text-right">Дії</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => <TableRow key={user.id}>
                            <TableCell>
                              <button onClick={() => handleUserNameClick(user.id, user.username)} className="text-blue-600 hover:underline" id={`user-name-${user.id}`}>
                                {user.username}
                              </button>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>{formatDate(user.last_login)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {user.is_active ? 'Активний' : 'Неактивний'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleToggleAccessClick(user)} className={user.is_active ? 'text-yellow-600' : 'text-green-600'} id={`toggle-access-${user.id}`}>
                                  {user.is_active ? <>
                                      <UserX className="h-4 w-4 mr-1" />
                                      Закрити доступ
                                    </> : <>
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Відкрити доступ
                                    </>}
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(user.id)} id={`delete-user-${user.id}`}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Видалити
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>)}
                      </TableBody>
                    </Table>
                    
                    {totalPages > 1 && <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={page <= 1 ? 'pointer-events-none opacity-50' : ''} />
                            </PaginationItem>
                            
                            {[...Array(totalPages)].map((_, i) => <PaginationItem key={i}>
                                <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>)}
                            
                            <PaginationItem>
                              <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={page >= totalPages ? 'pointer-events-none opacity-50' : ''} />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>}
                  </>}
              </CardContent>
            </Card>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Видалити користувача?</DialogTitle>
                <DialogDescription>
                  Ця дія видалить обліковий запис користувача. Цю дію неможливо відмінити.
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
          
          {/* Access Toggle Dialog */}
          <Dialog open={isAccessDialogOpen} onOpenChange={setIsAccessDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {userToToggleAccess?.is_active ? 'Закрити доступ користувачу?' : 'Відкрити доступ користувачу?'}
                </DialogTitle>
                <DialogDescription>
                  {userToToggleAccess?.is_active ? 'Користувач більше не зможе увійти в систему.' : 'Користувач отримає доступ до системи.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAccessDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button variant={userToToggleAccess?.is_active ? 'destructive' : 'default'} onClick={confirmToggleAccess}>
                  {userToToggleAccess?.is_active ? 'Закрити доступ' : 'Відкрити доступ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* User Info Drawer */}
          <UserInfoDrawer userId={selectedUserId} userName={selectedUserName} isOpen={isUserInfoOpen} onClose={() => setIsUserInfoOpen(false)} />
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default AdminUsers;