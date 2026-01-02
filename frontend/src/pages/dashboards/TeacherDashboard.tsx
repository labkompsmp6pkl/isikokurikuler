import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Printer, 
  Sparkles,
  Clock,
  ChevronRight,
  AlertCircle,
  UserCheck,
  TrendingUp,
  FileText,
  Award,
  Filter,
  RefreshCw,
  Search,
  BookOpen,
  Users
} from 'lucide-react';

import teacherService from '../../services/teacherService';
import Spinner from './student/components/Spinner';
import LogDetailModal from './parent/LogDetailModal';

// ==========================================
// 1. HELPER FUNCTIONS & CONSTANTS
// ==========================================

const formatISODate = (date: Date) => {
    return date.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
};

const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
};

const teacherHabits = [
  { id: 1, icon: "☀️", title: "Bangun Pagi", indicator: "Ketepatan waktu kehadiran siswa di sekolah harian.", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { id: 2, icon: "🙏", title: "Beribadah", indicator: "Ketaatan menjalankan jadwal ibadah sesuai agama masing-masing.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { id: 3, icon: "🏃", title: "Berolahraga", indicator: "Stamina, kesehatan fisik, dan partisipasi aktif dalam PJOK.", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { id: 4, icon: "🥗", title: "Makan Sehat", indicator: "Konsumsi gizi seimbang dan kebersihan bekal makanan.", color: "bg-green-50 border-green-200 text-green-800" },
  { id: 5, icon: "📚", title: "Gemar Belajar", indicator: "Keaktifan literasi dan penyelesaian tugas tepat waktu.", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { id: 6, icon: "🌍", title: "Bermasyarakat", indicator: "Kolaborasi kelompok, empati sosial, dan sopan santun.", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { id: 7, icon: "🌙", title: "Tidur Cepat", indicator: "Kesiapan mental dan fokus konsentrasi belajar di pagi hari.", color: "bg-indigo-50 border-indigo-200 text-indigo-800" }
];

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

const TeacherDashboard: React.FC = () => {
    const printRef = useRef<HTMLDivElement>(null);
    
    // --- State: User & Auth ---
    const [user, setUser] = useState<any>({ fullName: 'Guru', id: 0, nip: '', classId: null });

    // --- State: Loading & Error ---
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // --- State: Dashboard Data ---
    const [data, setData] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]); 
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'beranda' | 'validasi' | 'riwayat' | 'analisis'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- State: Interaction ---
    const [selectedLog, setSelectedLog] = useState<any>(null); 
    const [filterStudentId, setFilterStudentId] = useState<string>('');

    // --- State: AI Analysis ---
    const [reportConfig, setReportConfig] = useState({ studentId: '', startDate: '', endDate: '' });
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
const selectedStudent = data?.students?.find((s: any) => s.id == reportConfig.studentId);
    // ==========================================
    // 3. EFFECTS (Lifecycle)
    // ==========================================

    useEffect(() => {
        // Init User Data
        const userString = localStorage.getItem('user');
        if (userString) {
            setUser(JSON.parse(userString));
        }

        // Init Date Range for Report
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        setReportConfig(prev => ({
            ...prev,
            startDate: formatISODate(lastMonth),
            endDate: formatISODate(today)
        }));

        fetchDashboard();
    }, []);

    useEffect(() => {
        if (activeTab === 'riwayat') {
            handleFetchHistory();
        }
    }, [activeTab, filterStudentId]);

    // ==========================================
    // 4. API HANDLERS
    // ==========================================

    const fetchDashboard = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const res = await teacherService.getDashboard();
            setData(res);
            setLogs(res.logs || []);
        } catch (err: any) {
            console.error("Dashboard Error:", err);
            const message = err.response?.data?.message || 'Gagal memuat data kelas. Pastikan Class ID Anda sudah terdaftar.';
            setErrorMsg(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFetchHistory = async () => {
        // Cek apakah data dashboard dasar sudah masuk (punya teacherClassId)
        if (!data?.teacherClassId) return;
    
        try {
            const res = await teacherService.getClassHistory(filterStudentId || undefined);
            setHistoryLogs(res || []);
        } catch (error: any) {
            console.error("History Error:", error);
            if (error.response?.status === 403) {
                toast.error('Akses riwayat ditolak. Hubungi Admin.');
            }
        }
    };

    const handleValidate = async (logId: number) => {
        const result = await toast.promise(
            teacherService.validateLog(logId),
            {
                loading: 'Mengesahkan jurnal...',
                success: 'Jurnal siswa berhasil disahkan! ✅',
                error: 'Gagal mengesahkan jurnal.'
            }
        );

        if (result) {
            fetchDashboard();
            setSelectedLog(null);
        }
    };

    const handleGenerateReport = async () => {
        if (!reportConfig.studentId) return toast.error('Silakan pilih siswa!');
        if (!reportConfig.startDate || !reportConfig.endDate) return toast.error('Periode tanggal tidak lengkap!');

        setIsGenerating(true);
        setAnalysisResult(null);

        try {
            const result = await teacherService.generateReport({
                studentId: parseInt(reportConfig.studentId),
                startDate: reportConfig.startDate,
                endDate: reportConfig.endDate
            });
            setAnalysisResult(result);
            toast.success('Sintesis Karakter AI Berhasil Disusun!', { icon: '✨' });
        } catch (err: any) {
            const errNote = err.response?.data?.message || 'AI sedang sibuk, coba beberapa saat lagi.';
            toast.error(errNote);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const handlePrint = () => {
        window.print();
    };

    // ==========================================
    // 5. RENDER HELPERS
    // ==========================================

    const navItemClass = (id: string) => `
        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold duration-300
        ${activeTab === id 
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
            : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}
    `;

    const pendingCount = logs.filter((l: any) => l.status === 'Disetujui').length;

    if (isLoading) return (
        <div className="h-screen w-full flex flex-col justify-center items-center bg-slate-50">
            <Spinner />
            <p className="mt-4 text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Menyusun Ruang Kelas...</p>
        </div>
    );

    if (errorMsg) return (
        <div className="h-screen flex flex-col justify-center items-center bg-slate-100 p-6 text-center">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-lg w-full border border-slate-200">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Akses Terbatas</h2>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">{errorMsg}</p>
                <div className="flex flex-col gap-3">
                    <button onClick={fetchDashboard} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                        <RefreshCw size={20} /> Coba Muat Ulang
                    </button>
                    <button onClick={handleLogout} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all flex justify-center items-center gap-2">
                        <LogOut size={20} /> Keluar Akun
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
            
            {/* PRINT LOGIC CSS */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
                    .no-print { display: none !important; }
                    @page { size: portrait; margin: 1cm; }
                }
            `}</style>

            {/* SIDEBAR */}
            <aside className={`fixed md:sticky top-0 h-screen w-80 bg-white border-r border-slate-200 z-30 transition-transform duration-500 ease-in-out flex flex-col no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-8 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-slate-900 leading-tight tracking-tighter">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">Teacher Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-rose-500 transition-colors">
                        <X size={28} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="px-4 mb-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utama</p></div>
                    <button onClick={() => { setActiveTab('beranda'); setIsSidebarOpen(false); }} className={navItemClass('beranda')}>
                        <LayoutDashboard size={22}/> Beranda Dashboard
                    </button>
                    <button onClick={() => { setActiveTab('validasi'); setIsSidebarOpen(false); }} className={navItemClass('validasi')}>
                        <CheckSquare size={22}/> Validasi Jurnal
                        {pendingCount > 0 && (
                            <span className="ml-auto bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce shadow-lg shadow-rose-200">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    
                    <div className="px-4 mt-8 mb-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laporan & Analitik</p></div>
                    <button onClick={() => { setActiveTab('riwayat'); setIsSidebarOpen(false); }} className={navItemClass('riwayat')}>
                        <CalendarDays size={22}/> Riwayat Kelas
                    </button>
                    <button onClick={() => { setActiveTab('analisis'); setIsSidebarOpen(false); }} className={navItemClass('analisis')}>
                        <BarChart3 size={22}/> Analisis & Rapor AI
                    </button>
                </nav>

                <div className="p-6 m-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-100 uppercase ring-4 ring-white">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{user.fullName}</p>
                            <span className="inline-block bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                Wali Kelas {data?.teacherClass}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-black text-rose-600 bg-white border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                        <LogOut size={16} /> Keluar Aplikasi
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                
                {/* Mobile Header Navbar */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-5 flex justify-between items-center md:hidden sticky top-0 z-20 no-print">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <span className="font-black text-slate-800 text-sm tracking-tighter">ISIKOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-xl text-slate-600 active:scale-90 transition-transform">
                        <Menu size={26} />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto pb-32">
                        
                        {/* ==========================================
                            TAB: BERANDA
                        ========================================== */}
                        {activeTab === 'beranda' && (
                            <div className="space-y-10 animate-fade-in">
                                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                        <Sparkles size={200} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="bg-indigo-500/30 w-fit px-4 py-1.5 rounded-full border border-indigo-400/30 mb-6 backdrop-blur-md">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Dashboard Overview</p>
                                        </div>
                                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                                            Selamat Datang,<br/> <span className="text-indigo-400">Bapak/Ibu {user.fullName.split(' ')[0]}!</span>
                                        </h1>
                                        <p className="text-slate-300 max-w-2xl text-lg font-medium leading-relaxed opacity-90">
                                            Anda bertanggung jawab atas perkembangan karakter <span className="text-white font-black underline decoration-indigo-500 underline-offset-4">{data?.students?.length || 0} siswa</span> di kelas <span className="text-white font-black uppercase">{data?.teacherClass}</span>.
                                        </p>
                                        
                                        <div className="mt-12 flex flex-wrap gap-6">
                                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                    <Users size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Total Siswa</p>
                                                    <p className="text-2xl font-black">{data?.students?.length || 0}</p>
                                                </div>
                                            </div>
                                            <div onClick={() => setActiveTab('validasi')} className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                                                <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                                                    <CheckSquare size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Menunggu Sah</p>
                                                    <p className="text-2xl font-black">{pendingCount}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span> 
                                            Indikator Karakter Siswa
                                        </h3>
                                        <BookOpen className="text-slate-300" size={32} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {teacherHabits.map((habit) => (
                                            <div key={habit.id} className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-2 group ${habit.color} bg-opacity-40`}>
                                                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">{habit.icon}</div>
                                                <h3 className="font-black text-xl text-slate-800 mb-3 tracking-tight">{habit.title}</h3>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed opacity-70 italic">"{habit.indicator}"</p>
                                            </div>
                                        ))}
                                        <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                                            <Award size={48} className="text-slate-300 mb-4" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sistem Profil Pelajar Pancasila</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB: VALIDASI JURNAL
                        ========================================== */}
                        {activeTab === 'validasi' && (
                            <div className="space-y-8 animate-slide-up">
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><CheckSquare size={20}/></div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Pusat Validasi</h2>
                                        </div>
                                        <p className="text-slate-500 font-medium ml-12">Sahkan laporan harian yang telah diverifikasi oleh orang tua murid.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 px-8 py-5 rounded-[2rem] text-center border border-slate-100 min-w-[160px] shadow-inner">
                                            <span className="block text-4xl font-black text-indigo-600">{pendingCount}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Siap Sahkan</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    {logs.length > 0 ? (
                                        logs.map((log: any) => {
                                            const isReady = log.status === 'Disetujui';
                                            return (
                                                <div key={log.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row gap-8 items-start lg:items-center group">
                                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-6 duration-500 shadow-lg ${isReady ? 'bg-emerald-100 text-emerald-600 shadow-emerald-100' : 'bg-amber-100 text-amber-600 shadow-amber-100'}`}>
                                                        {isReady ? <UserCheck size={36} /> : <Clock size={36} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
                                                                <CalendarDays size={12}/> {formatDateIndo(log.log_date)}
                                                            </span>
                                                            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${isReady ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                                                                {log.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-black text-2xl text-slate-800 tracking-tight">{log.student_name}</h4>
                                                        {!isReady && (
                                                            <p className="text-xs text-rose-500 font-black mt-2 flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-lg w-fit">
                                                                <AlertCircle size={14}/> BELUM DISETUJUI ORANG TUA
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-3 w-full lg:w-auto">
                                                        <button onClick={() => setSelectedLog(log)} className="flex-1 lg:flex-none px-8 py-4 text-sm font-black text-indigo-600 bg-indigo-50 rounded-2xl hover:bg-indigo-100 transition-colors uppercase tracking-widest">Detail</button>
                                                        <button 
                                                            onClick={() => handleValidate(log.id)} 
                                                            disabled={!isReady} 
                                                            className={`flex-1 lg:flex-none px-10 py-4 text-sm font-black text-white rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isReady ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.05] active:scale-95 shadow-indigo-100' : 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none'}`}
                                                        >
                                                            {isReady ? <><UserCheck size={18}/> SAHKAN SEKARANG</> : 'MENUNGGU'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CheckSquare className="w-12 h-12 text-slate-200" />
                                            </div>
                                            <p className="font-black text-slate-300 text-xl uppercase tracking-[0.3em]">Jurnal Kelas Bersih</p>
                                            <p className="text-slate-400 mt-2 font-medium">Semua aktivitas siswa telah divalidasi hari ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB: RIWAYAT KELAS (KALENDER)
                        ========================================== */}
                        {activeTab === 'riwayat' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-8">
                                    <div className="w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CalendarDays className="text-indigo-600" size={28}/>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Kalender Aktivitas</h2>
                                        </div>
                                        <p className="text-slate-500 font-medium ml-10">Monitoring rekaman karakter harian seluruh siswa.</p>
                                    </div>
                                    <div className="relative w-full lg:w-96 group">
                                        <Filter className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20}/>
                                        <select 
                                            className="w-full border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-4 rounded-3xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none cursor-pointer" 
                                            value={filterStudentId} 
                                            onChange={(e) => setFilterStudentId(e.target.value)}
                                        >
                                            <option value="">Seluruh Siswa Kelas {data?.teacherClass}</option>
                                            {data?.students?.map((s:any) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                    <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-50">
                                        <Calendar 
                                            locale="id-ID" 
                                            className="w-full border-none font-sans text-lg" 
                                            tileClassName={({ date }) => 
                                                historyLogs.some((l:any) => l.log_date.startsWith(formatISODate(date))) 
                                                ? 'bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 scale-90' 
                                                : 'text-slate-600 hover:bg-slate-100 rounded-2xl transition-all'
                                            } 
                                            onClickDay={(date) => { 
                                                const log = historyLogs.find((l:any) => l.log_date.startsWith(formatISODate(date))); 
                                                if(log) setSelectedLog(log); 
                                                else toast('Tidak ada aktivitas tercatat', { icon: '📅', style: { borderRadius: '15px', fontWeight: 'bold' } }); 
                                            }} 
                                        />
                                        <div className="mt-8 pt-8 border-t border-slate-100 flex items-center gap-6 justify-center">
                                            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-indigo-600 rounded-full"></span> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Terisi</span></div>
                                            <div className="flex items-center gap-2"><span className="w-4 h-4 bg-slate-100 border border-slate-200 rounded-full"></span> <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Kosong</span></div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-50 flex flex-col h-[650px]">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="font-black text-xl text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                                                <TrendingUp size={24} className="text-indigo-600"/> Rekaman Terbaru
                                            </h3>
                                            <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black">{historyLogs.length}</span>
                                        </div>
                                        
                                        <div className="overflow-y-auto flex-1 pr-2 space-y-5 custom-scrollbar">
                                            {historyLogs.length > 0 ? (
                                                historyLogs.slice(0, 40).map((h: any) => (
                                                    <div key={h.id} onClick={() => setSelectedLog(h)} className="group p-6 rounded-3xl bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-100 cursor-pointer transition-all hover:shadow-xl shadow-indigo-100/20">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">{h.student_name}</span>
                                                            <span className="text-[9px] text-slate-400 font-black uppercase bg-white px-2 py-1 rounded-md border border-slate-100 tracking-tighter">{h.log_date.split('T')[0]}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${h.status === 'Disahkan' ? 'bg-indigo-600 text-white' : 'bg-amber-400 text-white'}`}>
                                                                {h.status}
                                                            </span>
                                                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all"/>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-20">
                                                    <Search size={48} className="mx-auto text-slate-200 mb-4" />
                                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Belum Ada Data</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            TAB: ANALISIS & RAPOR AI
                        ========================================== */}
                        {activeTab === 'analisis' && (
                            <div className="space-y-10 animate-fade-in pb-20">
                                <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-200 no-print relative overflow-hidden">
                                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-[100px]"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-6 mb-10">
                                            <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 animate-pulse">
                                                <Sparkles size={32}/>
                                            </div>
                                            <div>
                                                <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none mb-3">Generator Rapor AI</h2>
                                                <p className="text-slate-500 font-medium max-w-xl text-lg">Gunakan kekuatan Kecerdasan Buatan untuk menyusun narasi rapor karakter siswa secara objektif dan mendalam.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Pilih Nama Siswa</label>
                                                <select className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all focus:bg-white shadow-inner" value={reportConfig.studentId} onChange={(e) => setReportConfig({ ...reportConfig, studentId: e.target.value })}>
                                                    <option value="">Daftar Siswa...</option>
                                                    {data?.students?.map((s:any) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                                                </select>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Mulai Tanggal</label>
                                                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner" value={reportConfig.startDate} onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}/>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Hingga Tanggal</label>
                                                <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-3xl font-black text-slate-700 outline-none focus:border-indigo-500 transition-all shadow-inner" value={reportConfig.endDate} onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}/>
                                            </div>
                                            <button 
                                                onClick={handleGenerateReport} 
                                                disabled={isGenerating} 
                                                className="h-[68px] bg-slate-900 text-white rounded-3xl font-black hover:bg-indigo-600 hover:scale-[1.03] active:scale-95 transition-all flex justify-center items-center gap-3 shadow-2xl shadow-indigo-100 disabled:opacity-50 disabled:bg-slate-200"
                                            >
                                                {isGenerating ? <RefreshCw className="animate-spin" size={24}/> : <><Sparkles size={24}/> ANALISIS SEKARANG</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {analysisResult && (
                                    <div ref={printRef} className="print-area animate-slide-up pb-20">
                                        <div className="bg-slate-900 p-10 rounded-t-[4rem] flex flex-col md:flex-row justify-between items-center no-print shadow-2xl gap-6">
                                            <div className="flex items-center gap-4 text-white">
                                                <div className="p-3 bg-emerald-500 rounded-2xl"><FileText size={30} /></div>
                                                <div>
                                                    <h3 className="font-black text-2xl tracking-tighter uppercase">Dokumen Rapor Karakter</h3>
                                                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Sintesis Intelegensi Gemini 1.5 Pro</p>
                                                </div>
                                            </div>
                                            <button onClick={handlePrint} className="bg-white text-slate-900 px-12 py-5 rounded-3xl font-black text-base hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl active:scale-90">
                                                <Printer size={22} /> CETAK DOKUMEN RESMI
                                            </button>
                                        </div>

                                        <div className="bg-white p-12 md:p-24 rounded-b-[4rem] shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
                                            
                                            {/* --- KOP SURAT --- */}
                                            <div className="flex items-center justify-center border-b-[6px] border-double border-black pb-8 mb-12 gap-8">
                                                <img src="/logo-smpn6.png" alt="Logo" className="w-32 h-auto" />
                                                <div className="text-center">
                                                    <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-2">SMP NEGERI 6 PEKALONGAN</h1>
                                                    <p className="text-base font-black text-slate-800 uppercase tracking-[0.3em] mb-2">LAPORAN PEMBIASAAN KARAKTER SISWA (ISIKOKURIKULER)</p>
                                                    <p className="text-xs font-bold text-slate-600 italic">Alamat: Jl. Teratai No.31, Poncol, Kec. Pekalongan Tim., Kota Pekalongan, Jawa Tengah 51122</p>
                                                </div>
                                            </div>
                                            
                                            {/* --- IDENTITAS --- */}
                                            <table className="w-full text-base font-bold mt-10 mb-16">
                                                <tbody>
                                                    <tr className="border-b border-slate-100">
                                                        <td className="w-48 py-3 text-slate-500 uppercase text-xs tracking-widest">Nama Peserta Didik</td>
                                                        <td className="w-8 text-center text-slate-300">:</td>
                                                        <td className="text-2xl font-black text-black uppercase tracking-tighter">{selectedStudent?.full_name}</td>
                                                        <td className="w-32 text-right text-slate-500 uppercase text-xs tracking-widest">Kelas</td>
                                                        <td className="w-8 text-center text-slate-300">:</td>
                                                        <td className="w-32 text-2xl font-black text-black text-right uppercase">{data?.teacherClass}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 text-slate-500 uppercase text-xs tracking-widest">Periode Analisis</td>
                                                        <td className="text-center text-slate-300">:</td>
                                                        <td colSpan={4} className="text-slate-800 font-black">{formatDateIndo(reportConfig.startDate)} s.d {formatDateIndo(reportConfig.endDate)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>

                                            {/* --- ISI ANALISIS AI --- */}
                                            <div className="space-y-16 font-serif text-black leading-[1.8] text-justify text-xl px-4">
                                                <section>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <h4 className="font-black text-2xl uppercase tracking-tighter border-l-[10px] border-orange-500 pl-6 py-1">I. Ringkasan Eksekutif</h4>
                                                    </div>
                                                    <p className="pl-10 text-slate-800">{analysisResult.executive_summary}</p>
                                                </section>
                                                
                                                <section>
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <h4 className="font-black text-2xl uppercase tracking-tighter border-l-[10px] border-blue-500 pl-6 py-1">II. Progress Dinamika Karakter</h4>
                                                    </div>
                                                    <p className="pl-10 text-slate-800">{analysisResult.character_progress}</p>
                                                </section>
                                                
                                                <section className="break-inside-avoid">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <h4 className="font-black text-2xl uppercase tracking-tighter border-l-[10px] border-indigo-600 pl-6 py-1">III. Narasi Rapor & Rekomendasi</h4>
                                                    </div>
                                                    <div className="bg-slate-50 p-10 rounded-[3.5rem] border-2 border-indigo-100 italic relative print:bg-transparent print:border-none print:p-6 shadow-inner">
                                                        <span className="absolute -top-10 left-12 text-9xl text-indigo-200/50 no-print font-serif">“</span>
                                                        <p className="relative z-10 font-medium leading-[2]">"{analysisResult.report_narrative}"</p>
                                                        <span className="absolute -bottom-16 right-12 text-9xl text-indigo-200/50 no-print font-serif">”</span>
                                                    </div>
                                                </section>
                                                
                                                {/* --- TANDA TANGAN --- */}
                                                <div className="flex justify-between mt-32 pt-20 border-t border-slate-100 break-inside-avoid">
                                                    <div className="text-center w-80">
                                                        <p className="mb-32 font-black text-slate-800">Mengetahui,<br/><span className="text-xs uppercase tracking-widest text-slate-400">Orang Tua / Wali Murid</span></p>
                                                        <div className="border-t-2 border-black w-full mx-auto mb-1"></div>
                                                        <p className="font-black uppercase tracking-tighter text-black">{selectedStudent?.parent_name || "( ........................................ )"}</p>
                                                    </div>
                                                    
                                                    <div className="text-center w-80">
                                                        <p className="mb-32 font-black text-slate-800">Pekalongan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/><span className="text-xs uppercase tracking-widest text-slate-400">Wali Kelas {data?.teacherClass}</span></p>
                                                        <p className="font-black underline uppercase mb-2 text-black text-xl leading-none tracking-tighter">{user.fullName}</p>
                                                        {/* NIP DINAMIS DARI DATA GURU LOGIN */}
                                                        <p className="text-sm font-black text-slate-700 tracking-widest">NIP. {user.nip || "........................................"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* FOOTER PDF */}
                                            <div className="mt-20 pt-10 text-center border-t border-slate-50 opacity-20 no-print">
                                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Generated by ISIKOKURIKULER Intelligent System v2.0</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* MODAL DETEIL */}
                {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
                
                {/* TOOLTIP ACTION */}
                <div className="fixed bottom-10 right-10 no-print">
                    <button 
                        onClick={fetchDashboard}
                        className="p-5 bg-white text-indigo-600 rounded-full shadow-2xl border border-slate-100 hover:rotate-180 transition-transform duration-700 active:scale-90"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;