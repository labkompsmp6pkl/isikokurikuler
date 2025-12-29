import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';
import ContributorDashboard from './pages/dashboards/ContributorDashboard';

// --- Impor Struktur Dasbor Siswa yang Baru ---
import StudentLayout from './pages/dashboards/student/StudentLayout';
import Beranda from './pages/dashboards/student/Beranda';
import Riwayat from './pages/dashboards/student/Riwayat';

// Komponen PrivateRoute tetap sama
const PrivateRoute = ({ children, role, userRole }: { children: JSX.Element, role: string, userRole: string | null }) => {
  const isAuthenticated = !!localStorage.getItem('token');
  if (!isAuthenticated || userRole !== role) {
    return <Navigate to="/login" />;
  }
  return children;
};

const App = () => {
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const userRole = user?.role || null;

  return (
    <Router>
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{ duration: 3500, style: { background: '#363636', color: '#fff' } }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Rute Dasbor Siswa yang Baru & Bersarang --- */}
        <Route 
          path="/student/dashboard" 
          element={
            <PrivateRoute role="student" userRole={userRole}>
              <StudentLayout />
            </PrivateRoute>
          }
        >
          {/* Rute default akan mengarah ke Beranda */}
          <Route index element={<Navigate to="beranda" replace />} /> 
          <Route path="beranda" element={<Beranda />} />
          <Route path="riwayat" element={<Riwayat />} />
        </Route>

        {/* Rute dasbor lain tetap sama */}
        <Route path="/admin/dashboard" element={<PrivateRoute role="admin" userRole={userRole}><AdminDashboard /></PrivateRoute>} />
        <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher" userRole={userRole}><TeacherDashboard /></PrivateRoute>} />
        <Route path="/parent/dashboard" element={<PrivateRoute role="parent" userRole={userRole}><ParentDashboard /></PrivateRoute>} />
        <Route path="/contributor/dashboard" element={<PrivateRoute role="contributor" userRole={userRole}><ContributorDashboard /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
