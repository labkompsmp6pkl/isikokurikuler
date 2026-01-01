import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarDays, 
  LogOut, 
  Menu, 
  X,
  UserCircle
} from 'lucide-react';

import parentService, { ParentDashboardData, CharacterLog, StudentPreviewData } from '../../services/parentService';
import { useAuth } from '../../services/authService'; 
import Spinner from './student/components/Spinner';
import ApprovalPanel from './parent/ApprovalPanel';
import HistoryCalendar from './parent/HistoryCalendar';

// --- DATA KONTEN BERANDA ---
const parentHabits = [
  {
    icon: "☀️",
    title: "Bangun Pagi",
    desc: "Ayah & Bunda, biasakan ananda bangun secara mandiri untuk melatih rasa tanggung jawab sejak dini tanpa perlu dibangunkan paksa.",
    color: "bg-orange-50 border-orange-200 text-orange-800"
  },
  {
    icon: "🙏",
    title: "Beribadah",
    desc: "Bimbing ananda dalam menjalankan ibadah harian sesuai keyakinan. Jadikan momen ini sarana penguatan spiritual di rumah.",
    color: "bg-emerald-50 border-emerald-200 text-emerald-800"
  },
  {
    icon: "🏃",
    title: "Berolahraga",
    desc: "Dukung hobi olahraga ananda. Kesehatan fisik adalah fondasi utama agar ananda bisa belajar dengan optimal.",
    color: "bg-blue-50 border-blue-200 text-blue-800"
  },
  {
    icon: "🥗",
    title: "Makan Sehat",
    desc: "Pastikan asupan gizi seimbang bagi ananda. Hindari makanan instan berlebih untuk menjaga pertumbuhan optimal mereka.",
    color: "bg-green-50 border-green-200 text-green-800"
  },
  {
    icon: "📚",
    title: "Gemar Belajar",
    desc: "Hargai rasa ingin tahu ananda. Berikan ruang untuk mereka mengeksplorasi minatnya di luar buku teks sekolah.",
    color: "bg-purple-50 border-purple-200 text-purple-800"
  },
  {
    icon: "🌍",
    title: "Bermasyarakat",
    desc: "Ajarkan ananda etika bergaul dan kepedulian sosial. Biasakan mereka membantu pekerjaan rumah sebagai bentuk kontribusi kecil.",
    color: "bg-teal-50 border-teal-200 text-teal-800"
  },
  {
    icon: "🌙",
    title: "Tidur Cepat",
    desc: "Sepakati waktu tidur malam yang konsisten. Istirahat cukup sangat berpengaruh pada emosi dan daya konsentrasi ananda.",
    color: "bg-indigo-50 border-indigo-200 text-indigo-800"
  }
];

// --- KOMPONEN FORM MENAUTKAN SISWA ---
interface LinkFormProps {
    onLinkSuccess: (data: ParentDashboardData) => void;
    onLogout: () => void;
}

