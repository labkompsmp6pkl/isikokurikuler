
import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        const logoutToast = toast.loading('Anda sedang keluar...');

        // Hapus semua data sesi dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        toast.success('Logout berhasil!', { id: logoutToast });

        // Arahkan pengguna ke halaman login setelah jeda singkat
        setTimeout(() => {
            navigate('/login');
        }, 500); // jeda 0.5 detik
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-gray-800">Dasbor Orang Tua</span>
                    </div>
                    <div className="hidden md:block">
                        <button 
                            onClick={handleLogout}
                            className="ml-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="md:hidden">
                         {/* Opsi untuk tombol logout versi mobile jika diperlukan */}
                         <button onClick={handleLogout} className="text-red-600 hover:text-red-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                         </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
