import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PenTool, 
  History, 
  LogOut, 
  Menu, 
  X,
  School,
  Lock,
  Phone,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Target // Icon untuk Misi
} from 'lucide-react';
import { useAuth, authApi } from '../../services/authService';
import toast from 'react-hot-toast';

// --- IMPORT SEMUA VIEW (TERMASUK MISI) ---
import CharacterInputView from './contributor/CharacterInputView'; 
import CharacterScheduleView from './contributor/CharacterScheduleView'; // Restore fitur Misi
import HistoryView from './contributor/HistoryView';

const ContributorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State data user
  const [currentUser, setCurrentUser] = useState<any>(user || {});
  const [loadingFresh, setLoadingFresh] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // [RESTORE] Tambahkan 'misi' ke activeTab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'misi' | 'history'>('dashboard');

  // Fetch Data Terbaru
  const fetchFreshData = useCallback(async (showToast = false) => {
    setLoadingFresh(true);
    try {
        const res = await authApi.get('/auth/me');
        if (res.data) {
            console.log("Data Fresh Diterima:", res.data);
            setCurrentUser(res.data);
            if (showToast) toast.success("Data berhasil diperbarui!");
        }
    } catch (error) {
        console.error("Gagal refresh data:", error);
        if (showToast) toast.error("Gagal mengambil data terbaru. Cek koneksi.");
    } finally {
        setLoadingFresh(false);
    }
  }, []);

  useEffect(() => {
    fetchFreshData();
  }, [fetchFreshData]);

  // --- LOGIKA VALIDASI STATUS ---
  const contributorType = currentUser?.contributor_type;
  const agencyName = currentUser?.agency_name;
  const whatsappNumber = currentUser?.whatsapp_number;

  // 1. Cek Identitas
  const hasStatus = Boolean(
      contributorType && 
      (contributorType !== 'Lainnya' || (contributorType === 'Lainnya' && agencyName))
  );

  // 2. Cek WhatsApp
  const hasPhone = Boolean(whatsappNumber && whatsappNumber.length > 5);

  // 3. Status Final
  const isAccountActive = hasStatus && hasPhone;

  // Label Instansi
  const agencyLabel = agencyName || contributorType || 'Kontributor';

  const handleLogout = () => {
    const t = toast.loading('Keluar sistem...');
    setTimeout(() => { 
        logout(); 
        toast.success('Sampai jumpa!', { id: t }); 
        navigate('/login'); 
    }, 800);
  };

  // [RESTORE] Menu Misi Ditambahkan Kembali
  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: <LayoutDashboard size={20} />, disabled: false },
    { id: 'input', label: 'Input Penilaian', icon: <PenTool size={20} />, disabled: !isAccountActive },
    { id: 'misi', label: 'Buat Misi', icon: <Target size={20} />, disabled: !isAccountActive }, // Menu Misi
    { id: 'history', label: 'Riwayat', icon: <History size={20} />, disabled: !isAccountActive },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      
      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Header Sidebar */}
        <div className="p-6 flex items-center justify-between border-b border-gray-50 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-green-50 rounded-xl shadow-sm">
              <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-green-900 leading-none text-sm tracking-tighter">KOKURIKULER</span>
              <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">SMPN 6 Pekalongan</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.disabled) {
                    toast.error("Fitur terkunci. Lengkapi status & No WA.");
                    return;
                }
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-semibold ${
                activeTab === item.id
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-[1.02]'
                  : item.disabled 
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                    : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.disabled && <Lock size={14} className="text-gray-300"/>}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className={`p-4 rounded-[1.5rem] border shadow-sm mb-4 flex items-center gap-3 relative overflow-hidden ${
              !hasStatus 
                ? 'bg-gray-100 border-gray-200' 
                : !hasPhone 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-white border-gray-200'
          }`}>
            <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg text-white ${
                !hasStatus ? 'bg-gray-400' : !hasPhone ? 'bg-amber-400' : 'bg-gradient-to-br from-green-600 to-emerald-700'
            }`}>
                {currentUser?.full_name?.charAt(0) || 'K'}
            </div>
            
            <div className="overflow-hidden z-10 relative">
                <div className="flex items-center gap-1 mb-0.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</p>
                </div>
                
                <p className="text-xs font-black text-gray-800 truncate">{currentUser?.full_name}</p>
                
                <div className={`mt-1 inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider items-center gap-1 ${
                    !hasStatus 
                        ? 'bg-gray-200 text-gray-500' 
                        : !hasPhone 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-green-100 text-green-700'
                }`}>
                    {!hasStatus ? (
                        <>Belum ada status</>
                    ) : !hasPhone ? (
                        <><AlertTriangle size={10}/> Lengkapi WA</>
                    ) : (
                        <><School size={10}/> {agencyLabel.substring(0, 10)}{agencyLabel.length > 10 ? '..' : ''}</>
                    )}
                </div>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-rose-600 bg-white border border-rose-100 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm active:scale-95 group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col">
        
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 shadow-sm transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-smpn6.png" alt="Logo" className="w-7 h-7" />
              <span className="font-black text-green-900 text-xs tracking-tighter uppercase">KOKURIKULER</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl active:scale-90 transition-transform shadow-sm bg-green-50 text-green-600">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-10 max-w-7xl mx-auto w-full pb-20">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black text-gray-800">
                    {activeTab === 'dashboard' && 'Dashboard Kontributor'}
                    {activeTab === 'input' && 'Input Penilaian Siswa'}
                    {activeTab === 'misi' && 'Buat Misi Kebaikan'}
                    {activeTab === 'history' && 'Riwayat Penilaian'}
                </h1>
                <p className="text-gray-500 font-medium">Selamat datang di panel kontribusi ko-kurikuler.</p>
             </div>
             
             {/* Tombol Refresh */}
             <button 
                onClick={() => fetchFreshData(true)} 
                disabled={loadingFresh}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all active:scale-95"
             >
                <RefreshCw size={16} className={loadingFresh ? 'animate-spin text-indigo-600' : ''} />
                {loadingFresh ? 'Memuat...' : 'Cek Status Terbaru'}
             </button>
          </div>

          {/* ALERT BLOCKING */}
          {!isAccountActive && (
             <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm mb-8 animate-fade-in-up">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-800 mb-1">Akses Fitur Dibatasi</h3>
                        <div className="text-sm text-red-700 leading-relaxed mb-3 space-y-2">
                            {!hasStatus && (
                                <p>• Identitas Anda masih <strong>"Belum ada status"</strong>. Sistem membutuhkan kejelasan instansi (Guru/Dinas/KPAI/Komite).</p>
                            )}
                            {!hasPhone && (
                                <p>• Kolom <strong>Nomor WhatsApp</strong> masih kosong ({whatsappNumber || 'Kosong'}). Sistem mewajibkan nomor kontak aktif untuk validasi.</p>
                            )}
                        </div>
                        <div className="bg-white/60 p-4 rounded-lg border border-red-100 text-sm text-red-700">
                            <strong>Solusi:</strong> Hubungi Administrator untuk melengkapi data, lalu klik tombol <b>"Cek Status Terbaru"</b> di kanan atas.
                        </div>
                    </div>
                </div>
             </div>
          )}

          {/* DASHBOARD STATS */}
          {activeTab === 'dashboard' && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Status Akun</div>
                        <div className={`text-xl font-black ${isAccountActive ? 'text-green-600' : 'text-red-500'}`}>
                            {isAccountActive ? 'AKTIF' : 'TERBATAS'}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Peran / Instansi</div>
                        <div className="text-xl font-black text-slate-800">{agencyLabel}</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-slate-400 text-xs font-bold uppercase mb-1">Kontak Terdaftar</div>
                        <div className={`text-xl font-black flex items-center gap-2 ${hasPhone ? 'text-slate-800' : 'text-amber-500'}`}>
                            <Phone size={18} className={hasPhone ? 'text-slate-400' : 'text-amber-500'}/>
                            {whatsappNumber || 'Belum ada'}
                        </div>
                    </div>
                </div>

                {isAccountActive ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-blue-900 mb-2">Input Penilaian</h3>
                            <p className="text-blue-700 mb-6 text-sm">Berikan skor karakter harian kepada siswa.</p>
                            <button onClick={() => setActiveTab('input')} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-200 transition-all">
                                Mulai Input
                            </button>
                        </div>
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-8 text-center hover:shadow-lg transition-all">
                            <h3 className="text-xl font-bold text-purple-900 mb-2">Buat Misi</h3>
                            <p className="text-purple-700 mb-6 text-sm">Berikan tantangan kebaikan untuk siswa.</p>
                            <button onClick={() => setActiveTab('misi')} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg hover:shadow-purple-200 transition-all">
                                Buat Misi
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50">
                        <Lock size={64} className="text-slate-300 mb-4"/>
                        <p className="text-slate-400 font-bold">Menu Terkunci sampai data dilengkapi Admin.</p>
                    </div>
                )}
             </div>
          )}

          {/* Render Active View */}
          {activeTab === 'input' && isAccountActive && (
             <div className="animate-fade-in">
                 <CharacterInputView />
             </div>
          )}

          {activeTab === 'misi' && isAccountActive && (
             <div className="animate-fade-in">
                 <CharacterScheduleView />
             </div>
          )}

          {activeTab === 'history' && isAccountActive && (
             <div className="animate-fade-in">
                 <HistoryView />
             </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ContributorDashboard;