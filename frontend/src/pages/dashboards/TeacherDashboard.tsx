import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';

import teacherService from '../../services/teacherService';
import Spinner from './student/components/Spinner';
import LogDetailModal from './parent/LogDetailModal';

// --- HELPER: Format Tanggal (YYYY-MM-DD) Konsisten ---
const formatISODate = (date: Date) => {
    // Menggunakan locale 'en-CA' menghasilkan format YYYY-MM-DD
    return date.toLocaleDateString('en-CA');
};

const formatDateIndo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
};

// --- STATIC DATA: Habit Icons ---
const teacherHabits = [
  { icon: "☀️", title: "Bangun Pagi", indicator: "Ketepatan waktu kehadiran siswa.", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { icon: "🙏", title: "Beribadah", indicator: "Ketaatan menjalankan jadwal ibadah.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { icon: "🏃", title: "Berolahraga", indicator: "Stamina & partisipasi PJOK.", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { icon: "🥗", title: "Makan Sehat", indicator: "Konsumsi bekal/kantin sehat.", color: "bg-green-50 border-green-200 text-green-800" },
  { icon: "📚", title: "Gemar Belajar", indicator: "Keaktifan & tugas tepat waktu.", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { icon: "🌍", title: "Bermasyarakat", indicator: "Kolaborasi & empati sosial.", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { icon: "🌙", title: "Tidur Cepat", indicator: "Fokus konsentrasi di kelas.", color: "bg-indigo-50 border-indigo-200 text-indigo-800" }
];

const TeacherDashboard: React.FC = () => {
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);
    
    // States
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    
    const [activeTab, setActiveTab] = useState<'beranda' | 'validasi' | 'riwayat' | 'analisis'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [logs, setLogs] = useState<any[]>([]); 
    const [historyLogs, setHistoryLogs] = useState<any[]>([]); 
    const [selectedLog, setSelectedLog] = useState<any>(null); 
    const [filterStudentId, setFilterStudentId] = useState<string>('');

    // State untuk Analisis
    const [reportConfig, setReportConfig] = useState({ studentId: '', startDate: '', endDate: '' });
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // [MODIFIKASI] Ambil User beserta NIP dari LocalStorage
    // Pastikan backend mengirim field 'nip' saat login. Jika tidak ada, default string kosong.
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { fullName: 'Guru', id: 0, nip: '' };

    useEffect(() => {
        fetchDashboard();
        // Set default dates for report
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        setReportConfig(prev => ({
            ...prev,
            startDate: formatISODate(lastMonth),
            endDate: formatISODate(today)
        }));
    }, []);

    useEffect(() => {
        if (activeTab === 'riwayat' && data?.teacherClass) {
            handleFetchHistory();
        }
    }, [activeTab, filterStudentId]);

    const fetchDashboard = async () => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const res = await teacherService.getDashboard();
            setData(res);
            setLogs(res.logs);
        } catch (err: any) {
            console.error("Dashboard Fetch Error:", err);
            const message = err.response?.data?.message || 'Gagal memuat data dashboard.';
            setErrorMsg(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleValidate = async (logId: number) => {
        if (!window.confirm('Apakah Anda yakin ingin mengesahkan kegiatan ini?')) return;
        try {
            await teacherService.validateLog(logId);
            toast.success('Kegiatan berhasil disahkan!');
            fetchDashboard(); // Refresh data
            setSelectedLog(null);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal memvalidasi');
        }
    };

    const handleFetchHistory = async () => {
        try {
            const res = await teacherService.getClassHistory(filterStudentId || undefined);
            setHistoryLogs(res);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat riwayat kelas');
        }
    };

    const handleGenerateReport = async () => {
        if (!reportConfig.studentId) return toast.error('Pilih siswa terlebih dahulu');
        if (!reportConfig.startDate || !reportConfig.endDate) return toast.error('Lengkapi periode tanggal');

        setIsGenerating(true);
        try {
            const result = await teacherService.generateReport({
                studentId: parseInt(reportConfig.studentId),
                startDate: reportConfig.startDate,
                endDate: reportConfig.endDate
            });
            setAnalysisResult(result);
            toast.success('Analisis AI selesai!');
        } catch (err) {
            console.error(err);
            toast.error('Gagal membuat analisis AI. Coba lagi.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = () => {
        if(window.confirm('Keluar dari aplikasi?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login', { replace: true });
        }
    };

    // Fungsi Cetak Khusus (Hanya mencetak area laporan)
    const handlePrint = () => {
        window.print();
    };

    // Style Class Helpers
    const navItemClass = (id: string) => `
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200
        ${activeTab === id 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}
    `;

    // [MODIFIKASI] Helper untuk mendapatkan data siswa yang SEDANG DIPILIH di tab Analisis
    const selectedStudent = data?.students?.find((s: any) => s.id == reportConfig.studentId);

    if (isLoading) return <div className="h-screen flex justify-center items-center bg-gray-50"><Spinner /></div>;

    if (errorMsg) return (
        <div className="h-screen flex flex-col justify-center items-center bg-gray-50 p-6 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-gray-800 mb-2">Akses Terbatas</h2>
                <p className="text-gray-600 mb-6">{errorMsg}</p>
                <button onClick={handleLogout} className="btn btn-danger w-full flex justify-center items-center gap-2">
                    <LogOut size={18} /> Keluar Aplikasi
                </button>
            </div>
        </div>
    );

    const pendingCount = logs.filter((l: any) => l.status === 'Disetujui').length;

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans flex text-gray-800">
            {/* --- CUSTOM CSS FOR PRINTING --- */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                    .no-print { display: none !important; }
                    /* Reset background colors for print */
                    .bg-orange-50, .bg-blue-50, .bg-purple-50 { background-color: white !important; border: 1px solid #ddd !important; }
                }
            `}</style>

            {/* OVERLAY MOBILE */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* SIDEBAR */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-out flex flex-col no-print ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISOKURIKULER</h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest">TEACHER PANEL</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('beranda'); setIsSidebarOpen(false); }} className={navItemClass('beranda')}>
                        <LayoutDashboard size={20}/> Beranda
                    </button>
                    <button onClick={() => { setActiveTab('validasi'); setIsSidebarOpen(false); }} className={navItemClass('validasi')}>
                        <CheckSquare size={20}/> Validasi
                        {pendingCount > 0 && <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('riwayat'); setIsSidebarOpen(false); }} className={navItemClass('riwayat')}>
                        <CalendarDays size={20}/> Riwayat Kelas
                    </button>
                    <button onClick={() => { setActiveTab('analisis'); setIsSidebarOpen(false); }} className={navItemClass('analisis')}>
                        <BarChart3 size={20}/> Analisis & Rapor
                    </button>
                </nav>

                <div className="p-4 m-4 bg-indigo-50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm border border-indigo-100">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{user.fullName}</p>
                            <p className="text-xs text-indigo-600 font-semibold">Wali Kelas {data?.teacherClass}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* HEADER MOBILE */}
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10 no-print">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-gray-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto pb-20">
                        
                        {/* --- TAB: BERANDA --- */}
                        {activeTab === 'beranda' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles size={120} />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black mb-3 relative z-10">Selamat Datang, Bapak/Ibu!</h1>
                                    <p className="text-indigo-100 max-w-2xl text-lg font-medium relative z-10">
                                        Ini adalah panel kontrol Anda untuk memantau dan memvalidasi perkembangan karakter siswa kelas {data?.teacherClass}.
                                    </p>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-indigo-600 rounded-full"></span> Indikator Penilaian Karakter
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {teacherHabits.map((habit, idx) => (
                                        <div key={idx} className={`p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-1 ${habit.color} bg-opacity-40`}>
                                            <div className="text-3xl mb-3">{habit.icon}</div>
                                            <h3 className="font-black text-gray-800 mb-1">{habit.title}</h3>
                                            <p className="text-xs font-semibold opacity-80 leading-relaxed">{habit.indicator}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: VALIDASI --- */}
                        {activeTab === 'validasi' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-800">Validasi Jurnal</h2>
                                        <p className="text-gray-500 font-medium mt-1">Sahkan kegiatan siswa yang telah disetujui orang tua.</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-3xl font-black text-indigo-600">{pendingCount}</span>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menunggu Validasi</span>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    {logs.map((log: any) => {
                                        const isReady = log.status === 'Disetujui'; // Status dari Ortu
                                        return (
                                            <div key={log.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isReady ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                    {isReady ? <CheckSquare size={24} /> : <Clock size={24} />}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                                            {formatDateIndo(log.log_date)}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${isReady ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {log.status}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-gray-800 truncate">{log.student_name}</h4>
                                                    {!isReady && <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12}/> Menunggu persetujuan orang tua</p>}
                                                </div>

                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <button onClick={() => setSelectedLog(log)} className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                                                        Lihat Detail
                                                    </button>
                                                    <button 
                                                        onClick={() => handleValidate(log.id)} 
                                                        disabled={!isReady} 
                                                        className={`flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-all flex items-center justify-center gap-2
                                                            ${isReady 
                                                                ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200' 
                                                                : 'bg-gray-300 cursor-not-allowed grayscale opacity-70'}`}
                                                    >
                                                        {isReady ? '✅ Sahkan' : '⏳ Menunggu'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {logs.length === 0 && (
                                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <CheckSquare size={32} />
                                            </div>
                                            <p className="font-bold text-gray-500">Semua tugas validasi sudah selesai!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: RIWAYAT KELAS --- */}
                        {activeTab === 'riwayat' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                                    <div className="w-full">
                                        <h2 className="text-2xl font-black text-gray-800">Kalender Kelas</h2>
                                        <p className="text-gray-500 text-sm">Filter aktivitas siswa per tanggal.</p>
                                    </div>
                                    <select 
                                        className="w-full lg:w-64 border border-gray-300 p-2.5 rounded-xl font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                                        value={filterStudentId} 
                                        onChange={(e) => setFilterStudentId(e.target.value)}
                                    >
                                        <option value="">-- Semua Siswa --</option>
                                        {data?.students.map((s:any) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Kalender */}
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
                                        <Calendar 
                                            locale="id-ID"
                                            className="w-full border-none font-sans"
                                            tileClassName={({ date }) => {
                                                const dateStr = formatISODate(date);
                                                // Cek apakah ada log di tanggal ini
                                                const hasLog = historyLogs.some((l:any) => l.log_date.startsWith(dateStr));
                                                return hasLog ? 'bg-indigo-50 text-indigo-700 font-bold rounded-lg' : null;
                                            }}
                                            onClickDay={(date) => {
                                                const dateStr = formatISODate(date);
                                                const logsOnDate = historyLogs.filter((l:any) => l.log_date.startsWith(dateStr));
                                                
                                                if(logsOnDate.length > 0) {
                                                    setSelectedLog(logsOnDate[0]); // Buka detail log pertama
                                                    if(logsOnDate.length > 1) toast.success(`Ditemukan ${logsOnDate.length} jurnal siswa.`);
                                                } else {
                                                    toast('Tidak ada data pada tanggal ini', { icon: '📅' });
                                                }
                                            }}
                                        />
                                        <div className="mt-4 flex justify-center items-center gap-2 text-xs text-gray-500">
                                            <span className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded-md"></span> Tanggal dengan aktivitas
                                        </div>
                                    </div>

                                    {/* List Aktivitas Terkini */}
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 flex flex-col h-[500px]">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Clock size={18} className="text-indigo-600"/> Riwayat Terkini
                                        </h3>
                                        <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
                                            {historyLogs.slice(0, 20).map((h: any) => (
                                                <div key={h.id} onClick={() => setSelectedLog(h)} className="group p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-gray-800 text-sm">{h.student_name}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium">{formatDateIndo(h.log_date)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${h.status === 'Disahkan' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {h.status}
                                                        </span>
                                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400"/>
                                                    </div>
                                                </div>
                                            ))}
                                            {historyLogs.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Belum ada riwayat tercatat.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ANALISIS & RAPOR --- */}
                        {activeTab === 'analisis' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-200 no-print">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Sparkles size={24}/></div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-800">Generator Rapor AI</h2>
                                            <p className="text-gray-500 text-sm">Analisis otomatis perkembangan karakter siswa.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Siswa</label>
                                            <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={reportConfig.studentId} onChange={(e) => setReportConfig({ ...reportConfig, studentId: e.target.value })}>
                                                <option value="">-- Pilih Siswa --</option>
                                                {data?.students.map((s:any) => (<option key={s.id} value={s.id}>{s.full_name}</option>))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Dari Tanggal</label>
                                            <input type="date" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none" value={reportConfig.startDate} onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}/>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Sampai Tanggal</label>
                                            <input type="date" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none" value={reportConfig.endDate} onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}/>
                                        </div>
                                        <button onClick={handleGenerateReport} disabled={isGenerating} className="h-[50px] bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70">
                                            {isGenerating ? <Spinner /> : <><Sparkles size={18}/> Analisis Sekarang</>}
                                        </button>
                                    </div>
                                </div>

                                {analysisResult && (
                                    <div ref={printRef} className="print-area animate-slide-up">
                                        {/* HEADER TOMBOL (Disembunyikan saat print) */}
                                        <div className="bg-white p-6 rounded-t-3xl border-b border-gray-100 flex justify-between items-center no-print shadow-sm">
                                            <h3 className="font-bold text-gray-800">Hasil Analisis</h3>
                                            <button onClick={handlePrint} className="bg-gray-900 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors flex items-center gap-2">
                                                <Printer size={16} /> Cetak PDF Resmi
                                            </button>
                                        </div>

                                        {/* KONTEN LAPORAN */}
                                        <div className="bg-white p-8 md:p-12 rounded-b-3xl shadow-xl border border-gray-100 print:shadow-none print:border-none print:p-0">
                                            
                                            {/* KOP SURAT (Tampil Bagus di Print) */}
                                            <div className="text-center border-b-4 border-double border-black pb-6 mb-8">
                                                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-1">SMP NEGERI 6 PEKALONGAN</h1>
                                                <p className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4">Laporan Perkembangan Karakter Siswa (ISOKURIKULER)</p>
                                                
                                                <table className="w-full text-left text-sm font-medium mt-6">
                                                    <tbody>
                                                        <tr>
                                                            <td className="w-24 py-1">Nama Siswa</td>
                                                            <td className="w-4">:</td>
                                                            <td className="font-bold">{selectedStudent?.full_name}</td>
                                                            <td className="w-24 text-right">Kelas</td>
                                                            <td className="w-4 text-center">:</td>
                                                            <td className="w-20 font-bold">{data.teacherClass}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-1">Periode</td>
                                                            <td>:</td>
                                                            <td colSpan={4}>{formatDateIndo(reportConfig.startDate)} s/d {formatDateIndo(reportConfig.endDate)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* ISI LAPORAN */}
                                            <div className="space-y-8 font-serif text-gray-900 leading-relaxed text-justify">
                                                <section>
                                                    <h4 className="font-bold text-lg mb-2 underline decoration-2 decoration-orange-300 underline-offset-4">1. Ringkasan Eksekutif</h4>
                                                    <p>{analysisResult.executive_summary}</p>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-lg mb-2 underline decoration-2 decoration-blue-300 underline-offset-4">2. Progress Karakter</h4>
                                                    <p>{analysisResult.character_progress}</p>
                                                </section>

                                                <section>
                                                    <h4 className="font-bold text-lg mb-2 underline decoration-2 decoration-purple-300 underline-offset-4">3. Catatan Wali Kelas (Narasi Rapor)</h4>
                                                    <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-indigo-500 italic print:bg-transparent print:border-l-2 print:border-black print:p-2">
                                                        "{analysisResult.report_narrative}"
                                                    </div>
                                                </section>

                                                {/* TANDA TANGAN */}
                                                <div className="flex justify-between mt-16 pt-8 break-inside-avoid">
                                                    <div className="text-center w-56">
                                                        <p className="mb-20">Mengetahui,<br/>Orang Tua/Wali</p>
                                                        {/* [MODIFIKASI] Tampilkan nama ortu dari data siswa */}
                                                        <p className="border-t border-black pt-1 font-bold">
                                                            {selectedStudent?.parent_name ? selectedStudent.parent_name : "( ........................................ )"}
                                                        </p>
                                                    </div>
                                                    <div className="text-center w-64">
                                                        <p className="mb-20">
                                                            Pekalongan, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                            <br/>Wali Kelas
                                                        </p>
                                                        <p className="font-bold underline uppercase mb-1">{user.fullName}</p>
                                                        {/* [MODIFIKASI] Tampilkan NIP Guru Login */}
                                                        <p className="text-sm">NIP. {user.nip ? user.nip : ".............................."}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* MODAL DETAIL */}
                {selectedLog && (
                    <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;