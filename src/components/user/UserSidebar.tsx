
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Store, Package, Settings, LogOut, Menu, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserSidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);

  // При зміні розміру вікна до мобільного, згортаємо меню
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  // Закриваємо меню при виборі пункту меню в мобільному режимі
  const handleMenuItemClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  // Отримуємо ініціали користувача для аватара
  const getUserInitials = () => {
    if (!user || !user.email) return '?';
    
    // Спробуємо отримати ініціали з email
    const emailParts = user.email.split('@')[0].split('.');
    if (emailParts.length > 1) {
      return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
    }
    
    // Якщо email не містить крапки, повертаємо першу літеру
    return user.email[0].toUpperCase();
  };

  // Меню займає всю висоту в мобільній версії
  const sidebarClasses = `
    ${collapsed ? 'w-[60px]' : isMobile ? 'w-full fixed z-50 bg-background' : 'w-64'} 
    flex flex-col justify-between
    h-screen border-r transition-all duration-300
  `;

  return (
    <div className={sidebarClasses}>
      <div>
        <div className="flex items-center justify-between p-4">
          <span className={`font-bold ${collapsed ? 'hidden' : 'block'}`}>Кабінет користувача</span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
            id="sidebar-toggle"
          >
            {isMobile ? (
              collapsed ? <Menu /> : <X />
            ) : (
              collapsed ? <ChevronRight /> : <ChevronLeft />
            )}
          </Button>
        </div>

        <div className="mt-4 px-2">
          <NavLink 
            to="/user/dashboard" 
            end 
            className={({ isActive }) => `
              flex items-center py-2 px-4 rounded-md mb-1
              ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={handleMenuItemClick}
          >
            <Home className="h-5 w-5" />
            <span className={collapsed ? 'hidden' : 'ml-3'}>Головна</span>
          </NavLink>

          <NavLink 
            to="/user/dashboard/stores" 
            className={({ isActive }) => `
              flex items-center py-2 px-4 rounded-md mb-1
              ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={handleMenuItemClick}
          >
            <Store className="h-5 w-5" />
            <span className={collapsed ? 'hidden' : 'ml-3'}>Магазини</span>
          </NavLink>

          <NavLink 
            to="/user/dashboard/suppliers" 
            className={({ isActive }) => `
              flex items-center py-2 px-4 rounded-md mb-1
              ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={handleMenuItemClick}
          >
            <Package className="h-5 w-5" />
            <span className={collapsed ? 'hidden' : 'ml-3'}>Постачальники</span>
          </NavLink>

          <NavLink 
            to="/user/dashboard/tariffs" 
            className={({ isActive }) => `
              flex items-center py-2 px-4 rounded-md mb-1
              ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={handleMenuItemClick}
          >
            <svg className="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M18 9V3H12" />
              <path d="M18 3l-8 8" />
              <circle cx="9" cy="15" r="2" />
              <circle cx="15" cy="9" r="2" />
            </svg>
            <span className={collapsed ? 'hidden' : 'ml-3'}>Тарифи</span>
          </NavLink>

          <NavLink 
            to="/user/dashboard/settings" 
            className={({ isActive }) => `
              flex items-center py-2 px-4 rounded-md mb-1
              ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
            `}
            onClick={handleMenuItemClick}
          >
            <Settings className="h-5 w-5" />
            <span className={collapsed ? 'hidden' : 'ml-3'}>Налаштування</span>
          </NavLink>
        </div>
      </div>

      <div className="mb-4 px-2">
        {/* Інформація про користувача */}
        <div className={`border-t pt-2 mb-2 ${collapsed ? 'text-center' : 'px-4'}`}>
          <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-2'}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      
        <button 
          onClick={logout}
          className="flex w-full items-center py-2 px-4 rounded-md text-red-500 hover:bg-red-50"
          id="logout-button"
        >
          <LogOut className="h-5 w-5" />
          <span className={collapsed ? 'hidden' : 'ml-3'}>Вихід</span>
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
