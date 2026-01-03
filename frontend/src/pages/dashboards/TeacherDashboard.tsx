import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  User,
  BookOpen,
  Activity,
  Heart,
  Coffee,
  Moon,
  Sun,
  Users
} from 'lucide-react';

import teacherService from '../../services/teacherService';
import { useAuth } from '../../services/authService';
import Spinner from './student/components/Spinner';

// Sub-Components
import ValidationView from './teacher/ValidationView';
import HistoryView from './teacher/HistoryView';
import AIReportView from './teacher/AIReportView';

// --- DATA INDIKATOR ---
const teacherHabits = [
  { id: 1, icon: <Sun size={32} />, title: "Bangun Pagi", indicator: "Ketepatan waktu kehadiran siswa di sekolah dan kesiapan memulai pelajaran jam pertama.", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { id: 2, icon: <Heart size={32} />, title: "Beribadah", indicator: "Ketaatan menjalankan jadwal ibadah sekolah dan sikap santun dalam bertindak harian.", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  { id: 3, icon: <Activity size={32} />, title: "Berolahraga", indicator: "Stamina siswa dalam mengikuti kegiatan sekolah dan partisipasi aktif dalam pelajaran PJOK.", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: 4, icon: <Coffee size={32} />, title: "Makan Sehat", indicator: "Pilihan menu bekal siswa atau jajanan kantin yang dikonsumsi selama di sekolah.", color: "bg-green-50 border-green-200 text-green-700" },
  { id: 5, icon: <BookOpen size={32} />, title: "Gemar Belajar", indicator: "Keaktifan bertanya di kelas, ketepatan mengumpulkan tugas, dan kemandirian dalam mencari sumber belajar.", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: 6, icon: <Users size={32} />, title: "Bermasyarakat", indicator: "Kemampuan berkolaborasi dengan teman sejawat dan empati terhadap lingkungan sekolah.", color: "bg-teal-50 border-teal-200 text-teal-700" },
  { id: 7, icon: <Moon size={32} />, title: "Tidur Cepat", indicator: "Fokus konsentrasi siswa di dalam kelas dan tidak terlihat mengantuk saat jam pelajaran.", color: "bg-indigo-50 border-indigo-200 text-indigo-700" }
];

const TeacherDashboard: React.FC = () => {
    const { logout } = useAuth();
    
    // --- STATE ---
    const [user, setUser] = useState<any>({ fullName: 'Guru', id: 0, nip: '', classId: null });
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'beranda' | 'validasi' | 'riwayat' | 'analisis'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- FETCH DATA ---
    const fetchDashboard = async () => {
        setIsLoading(true);
        try {
            const res = await teacherService.getDashboard();
            setData(res);
            setLogs(res.logs || []);
        } catch (err: any) {
            console.error("Dashboard Error:", err);
            toast.error("Gagal memuat data kelas.", { id: 'dashboard-error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) setUser(JSON.parse(userString));
        fetchDashboard();
    }, []);

    const handleLogout = () => {
        const toastId = toast.loading('Keluar sistem...', { id: 'logout-process' });
        setTimeout(() => {
            logout();
            toast.success('Berhasil logout', { id: toastId });
        }, 800);
    };

    // --- NAV ITEMS ---
    const pendingCount = logs.filter((l: any) => l.status === 'Disetujui').length; 

    const navItems = [
        { id: 'beranda', label: 'Beranda Guru', icon: <LayoutDashboard size={20} /> },
        { id: 'validasi', label: 'Validasi Jurnal', icon: <CheckSquare size={20} />, badge: pendingCount },
        { id: 'riwayat', label: 'Riwayat Kelas', icon: <CalendarDays size={20} /> },
        { id: 'analisis', label: 'Rapor AI', icon: <BarChart3 size={20} /> },
    ];

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* SIDEBAR (Desktop Sticky, Mobile Drawer) */}
            <aside className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
                        <span className="font-bold text-gray-800 tracking-tight">KOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-rose-500"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button 
                            key={item.id} 
                            type="button" 
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === item.id ? 'bg-violet-50 text-violet-600 border border-violet-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.badge ? <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span> : null}
                        </button>
                    ))}
                </nav>

                {/* PROFILE SIDEBAR BOTTOM */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold shadow-md uppercase">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="overflow-hidden w-full">
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{user.fullName}</p>
                            <div className="mt-1 flex flex-col">
                                <span className="text-[10px] font-semibold text-gray-500 truncate">Halaman Guru</span>
                                <span className="text-[10px] font-bold text-violet-600 mt-0.5 uppercase tracking-wider">Kelas {data?.teacherClass || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm">
                        <LogOut size={18} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
            {/* Menggunakan min-w-0 agar scroll body bekerja */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* HEADER MOBILE (STICKY) */}
                <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
                            <span className="font-bold text-gray-800 text-sm tracking-tight">KOKURIKULER</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 p-1 bg-gray-50 rounded-lg active:scale-95 transition-transform"><Menu size={24} /></button>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 mt-2">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Halaman Guru</p>
                            <p className="text-xs font-black text-gray-800 truncate mt-1">{user.fullName}</p>
                        </div>
                        <div className="bg-violet-100 text-violet-700 px-2 py-1 rounded text-[10px] font-black uppercase shadow-sm">
                            Kelas {data?.teacherClass || '-'}
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                {/* Menghapus overflow-auto dan h-screen agar scroll di body */}
                <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-20">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                            {activeTab === 'beranda' && 'Dashboard Guru'}
                            {activeTab === 'validasi' && 'Validasi Jurnal'}
                            {activeTab === 'riwayat' && 'Riwayat Kelas'}
                            {activeTab === 'analisis' && 'Rapor Karakter AI'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Wali Kelas {data?.teacherClass}</p>
                    </div>

                    {activeTab === 'beranda' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Sparkles size={24} /></div>
                                        <span className="font-bold tracking-widest uppercase text-xs">Overview Kelas</span>
                                    </div>
                                    <h1 className="text-3xl font-black mb-4 leading-tight tracking-tighter">Selamat Bertugas, <br/><span className="text-yellow-300 italic">{user.fullName}</span></h1>
                                    <p className="text-violet-100 text-lg font-medium max-w-2xl opacity-90">
                                        Anda mengampu <strong>{data?.students?.length || 0} Siswa</strong> di kelas ini. Pastikan untuk selalu memantau perkembangan karakter mereka.
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                                    <User size={200} />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <span className="w-1.5 h-8 bg-violet-600 rounded-full"></span>
                                    7 Kebiasaan Indonesia Hebat
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {teacherHabits.map((habit) => (
                                        <div key={habit.id} className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg hover:-translate-y-1 ${habit.color} bg-white relative overflow-hidden group`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-white rounded-2xl shadow-sm">{habit.icon}</div>
                                            </div>
                                            <h3 className="font-black text-lg mb-2">{habit.title}</h3>
                                            <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Indikator Validasi</p>
                                                <p className="text-xs font-bold leading-relaxed">{habit.indicator}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'validasi' && (
                        <ValidationView 
                            logs={logs} 
                            onRefresh={fetchDashboard} 
                        />
                    )}

                    {activeTab === 'riwayat' && (
                        <HistoryView 
                            students={data?.students || []} 
                            teacherClass={data?.teacherClass}
                        />
                    )}

                    {activeTab === 'analisis' && (
                        <AIReportView 
                            students={data?.students || []} 
                            teacherClass={data?.teacherClass}
                            teacherName={user.fullName}
                            teacherNip={user.nip}
                        />
                    )}

                </main>
            </div>
        </div>
    );
};

export default TeacherDashboard;