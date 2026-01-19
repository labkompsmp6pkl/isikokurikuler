import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, LogOut, Menu, X, Activity, 
    TrendingUp, Shield, UserCircle, BrainCircuit, Users, BookOpen,
    Sun, Moon, Heart, Book, Globe, Smile, Zap, ArrowUpCircle,
    AlertTriangle, Calendar, Filter
} from 'lucide-react';
import adminService from '../../services/adminService';

// --- IMPORT SUB-COMPONENTS (TABS) ---
import UserManagement from './admin/UserManagement';
import ClassManagement from './admin/ClassManagement';
import NationalAnalysis from './NationalAnalysis'; 
import PromotionManagement from './admin/PromotionManagement'; 

const AdminDashboard: React.FC = () => {
    const location = useLocation();
    
    // --- UI STATE ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'beranda' | 'analysis' | 'users' | 'classes' | 'promotion'>('beranda');

    // Auto-switch tab based on URL
    useEffect(() => {
        if (location.pathname.includes('/admin/analysis')) setActiveTab('analysis');
        else if (location.pathname.includes('/admin/users')) setActiveTab('users');
        else if (location.pathname.includes('/admin/classes')) setActiveTab('classes');
        else if (location.pathname.includes('/admin/promotion')) setActiveTab('promotion');
    }, [location]);

    // --- DATA STATE ---
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filter State for Habits
    const [statsFilter, setStatsFilter] = useState<'all' | 'active'>('active');

    // State untuk Data Sekolah (Real-time)
    const [schoolData, setSchoolData] = useState({
        totalClasses: 0,
        totalStudents: 0,
        classesNoTeacher: 0,
        academicYear: '-',
        semester: '-',
        progress: 0
    });

    // --- FETCH DATA DASHBOARD ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Ambil Statistik Dashboard dengan Filter
                const dashboardStats = await adminService.getDashboardStats(statsFilter);
                setStats(dashboardStats);

                // 2. Ambil Pengaturan Tahun Ajaran
                const settings = await adminService.getAppSettings();

                // 3. Hitung Progress
                const totalStudentsReal = dashboardStats.totalStudents || 0;
                const progressVal = dashboardStats.totalLogs && totalStudentsReal > 0 
                    ? Math.min(Math.round((dashboardStats.totalLogs / totalStudentsReal) * 100), 100) 
                    : 0;

                setSchoolData({
                    totalClasses: dashboardStats.totalClasses || 0,
                    totalStudents: totalStudentsReal,
                    classesNoTeacher: dashboardStats.classesNoTeacher || 0,
                    academicYear: settings.current_academic_year || '2024/2025',
                    semester: settings.current_semester || 'Ganjil',
                    progress: progressVal
                });

            } catch (error) {
                console.error("Gagal memuat data admin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [statsFilter]); // Re-fetch when filter changes

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    // --- CONFIG VISUALISASI DATA ---
    const habitsList = stats ? [
        { title: "Bangun Pagi", icon: <Sun size={24} />, color: "text-amber-500", ring: "text-amber-500", percent: stats.habits?.bangunPagi || 0 },
        { title: "Beribadah", icon: <Book size={24} />, color: "text-emerald-600", ring: "text-emerald-600", percent: stats.habits?.beribadah || 0 },
        { title: "Berolahraga", icon: <Activity size={24} />, color: "text-rose-500", ring: "text-rose-500", percent: stats.habits?.berolahraga || 0 },
        { title: "Makan Sehat", icon: <Heart size={24} />, color: "text-red-500", ring: "text-red-500", percent: stats.habits?.makanSehat || 0 },
        { title: "Gemar Belajar", icon: <BookOpen size={24} />, color: "text-blue-500", ring: "text-blue-500", percent: stats.habits?.gemarBelajar || 0 },
        { title: "Bermasyarakat", icon: <Globe size={24} />, color: "text-cyan-500", ring: "text-cyan-500", percent: stats.habits?.bermasyarakat || 0 },
        { title: "Tidur Cepat", icon: <Moon size={24} />, color: "text-indigo-500", ring: "text-indigo-500", percent: stats.habits?.tidurCepat || 0 },
    ] : [];

    const profilesList = stats ? [
        { title: "Keimanan", icon: <Shield size={20}/>, bg: "bg-emerald-100", text: "text-emerald-600", bar: "bg-emerald-500", percent: stats.profile?.keimanan || 0 },
        { title: "Kewargaan", icon: <Globe size={20}/>, bg: "bg-red-100", text: "text-red-600", bar: "bg-red-500", percent: stats.profile?.kewargaan || 0 },
        { title: "Kritis", icon: <BrainCircuit size={20}/>, bg: "bg-violet-100", text: "text-violet-600", bar: "bg-violet-500", percent: stats.profile?.penalaranKritis || 0 },
        { title: "Kreativitas", icon: <Zap size={20}/>, bg: "bg-amber-100", text: "text-amber-600", bar: "bg-amber-500", percent: stats.profile?.kreativitas || 0 },
        { title: "Kolaborasi", icon: <Users size={20}/>, bg: "bg-blue-100", text: "text-blue-600", bar: "bg-blue-500", percent: stats.profile?.kolaborasi || 0 },
        { title: "Mandiri", icon: <UserCircle size={20} />, bg: "bg-orange-100", text: "text-orange-600", bar: "bg-orange-500", percent: stats.profile?.kemandirian || 0 },
        { title: "Kesehatan", icon: <Heart size={20}/>, bg: "bg-rose-100", text: "text-rose-600", bar: "bg-rose-500", percent: stats.profile?.kesehatan || 0 },
        { title: "Komunikasi", icon: <Smile size={20}/>, bg: "bg-teal-100", text: "text-teal-600", bar: "bg-teal-500", percent: stats.profile?.komunikasi || 0 },
    ] : [];

    const navItems = [
        { id: 'beranda', label: 'Dashboard Utama', icon: <LayoutDashboard size={20}/> },
        { id: 'analysis', label: 'Sintesis AI', icon: <BrainCircuit size={20}/> },
        { id: 'users', label: 'Manajemen User', icon: <Users size={20}/> },
        { id: 'classes', label: 'Manajemen Kelas', icon: <BookOpen size={20}/> },
        { id: 'promotion', label: 'Kenaikan & Tahun Ajaran', icon: <ArrowUpCircle size={20}/> },
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
                        {activeTab !== 'promotion' && (
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                        {activeTab === 'beranda' && 'Dashboard Sekolah'}
                                        {activeTab === 'analysis' && 'Sintesis AI Nasional'}
                                        {activeTab === 'users' && 'Manajemen User'}
                                        {activeTab === 'classes' && 'Manajemen Kelas'}
                                    </h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">
                                        Tahun Ajaran: <span className="font-bold text-indigo-600">{schoolData.academicYear} ({schoolData.semester})</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 1: BERANDA (DASHBOARD SEKOLAH) */}
                        {activeTab === 'beranda' && (
                            <div className="space-y-8">
                                
                                {/* 1. SECTION DASHBOARD SEKOLAH (4 KARTU UTAMA) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Total Kelas */}
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Kelas</p>
                                            <h3 className="text-3xl font-black text-slate-800">{schoolData.totalClasses}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <BookOpen size={24} />
                                        </div>
                                    </div>

                                    {/* Total Siswa */}
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Siswa</p>
                                            <h3 className="text-3xl font-black text-slate-800">{schoolData.totalStudents}</h3>
                                        </div>
                                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Users size={24} />
                                        </div>
                                    </div>

                                    {/* Semester Info */}
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Semester</p>
                                            <h3 className="text-xl font-black text-slate-800">{schoolData.semester}</h3>
                                            <p className="text-xs text-slate-500 font-mono">{schoolData.academicYear}</p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Calendar size={24} />
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Aktivitas Hari Ini</p>
                                            <h3 className="text-3xl font-black text-slate-800">{schoolData.progress}%</h3>
                                        </div>
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                            <Activity size={24} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. SECTION PERINGATAN (JIKA ADA MASALAH) */}
                                {(schoolData.classesNoTeacher > 0 || schoolData.totalClasses === 0) && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4 animate-pulse-slow">
                                        <div className="p-3 bg-white text-rose-600 rounded-xl shadow-sm shrink-0">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-rose-800 text-lg">Peringatan Sistem</h3>
                                            <ul className="mt-1 space-y-1 text-sm text-rose-700">
                                                {schoolData.classesNoTeacher > 0 && (
                                                    <li className="flex items-center gap-2">
                                                        • Terdapat <strong>{schoolData.classesNoTeacher} Kelas</strong> yang belum memiliki Wali Kelas.
                                                        <button onClick={() => setActiveTab('classes')} className="underline hover:text-rose-900 font-bold">Atur Sekarang</button>
                                                    </li>
                                                )}
                                                {schoolData.totalClasses === 0 && (
                                                    <li>• Data kelas belum diinisialisasi. Silakan buat kelas baru.</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* 3. VISUALISASI DATA (KEBIASAAN & PROFIL) */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Kolom Kiri: Kebiasaan (Lebar) */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
                                                    Indikator Kebiasaan Harian
                                                </h3>
                                                {/* FILTER DROPDOWN */}
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                                    <Filter size={14} className="text-slate-400" />
                                                    <select 
                                                        className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                                                        value={statsFilter}
                                                        onChange={(e) => setStatsFilter(e.target.value as 'all' | 'active')}
                                                    >
                                                        <option value="active">{schoolData.semester} {schoolData.academicYear}</option>
                                                        <option value="all">Semua Waktu (All Time)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {habitsList.map((h, idx) => (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:border-indigo-100 transition-all">
                                                        <div className={`text-2xl mb-2 ${h.color}`}>{h.icon}</div>
                                                        <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-tight mb-2 h-5 flex items-center">{h.title}</h4>
                                                        <div className="font-black text-xl text-slate-800">{h.percent}%</div>
                                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                                            <div className={`h-full rounded-full ${h.color.replace('text-', 'bg-')}`} style={{ width: `${h.percent}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolom Kanan: Profil Pancasila */}
                                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <TrendingUp size={20} />
                                            </div>
                                            <h3 className="font-bold text-slate-800">Profil Pelajar Pancasila</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {profilesList.slice(0, 5).map((p, idx) => (
                                                <div key={idx} className="group">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-lg ${p.bg} ${p.text} text-xs`}>{p.icon}</div>
                                                            <span className="text-xs font-bold text-slate-600">{p.title}</span>
                                                        </div>
                                                        <span className="text-xs font-black text-slate-800">{p.percent}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className={`h-full rounded-full ${p.bar} transition-all duration-1000`} style={{ width: `${p.percent}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => setActiveTab('analysis')} className="w-full py-3 mt-4 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                                                Lihat Analisis Lengkap
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUB TABS */}
                        {activeTab === 'analysis' && <div className="animate-fade-in"><NationalAnalysis /></div>}
                        {activeTab === 'users' && <UserManagement />}
                        {activeTab === 'classes' && <ClassManagement />}
                        {activeTab === 'promotion' && <div className="animate-fade-in"><PromotionManagement /></div>}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;