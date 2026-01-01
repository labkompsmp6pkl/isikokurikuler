import React from 'react';
import { useAuth } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';

const Navbar: React.FC<{ toggleSidebar?: () => void }> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            {toggleSidebar && (
              <button onClick={toggleSidebar} className="md:hidden p-2 rounded-md hover:bg-blue-600 focus:outline-none">
                <Menu className="h-6 w-6" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <img 
                src="/logo-smpn6.png" 
                alt="Logo SMPN 6" 
                className="h-12 w-12 object-contain bg-white rounded-full p-1"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-wide">ISIKOKURIKULER</span>
                <span className="text-sm font-medium text-blue-200">SMPN 6 PEKALONGAN</span>
              </div>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="font-medium text-sm">{user?.name}</span>
              <span className="text-xs text-blue-200 capitalize">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md flex items-center gap-2"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;