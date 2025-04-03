
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';

const TariffPlanForm = () => {
  const { id } = useParams();
  const isEdit = id !== 'new';
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currencies, setCurrencies] = useState([]);
  const [tariffItems, setTariffItems] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    currency_id: '',
    duration_days: '',
    is_permanent: false
  });
  
  const [newItem, setNewItem] = useState({
    description: '',
    existingItemId: ''
  });
  
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .eq('is_active', true)
          .order('is_base', { ascending: false });
          
        if (error) {
          console.error('Error fetching currencies:', error);
          toast({
            variant: "destructive",
            title: "Помилка",
            description: "Не вдалося завантажити валюти."
          });
        } else {
          setCurrencies(data || []);
          if (data && data.length > 0 && !formData.currency_id) {
            setFormData(prev => ({
              ...prev,
              currency_id: data.find(c => c.is_base)?.id || data[0].id
            }));
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    const fetchTariffItems = async () => {
      try {
        const { data, error } = await supabase
          .from('tariff_items')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching tariff items:', error);
        } else {
          setTariffItems(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    const fetchTariffPlan = async () => {
      if (!isEdit) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('tariff_plans')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching tariff plan:', error);
          toast({
            variant: "destructive",
            title: "Помилка",
            description: "Не вдалося завантажити тарифний план."
          });
          navigate('/admin/tariffs');
        } else if (data) {
          setFormData({
            name: data.name,
            price: data.price,
            currency_id: data.currency_id,
            duration_days: data.duration_days || '',
            is_permanent: data.is_permanent || false
          });
          
          const { data: itemsData, error: itemsError } = await supabase
            .from('tariff_plan_items')
            .select(`
              id,
              is_active,
              tariff_items (
                id,
                description
              )
            `)
            .eq('tariff_plan_id', id)
            .order('created_at', { ascending: false });
            
          if (itemsError) {
            console.error('Error fetching tariff plan items:', itemsError);
          } else {
            setPlanItems(itemsData || []);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCurrencies();
    fetchTariffItems();
    fetchTariffPlan();
  }, [id, isEdit, navigate, toast]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckboxChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_permanent: checked
    }));
  };
  
  const handleCurrencyChange = (value) => {
    setFormData(prev => ({
      ...prev,
      currency_id: value
    }));
  };
  
  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.currency_id) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, заповніть всі обов'язкові поля."
      });
      return;
    }
    
    // Validate duration_days if not permanent
    if (!formData.is_permanent && (!formData.duration_days || parseInt(formData.duration_days) <= 0)) {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, вкажіть термін дії тарифу в днях або виберіть опцію 'Постійний доступ'."
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      let planId = id;
      
      if (!isEdit) {
        // Create new tariff plan
        const { data, error } = await supabase
          .from('tariff_plans')
          .insert([
            {
              name: formData.name,
              price: parseFloat(formData.price),
              currency_id: formData.currency_id,
              duration_days: formData.is_permanent ? null : parseInt(formData.duration_days),
              is_permanent: formData.is_permanent
            }
          ])
          .select();
          
        if (error) {
          console.error('Error creating tariff plan:', error);
          toast({
            variant: "destructive",
            title: "Помилка",
            description: error.message || "Не вдалося створити тарифний план."
          });
          setIsSaving(false);
          return;
        }
        
        planId = data[0].id;
        
        toast({
          title: "Успіх",
          description: "Тарифний план успішно створено."
        });
      } else {
        // Update existing tariff plan
        const { error } = await supabase
          .from('tariff_plans')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            currency_id: formData.currency_id,
            duration_days: formData.is_permanent ? null : parseInt(formData.duration_days),
            is_permanent: formData.is_permanent
          })
          .eq('id', id);
          
        if (error) {
          console.error('Error updating tariff plan:', error);
          toast({
            variant: "destructive",
            title: "Помилка",
            description: error.message || "Не вдалося оновити тарифний план."
          });
          setIsSaving(false);
          return;
        }
        
        toast({
          title: "Успіх",
          description: "Тарифний план успішно оновлено."
        });
      }
      
      navigate(`/admin/tariffs/${planId}`);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Сталася помилка при збереженні тарифного плану."
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddItem = async () => {
    let itemId;
    
    if (newItem.existingItemId) {
      itemId = newItem.existingItemId;
    } else if (newItem.description) {
      try {
        const { data, error } = await supabase
          .from('tariff_items')
          .insert([
            {
              description: newItem.description
            }
          ])
          .select();
          
        if (error) {
          console.error('Error creating tariff item:', error);
          toast({
            variant: "destructive",
            title: "Помилка",
            description: error.message || "Не вдалося створити пункт тарифу."
          });
          return;
        }
        
        itemId = data[0].id;
        
        // Update tariffItems state
        setTariffItems(prev => [data[0], ...prev]);
      } catch (error) {
        console.error('Error:', error);
        return;
      }
    } else {
      toast({
        variant: "destructive",
        title: "Помилка",
        description: "Будь ласка, виберіть існуючий пункт або введіть новий."
      });
      return;
    }
    
    // Add item to tariff plan
    try {
      const { data, error } = await supabase
        .from('tariff_plan_items')
        .insert([
          {
            tariff_plan_id: id,
            tariff_item_id: itemId,
            is_active: true
          }
        ])
        .select(`
          id,
          is_active,
          tariff_items (
            id,
            description
          )
        `);
        
      if (error) {
        console.error('Error adding item to tariff plan:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося додати пункт до тарифного плану."
        });
      } else {
        setPlanItems(prev => [data[0], ...prev]);
        setNewItem({
          description: '',
          existingItemId: ''
        });
        toast({
          title: "Успіх",
          description: "Пункт успішно додано до тарифного плану."
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleToggleItemActive = async (id, currentValue) => {
    try {
      const { error } = await supabase
        .from('tariff_plan_items')
        .update({
          is_active: !currentValue
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error toggling item active state:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося змінити статус пункту."
        });
      } else {
        setPlanItems(prev => 
          prev.map(item => 
            item.id === id ? { ...item, is_active: !currentValue } : item
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const handleDeleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('tariff_plan_items')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting tariff plan item:', error);
        toast({
          variant: "destructive",
          title: "Помилка",
          description: error.message || "Не вдалося видалити пункт з тарифного плану."
        });
      } else {
        setPlanItems(prev => prev.filter(item => item.id !== id));
        toast({
          title: "Успіх",
          description: "Пункт успішно видалено з тарифного плану."
        });
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
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Редагувати тарифний план' : 'Створити тарифний план'}
          </h1>
          <Button variant="outline" onClick={() => navigate('/admin/tariffs')}>
            Назад до тарифів
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <p>Завантаження...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Інформація про тариф</CardTitle>
                <CardDescription>
                  Заповніть основну інформацію про тарифний план.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Назва тарифного плану</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Базовий тариф"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Валюта</Label>
                    <Select
                      value={formData.currency_id}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Виберіть валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem 
                            key={currency.id} 
                            value={currency.id}
                          >
                            {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Ціна</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="100.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id="is_permanent" 
                        checked={formData.is_permanent} 
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label htmlFor="is_permanent" className="cursor-pointer">
                        Постійний доступ
                      </Label>
                    </div>
                    <Label htmlFor="duration_days">Термін дії (днів)</Label>
                    <Input
                      id="duration_days"
                      name="duration_days"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.duration_days}
                      onChange={handleInputChange}
                      placeholder="30"
                      disabled={formData.is_permanent}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Збереження...' : (isEdit ? 'Зберегти зміни' : 'Створити тариф')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {isEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Пункти тарифного плану</CardTitle>
                  <CardDescription>
                    Додайте пункти, які входять в тарифний план.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="existingItem">Вибрати існуючий пункт</Label>
                      <Select
                        value={newItem.existingItemId}
                        onValueChange={(value) => {
                          setNewItem({
                            description: '',
                            existingItemId: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть пункт" />
                        </SelectTrigger>
                        <SelectContent>
                          {tariffItems.map(item => (
                            <SelectItem 
                              key={item.id} 
                              value={item.id}
                            >
                              {item.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full md:w-1/4 mt-6">
                      <p className="text-center">або</p>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="newItem">Новий пункт</Label>
                      <Textarea
                        id="newItem"
                        value={newItem.description}
                        onChange={(e) => {
                          setNewItem({
                            description: e.target.value,
                            existingItemId: ''
                          });
                        }}
                        placeholder="Опис нового пункту тарифу"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Додати
                      </Button>
                    </div>
                  </div>
                  
                  {planItems.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Опис</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="w-[100px]">Дії</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.tariff_items.description}</TableCell>
                            <TableCell>
                              <Switch
                                checked={item.is_active}
                                onCheckedChange={() => handleToggleItemActive(item.id, item.is_active)}
                              />
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="text-red-500"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Ви впевнені, що хочете видалити цей пункт?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Цей пункт буде видалено з тарифного плану. Сам пункт залишиться в базі для використання в інших тарифах.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                                    <AlertDialogAction 
                                      className="bg-red-500 hover:bg-red-600" 
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      Видалити
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      Немає жодних пунктів у цьому тарифному плані. Додайте пункти вище.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TariffPlanForm;
