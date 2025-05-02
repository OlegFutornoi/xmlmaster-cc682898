
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import SupplierList from '@/components/user/suppliers/SupplierList';
import AddSupplierForm from '@/components/user/suppliers/AddSupplierForm';
import { toast } from 'sonner';

// Компонент сторінки для роботи з постачальниками
const UserSuppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Завантажуємо список постачальників при монтуванні компонента
  useEffect(() => {
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  // Функція для отримання списку постачальників користувача
  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Помилка при завантаженні постачальників:', error);
        toast.error('Не вдалося завантажити список постачальників');
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Помилка:', error);
      toast.error('Сталася помилка при завантаженні данних');
    } finally {
      setIsLoading(false);
    }
  };

  // Функція для додавання нового постачальника
  const addSupplier = async (newSupplier) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...newSupplier,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('Помилка при додаванні постачальника:', error);
        toast.error('Не вдалося додати постачальника');
        return false;
      }
      
      setSuppliers(prevSuppliers => [data, ...prevSuppliers]);
      toast.success('Постачальник успішно доданий');
      return true;
    } catch (error) {
      console.error('Помилка:', error);
      toast.error('Сталася помилка при додаванні постачальника');
      return false;
    }
  };

  // Функція для оновлення постачальника
  const updateSupplier = async (supplierId, updates) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', supplierId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Помилка при оновленні постачальника:', error);
        toast.error('Не вдалося оновити постачальника');
        return false;
      }

      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier => 
          supplier.id === supplierId ? data : supplier
        )
      );
      
      toast.success('Постачальник успішно оновлений');
      return true;
    } catch (error) {
      console.error('Помилка:', error);
      toast.error('Сталася помилка при оновленні постачальника');
      return false;
    }
  };

  // Функція для видалення постачальника
  const deleteSupplier = async (supplierId) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Помилка при видаленні постачальника:', error);
        toast.error('Не вдалося видалити постачальника');
        return false;
      }

      setSuppliers(prevSuppliers => 
        prevSuppliers.filter(supplier => supplier.id !== supplierId)
      );
      
      toast.success('Постачальник успішно видалений');
      return true;
    } catch (error) {
      console.error('Помилка:', error);
      toast.error('Сталася помилка при видаленні постачальника');
      return false;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2" id="suppliers-page-title">Постачальники</h1>
          <p className="text-muted-foreground mb-6">
            Керуйте своїми постачальниками товарів та їх файлами
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-card border rounded-lg shadow-sm">
            <div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Додати нового постачальника</h2>
              <AddSupplierForm onAddSupplier={addSupplier} />
            </div>
          </div>
          
          <div className="bg-card border rounded-lg shadow-sm">
            <div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Список постачальників</h2>
              <SupplierList 
                suppliers={suppliers} 
                isLoading={isLoading}
                onUpdateSupplier={updateSupplier}
                onDeleteSupplier={deleteSupplier}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSuppliers;
