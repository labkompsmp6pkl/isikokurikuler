import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, LogOut, Menu, X, Activity, 
    TrendingUp, Shield, UserCircle, BrainCircuit, Users, BookOpen,
    Sun, Moon, Heart, Book, Globe, Smile, Zap
} from 'lucide-react';
import adminService from '../../services/adminService';

// --- IMPORT SUB-COMPONENTS (TABS) ---
import UserManagement from './admin/UserManagement';
import ClassManagement from './admin/ClassManagement';
import NationalAnalysis from './NationalAnalysis'; 

const AdminDashboard: React.FC = () => {
    const location = useLocation();
    
    // --- UI STATE ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'beranda' | 'analysis' | 'users' | 'classes'>('beranda');

    // Auto-switch tab based on URL
    useEffect(() => {
        if (location.pathname.includes('/admin/analysis')) setActiveTab('analysis');
        else if (location.pathname.includes('/admin/users')) setActiveTab('users');
        else if (location.pathname.includes('/admin/classes')) setActiveTab('classes');
    }, [location]);

    // --- DATA STATE ---
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

    // --- CONFIG VISUALISASI DATA (Warna Warni) ---
    // Di sini kita mendefinisikan warna spesifik untuk setiap icon agar tidak hitam
    const habitsList = stats ? [
        { title: "Bangun Pagi", icon: <Sun size={24} />, color: "text-amber-500", ring: "text-amber-500", percent: stats.habits.bangunPagi },
        { title: "Beribadah", icon: <Book size={24} />, color: "text-emerald-600", ring: "text-emerald-600", percent: stats.habits.beribadah },
        { title: "Berolahraga", icon: <Activity size={24} />, color: "text-rose-500", ring: "text-rose-500", percent: stats.habits.berolahraga },
        { title: "Makan Sehat", icon: <Heart size={24} />, color: "text-red-500", ring: "text-red-500", percent: stats.habits.makanSehat },
        { title: "Gemar Belajar", icon: <BookOpen size={24} />, color: "text-blue-500", ring: "text-blue-500", percent: stats.habits.gemarBelajar },
        { title: "Bermasyarakat", icon: <Globe size={24} />, color: "text-cyan-500", ring: "text-cyan-500", percent: stats.habits.bermasyarakat },
        { title: "Tidur Cepat", icon: <Moon size={24} />, color: "text-indigo-500", ring: "text-indigo-500", percent: stats.habits.tidurCepat },
    ] : [];

    const profilesList = stats ? [
        { title: "Keimanan", icon: <Shield size={20}/>, bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500", percent: stats.profile.keimanan },
        { title: "Kewargaan", icon: <Globe size={20}/>, bg: "bg-red-100", text: "text-red-600", bar: "bg-red-500", percent: stats.profile.kewargaan },
        { title: "Kritis", icon: <BrainCircuit size={20}/>, bg: "bg-violet-100", text: "text-violet-600", bar: "bg-violet-500", percent: stats.profile.penalaranKritis },
        { title: "Kreativitas", icon: <Zap size={20}/>, bg: "bg-amber-100", text: "text-amber-600", bar: "bg-amber-500", percent: stats.profile.kreativitas },
        { title: "Kolaborasi", icon: <Users size={20}/>, bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500", percent: stats.profile.kolaborasi },
        { title: "Mandiri", icon: <UserCircle size={20} />, bg: "bg-orange-100", text: "text-orange-600", bar: "bg-orange-500", percent: stats.profile.kemandirian },
        { title: "Kesehatan", icon: <Heart size={20}/>, bg: "bg-rose-100", text: "text-rose-600", bar: "bg-rose-500", percent: stats.profile.kesehatan },
        { title: "Komunikasi", icon: <Smile size={20}/>, bg: "bg-teal-100", text: "text-teal-600", bar: "bg-teal-500", percent: stats.profile.komunikasi },
    ] : [];

    // --- NAVIGATION ITEMS ---
    const navItems = [
        { id: 'beranda', label: 'Dashboard Utama', icon: <LayoutDashboard size={20}/> },
        { id: 'analysis', label: 'Sintesis AI', icon: <BrainCircuit size={20}/> },
        { id: 'users', label: 'Manajemen User', icon: <Users size={20}/> },
        { id: 'classes', label: 'Manajemen Kelas', icon: <BookOpen size={20}/> },
    ];

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-800">
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* SIDEBAR */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Logo tanpa grayscale */}
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-xl text-indigo-900 leading-none tracking-tight">KOKURIKULER</h1>
                            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">Panel Admin</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-red-500"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 group
                                ${activeTab === item.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 translate-x-1' 
                                    : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                                }
                            `}
                        >
                            {/* Icon inherits color naturally */}
                            <span className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 transition-colors'}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 m-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">A</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">Administrator</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* HEADER MOBILE */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:hidden sticky top-0 z-30 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-indigo-900 uppercase text-xs tracking-widest">KOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-50 text-slate-600 rounded-lg active:scale-95">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-fade-in-up">
                        
                        {/* HEADER DASHBOARD */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                    {activeTab === 'beranda' && 'Dashboard Utama'}
                                    {activeTab === 'analysis' && 'Sintesis AI Nasional'}
                                    {activeTab === 'users' && 'Manajemen User'}
                                    {activeTab === 'classes' && 'Manajemen Kelas'}
                                </h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Selamat datang kembali di panel kontrol sistem karakter.</p>
                            </div>
                        </div>

                        {/* TAB 1: BERANDA (DEFAULT STATS) */}
                        {activeTab === 'beranda' && (
                            <>
                                {/* Welcome Stats - Menggunakan Gradient lembut, bukan hitam */}
                                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 rounded-[2rem] shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                                    {/* Hiasan background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    
                                    <div className="relative z-10">
                                        <h1 className="text-3xl md:text-4xl font-black mb-3">Pusat Data Karakter</h1>
                                        <p className="text-indigo-100 text-sm md:text-base font-medium leading-relaxed max-w-xl">
                                            Memantau perkembangan karakter siswa secara realtime. Saat ini terdapat <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">{stats?.totalLogs || 0}</span> data aktivitas positif yang telah terekam.
                                        </p>
                                    </div>
                                    
                                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-2xl flex items-center gap-4 relative z-10">
                                        <div className="p-3 bg-white text-indigo-600 rounded-xl shadow-lg">
                                            <Activity size={24} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Status Sistem</p>
                                            <p className="font-black text-white uppercase text-sm tracking-wide flex items-center justify-end gap-2">
                                                Active <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kebiasaan - Icon berwarna warni */}
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-3">
                                        <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                                        Indikator Kebiasaan Harian
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        {habitsList.map((h, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center transition-all hover:-translate-y-1 hover:shadow-lg group">
                                                <div className={`text-3xl mb-4 transition-transform group-hover:scale-110 ${h.color}`}>
                                                    {h.icon}
                                                </div>
                                                <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-tight mb-4 h-6 flex items-center justify-center">{h.title}</h3>
                                                
                                                {/* Circular Progress dengan warna dinamis */}
                                                <div className="relative w-14 h-14">
                                                    <svg className="w-full h-full transform -rotate-90">
                                                        <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                                        <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                                            strokeDasharray={138.2} 
                                                            strokeDashoffset={138.2 - (138.2 * h.percent) / 100} 
                                                            className={h.ring}
                                                            style={{ transition: 'stroke-dashoffset 1.5s ease-in-out', strokeLinecap: 'round' }}
                                                        />
                                                    </svg>
                                                    <span className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-black text-xs ${h.color}`}>
                                                        {h.percent}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Profil Lulusan - Kartu Putih dengan Icon Berwarna */}
                                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                            <TrendingUp size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Profil Pelajar Pancasila</h2>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Statistik Kumulatif Sekolah</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {profilesList.map((p, idx) => (
                                            <div key={idx} className="group p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-3 rounded-xl ${p.bg} ${p.text}`}>
                                                        {p.icon}
                                                    </div>
                                                    <div className="text-2xl font-black text-slate-800">{p.percent}%</div>
                                                </div>
                                                
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3 overflow-hidden">
                                                    <div className={`h-full rounded-full ${p.bar} transition-all duration-1000`} style={{ width: `${p.percent}%` }}></div>
                                                </div>
                                                <h4 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider group-hover:text-slate-700 transition-colors">{p.title}</h4>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* SUB TABS */}
                        {activeTab === 'analysis' && <div className="animate-fade-in"><NationalAnalysis /></div>}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'classes' && <ClassManagement />}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;