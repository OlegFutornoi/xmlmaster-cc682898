
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

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

// Initial admin credential
const DEFAULT_ADMIN = {
  username: 'admin',
  password: '1111'
};

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
  const [credentials, setCredentials] = useState({
    username: DEFAULT_ADMIN.username,
    password: DEFAULT_ADMIN.password
  });
  const [admins, setAdmins] = useState<Admin[]>([{ id: '1', username: DEFAULT_ADMIN.username }]);
  const { toast } = useToast();

  // Check for saved admin on initial load
  useEffect(() => {
    const savedAdmin = localStorage.getItem('admin');
    const savedCredentials = localStorage.getItem('adminCredentials');
    const savedAdmins = localStorage.getItem('admins');
    
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
      setIsAuthenticated(true);
    }
    
    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials));
    } else {
      // Save default credentials if none are stored
      localStorage.setItem('adminCredentials', JSON.stringify(credentials));
    }
    
    if (savedAdmins) {
      setAdmins(JSON.parse(savedAdmins));
    } else {
      // Save default admin if none are stored
      localStorage.setItem('admins', JSON.stringify(admins));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check if the provided credentials match
      if (credentials.username === username && credentials.password === password) {
        const adminUser = admins.find(a => a.username === username);
        
        if (adminUser) {
          setAdmin(adminUser);
          setIsAuthenticated(true);
          localStorage.setItem('admin', JSON.stringify(adminUser));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Admin login error:', error);
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
      const newCredentials = { username, password };
      setCredentials(newCredentials);
      localStorage.setItem('adminCredentials', JSON.stringify(newCredentials));
      
      // Update the main admin's username in the admins list
      const updatedAdmins = admins.map(a => 
        a.id === '1' ? { ...a, username } : a
      );
      setAdmins(updatedAdmins);
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));
      
      // Update the current admin if it's the main admin
      if (admin && admin.id === '1') {
        const updatedAdmin = { ...admin, username };
        setAdmin(updatedAdmin);
        localStorage.setItem('admin', JSON.stringify(updatedAdmin));
      }
      
      toast({
        title: "Credentials updated",
        description: "Admin username and password have been updated successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Change credentials error:', error);
      return false;
    }
  };

  const addAdmin = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check if an admin with this username already exists
      if (admins.some(a => a.username === username)) {
        toast({
          title: "Admin already exists",
          description: "An admin with this username already exists.",
          variant: "destructive"
        });
        return false;
      }
      
      const newAdmin = {
        id: Date.now().toString(),
        username,
      };
      
      const updatedAdmins = [...admins, newAdmin];
      setAdmins(updatedAdmins);
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));
      
      toast({
        title: "Admin added",
        description: `Admin "${username}" has been added successfully.`,
      });
      
      return true;
    } catch (error) {
      console.error('Add admin error:', error);
      return false;
    }
  };

  const removeAdmin = async (adminId: string): Promise<boolean> => {
    try {
      // Prevent removing the main admin
      if (adminId === '1') {
        toast({
          title: "Cannot remove main admin",
          description: "The main administrator cannot be removed.",
          variant: "destructive"
        });
        return false;
      }
      
      const updatedAdmins = admins.filter(a => a.id !== adminId);
      setAdmins(updatedAdmins);
      localStorage.setItem('admins', JSON.stringify(updatedAdmins));
      
      toast({
        title: "Admin removed",
        description: "Administrator has been removed successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Remove admin error:', error);
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
