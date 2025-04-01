import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import * as bcrypt from 'bcryptjs';

interface Admin {
  id: string;
  username: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  changeCredentials: (username: string, password: string) => Promise<boolean>;
  addAdmin: (username: string, password: string) => Promise<boolean>;
  removeAdmin: (adminId: string) => Promise<boolean>;
  admins: Admin[];
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider = ({ children }: AdminAuthProviderProps) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const { toast } = useToast();

  // Check for saved admin on initial load
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
      setIsAuthenticated(true);
    }
    
    // Fetch admins if authenticated
    if (isAuthenticated) {
      fetchAdmins();
    }
  }, [isAuthenticated]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('id, username')
        .order('username');

      if (error) {
        throw error;
      }

      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("Admin login attempt with:", { username, passwordLength: password.length });
      
      // Find admin by username
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('*')
        .eq('username', username)
        .single();

      if (adminError) {
        console.error('Admin lookup error:', adminError);
        toast({
          title: "Помилка входу",
          description: "Адміністратора з таким логіном не знайдено",
          variant: "destructive",
        });
        return false;
      }

      if (!adminData) {
        console.log("No admin found with username:", username);
        toast({
          title: "Помилка входу",
          description: "Адміністратора з таким логіном не знайдено",
          variant: "destructive",
        });
        return false;
      }

      console.log("Admin found:", { username: adminData.username, passwordHashLength: adminData.password_hash.length });

      // For debugging purposes only - create a standard hash for admin1/11111111
      // This should match what we have in the database
      const testHash = await bcrypt.hash("11111111", 10);
      console.log("Test hash for '11111111':", testHash);
      console.log("Actual hash in DB:", adminData.password_hash);

      // Verify password - ensure we're comparing the correct values
      const passwordMatch = await bcrypt.compare(password, adminData.password_hash);
      console.log("Password comparison result:", passwordMatch);
      
      if (!passwordMatch) {
        toast({
          title: "Помилка входу",
          description: "Невірний пароль",
          variant: "destructive",
        });
        return false;
      }

      const loggedInAdmin = {
        id: adminData.id,
        username: adminData.username
      };
      
      setAdmin(loggedInAdmin);
      setIsAuthenticated(true);
      localStorage.setItem('admin', JSON.stringify(loggedInAdmin));
      await fetchAdmins();
      return true;
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: "Помилка входу",
        description: "Сталася помилка при спробі входу в систему",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin');
  };

  const changeCredentials = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!admin) {
        throw new Error('Не авторизований');
      }

      // Check if username already exists (except for current admin)
      if (username !== admin.username) {
        const { data: existingAdmin, error: checkError } = await supabase
          .from('administrators')
          .select('id')
          .eq('username', username)
          .maybeSingle();
  
        if (checkError) {
          console.error('Error checking admin:', checkError);
          throw new Error('Помилка перевірки існуючих адміністраторів');
        }
  
        if (existingAdmin) {
          throw new Error('Адміністратор з таким логіном вже існує');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update admin credentials
      const { error } = await supabase
        .from('administrators')
        .update({ 
          username: username,
          password_hash: passwordHash 
        })
        .eq('id', admin.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      const updatedAdmin = { ...admin, username };
      setAdmin(updatedAdmin);
      localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      
      // Refresh admins list
      await fetchAdmins();
      
      toast({
        title: "Дані оновлено",
        description: "Логін та пароль успішно змінено.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Change credentials error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося змінити дані",
        variant: "destructive"
      });
      return false;
    }
  };

  const addAdmin = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check if username already exists
      const { data: existingAdmin, error: checkError } = await supabase
        .from('administrators')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking admin:', checkError);
        throw new Error('Помилка перевірки існуючих адміністраторів');
      }

      if (existingAdmin) {
        throw new Error('Адміністратор з таким логіном вже існує');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new admin
      const { data, error } = await supabase
        .from('administrators')
        .insert([{ username, password_hash: passwordHash }])
        .select();

      if (error) {
        throw error;
      }

      // Refresh admins list
      await fetchAdmins();
      
      toast({
        title: "Адміністратор доданий",
        description: `Адміністратор "${username}" був успішно доданий.`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Add admin error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося додати адміністратора",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeAdmin = async (adminId: string): Promise<boolean> => {
    try {
      // Prevent removing yourself
      if (admin && adminId === admin.id) {
        throw new Error('Ви не можете видалити власний обліковий запис');
      }
      
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', adminId);

      if (error) {
        throw error;
      }
      
      // Refresh admins list
      await fetchAdmins();
      
      toast({
        title: "Адміністратор видалений",
        description: "Адміністратор був успішно видалений.",
      });
      
      return true;
    } catch (error: any) {
      console.error('Remove admin error:', error);
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити адміністратора",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <AdminAuthContext.Provider value={{ 
      admin, 
      isAuthenticated, 
      login, 
      logout, 
      changeCredentials,
      addAdmin,
      removeAdmin,
      admins
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