const LinkStudentForm: React.FC<LinkFormProps> = ({ onLinkSuccess, onLogout }) => {
    const [nisn, setNisn] = useState('');
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [previewData, setPreviewData] = useState<StudentPreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckNisn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nisn.trim()) {
            setError('NISN tidak boleh kosong.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await parentService.getStudentPreview(nisn);
            setPreviewData(data);
            setStep('preview');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Siswa tidak ditemukan.');
            toast.error('Data tidak ditemukan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmLink = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Menghubungkan akun...');
        try {
            await parentService.linkStudent(nisn);
            toast.success('Berhasil terhubung!', { id: toastId });
            const initialData = await parentService.getDashboardData();
            onLinkSuccess(initialData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menautkan siswa.');
            toast.error('Gagal menghubungkan', { id: toastId });
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 relative font-sans">
             <div className="absolute top-6 right-6">
                <button 
                    type="button"
                    onClick={onLogout} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                >
                    <LogOut size={18} /> Keluar
                </button>
            </div>
            <div className="w-full max-w-md bg-white shadow-2xl shadow-slate-200 rounded-[2rem] overflow-hidden">
                <div className="bg-indigo-600 p-8 text-center text-white">
                    <h2 className="text-2xl font-black mb-1">Hubungkan Akun</h2>
                    <p className="text-indigo-100 text-sm">Pantau perkembangan karakter ananda.</p>
                </div>
                <div className="p-8">
                    {step === 'input' ? (
                        <form onSubmit={handleCheckNisn} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Masukkan NISN Siswa</label>
                                <input
                                    type="text"
                                    value={nisn}
                                    onChange={(e) => setNisn(e.target.value)}
                                    placeholder="Contoh: 0056xxxxxx"
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-0 focus:border-indigo-500 font-bold text-slate-800 placeholder-slate-300 transition-all text-center text-lg tracking-widest"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70" disabled={isLoading}>
                                {isLoading ? 'Mencari...' : 'Cari Data Siswa'}
                            </button>
                        </form>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-300">
                            {previewData && (
                                <div className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-2xl mb-6 relative overflow-hidden">
                                    <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-indigo-200 rounded-full opacity-30 blur-2xl"></div>
                                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Hasil Pencarian</p>
                                    <h3 className="text-xl font-black text-slate-800 mb-1">{previewData.fullName}</h3>
                                    <p className="text-slate-500 font-bold">Kelas {previewData.class}</p>
                                </div>
                            )}
                            <div className="space-y-3">
                                <button onClick={handleConfirmLink} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all" disabled={isLoading}>
                                    {isLoading ? <Spinner /> : '✅ Benar, Hubungkan'}
                                </button>
                                <button onClick={() => { setStep('input'); setPreviewData(null); setError(null); }} className="w-full py-4 bg-white text-slate-500 font-bold rounded-xl border-2 border-slate-200 hover:bg-slate-50 transition-all" disabled={isLoading}>
                                    ❌ Bukan, Kembali
                                </button>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-6 bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 flex items-center justify-center gap-2 animate-pulse">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA DASHBOARD ---
const ParentDashboard: React.FC = () => {
    const { logout: authLogout } = useAuth();
    
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'beranda' | 'validasi' | 'kalender'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { fullName: 'Orang Tua' };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await parentService.getDashboardData();
            setDashboardData(data);
        } catch (err: any) {
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprovalSuccess = (updatedLog: CharacterLog) => {
        setDashboardData(prevData => {
            if (!prevData) return null;
            const updatedLogs = prevData.logs.map(log => log.id === updatedLog.id ? updatedLog : log);
            return { ...prevData, logs: updatedLogs };
        });
        fetchData();
    };

    // --- FUNGSI LOGOUT DIPERBAIKI (LANGSUNG LOGOUT) ---
    const handleLogout = () => {
        // 1. Set state untuk menyembunyikan UI segera
        setIsLoggingOut(true);
        
        // 2. Langsung logout tanpa konfirmasi window.confirm
        setTimeout(() => {
            authLogout();
        }, 50);
    };

    // --- LOGIC RENDERING ---
    if (isLoggingOut) return <div className="min-h-screen bg-slate-50"></div>;
    if (isLoading) return <div className="flex items-center justify-center h-screen bg-slate-50"><Spinner /></div>;
    
    // Jika data sudah load tapi tidak ada siswa -> Tampilkan LinkForm
    if (!dashboardData?.student) {
        return <LinkStudentForm onLinkSuccess={(data) => setDashboardData(data)} onLogout={handleLogout} />;
    }

    const pendingCount = dashboardData.logs.filter(l => l.status === 'Tersimpan').length;
    const parentInitial = user.fullName.charAt(0).toUpperCase();

    const navItems = [
        { id: 'beranda', label: 'Dukungan Ortu', icon: <LayoutDashboard size={20} /> },
        { id: 'validasi', label: 'Validasi', icon: <CheckSquare size={20} />, badge: pendingCount },
        { id: 'kalender', label: 'Kalender', icon: <CalendarDays size={20} /> },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`
                fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out flex flex-col
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
                        <span className="font-bold text-gray-800 tracking-tight">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(item.id as any);
                                setIsSidebarOpen(false);
                            }}
                            className={`
                                w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium
                                ${activeTab === item.id 
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                            {item.badge ? (
                                <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    {item.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                            {parentInitial}
                        </div>
                        
                        <div className="overflow-hidden w-full">
                            <p className="text-sm font-bold text-gray-800 break-words leading-tight">
                                {user.fullName}
                            </p>
                            
                            <div className="mt-1 flex items-center gap-1">
                                <UserCircle size={12} className="text-gray-400"/>
                                <span className="text-[10px] font-semibold text-gray-500 truncate">
                                    Ananda: {dashboardData.student.full_name}
                                </span>
                            </div>
                            <div className="mt-0.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Kelas {dashboardData.student.class}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm"
                    >
                        <LogOut size={18} />
                        <span>Keluar Aplikasi</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
                        <span className="font-bold text-gray-800 text-sm">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-5xl mx-auto pb-20">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-gray-800">
                                {activeTab === 'beranda' && 'Dukungan Ayah & Bunda'}
                                {activeTab === 'validasi' && 'Konfirmasi Kegiatan'}
                                {activeTab === 'kalender' && 'Riwayat Aktivitas'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1 hidden md:block">
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        {activeTab === 'beranda' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <h1 className="text-3xl font-black mb-4 leading-tight">
                                            7 Kebiasaan <br/>
                                            <span className="text-yellow-300">Indonesia Hebat</span>
                                        </h1>
                                        <p className="text-indigo-100 text-lg font-medium max-w-2xl">
                                            Mari bersinergi membentuk karakter ananda {dashboardData.student.full_name} menjadi pribadi yang unggul.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {parentHabits.map((habit, idx) => (
                                        <div key={idx} className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${habit.color}`}>
                                            <div className="text-4xl mb-4">{habit.icon}</div>
                                            <h3 className="text-lg font-black mb-2">{habit.title}</h3>
                                            <div className="bg-white/60 p-3 rounded-lg">
                                                <p className="text-[10px] font-bold uppercase mb-1 opacity-70">🏠 Peran Orang Tua</p>
                                                <p className="text-sm font-medium leading-relaxed">{habit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'validasi' && (
                            <div className="animate-fade-in">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">Daftar Kegiatan Pending</h3>
                                        <p className="text-gray-500 text-sm">Mohon periksa laporan kegiatan ananda.</p>
                                    </div>
                                    <div className="p-6">
                                        <ApprovalPanel logs={dashboardData.logs} onApproveSuccess={handleApprovalSuccess} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'kalender' && (
                            <div className="animate-fade-in">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                        <h3 className="text-lg font-bold text-gray-800 mb-1">Riwayat Aktivitas</h3>
                                        <p className="text-gray-500 text-sm">Pantau konsistensi kegiatan ananda melalui kalender.</p>
                                    </div>
                                    <div className="p-0">
                                        <HistoryCalendar />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ParentDashboard;