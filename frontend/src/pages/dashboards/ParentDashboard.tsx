import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import parentService, { ParentDashboardData, CharacterLog, StudentPreviewData } from '../../services/parentService';
import Spinner from './student/components/Spinner';
import ApprovalPanel from './parent/ApprovalPanel';
import Navbar from '../../components/Navbar';
import HistoryCalendar from './parent/HistoryCalendar';
import WeeklyAnalyticsChart from './parent/WeeklyAnalyticsChart';

// --- KOMPONEN FORM MENAUTKAN SISWA (Tetap Sama dengan sedikit styling tambahan) ---
const LinkStudentForm: React.FC<{ onLinkSuccess: (data: ParentDashboardData) => void }> = ({ onLinkSuccess }) => {
    const navigate = useNavigate();
    const [nisn, setNisn] = useState('');
    const [step, setStep] = useState<'input' | 'preview'>('input');
    const [previewData, setPreviewData] = useState<StudentPreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = () => {
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }
    };

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
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                    Keluar
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
                                    {isLoading ? <Spinner size="sm" color="white"/> : '✅ Benar, Hubungkan'}
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
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { fullName: 'Orang Tua' };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await parentService.getDashboardData();
            setDashboardData(data);
        } catch (err: any) {
            if (err.response?.status !== 404) setError(err.message || 'Gagal memuat data.');
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
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center h-screen bg-slate-50"><Spinner size="lg" /><p className="mt-4 text-slate-500 font-bold animate-pulse">Memuat Dasbor...</p></div>;
    if (error) return <div className="flex flex-col items-center justify-center h-screen bg-rose-50 p-8"><h2 className="text-2xl font-black text-rose-800">Terjadi Kesalahan</h2><p className="mt-2 text-rose-600">{error}</p><button onClick={fetchData} className="mt-6 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl shadow-lg hover:bg-rose-700 transition">Muat Ulang</button></div>;
    if (!dashboardData?.student) return <LinkStudentForm onLinkSuccess={(data) => setDashboardData(data)} />;

    // --- Hitung Statistik Sederhana untuk Kartu ---
    const pendingCount = dashboardData.logs.filter(l => l.status === 'Tersimpan').length;
    const totalLogs = dashboardData.logs.length; // Ini hanya log yang diambil (pending/approved tergantung API)

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
            <Navbar />
            
            <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
                
                {/* 1. SECTION HERO: Identitas Anak & Orang Tua */}
                <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-600 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-indigo-200 text-white overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400 opacity-10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <p className="text-indigo-200 font-bold text-sm uppercase tracking-widest mb-1">Selamat Datang, {user.fullName}</p>
                            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                                Laporan Perkembangan <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">
                                    Ananda {dashboardData.student.full_name}
                                </span>
                            </h1>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-sm font-bold tracking-wide">Kelas {dashboardData.student.class}</span>
                            </div>
                        </div>
                        
                        {/* Kartu Statistik Mini di dalam Header */}
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                                <p className="text-xs text-indigo-200 font-bold uppercase mb-1">Perlu Disetujui</p>
                                <p className="text-3xl font-black">{pendingCount}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl min-w-[120px]">
                                <p className="text-xs text-indigo-200 font-bold uppercase mb-1">Total Entri</p>
                                <p className="text-3xl font-black">{totalLogs}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SECTION CONTENT: Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* KOLOM KIRI (Utama): Panel Persetujuan */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <span>📝</span> Konfirmasi Kegiatan
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium mt-1">
                                        Periksa dan setujui jurnal harian ananda.
                                    </p>
                                </div>
                                {pendingCount > 0 && (
                                    <span className="bg-rose-100 text-rose-600 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                                        {pendingCount} Pending
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                <ApprovalPanel logs={dashboardData.logs} onApproveSuccess={handleApprovalSuccess} />
                            </div>
                        </div>
                    </div>

                    {/* KOLOM KANAN: Analisis & Kalender */}
                    <div className="space-y-8">
                        {/* Grafik Analisis */}
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
                            <h2 className="text-lg font-black mb-6 text-slate-700 uppercase flex items-center gap-2 tracking-wide">
                                <span>📊</span> Analisis Mingguan
                            </h2>
                            <WeeklyAnalyticsChart />
                        </div>

                        {/* Kalender Riwayat */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
                            <HistoryCalendar />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ParentDashboard;