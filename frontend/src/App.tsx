import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import GuestDashboard from './pages/GuestCabinet/GuestDashboard';
import MyBookingsPage from './pages/GuestCabinet/MyBookingsPage';
import BrowseRoomsPage from './pages/GuestCabinet/BrowseRoomsPage';
import RoomDetailsPage from './pages/GuestCabinet/RoomDetailsPage';
import MyProfilePage from './pages/GuestCabinet/MyProfilePage';
import AdminDashboard from './pages/AdminCabinet/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected: any authenticated user */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/rooms"
          element={
            <ProtectedRoute>
              <BrowseRoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/rooms/:id"
          element={
            <ProtectedRoute>
              <RoomDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/profile"
          element={
            <ProtectedRoute>
              <MyProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Protected: admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
