
// Компонент бічної панелі користувача
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Store, 
  Truck, 
  CreditCard, 
  Settings, 
  LogOut,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserSidebarProps {
  hasActiveSubscription: boolean;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ hasActiveSubscription }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/user/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      path: '/user/dashboard',
      icon: Home,
      label: 'Головна',
      requiresSubscription: true,
    },
    {
      path: '/user/dashboard/stores',
      icon: Store,
      label: 'Магазини',
      requiresSubscription: true,
    },
    {
      path: '/user/dashboard/suppliers',
      icon: Truck,
      label: 'Постачальники',
      requiresSubscription: true,
    },
    {
      path: '/user/dashboard/tariffs',
      icon: CreditCard,
      label: 'Тарифи',
      requiresSubscription: false,
    },
    {
      path: '/user/dashboard/settings',
      icon: Settings,
      label: 'Налаштування',
      requiresSubscription: true,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">XML Master</h2>
        <p className="text-sm text-gray-600">Панель користувача</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isBlocked = item.requiresSubscription && !hasActiveSubscription;
          const Icon = item.icon;

          if (isBlocked) {
            return (
              <div
                key={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  "text-gray-400 cursor-not-allowed opacity-60"
                )}
                title="Потрібна активна підписка"
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
                <Lock className="ml-auto h-4 w-4" />
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-emerald-100 text-emerald-900 border-r-2 border-emerald-500"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Вихід
        </Button>
      </div>
    </div>
  );
};

export default UserSidebar;
