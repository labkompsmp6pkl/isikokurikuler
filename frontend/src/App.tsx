import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';

import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ContributorDashboard from './pages/dashboards/ContributorDashboard';

// --- Impor Struktur Dasbor Siswa ---
import StudentLayout from './pages/dashboards/student/StudentLayout';
import Beranda from './pages/dashboards/student/Beranda';
import Riwayat from './pages/dashboards/student/Riwayat';

const getInitialUser = () => {
  try {
    const userItem = localStorage.getItem('user');
    if (userItem) {
      return JSON.parse(userItem);
    }
    return null;
  } catch (error) {
    console.error("Gagal mem-parsing data pengguna dari localStorage:", error);
    localStorage.removeItem('user');
    return null;
  }
};

const PrivateRoute = ({ children, role, userRole }: { children: JSX.Element, role: string, userRole: string | null }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated || userRole !== role) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  const [user] = useState(getInitialUser());

  return (
    // [PERBAIKAN] Tambahkan future flags di sini untuk menghilangkan warning v7
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rute Privat untuk Peran Lain */}
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin" userRole={user?.role}><AdminDashboard /></PrivateRoute>} />
        <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher" userRole={user?.role}><TeacherDashboard /></PrivateRoute>} />
        <Route path="/parent/dashboard" element={<PrivateRoute role="parent" userRole={user?.role}><ParentDashboard /></PrivateRoute>} />
        <Route path="/contributor/dashboard" element={<PrivateRoute role="contributor" userRole={user?.role}><ContributorDashboard /></PrivateRoute>} />

        {/* --- Struktur Rute Siswa --- */}
        <Route 
          path="/student/dashboard" 
          element={
            <PrivateRoute role="student" userRole={user?.role}>
              <StudentLayout />
            </PrivateRoute>
          }
        >
          {/* Mengarahkan /student/dashboard ke /student/dashboard/beranda secara default */}
          <Route index element={<Navigate to="beranda" replace />} /> 
          {/* Rute anak yang akan dirender di dalam <Outlet /> */}
          <Route path="beranda" element={<Beranda />} />
          <Route path="riwayat" element={<Riwayat />} />
        </Route>

        {/* Rute Catch-all untuk pengguna yang sudah login tapi URL salah */}
        <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;