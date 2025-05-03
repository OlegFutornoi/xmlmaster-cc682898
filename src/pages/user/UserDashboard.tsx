
// Компонент головної сторінки панелі керування користувача
import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import UserStores from './UserStores';
import UserSettings from './UserSettings';
import UserTariffs from './UserTariffs';
import UserSuppliers from './UserSuppliers';

// Головний компонент панелі керування користувача
const UserDashboard = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Бокова панель */}
      <UserSidebar />
      
      {/* Основний контент */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/user/dashboard/tariffs" replace />} />
            <Route path="tariffs" element={<UserTariffs />} />
            <Route path="stores" element={<UserStores />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="suppliers" element={<UserSuppliers />} />
            <Route path="suppliers/*" element={<Outlet />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
