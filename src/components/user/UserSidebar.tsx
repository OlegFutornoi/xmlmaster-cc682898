
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
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const UserSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);

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
              
              if (endDate < now) {
                // Subscription expired - deactivate it
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

  return (
    <div
      className={`h-screen bg-sidebar transition-all duration-300 flex flex-col border-r border-sidebar-border ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
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
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {!isCollapsed && activeSubscription && (
        <div className="p-3 border-b border-sidebar-border bg-blue-50">
          <div className="text-sm font-medium mb-1">Активний тариф:</div>
          <div className="flex flex-col">
            <span className="font-semibold text-blue-700">{activeSubscription.tariff_plans.name}</span>
            {!activeSubscription.tariff_plans.is_permanent && (
              <span className="text-xs text-gray-600 flex items-center mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                До {format(new Date(activeSubscription.end_date), "dd MMMM yyyy", { locale: uk })}
              </span>
            )}
          </div>
        </div>
      )}

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
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="ml-3 truncate">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.username || 'Користувач'}
                </p>
                {user && (
                  <Badge 
                    variant={user.is_active ? "success" : "destructive"} 
                    className="text-xs"
                  >
                    {user.is_active ? 'Активний' : 'Неактивний'}
                  </Badge>
                )}
              </div>
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

export default UserSidebar;
