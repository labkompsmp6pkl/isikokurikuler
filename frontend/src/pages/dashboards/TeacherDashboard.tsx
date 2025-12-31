import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import CollectiveReportTemplate, { ClassAnalysisData } from './teacher/CollectiveReportTemplate';
import { useNavigate } from 'react-router-dom';

interface UserData {
  role: string;
  class?: string;
  fullName: string;
  nip?: string;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ClassAnalysisData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'teacher') {
        navigate('/login');
      }
      setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await aiService.generateClassRecap(startDate, endDate);
      
      if (response.data.analysis) {
        setAnalysis(response.data.analysis);
        setStats(response.data.stats);
      } else {
        alert(response.data.message || "Tidak ada data untuk dianalisis.");
      }
    } catch (error: any) {
      console.error("Gagal melakukan analisis", error);
      const msg = error.response?.data?.message || "Terjadi kesalahan koneksi ke server.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      
      {/* Header Dashboard dengan Logout */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 uppercase tracking-tight">Dasbor Wali Kelas</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            SMP Negeri 6 Pekalongan • Kelas Binaan: <span className="text-indigo-600">{user?.class || '-'}</span>
          </p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-400">Selamat Datang,</p>
              <p className="font-black text-lg">{user?.fullName}</p>
           </div>
           <button 
             onClick={handleLogout}
             className="bg-red-50 text-red-600 px-5 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
           >
             Keluar
           </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel Kontrol (Kiri) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                <h2 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                    <span>📅</span> Filter Periode
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Mulai</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-slate-50 font-bold border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Sampai</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-slate-50 font-bold border-2 border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-100">
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !user?.class}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Memproses Data Kelas...</span>
                            </>
                        ) : (
                            <>
                                <span>✨ Generate Analisis Real</span>
                            </>
                        )}
                    </button>
                    {!user?.class && (
                        <p className="text-[10px] text-red-500 text-center mt-2 font-bold">Akun Anda belum diset sebagai Wali Kelas.</p>
                    )}
                </div>
            </div>

            {/* Statistik Cepat Real */}
            {stats && (
                <div className="bg-indigo-900 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative z-10 grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Partisipasi</h3>
                            <p className="text-2xl font-black">{stats.activeStudents}<span className="text-sm opacity-50">/{stats.totalStudents}</span></p>
                        </div>
                        <div>
                            <h3 className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Jurnal</h3>
                            <p className="text-2xl font-black">{stats.totalLogs}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Panel Hasil (Kanan) */}
        <div className="lg:col-span-2">
            {!analysis ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-[2rem] border-4 border-dashed border-slate-200 text-slate-300 p-10 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-black uppercase text-slate-400">Siap Menganalisis</h3>
                    <p className="font-bold text-sm max-w-md mx-auto mt-2 text-slate-400">
                        Sistem akan mengambil data jurnal siswa kelas <span className="text-indigo-400">{user?.class || '...'}</span> secara otomatis dari database dan menyusun 8 Profil Lulusan.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Hasil Analisis Kolektif</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Berbasis Data Jurnal Siswa</p>
                        </div>
                        <button 
                            onClick={() => setShowReport(true)}
                            className="w-full md:w-auto bg-white border-2 border-slate-900 text-slate-900 px-6 py-2 rounded-xl font-black text-xs uppercase hover:bg-slate-900 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span>🖨️</span> Cetak Laporan PDF
                        </button>
                    </div>
                    
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto">
                        <AnalysisCard title="Keimanan & Ketakwaan" content={analysis.keimanan} color="bg-emerald-50 text-emerald-800 border-emerald-100" />
                        <AnalysisCard title="Kewargaan & Sosial" content={analysis.kewargaan} color="bg-blue-50 text-blue-800 border-blue-100" />
                        <AnalysisCard title="Penalaran Kritis" content={analysis.penalaranKritis} color="bg-indigo-50 text-indigo-800 border-indigo-100" />
                        <AnalysisCard title="Kreativitas" content={analysis.kreativitas} color="bg-purple-50 text-purple-800 border-purple-100" />
                        <AnalysisCard title="Kolaborasi" content={analysis.kolaborasi} color="bg-orange-50 text-orange-800 border-orange-100" />
                        <AnalysisCard title="Kemandirian" content={analysis.kemandirian} color="bg-slate-50 text-slate-800 border-slate-200" />
                        <AnalysisCard title="Kesehatan Fisik" content={analysis.kesehatan} color="bg-rose-50 text-rose-800 border-rose-100" />
                        <AnalysisCard title="Komunikasi" content={analysis.komunikasi} color="bg-teal-50 text-teal-800 border-teal-100" />
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* Modal Cetak (Template sudah diperbarui) */}
      {showReport && analysis && (
        <CollectiveReportTemplate 
            analysis={analysis}
            startDate={startDate}
            endDate={endDate}
            onClose={() => setShowReport(false)}
            // Tambahkan dua baris di bawah ini:
            teacherName={user?.fullName || "Nama Guru"}
            teacherNIP={user?.nip || "-"} 
        />
      )}
    </div>
  );
};

const AnalysisCard = ({ title, content, color }: { title: string, content: string, color: string }) => (
    <div className={`p-5 rounded-2xl border ${color} transition-all hover:scale-[1.01]`}>
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{title}</h4>
        <p className="text-xs font-bold leading-relaxed">{content || "Belum ada cukup data untuk menganalisis aspek ini."}</p>
    </div>
);

export default TeacherDashboard;