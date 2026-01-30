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
import PromotionManagement from './pages/dashboards/admin/PromotionManagement'; 

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
import { useAuth } from './services/authService'; 

/**
 * [PERBAIKAN] PrivateRoute
 * Menjamin jika token hilang atau user null, aplikasi langsung melempar ke /login.
 */
const PrivateRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Memuat Sesi...</p>
      </div>
    );
  }

  // Jika tidak ada token atau user, paksa ke login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle user baru Google yang belum melengkapi profile
  if (user.role === 'new_user') {
    return <Navigate to="/google-register-complete" replace />;
  }

  // Proteksi Role
  if (!allowedRoles.includes(user.role)) {
    let target = '/login';
    if (user.role === 'student' || user.role === 'alumni') target = '/student';
    else if (user.role === 'teacher') target = '/teacher/dashboard';
    else if (user.role === 'parent') target = '/parent/dashboard';
    else if (user.role === 'admin') target = '/admin/dashboard';
    else if (user.role === 'contributor') target = '/contributor/dashboard';
    
    return <Navigate to={target} replace />;
  }

  return children;
};

/**
 * [PERBAIKAN] RedirectRoot
 * Mengatur halaman awal berdasarkan status login terbaru.
 */
const RedirectRoot = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) return null;

  if (token && user) {
    if (user.role === 'new_user') return <Navigate to="/google-register-complete" replace />;
    if (user.role === 'student' || user.role === 'alumni') return <Navigate to="/student" replace />;
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Default jika tidak terautentikasi adalah LOGIN
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Google Auth Routes */}
        <Route path="/google-register-complete" element={<GoogleRegisterComplete />} />
        <Route path="/auth/google/complete" element={<GoogleRegisterComplete />} />
        <Route path="/auth/google/success" element={<GoogleSuccess />} />

        {/* Root Redirect - Menentukan kemana user pergi saat buka URL utama */}
        <Route path="/" element={<RedirectRoot />} />

        {/* --- Private Routes --- */}
        
        {/* ADMIN */}
        <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/analysis" element={<PrivateRoute allowedRoles={['admin']}><NationalAnalysis /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute allowedRoles={['admin']}><UserManagement /></PrivateRoute>} />
        <Route path="/admin/users/:id" element={<PrivateRoute allowedRoles={['admin']}><UserDetail /></PrivateRoute>} />
        <Route path="/admin/classes" element={<PrivateRoute allowedRoles={['admin']}><ClassManagement /></PrivateRoute>} />
        <Route path="/admin/promotion" element={<PrivateRoute allowedRoles={['admin']}><PromotionManagement /></PrivateRoute>} />
        
        {/* TEACHER */}
        <Route path="/teacher/dashboard" element={<PrivateRoute allowedRoles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
        
        {/* PARENT */}
        <Route path="/parent/dashboard" element={<PrivateRoute allowedRoles={['parent']}><ParentDashboard /></PrivateRoute>} />
        
        {/* CONTRIBUTOR */}
        <Route path="/contributor/dashboard" element={<PrivateRoute allowedRoles={['contributor']}><ContributorDashboard /></PrivateRoute>} />

        {/* STUDENT & ALUMNI */}
        <Route path="/student" element={<PrivateRoute allowedRoles={['student', 'alumni']}><StudentLayout /></PrivateRoute>}>
          <Route index element={<Beranda />} /> 
          <Route path="beranda" element={<Beranda />} />
          <Route path="journal" element={<StudentDashboard />} />
          <Route path="history" element={<Riwayat />} />
          <Route path="misi" element={<StudentMissions />} />
        </Route>

        {/* Catch-all: Jika URL tidak dikenal, lempar ke RedirectRoot untuk dicek loginnya */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;