
// Компонент для відображення панелі керування користувача
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import UserHome from './UserHome';
import UserTariffs from './UserTariffs';
import UserStores from './UserStores';
import UserSettings from './UserSettings';
import UserSuppliers from './UserSuppliers';

const UserDashboard = () => {
  return (
    <div className="flex h-screen">
      <UserSidebar />
      <div className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<UserHome />} />
          <Route path="tariffs" element={<UserTariffs />} />
          <Route path="stores" element={<UserStores />} />
          <Route path="suppliers" element={<UserSuppliers />} />
          <Route path="settings" element={<UserSettings />} />
        </Routes>
      </div>
    </div>
  );
};

export default UserDashboard;
