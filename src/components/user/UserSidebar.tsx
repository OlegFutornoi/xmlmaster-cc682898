
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Menu, 
  LogOut, 
  User, 
  Store, 
  Settings, 
  CreditCard,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

const UserSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(isMobile);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

  useEffect(() => {
    // Автоматично згортати на мобільних пристроях
    setIsCollapsed(isMobile);
  }, [isMobile]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user) {
        try {
          setIsSubscriptionLoading(true);
          const { data, error } = await supabase
            .from('user_tariff_subscriptions')
            .select(`
              id,
              start_date,
              end_date,
              is_active,
              tariff_plans (
                id,
                name,
                price,
                is_permanent,
                duration_days,
                currencies (name, code)
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (error) {
            console.error('Error fetching subscription:', error);
          } else {
            // Check if subscription is expired
            if (data && !data.tariff_plans.is_permanent && data.end_date) {
              const endDate = new Date(data.end_date);
              const now = new Date();
              
              // Враховуємо що час закінчення завжди 23:59:59
              endDate.setHours(23, 59, 59);
              
              if (endDate < now) {
                // Підписка закінчилась - деактивуємо її
                const { error: updateError } = await supabase
                  .from('user_tariff_subscriptions')
                  .update({ is_active: false })
                  .eq('id', data.id);
                
                if (updateError) {
                  console.error('Error deactivating expired subscription:', updateError);
                }
                setActiveSubscription(null);
              } else {
                setActiveSubscription(data);
              }
            } else {
              setActiveSubscription(data);
            }
          }
        } catch (error) {
          console.error('Error:', error);
        } finally {
          setIsSubscriptionLoading(false);
        }
      }
    };

    fetchSubscription();
    // Set up a periodic check for subscription expiration
    const interval = setInterval(fetchSubscription, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  useEffect(() => {
    if (isMobile) {
      // Закриваємо sidebar при зміні маршруту на мобільних пристроях
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/user/login');
  };

  // Redirect to tariffs if no active subscription
  useEffect(() => {
    if (!isSubscriptionLoading && !activeSubscription && location.pathname !== '/user/dashboard/tariffs' && user) {
      navigate('/user/dashboard/tariffs');
    }
  }, [activeSubscription, isSubscriptionLoading, navigate, location.pathname, user]);

  const menuItems = [
    {
      name: 'Дашборд',
      path: '/user/dashboard',
      icon: <Home className="h-5 w-5" />,
      requiresSubscription: true
    },
    {
      name: 'Тарифи',
      path: '/user/dashboard/tariffs',
      icon: <CreditCard className="h-5 w-5" />,
      requiresSubscription: false
    },
    {
      name: 'Магазини',
      path: '/user/dashboard/stores',
      icon: <Store className="h-5 w-5" />,
      requiresSubscription: true
    },
    {
      name: 'Налаштування',
      path: '/user/dashboard/settings',
      icon: <Settings className="h-5 w-5" />,
      requiresSubscription: true
    },
  ];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="font-bold text-sidebar-primary text-lg">XML Master</div>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
            id="close-sidebar-button"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const isDisabled = item.requiresSubscription && !activeSubscription;
            const isActive = location.pathname === item.path || 
                          (item.path === '/user/dashboard' && location.pathname === '/user/dashboard/');
            
            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors 
                  ${isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : isDisabled
                    ? 'text-gray-400 opacity-70'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    navigate('/user/dashboard/tariffs');
                  }
                  if (isMobile) {
                    setIsSidebarOpen(false);
                  }
                }}
                id={`sidebar-link-${item.name.toLowerCase()}`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-2 mb-3">
          <div className="flex items-center">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user?.username || 'Користувач'}
              </p>
            </div>
          </div>
          {user && (
            <Badge 
              variant={user.is_active ? "success" : "destructive"} 
              className="text-xs self-start ml-11"
            >
              {user.is_active ? 'Активний' : 'Неактивний'}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={`w-full flex items-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
          id="logout-button"
        >
          <LogOut className="h-5 w-5 mr-2" />
          <span>Вийти</span>
        </Button>
      </div>
    </div>
  );

  // Мобільна версія з Sheet компонентом
  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 p-4 flex items-center z-20 bg-background border-b">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                id="open-sidebar-button"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full max-w-[280px]">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="ml-4 font-bold">XML Master</div>
        </div>
        <div className="h-16"></div> {/* Відступ для фіксованого хедера */}
      </>
    );
  }

  // Десктопна версія
  return (
    <div
      className={`h-screen bg-sidebar transition-all duration-300 flex flex-col border-r border-sidebar-border ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      id="user-sidebar"
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="font-bold text-sidebar-primary text-lg">XML Master</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
          id="toggle-sidebar-button"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const isDisabled = item.requiresSubscription && !activeSubscription;
            const isActive = location.pathname === item.path || 
                            (item.path === '/user/dashboard' && location.pathname === '/user/dashboard/');
            
            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : isDisabled
                    ? 'text-gray-400 opacity-70'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } ${isCollapsed ? 'justify-center' : ''}`}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault();
                    navigate('/user/dashboard/tariffs');
                  }
                }}
                id={`sidebar-link-${item.name.toLowerCase()}`}
              >
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.username || 'Користувач'}
                </p>
              </div>
            </div>
            {user && (
              <Badge 
                variant={user.is_active ? "success" : "destructive"} 
                className="text-xs self-start ml-11"
              >
                {user.is_active ? 'Активний' : 'Неактивний'}
              </Badge>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          onClick={handleLogout}
          className={`w-full flex ${isCollapsed ? 'justify-center' : ''} items-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
          id="logout-button"
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Вийти</span>}
        </Button>
      </div>
    </div>
  );
};

export default UserSidebar;
