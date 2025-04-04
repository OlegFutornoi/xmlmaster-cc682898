
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Home, Menu, LogOut, Settings, Users, User, DollarSign } from 'lucide-react';

const AdminSidebar = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Користувачі',
      path: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: 'Тарифи',
      path: '/admin/tariffs',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: 'Налаштування',
      path: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div
      className={`h-screen bg-sidebar transition-all duration-300 flex flex-col border-r border-sidebar-border ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="font-bold text-sidebar-primary text-lg">Кабінет Адміна</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {item.icon}
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-sidebar-foreground">
                {admin?.username || 'Admin'}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Вихід</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
