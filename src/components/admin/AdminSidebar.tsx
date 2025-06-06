
import {
  LayoutDashboard,
  Settings,
  Users,
  CreditCard,
  DollarSign,
  FileCode,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const AdminSidebar = () => {
  const { logout } = useAdminAuth();

  const menuItems = [
    {
      title: "Головна",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      title: "Користувачі",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Тарифні плани",
      icon: CreditCard,
      href: "/admin/tariffs",
    },
    {
      title: "Валюти",
      icon: DollarSign,
      href: "/admin/tariffs/currencies",
    },
    {
      title: "Шаблони XML",
      icon: FileCode,
      href: "/admin/xml-templates",
    },
    {
      title: "Налаштування",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h1 className="text-2xl font-bold text-sidebar-foreground">
          Admin Panel
        </h1>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навігація</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.href}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <Button
          onClick={logout}
          variant="destructive"
          className="w-full"
          id="logout-button"
        >
          Вийти
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
