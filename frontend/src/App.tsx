import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import NationalAnalysis from './pages/dashboards/NationalAnalysis'; // [BARU] Import Halaman Analisis
import UserManagement from './pages/dashboards/admin/UserManagement'; // Import Baru
import UserDetail from './pages/dashboards/admin/UserDetail'; // Import Baru
import ClassManagement from './pages/dashboards/admin/ClassManagement';

// Other Roles
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ContributorDashboard from './pages/dashboards/ContributorDashboard';

// Student Structure
import StudentLayout from './pages/dashboards/student/StudentLayout';
import Beranda from './pages/dashboards/student/Beranda';
import StudentDashboard from './pages/dashboards/StudentDashboard'; // Import Halaman Jurnal
import Riwayat from './pages/dashboards/student/Riwayat';

import GoogleSuccess from './pages/GoogleSuccess';
import GoogleRegisterComplete from './pages/GoogleRegisterComplete';

// Auth Hook
import { useAuth } from './services/authService';

// --- Components Helper ---

// 1. PrivateRoute: Menggunakan Context useAuth() agar reaktif
const PrivateRoute = ({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== allowedRole) {
    // Redirect jika salah role
    // Siswa -> /student (yang nanti di redirect ke /student/beranda oleh layout)
    // Lainnya -> /role/dashboard
    const target = user.role === 'student' ? '/student' : `/${user.role}/dashboard`;
    return <Navigate to={target} replace />;
  }

  return children;
};

// 2. Redirect Root: Menangani user yang akses "/"
const RedirectRoot = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return null;

  if (token && user) {
    if (user.role === 'student') return <Navigate to="/student" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <Navigate to="/login" replace />;
};

// --- Main App Component ---

const App: React.FC = () => {
  return (
    <>
      {/* HAPUS <Router> DISINI KARENA SUDAH ADA DI main.tsx */}
      <Toaster position="top-right" reverseOrder={false} />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/auth/google/success" element={<GoogleSuccess />} />
        <Route path="/auth/google/complete" element={<GoogleRegisterComplete />} />

        {/* Root Redirect */}
        <Route path="/" element={<RedirectRoot />} />

        {/* --- Private Routes --- */}
        
        {/* ADMIN ROUTES */}
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        {/* [BARU] Route untuk Analisis AI */}
        <Route 
          path="/admin/analysis" 
          element={
            <PrivateRoute allowedRole="admin">
              <NationalAnalysis />
            </PrivateRoute>
          } 
        />
        
        {/* TEACHER ROUTE */}
        <Route 
          path="/teacher/dashboard" 
          element={
            <PrivateRoute allowedRole="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route path="/admin/users" element={<PrivateRoute allowedRole="admin"><UserManagement /></PrivateRoute>} />
        <Route path="/admin/users/:id" element={<PrivateRoute allowedRole="admin"><UserDetail /></PrivateRoute>} />
        <Route path="/admin/classes" element={<PrivateRoute allowedRole="admin"><ClassManagement /></PrivateRoute>} />
        
        {/* PARENT ROUTE */}
        <Route 
          path="/parent/dashboard" 
          element={
            <PrivateRoute allowedRole="parent">
              <ParentDashboard />
            </PrivateRoute>
          } 
        />
        
        {/* CONTRIBUTOR ROUTE */}
        <Route 
          path="/contributor/dashboard" 
          element={
            <PrivateRoute allowedRole="contributor">
              <ContributorDashboard />
            </PrivateRoute>
          } 
        />

        {/* STUDENT ROUTES (Nested Structure) */}
        {/* Perhatikan: Path utamanya '/student' bukan '/student/dashboard' agar sesuai layout */}
        <Route 
          path="/student" 
          element={
            <PrivateRoute allowedRole="student">
              <StudentLayout />
            </PrivateRoute>
          }
        >
          {/* Default Route: Redirect ke Beranda */}
          <Route index element={<Beranda />} /> 
          
          <Route path="beranda" element={<Beranda />} />
          <Route path="journal" element={<StudentDashboard />} /> {/* Halaman Input Jurnal */}
          <Route path="history" element={<Riwayat />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;