
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home, Store, Package, Settings, LogOut, Menu, X, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const UserSidebar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const handleMenuItemClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const getUserInitials = () => {
    if (!user || !user.email) return '?';
    
    const emailParts = user.email.split('@')[0].split('.');
    if (emailParts.length > 1) {
      return (emailParts[0][0] + emailParts[1][0]).toUpperCase();
    }
    
    return user.email[0].toUpperCase();
  };

  const sidebarClasses = `
    ${collapsed ? 'w-[60px]' : isMobile ? 'w-full fixed z-50 bg-white shadow-xl' : 'w-64'} 
    flex flex-col justify-between
    h-screen border-r border-gray-200 bg-white transition-all duration-300
  `;

  const menuItems = [
    { to: "/user/dashboard", end: true, icon: Home, label: "Головна" },
    { to: "/user/dashboard/stores", icon: Store, label: "Магазини" },
    { to: "/user/dashboard/suppliers", icon: Package, label: "Постачальники" },
    { to: "/user/dashboard/tariffs", icon: CreditCard, label: "Тарифи" },
    { to: "/user/dashboard/settings", icon: Settings, label: "Налаштування" }
  ];

  return (
    <div className={sidebarClasses}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="font-semibold text-gray-900">XML Master</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hover:bg-gray-100"
            id="sidebar-toggle"
          >
            {isMobile ? (
              collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />
            ) : (
              collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="mt-6 px-3">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavLink 
                key={item.to}
                to={item.to} 
                end={item.end} 
                className={({ isActive }) => `
                  flex items-center px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                onClick={handleMenuItemClick}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-gray-100">
        {!collapsed && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Активний користувач</p>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={logout}
          className={`flex w-full items-center px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          id="logout-button"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3 font-medium">Вихід</span>}
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
