import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

// --- Komponen Pembantu ---

// 1. PrivateRoute: Mengecek localStorage secara langsung setiap kali rute diakses
//    Ini mencegah bug di mana App.tsx tidak sadar user sudah login.
const PrivateRoute = ({ children, allowedRole }: { children: JSX.Element, allowedRole: string }) => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const location = useLocation();

  if (!token || !userString) {
    // Redirect ke login, simpan lokasi asal agar bisa balik (opsional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userString);
    
    // Cek apakah role sesuai
    if (user.role !== allowedRole) {
      // Jika role salah, arahkan ke dashboard yang benar
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    return children;
  } catch (error) {
    // Jika data corrupt, bersihkan dan minta login ulang
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

// 2. RedirectBasedOnAuth: Untuk menangani rute "Catch-All" (*)
//    Cek apakah user login? Jika ya, ke dashboard. Jika tidak, ke login.
const RedirectBasedOnAuth = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      return <Navigate to={`/${user.role}/dashboard`} replace />;
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

// --- Komponen Utama App ---

const App = () => {
  return (
    // Mengaktifkan future flags untuk menghilangkan warning React Router v7
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Redirect root '/' ke logic pengecekan */}
        <Route path="/" element={<RedirectBasedOnAuth />} />

        {/* --- Rute Privat (Diperbarui agar membaca localStorage langsung) --- */}
        
        <Route 
          path="/admin/dashboard" 
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/teacher/dashboard" 
          element={
            <PrivateRoute allowedRole="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/parent/dashboard" 
          element={
            <PrivateRoute allowedRole="parent">
              <ParentDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/contributor/dashboard" 
          element={
            <PrivateRoute allowedRole="contributor">
              <ContributorDashboard />
            </PrivateRoute>
          } 
        />

        {/* --- Struktur Rute Siswa --- */}
        <Route 
          path="/student/dashboard" 
          element={
            <PrivateRoute allowedRole="student">
              <StudentLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="beranda" replace />} /> 
          <Route path="beranda" element={<Beranda />} />
          <Route path="riwayat" element={<Riwayat />} />
        </Route>

        {/* Catch-all Route: Tangani 404 atau URL nyasar */}
        <Route path="*" element={<RedirectBasedOnAuth />} />
      </Routes>
    </Router>
  );
};

export default App;