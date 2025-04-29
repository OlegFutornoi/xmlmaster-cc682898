
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as bcrypt from 'bcryptjs';

interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Check for saved user on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Verify if the user is still active
      checkUserStatus(parsedUser.id).then(isActive => {
        if (isActive) {
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          // If user is no longer active, logout
          logout();
          toast({
            title: "Доступ закрито",
            description: "Ваш доступ було деактивовано адміністратором",
            variant: "destructive",
          });
        }
      });
    }
  }, []);

  const checkUserStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking user status:', error);
        return false;
      }

      return data?.is_active || false;
    } catch (error) {
      console.error('Error checking user status:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("User login attempt with:", { email, passwordLength: password.length });
      
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.log("No user found with email:", email);
        toast({
          title: "Помилка входу",
          description: "Користувача з таким email не знайдено",
          variant: "destructive",
        });
        return false;
      }

      console.log("User found:", { email: userData.email, passwordHashLength: userData.password_hash.length });

      // Check if user is active
      if (!userData.is_active) {
        console.log("User account is inactive:", email);
        toast({
          title: "Доступ закрито",
          description: "Ваш обліковий запис ще не активовано адміністратором",
          variant: "destructive",
        });
        return false;
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, userData.password_hash);
      console.log("Password comparison result:", passwordMatch);
      
      if (!passwordMatch) {
        toast({
          title: "Помилка входу",
          description: "Невірний пароль",
          variant: "destructive",
        });
        return false;
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error updating last login:', updateError);
      }

      const loggedInUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        is_active: userData.is_active
      };
      
      setUser(loggedInUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Помилка входу",
        description: "Сталася помилка при спробі входу в систему",
        variant: "destructive",
      });
      return false;
    }
  };

  const assignFreePlan = async (userId: string) => {
    try {
      // Пошук безкоштовного тарифного плану "Демо доступ"
      const { data: freePlan, error: freePlanError } = await supabase
        .from('tariff_plans')
        .select('id')
        .eq('price', 0)
        .maybeSingle();

      if (freePlanError) {
        console.error('Error finding free plan:', freePlanError);
        return;
      }

      // Якщо знайдено безкоштовний план, активуємо його для користувача
      if (freePlan) {
        // Створюємо підписку для користувача
        const { error: subscriptionError } = await supabase
          .from('user_tariff_subscriptions')
          .insert({
            user_id: userId,
            tariff_plan_id: freePlan.id,
            is_active: true,
            // Для безкоштовного плану end_date може бути null
            end_date: null
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        }
      }
    } catch (error) {
      console.error('Error assigning free plan:', error);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking user:', checkError);
        throw new Error('Помилка перевірки існуючих користувачів');
      }

      if (existingUser) {
        throw new Error('Користувач з таким email вже існує');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new user - змінюємо is_active на true
      const { data, error } = await supabase
        .from('users')
        .insert([
          { 
            username, 
            email, 
            password_hash: passwordHash,
            is_active: true // Користувачі тепер відразу активні
          }
        ])
        .select();

      if (error) {
        console.error('Error registering user:', error);
        throw new Error('Помилка при створенні облікового запису');
      }

      // Якщо користувач успішно створений, активуємо для нього безкоштовний план
      if (data && data.length > 0) {
        await assignFreePlan(data[0].id);
      }

      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
