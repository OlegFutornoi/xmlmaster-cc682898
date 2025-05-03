
// Компонент для керування маршрутизацією та темою додатку
import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import UserRoute from '@/components/auth/UserRoute'
import AdminRoute from '@/components/auth/AdminRoute'

// Лейзі імпорт для оптимізації
const Home = lazy(() => import('./pages/Index'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Адмін сторінки
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminTariffs = lazy(() => import('./pages/admin/tariffs/AdminTariffs'))
const AdminCurrencies = lazy(() => import('./pages/admin/tariffs/AdminCurrencies'))
const TariffPlanForm = lazy(() => import('./pages/admin/tariffs/TariffPlanForm'))

// Користувацькі сторінки
const UserHome = lazy(() => import('./pages/user/UserHome'))
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'))
const UserLogin = lazy(() => import('./pages/user/UserLogin'))
const UserSettings = lazy(() => import('./pages/user/UserSettings'))
const UserTariffs = lazy(() => import('./pages/user/UserTariffs'))
const UserStores = lazy(() => import('./pages/user/UserStores'))
const UserRegister = lazy(() => import('./pages/user/UserRegister'))
const UserSuppliers = lazy(() => import('./pages/user/UserSuppliers'))

// Нові сторінки
const SupplierProducts = lazy(() => import('./pages/user/SupplierProducts'))
const ProductDetails = lazy(() => import('./components/user/products/ProductDetails'))

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AdminAuthProvider>
          <AuthProvider>
            <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Завантаження...</div>}>
              <Routes>
                {/* Головна сторінка */}
                <Route path="/" element={<Home />} />

                {/* Сторінки користувача */}
                <Route path="/user/login" element={<UserLogin />} />
                <Route path="/user/register" element={<UserRegister />} />

                {/* Захищені сторінки користувача */}
                <Route path="/user" element={<UserRoute><UserHome /></UserRoute>} />
                <Route path="/user/dashboard/*" element={<UserRoute><UserDashboard /></UserRoute>} />
                <Route path="/user/settings" element={<UserRoute><UserSettings /></UserRoute>} />
                <Route path="/user/tariffs" element={<UserRoute><UserTariffs /></UserRoute>} />
                <Route path="/user/stores" element={<UserRoute><UserStores /></UserRoute>} />
                <Route path="/user/suppliers" element={<UserRoute><UserSuppliers /></UserRoute>} />
                
                {/* Нові маршрути */}
                <Route path="/user/suppliers/:supplierId/products" element={<UserRoute><SupplierProducts /></UserRoute>} />
                <Route path="/user/products/:productId" element={<UserRoute><ProductDetails /></UserRoute>} />

                {/* Сторінки адміна */}
                <Route path="/admin/login" element={<AdminLogin />} />
                
                {/* Захищені сторінки адміна */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
                <Route path="/admin/tariffs" element={<AdminRoute><AdminTariffs /></AdminRoute>} />
                <Route path="/admin/currencies" element={<AdminRoute><AdminCurrencies /></AdminRoute>} />
                <Route path="/admin/tariffs/new" element={<AdminRoute><TariffPlanForm /></AdminRoute>} />
                <Route path="/admin/tariffs/edit/:planId" element={<AdminRoute><TariffPlanForm /></AdminRoute>} />

                {/* Сторінка "Не знайдено" */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </>
  )
}

export default App
