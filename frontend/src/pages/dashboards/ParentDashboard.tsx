import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    LayoutDashboard, 
    CheckSquare, 
    CalendarDays, 
    LogOut, 
    Menu, 
    X,
    Search,
    UserPlus,
    UserCheck,
    Lock,
    Unlock, 
    Users,
    ShieldCheck,
    ArrowRight,
    KeyRound
} from 'lucide-react';

import parentService, { ParentDashboardData } from '../../services/parentService';
import { useAuth, authApi } from '../../services/authService'; 
import Spinner from './student/components/Spinner';
import ApprovalPanel from './parent/ApprovalPanel';
import HistoryCalendar from './parent/HistoryCalendar';
import PersonalEmailAlert from '../../components/PersonalEmailAlert'; // [PENTING] Import Komponen Alert

// --- INTERFACE ---
interface StudentSearchResult {
    id: number;
    full_name: string;
    nisn: string;
    class_name: string;
    class_level: string;
    is_active: boolean; 
    is_linked_to_me: boolean; 
}

const parentHabits = [
  { icon: "☀️", title: "Bangun Pagi", desc: "Ayah & Bunda, biasakan ananda bangun secara mandiri.", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { icon: "🙏", title: "Beribadah", desc: "Bimbing ananda dalam menjalankan ibadah harian sesuai keyakinan.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { icon: "🏃", title: "Berolahraga", desc: "Dukung hobi olahraga ananda agar fisik tetap prima.", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { icon: "🥗", title: "Makan Sehat", desc: "Pastikan asupan gizi seimbang bagi ananda.", color: "bg-green-50 border-green-200 text-green-800" },
  { icon: "📚", title: "Gemar Belajar", desc: "Berikan ruang untuk mereka mengeksplorasi minatnya.", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { icon: "🌍", title: "Bermasyarakat", desc: "Ajarkan ananda etika bergaul dan kepedulian sosial.", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { icon: "🌙", title: "Tidur Cepat", desc: "Sepakati waktu tidur malam yang konsisten.", color: "bg-indigo-50 border-indigo-200 text-indigo-800" }
];

// --- COMPONENT: FORM LINK STUDENT (SEARCH MODE) ---
interface LinkFormProps {
    onLinkSuccess: (data: ParentDashboardData) => void;
    onLogout: () => void;
}

const LinkStudentForm: React.FC<LinkFormProps> = ({ onLinkSuccess, onLogout }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<StudentSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null);
    const [relationship, setRelationship] = useState<'Ayah' | 'Ibu' | 'Wali'>('Ayah');
    const [studentPassword, setStudentPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!searchTerm.trim()) {
            toast.error("Mohon masukkan NISN");
            return;
        }

        setIsLoading(true);
        setHasSearched(true);
        setStudents([]); 

        try {
            const res = await authApi.get('/parent/search-students', {
                params: { q: searchTerm.trim() }
            });
            const data = res.data.data || res.data;
            setStudents(Array.isArray(data) ? data : []); 
        } catch (error) {
            console.error("Gagal load siswa", error);
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmLink = async () => {
        if (!selectedStudent) return;
        
        if (!selectedStudent.is_active && (!studentPassword || studentPassword.length < 6)) {
            toast.error('Akun siswa belum aktif. Wajib buat password (min 6 karakter).');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Menghubungkan...');
        
        try {
            await parentService.linkStudent({
                nisn: selectedStudent.nisn,
                studentPassword: selectedStudent.is_active ? '' : studentPassword, 
                relationship: relationship
            });
            
            toast.success('Berhasil terhubung!', { id: toastId });
            const initialData = await parentService.getDashboardData();
            onLinkSuccess(initialData);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal menghubungkan', { id: toastId });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2">
                   <div className="bg-emerald-600 text-white p-2 rounded-lg font-bold">OT</div>
                   <div>
                       <h1 className="font-bold text-slate-800 leading-none">Hubungkan Siswa</h1>
                       <p className="text-[10px] text-slate-500 font-medium mt-0.5">Validasi NISN</p>
                   </div>
                </div>
                <button onClick={onLogout} className="text-rose-600 font-bold text-xs bg-rose-50 px-3 py-2 rounded-lg hover:bg-rose-100 transition">
                    <LogOut size={14} className="inline mr-1"/> Logout
                </button>
            </div>

            <div className="flex-1 max-w-2xl mx-auto w-full p-4 pb-32 flex flex-col items-center justify-center -mt-20">
                
                <div className="w-full bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    
                    <h2 className="text-center font-black text-slate-800 text-xl mb-2">Cari Data Ananda</h2>
                    <p className="text-center text-slate-400 text-sm mb-8 font-medium">Masukkan <span className="text-emerald-600 font-bold">NISN</span> secara lengkap dan tepat.</p>
                    
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <input 
                            type="text" 
                            placeholder="Contoh: 0081234567" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, ''))} // Hanya angka
                            className="w-full pl-6 pr-32 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 focus:outline-none font-bold text-slate-800 text-lg placeholder:text-slate-300 transition-all tracking-widest text-center"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !searchTerm}
                            className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                            {isLoading ? <Spinner /> : <><Search size={18} /> Cari</>}
                        </button>
                    </form>
                </div>

                {hasSearched && (
                    <div className="w-full mt-8 animate-in slide-in-from-bottom-4 duration-500">
                        {students.length > 0 ? (
                            students.map((student) => (
                                <div 
                                    key={student.id} 
                                    onClick={() => !student.is_linked_to_me && setSelectedStudent(student)}
                                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 group bg-white shadow-lg ${
                                        student.is_linked_to_me 
                                            ? 'border-slate-200 opacity-80 cursor-default' 
                                            : 'border-emerald-100 hover:border-emerald-500 cursor-pointer scale-100 hover:scale-[1.02]'
                                    }`}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-200">
                                            {student.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Data Ditemukan</p>
                                            <h3 className="font-black text-slate-800 text-xl truncate">{student.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wide">{student.nisn}</span>
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase">Kelas {student.class_name}</span>
                                            </div>
                                        </div>
                                        <div>
                                            {student.is_linked_to_me ? (
                                                <div className="bg-slate-100 p-2 rounded-full text-slate-400"><UserCheck size={24} /></div>
                                            ) : (
                                                <div className="bg-emerald-100 p-2 rounded-full text-emerald-600 animate-bounce"><ArrowRight size={24} /></div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <div className="text-xs font-medium text-slate-400">Status Akun</div>
                                        {student.is_linked_to_me ? (
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><UserCheck size={14}/> Sudah Terhubung</span>
                                        ) : !student.is_active ? (
                                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><Lock size={14}/> Perlu Aktivasi</span>
                                        ) : (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><UserPlus size={14}/> Siap Dihubungkan</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <div className="inline-flex bg-slate-50 p-4 rounded-full text-slate-300 mb-3">
                                    <Search size={32} />
                                </div>
                                <h3 className="font-bold text-slate-800">Data Tidak Ditemukan</h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                                    NISN yang Anda masukkan tidak terdaftar. Silakan periksa kembali angka yang dimasukkan.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL LINKING (MANUAL) */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 rounded-t-[2rem] ${selectedStudent ? 'translate-y-0' : 'translate-y-full'}`}>
                {selectedStudent && (
                    <div className="max-w-xl mx-auto p-6 md:p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-800">Hubungkan Akun</h3>
                                <p className="text-sm text-slate-500">Anda akan terhubung sebagai Orang Tua dari <span className="font-bold text-emerald-600">{selectedStudent.full_name}</span>.</p>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pilih Peran Anda</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['Ayah', 'Ibu', 'Wali'] as const).map((rel) => (
                                        <button
                                            key={rel}
                                            onClick={() => setRelationship(rel)}
                                            className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center gap-1 ${
                                                relationship === rel 
                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200'
                                            }`}
                                        >
                                            <Users size={18} />
                                            {rel}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedStudent.is_active ? (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0"><ShieldCheck size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">Akun Aman</p>
                                        <p className="text-xs text-blue-600 leading-relaxed">
                                            Password untuk akun siswa ini sudah diatur sebelumnya. Anda bisa langsung menghubungkan akun tanpa pengaturan tambahan.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-sm">
                                        <Unlock size={18} />
                                        <span>Aktivasi Akun Siswa</span>
                                    </div>
                                    <p className="text-xs text-amber-700 mb-4 leading-relaxed border-b border-amber-200/50 pb-3">
                                        Karena ini pertama kalinya akun siswa dihubungkan, mohon buatkan password agar ananda bisa login ke aplikasi siswa nantinya.
                                    </p>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Password Baru</label>
                                        <input 
                                            type="text" 
                                            placeholder="Minimal 6 Karakter"
                                            value={studentPassword}
                                            onChange={(e) => setStudentPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-slate-800 font-bold focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handleConfirmLink}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2 active:scale-[0.98]"
                            >
                                {isSubmitting ? <Spinner /> : (
                                    <><span>Konfirmasi & Hubungkan</span><ArrowRight size={20} /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENT: ACTIVATION FORM (FOR PRE-LINKED USERS) ---
// Ini muncul jika Admin sudah menghubungkan orang tua, tapi akun siswa belum diaktivasi (belum ada password)
const ActivationStudentForm: React.FC<{ studentName: string, studentNisn: string, onActivateSuccess: (data: any) => void, onLogout: () => void }> = ({ studentName, studentNisn, onActivateSuccess, onLogout }) => {
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleActivate = async () => {
        if (password.length < 6) {
            toast.error("Password minimal 6 karakter.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Mengaktifkan akun siswa...');

        try {
            await parentService.linkStudent({
                nisn: studentNisn,
                studentPassword: password,
                relationship: 'Wali'
            });

            toast.success('Akun siswa berhasil diaktifkan!', { id: toastId });
            const initialData = await parentService.getDashboardData();
            onActivateSuccess(initialData);

        } catch (error: any) {
            toast.error(error.response?.data?.message || "Gagal aktivasi.", { id: toastId });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                        <KeyRound size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Aktivasi Akun Siswa</h2>
                    <p className="text-slate-500 text-sm">
                        Halo Ayah/Bunda! Anda telah terhubung dengan <span className="font-bold text-slate-800">{studentName}</span>.
                    </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6">
                    <p className="text-xs text-slate-600 leading-relaxed text-center">
                        Untuk keamanan dan agar ananda bisa login ke aplikasi siswa, mohon buatkan <strong>Password</strong> terlebih dahulu.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Buat Password Baru</label>
                        <input 
                            type="text" 
                            placeholder="Minimal 6 Karakter"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-center text-lg"
                        />
                    </div>

                    <button 
                        onClick={handleActivate}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                    >
                        {isSubmitting ? <Spinner /> : "Simpan & Masuk Dashboard"}
                    </button>

                    <button onClick={onLogout} className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition">
                        Logout / Batal
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- UTAMA: PARENT DASHBOARD ---
const ParentDashboard: React.FC = () => {
    // [PENTING] Gunakan user dari Context Auth, bukan localStorage manual agar reaktif
    const { user, logout: authLogout } = useAuth();
    
    const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'beranda' | 'validasi' | 'kalender'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const resData = await parentService.getDashboardData();
            if (!resData || !resData.student) {
                setDashboardData(null); 
            } else {
                setDashboardData(resData);
            }
        } catch (err: any) {
            setDashboardData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // 1. Loading State
    if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Spinner /></div>;

    // 2. Logic Pengecekan Data Siswa
    if (dashboardData && dashboardData.student) {
        
        // Cek status aktif (apakah sudah punya password)
        const isStudentActive = Boolean((dashboardData.student as any).is_active);

        if (!isStudentActive) {
            return (
                <ActivationStudentForm 
                    studentName={dashboardData.student.full_name}
                    studentNisn={dashboardData.student.nisn || ''} 
                    onActivateSuccess={setDashboardData}
                    onLogout={authLogout}
                />
            );
        }

        // Jika Aktif -> Lanjut render Dashboard
    } else {
        // Belum terhubung sama sekali -> Tampilkan Form Search
        return <LinkStudentForm onLinkSuccess={setDashboardData} onLogout={authLogout} />;
    }

    // --- DASHBOARD DATA UI ---
    const pendingCount = dashboardData.logs.filter(l => l.status === 'Tersimpan').length;
    const relationshipLabel = dashboardData.student.relationship || 'Wali Murid';

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
             {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" alt="Logo" className="w-8 h-8" />
                        <span className="font-bold text-gray-800 tracking-tight">KOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'beranda', label: 'Dukungan', icon: <LayoutDashboard size={20} /> },
                        { id: 'validasi', label: 'Validasi', icon: <CheckSquare size={20} />, badge: pendingCount },
                        { id: 'kalender', label: 'Kalender', icon: <CalendarDays size={20} /> },
                    ].map((item) => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === item.id ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                            <div className="flex items-center gap-3">{item.icon}<span>{item.label}</span></div>
                            {item.badge ? <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span> : null}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm uppercase">
                            {user?.fullName?.charAt(0) || 'O'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.fullName || 'Orang Tua'}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{relationshipLabel}</p>
                        </div>
                    </div>
                    <button onClick={authLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 rounded-lg transition-colors">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden bg-white/90 backdrop-blur border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                        <img src="/logo-smpn6.png" className="w-6 h-6"/> <span className="text-sm">KOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-slate-600 bg-slate-100 rounded-lg"><Menu size={24} /></button>
                </header>

                <div className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-24">
                    
                    {/* [BARU] Alert Email Pribadi - Akan mengecek user.personal_email */}
                    <PersonalEmailAlert />

                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {activeTab === 'beranda' ? 'Dukungan Orang Tua' : activeTab === 'validasi' ? 'Konfirmasi Aktivitas' : 'Riwayat Kegiatan'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ananda</p>
                            <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{dashboardData.student.full_name}</p>
                        </div>
                    </div>

                    {activeTab === 'beranda' && (
                        <div className="space-y-6 animate-fade-in">
                             <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-black mb-2 leading-tight tracking-tighter">7 Kebiasaan <span className="text-yellow-300 italic">Indonesia Hebat</span></h1>
                                    <p className="text-emerald-100 font-medium opacity-90 max-w-2xl">Mari bersama membangun karakter positif ananda setiap hari.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {parentHabits.map((h, i) => (
                                    <div key={i} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${h.color}`}>
                                            <div className="text-3xl mb-3">{h.icon}</div>
                                            <h3 className="font-black text-lg mb-1">{h.title}</h3>
                                            <p className="text-xs font-medium opacity-80 leading-relaxed">{h.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'validasi' && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
                             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Daftar Jurnal Pending</h3>
                                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold">{pendingCount}</span>
                            </div>
                            <div className="p-4">
                                <ApprovalPanel 
                                    logs={dashboardData.logs} 
                                    onApproveSuccess={() => fetchData()} 
                                    currentUserId={user?.id || 0}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'kalender' && (
                        <div className="animate-slide-up">
                            <HistoryCalendar />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ParentDashboard;