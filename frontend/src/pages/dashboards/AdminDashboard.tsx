import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, LogOut, Menu, X, Activity, 
  TrendingUp, Shield, UserCircle, BrainCircuit, Users, BookOpen
} from 'lucide-react';
import adminService from '../../services/adminService';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA DASHBOARD ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await adminService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Gagal memuat data admin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    // --- CONFIG DATA VISUALISASI ---
    
    // 1. Data 7 Kebiasaan
    const habitsList = stats ? [
        { title: "Bangun Pagi", icon: "☀️", color: "text-orange-500", bg: "bg-orange-50", percent: stats.habits.bangunPagi },
        { title: "Beribadah", icon: "🙏", color: "text-emerald-600", bg: "bg-emerald-50", percent: stats.habits.beribadah },
        { title: "Berolahraga", icon: "🏃", color: "text-blue-600", bg: "bg-blue-50", percent: stats.habits.berolahraga },
        { title: "Makan Sehat", icon: "🥗", color: "text-green-600", bg: "bg-green-50", percent: stats.habits.makanSehat },
        { title: "Gemar Belajar", icon: "📚", color: "text-purple-600", bg: "bg-purple-50", percent: stats.habits.gemarBelajar },
        { title: "Bermasyarakat", icon: "🌍", color: "text-teal-600", bg: "bg-teal-50", percent: stats.habits.bermasyarakat },
        { title: "Tidur Cepat", icon: "🌙", color: "text-indigo-600", bg: "bg-indigo-50", percent: stats.habits.tidurCepat },
    ] : [];

    // 2. Data Profil Lulusan
    const profilesList = stats ? [
        { title: "Keimanan & Ketakwaan", icon: <Shield size={18}/>, color: "bg-emerald-500", percent: stats.profile.keimanan },
        { title: "Kewargaan", icon: "🇮🇩", color: "bg-red-500", percent: stats.profile.kewargaan },
        { title: "Penalaran Kritis", icon: "🧠", color: "bg-blue-500", percent: stats.profile.penalaranKritis },
        { title: "Kreativitas", icon: "🎨", color: "bg-purple-500", percent: stats.profile.kreativitas },
        { title: "Kolaborasi", icon: "🤝", color: "bg-teal-500", percent: stats.profile.kolaborasi },
        { title: "Kemandirian", icon: <UserCircle size={18} />, color: "bg-orange-500", percent: stats.profile.kemandirian },
        { title: "Kesehatan", icon: "🍎", color: "bg-green-500", percent: stats.profile.kesehatan },
        { title: "Komunikasi", icon: "💬", color: "bg-indigo-500", percent: stats.profile.komunikasi },
    ] : [];

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans flex text-gray-800">
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* SIDEBAR */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest">ADMINISTRATOR</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {/* Menu Dashboard (Aktif) */}
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-medium transition-all">
                        <LayoutDashboard size={20}/> <span>Dashboard Utama</span>
                    </button>

                    {/* Menu Analisis AI */}
                    <button onClick={() => navigate('/admin/analysis')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <BrainCircuit size={20}/> <span>Sintesis AI</span>
                    </button>

                    {/* Menu Manajemen User */}
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <Users size={20}/> <span>Manajemen User</span>
                    </button>

                    {/* Menu Manajemen Kelas (BARU) */}
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <BookOpen size={20}/> <span>Manajemen Kelas</span>
                    </button>
                </nav>

                <div className="p-4 m-4 bg-indigo-50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm border border-indigo-100">A</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">Administrator</p>
                            <p className="text-xs text-indigo-600 font-semibold">Super User</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-gray-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto pb-20 space-y-8">
                        
                        {/* Header Section */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">Pusat Data Karakter</h1>
                                <p className="text-gray-500">
                                    Analisis Big Data dari <span className="font-bold text-indigo-600">{stats?.totalLogs || 0}</span> jurnal harian siswa di seluruh kelas.
                                </p>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-3">
                                <Activity className="text-indigo-600" />
                                <div className="text-right">
                                    <p className="text-xs font-bold text-indigo-400 uppercase">Status Data</p>
                                    <p className="font-black text-indigo-800">Realtime Update</p>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 1: SEBARAN 7 KEBIASAAN */}
                        <div>
                            <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">☀️</span>
                                Sebaran 7 Kebiasaan
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                {habitsList.map((h, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-1 hover:shadow-md">
                                        <div className={`text-3xl mb-2 p-3 rounded-full ${h.bg}`}>{h.icon}</div>
                                        <h3 className="font-bold text-xs text-gray-600 uppercase tracking-wide mb-2 h-8 flex items-center justify-center">{h.title}</h3>
                                        
                                        {/* Circular Progress */}
                                        <div className="relative w-16 h-16">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                                    strokeDasharray={175.9} 
                                                    strokeDashoffset={175.9 - (175.9 * h.percent) / 100} 
                                                    className={h.color} 
                                                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                                />
                                            </svg>
                                            <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black text-sm ${h.color}`}>
                                                {h.percent}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SECTION 2: PROFIL LULUSAN TERKINI */}
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                                    <TrendingUp size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Profil Lulusan Terkini✨</h2>
                                    <p className="text-gray-400 text-sm font-medium">Akumulasi kompetensi karakter dari seluruh siswa</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {profilesList.map((p, idx) => (
                                    <div key={idx} className="group p-5 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:border-transparent transition-all duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-2xl">{p.icon}</div>
                                            <div className="text-3xl font-black text-gray-800">{p.percent}%</div>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
                                            <div 
                                                className={`h-3 rounded-full ${p.color} transition-all duration-1000 ease-out group-hover:scale-x-105 origin-left`} 
                                                style={{ width: `${p.percent}%` }}
                                            ></div>
                                        </div>
                                        
                                        <h4 className="font-bold text-gray-600 text-sm uppercase tracking-wide group-hover:text-gray-900">{p.title}</h4>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center text-blue-700 text-sm font-medium">
                                "Data ini mencerminkan kompetensi karakter yang paling sering muncul dalam jurnal harian siswa selama periode aktif."
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;