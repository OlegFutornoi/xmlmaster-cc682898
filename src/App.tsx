
// Файл App.tsx - Головний компонент додатку
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { AuthProvider } from "./context/AuthContext";

// Public pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// User pages
import UserLogin from "./pages/user/UserLogin";
import UserRegister from "./pages/user/UserRegister";
import UserDashboard from "./pages/user/UserDashboard";
import UserRoute from "./components/auth/UserRoute";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoute from "./components/auth/AdminRoute";

// Tariff pages
import AdminTariffs from "./pages/admin/tariffs/AdminTariffs";
import AdminCurrencies from "./pages/admin/tariffs/AdminCurrencies";
import TariffPlanForm from "./pages/admin/tariffs/TariffPlanForm";

// XML Template pages
import AdminXMLTemplates from "./pages/admin/xml-templates/AdminXMLTemplates";
import XMLTemplateEditor from "./pages/admin/xml-templates/XMLTemplateEditor";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            
            {/* User routes */}
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route 
              path="/user/dashboard/*" 
              element={
                <UserRoute>
                  <UserDashboard />
                </UserRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } 
            />
            
            {/* Tariff routes */}
            <Route 
              path="/admin/tariffs" 
              element={
                <AdminRoute>
                  <AdminTariffs />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/tariffs/currencies" 
              element={
                <AdminRoute>
                  <AdminCurrencies />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/tariffs/new" 
              element={
                <AdminRoute>
                  <TariffPlanForm />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/tariffs/:id" 
              element={
                <AdminRoute>
                  <TariffPlanForm />
                </AdminRoute>
              } 
            />
            
            {/* XML Template routes */}
            <Route 
              path="/admin/xml-templates" 
              element={
                <AdminRoute>
                  <AdminXMLTemplates />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/xml-templates/:id" 
              element={
                <AdminRoute>
                  <XMLTemplateEditor />
                </AdminRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
