import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ContributorDashboard from './pages/ContributorDashboard';
import ParentDashboard from './pages/ParentDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rute Default */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rute Otentikasi */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rute Dasbor Berbasis Peran */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />

        {/* Tambahkan rute fallback jika diperlukan, misalnya ke halaman 404 */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
