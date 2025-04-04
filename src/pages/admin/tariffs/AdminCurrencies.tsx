
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash, Check, X, DollarSign } from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminCurrencies = () => {
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    exchange_rate: '0',
    is_active: true
  });
  const [editCurrency, setEditCurrency] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('is_base', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching currencies:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: "Не вдалося завантажити валюти."
        });
      } else {
        setCurrencies(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCurrency = async () => {
    if (!newCurrency.code || !newCurrency.name || !newCurrency.exchange_rate) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, заповніть всі поля."
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('currencies')
        .insert([
          {
            code: newCurrency.code.toUpperCase(),
            name: newCurrency.name,
            exchange_rate: parseFloat(newCurrency.exchange_rate),
            is_active: newCurrency.is_active
          }
        ])
        .select();

      if (error) {
        console.error('Error creating currency:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося створити валюту."
        });
      } else {
        toast({
          title: "Успіх",
          description: "Валюту успішно створено."
        });
        setNewCurrency({
          code: '',
          name: '',
          exchange_rate: '0',
          is_active: true
        });
        fetchCurrencies();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateCurrency = async () => {
    if (!editCurrency || !editCurrency.code || !editCurrency.name || !editCurrency.exchange_rate) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, заповніть всі поля."
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('currencies')
        .update({
          code: editCurrency.code.toUpperCase(),
          name: editCurrency.name,
          exchange_rate: parseFloat(editCurrency.exchange_rate.toString()),
          is_active: editCurrency.is_active
        })
        .eq('id', editCurrency.id);

      if (error) {
        console.error('Error updating currency:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося оновити валюту."
        });
      } else {
        toast({
          title: "Успіх",
          description: "Валюту успішно оновлено."
        });
        setEditCurrency(null);
        fetchCurrencies();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteCurrency = async (id) => {
    try {
      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting currency:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося видалити валюту."
        });
      } else {
        toast({
          title: "Успіх",
          description: "Валюту успішно видалено."
        });
        fetchCurrencies();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Валюти</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/tariffs')}>
              Тарифні плани
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати валюту
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Додати нову валюту</DialogTitle>
                  <DialogDescription>
                    Заповніть інформацію про нову валюту.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">
                      Код
                    </Label>
                    <Input
                      id="code"
                      placeholder="USD"
                      className="col-span-3"
                      value={newCurrency.code}
                      onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value})}
                      maxLength={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Назва
                    </Label>
                    <Input
                      id="name"
                      placeholder="Долар США"
                      className="col-span-3"
                      value={newCurrency.name}
                      onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rate" className="text-right">
                      Курс
                    </Label>
                    <Input
                      id="rate"
                      type="number"
                      placeholder="38.00"
                      step="0.01"
                      min="0"
                      className="col-span-3"
                      value={newCurrency.exchange_rate}
                      onChange={(e) => setNewCurrency({...newCurrency, exchange_rate: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">
                      Активна
                    </Label>
                    <Switch
                      id="active"
                      checked={newCurrency.is_active}
                      onCheckedChange={(checked) => setNewCurrency({...newCurrency, is_active: checked})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Скасувати</Button>
                  </DialogClose>
                  <Button onClick={handleCreateCurrency}>Створити</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Завантаження...</p>
          </div>
        ) : currencies.length > 0 ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Назва</TableHead>
                    <TableHead>Курс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-[150px]">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((currency) => (
                    <TableRow key={currency.id}>
                      <TableCell>{currency.code}</TableCell>
                      <TableCell>{currency.name}</TableCell>
                      <TableCell>{currency.exchange_rate}</TableCell>
                      <TableCell>
                        {currency.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <Check className="mr-1 h-3 w-3" />
                            Активна
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            <X className="mr-1 h-3 w-3" />
                            Неактивна
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => setEditCurrency(currency)}
                                disabled={currency.is_base}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            {editCurrency && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Редагувати валюту</DialogTitle>
                                  <DialogDescription>
                                    Змініть інформацію про валюту.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-code" className="text-right">
                                      Код
                                    </Label>
                                    <Input
                                      id="edit-code"
                                      placeholder="USD"
                                      className="col-span-3"
                                      value={editCurrency.code}
                                      onChange={(e) => setEditCurrency({...editCurrency, code: e.target.value})}
                                      maxLength={3}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">
                                      Назва
                                    </Label>
                                    <Input
                                      id="edit-name"
                                      placeholder="Долар США"
                                      className="col-span-3"
                                      value={editCurrency.name}
                                      onChange={(e) => setEditCurrency({...editCurrency, name: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-rate" className="text-right">
                                      Курс
                                    </Label>
                                    <Input
                                      id="edit-rate"
                                      type="number"
                                      placeholder="38.00"
                                      step="0.01"
                                      min="0"
                                      className="col-span-3"
                                      value={editCurrency.exchange_rate}
                                      onChange={(e) => setEditCurrency({...editCurrency, exchange_rate: e.target.value})}
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-active" className="text-right">
                                      Активна
                                    </Label>
                                    <Switch
                                      id="edit-active"
                                      checked={editCurrency.is_active}
                                      onCheckedChange={(checked) => setEditCurrency({...editCurrency, is_active: checked})}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Скасувати</Button>
                                  </DialogClose>
                                  <Button onClick={handleUpdateCurrency}>Зберегти</Button>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="text-red-500" 
                                disabled={currency.is_base}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Ви впевнені, що хочете видалити цю валюту?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ця дія не може бути скасована. Всі тарифні плани, пов'язані з цією валютою, будуть видалені.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="bg-red-500 hover:bg-red-600" 
                                  onClick={() => handleDeleteCurrency(currency.id)}
                                >
                                  Видалити
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                Немає валют. Додайте нову валюту.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати валюту
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* Content same as above, omitted for brevity */}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminCurrencies;
