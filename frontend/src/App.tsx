import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Login from './pages/Login';
import Register from './pages/Register';
import GoogleRegister from './pages/GoogleRegister';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ContributorDashboard from './pages/dashboards/ContributorDashboard';

// --- Impor Struktur Dasbor Siswa ---
import StudentLayout from './pages/dashboards/student/StudentLayout';
import Beranda from './pages/dashboards/student/Beranda';
import Riwayat from './pages/dashboards/student/Riwayat';

// Fungsi untuk mengambil dan mem-parsing data pengguna dengan aman
const getInitialUser = () => {
  try {
    const userItem = localStorage.getItem('user');
    // Jika userItem ada dan bukan string kosong, coba parse
    if (userItem) {
      return JSON.parse(userItem);
    }
    // Jika tidak ada, kembalikan null
    return null;
  } catch (error) {
    console.error("Gagal mem-parsing data pengguna dari localStorage:", error);
    // Jika terjadi galat parsing, hapus item yang rusak dan kembalikan null
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
  // Gunakan fungsi aman untuk inisialisasi state
  const [user] = useState(getInitialUser());

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/google-register" element={<GoogleRegister />} />
          
          {/* Rute Privat */}
          <Route path="/admin/dashboard" element={<PrivateRoute role="admin" userRole={user?.role}><AdminDashboard /></PrivateRoute>} />
          <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher" userRole={user?.role}><TeacherDashboard /></PrivateRoute>} />
          
          {/* --- Rute Dasbor Siswa dengan Layout --- */}
          <Route 
            path="/student" 
            element={
              <PrivateRoute role="student" userRole={user?.role}>
                <StudentLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<Beranda />} />
            <Route path="history" element={<Riwayat />} />
            {/* Tambahkan rute siswa lainnya di sini jika perlu */}
          </Route>

          <Route path="/parent/dashboard" element={<PrivateRoute role="parent" userRole={user?.role}><ParentDashboard /></PrivateRoute>} />
          <Route path="/contributor/dashboard" element={<PrivateRoute role="contributor" userRole={user?.role}><ContributorDashboard /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
