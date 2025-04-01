
import { Routes, Route } from 'react-router-dom';
import UserSidebar from '@/components/user/UserSidebar';
import { useAuth } from '@/context/AuthContext';
import UserHome from './UserHome';

const UserDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen">
      <UserSidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<UserHome />} />
        </Routes>
      </div>
    </div>
  );
};

export default UserDashboard;
