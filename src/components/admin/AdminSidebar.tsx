import {
  LayoutDashboard,
  Settings,
  Users,
  CreditCard,
  DollarSign,
  FileCode,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/context/AdminAuthContext";

const AdminSidebar = () => {
  const location = useLocation();
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
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-screen fixed top-0 left-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Admin Panel
        </h1>
      </div>
      <nav className="py-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.title} className="mb-1">
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition duration-200 ${
                    isActive
                      ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                      : ""
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 mt-auto">
        <button
          onClick={logout}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
        >
          Вийти
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
