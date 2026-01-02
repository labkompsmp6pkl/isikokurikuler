import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const GoogleSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      toast.success('Login Berhasil!');
      
      // Decode token sederhana untuk redirect role (opsional, atau lempar ke dashboard default)
      // Disini kita asumsi langsung ke dashboard student dulu, atau logic redirect yang ada di App.tsx
      window.location.href = '/student-dashboard'; // Refresh state auth
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div className="flex justify-center items-center h-screen">Memproses Login...</div>;
};

export default GoogleSuccess;