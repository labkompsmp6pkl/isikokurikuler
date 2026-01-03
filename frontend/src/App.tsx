import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import NationalAnalysis from './pages/dashboards/NationalAnalysis';
import UserManagement from './pages/dashboards/admin/UserManagement';
import UserDetail from './pages/dashboards/admin/UserDetail';
import ClassManagement from './pages/dashboards/admin/ClassManagement';

// Other Roles
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ContributorDashboard from './pages/dashboards/ContributorDashboard';

// Student Structure
import StudentLayout from './pages/dashboards/student/StudentLayout';
import Beranda from './pages/dashboards/student/Beranda';
import StudentDashboard from './pages/dashboards/StudentDashboard'; 
import Riwayat from './pages/dashboards/student/Riwayat';
import StudentMissions from './pages/dashboards/student/StudentMissions';

// Google Auth Pages
import GoogleSuccess from './pages/GoogleSuccess';
import GoogleRegisterComplete from './pages/GoogleRegisterComplete';

// Auth Hook
import { useAuth } from './services/authService'; // Pastikan casing file benar 'AuthService'

const PrivateRoute = ({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Memuat Sesi...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Gunakan casting (as string) jika masih error, 
  // atau biarkan seperti ini jika langkah 1 sudah dilakukan
  if ((user.role as string) === 'new_user') {
    return <Navigate to="/google-register-complete" replace />;
  }

  if (user.role !== allowedRole) {
    const target = user.role === 'student' ? '/student' : `/${user.role}/dashboard`;
    return <Navigate to={target} replace />;
  }

  return children;
};

const RedirectRoot = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return null;

  if (token && user) {
    // User baru Google yang belum lengkap datanya
    if (user.role === 'new_user') return <Navigate to="/google-register-complete" replace />;
    
    if (user.role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* PERBAIKAN PATH: Sesuaikan dengan redirect dari Backend */}
        <Route path="/google-register-complete" element={<GoogleRegisterComplete />} />
        
        {/* Jalur lama (backup) jika backend mengirim ke sini */}
        <Route path="/auth/google/complete" element={<GoogleRegisterComplete />} />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />

        {/* Root Redirect */}
        <Route path="/" element={<RedirectRoot />} />

        {/* --- Private Routes --- */}
        
        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRole="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/analysis" element={<PrivateRoute allowedRole="admin"><NationalAnalysis /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute allowedRole="admin"><UserManagement /></PrivateRoute>} />
        <Route path="/admin/users/:id" element={<PrivateRoute allowedRole="admin"><UserDetail /></PrivateRoute>} />
        <Route path="/admin/classes" element={<PrivateRoute allowedRole="admin"><ClassManagement /></PrivateRoute>} />
        
        {/* TEACHER */}
        <Route path="/teacher/dashboard" element={<PrivateRoute allowedRole="teacher"><TeacherDashboard /></PrivateRoute>} />
        
        {/* PARENT */}
        <Route path="/parent/dashboard" element={<PrivateRoute allowedRole="parent"><ParentDashboard /></PrivateRoute>} />
        
        {/* CONTRIBUTOR */}
        <Route path="/contributor/dashboard" element={<PrivateRoute allowedRole="contributor"><ContributorDashboard /></PrivateRoute>} />

        {/* STUDENT (Nested) */}
        <Route path="/student" element={<PrivateRoute allowedRole="student"><StudentLayout /></PrivateRoute>}>
          <Route index element={<Beranda />} /> 
          <Route path="beranda" element={<Beranda />} />
          <Route path="journal" element={<StudentDashboard />} />
          <Route path="history" element={<Riwayat />} />
          <Route path="misi" element={<StudentMissions />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;