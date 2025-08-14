
// Компонент бокового меню користувача
import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface UserAppSidebarProps {
  hasActiveSubscription: boolean;
}

export const UserAppSidebar: React.FC<UserAppSidebarProps> = ({ hasActiveSubscription }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
      requiresSubscription: false,
    },
    {
      path: '/user/dashboard/tariffs',
      icon: CreditCard,
      label: 'Тарифи',
      requiresSubscription: false,
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
      path: '/user/dashboard/settings',
      icon: Settings,
      label: 'Налаштування',
      requiresSubscription: true,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        {/* Header */}
        {!collapsed && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">XML Master</h2>
            <p className="text-sm text-gray-600">Панель користувача</p>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Навігація
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isItemActive = isActive(item.path);
                const isBlocked = item.requiresSubscription && !hasActiveSubscription;
                const Icon = item.icon;

                if (isBlocked) {
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        className="text-gray-400 cursor-not-allowed opacity-60"
                        title="Потрібна активна підписка"
                        disabled
                        id={`nav-${item.label.toLowerCase().replace(' ', '-')}-button`}
                      >
                        <Icon className="h-5 w-5" />
                        {!collapsed && (
                          <>
                            <span>{item.label}</span>
                            <Lock className="ml-auto h-4 w-4" />
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isItemActive}
                      id={`nav-${item.label.toLowerCase().replace(' ', '-')}-button`}
                    >
                      <NavLink to={item.path}>
                        <Icon className="h-5 w-5" />
                        {!collapsed && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="bg-white border-t border-gray-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              id="logout-button"
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Вихід</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
