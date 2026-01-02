import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
    LayoutDashboard, 
    Target, 
    History, 
    LogOut, 
    Menu, 
    X, 
    Send, 
    CalendarDays, 
    Award, 
    UserCircle, 
    Users, 
    CheckCircle 
} from 'lucide-react';

import contributorService from '../../services/contributorService';

// Interface untuk tipe data kelas
interface ClassOption {
    id: string | number;
    name: string;
}

const ContributorDashboard: React.FC = () => {
    const navigate = useNavigate();
    
    // --- STATE MANAGEMENT ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'beranda' | 'misi' | 'riwayat'>('beranda');
    const [activeMissionTab, setActiveMissionTab] = useState<'sikap' | 'jadwal'>('sikap');
    const [isLoading, setIsLoading] = useState(true);

    // Data State
    const [user, setUser] = useState<any>({ fullName: 'Kontributor' });
    const [students, setStudents] = useState<any[]>([]); 
    const [classes, setClasses] = useState<ClassOption[]>([]); // MODIFIKASI: Gunakan interface ClassOption
    const [historyData, setHistoryData] = useState<any[]>([]); 

    // Form State: Penilaian Sikap
    const [sikapForm, setSikapForm] = useState({
        role: "Guru Mata Pelajaran",
        studentId: '',
        category: 'Bangun Pagi',
        date: new Date().toISOString().split('T')[0],
        score: 80,
        notes: ''
    });

    // Form State: Misi
    const [modalMisiOpen, setModalMisiOpen] = useState(false);
    const [selectedHabitForMission, setSelectedHabitForMission] = useState('');
    const [misiForm, setMisiForm] = useState({
        targetType: 'siswa', 
        targetId: '', // Berisi student_id atau class_id
        title: '',
        dueDate: ''
    });

    const habits = [
        { title: "Bangun Pagi", icon: "☀️", color: "bg-orange-50 text-orange-700", desc: "Ketepatan waktu kehadiran" },
        { title: "Beribadah", icon: "🙏", color: "bg-emerald-50 text-emerald-700", desc: "Ketaatan ibadah & adab" },
        { title: "Berolahraga", icon: "🏃", color: "bg-blue-50 text-blue-700", desc: "Stamina & aktivitas fisik" },
        { title: "Makan Sehat", icon: "🥗", color: "bg-green-50 text-green-700", desc: "Gizi & kebersihan makanan" },
        { title: "Gemar Belajar", icon: "📚", color: "bg-purple-50 text-purple-700", desc: "Keaktifan & tugas" },
        { title: "Bermasyarakat", icon: "🌍", color: "bg-teal-50 text-teal-700", desc: "Sosialisasi & empati" },
        { title: "Tidur Cepat", icon: "🌙", color: "bg-indigo-50 text-indigo-700", desc: "Fokus & istirahat cukup" }
    ];

    const contributorRoles = [
        "Guru Mata Pelajaran", "Guru Tamu / Motivator", "Pelatih Ekskul", "Masyarakat"
    ];

    // --- EFFECTS & API CALLS ---

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            navigate('/login', { replace: true });
            return;
        }
        
        try {
            setUser(JSON.parse(storedUser));
            loadInitialData();
        } catch (e) {
            handleLogout();
        }
    }, []);

    const loadInitialData = async () => {
        try {
            const data = await contributorService.getData();
            setStudents(data.students || []);
            // MODIFIKASI: Pastikan data kelas yang diterima memiliki struktur id dan name
            setClasses(data.classes || []); 
            
            await loadHistory(); 
        } catch (error) {
            console.error("Gagal memuat data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await contributorService.getHistory();
            setHistoryData(data);
        } catch (error) {
            console.error("Gagal memuat riwayat", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const handleKirimSikap = async () => {
        if (!sikapForm.studentId) return Swal.fire('Perhatian', 'Pilih siswa terlebih dahulu', 'warning');
        
        try {
            await contributorService.submitScore(sikapForm);
            Swal.fire({
                title: 'Berhasil',
                text: 'Nilai sikap berhasil dikirim!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setSikapForm(prev => ({ ...prev, score: 80, notes: '' }));
            loadHistory(); 
        } catch (error) {
            Swal.fire('Gagal', 'Terjadi kesalahan saat mengirim nilai.', 'error');
        }
    };

    const openMissionModal = (habitTitle: string) => {
        setSelectedHabitForMission(habitTitle);
        setMisiForm({ targetType: 'siswa', targetId: '', title: '', dueDate: '' });
        setModalMisiOpen(true);
    };

    const handleJadwalkanMisi = async () => {
        if (!misiForm.title || !misiForm.targetId || !misiForm.dueDate) {
            return Swal.fire('Lengkapi Data', 'Judul misi, target, dan tanggal wajib diisi.', 'warning');
        }

        const payload: any = {
            habit: selectedHabitForMission,
            title: misiForm.title,
            dueDate: misiForm.dueDate
        };

        if (misiForm.targetType === 'siswa') {
            payload.studentId = misiForm.targetId;
        } else {
            // MODIFIKASI: Mengirimkan class_id sebagai target
            payload.classId = misiForm.targetId; 
        }

        try {
            await contributorService.assignMission(payload);
            Swal.fire({
                title: 'Terjadwal!',
                text: `Misi berhasil diberikan.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setModalMisiOpen(false);
        } catch (error) {
            Swal.fire('Gagal', 'Tidak dapat menjadwalkan misi.', 'error');
        }
    };

    const navItemClass = (id: string) => `
        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200
        ${activeTab === id 
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
            : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}
    `;

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans flex text-gray-800">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* SIDEBAR */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-emerald-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest">CONTRIBUTOR</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('beranda'); setIsSidebarOpen(false); }} className={navItemClass('beranda')}>
                        <LayoutDashboard size={20}/> Instruksi Misi
                    </button>
                    <button onClick={() => { setActiveTab('misi'); setIsSidebarOpen(false); }} className={navItemClass('misi')}>
                        <Target size={20}/> Misi & Penilaian
                    </button>
                    <button onClick={() => { setActiveTab('riwayat'); setIsSidebarOpen(false); }} className={navItemClass('riwayat')}>
                        <History size={20}/> Riwayat Kontribusi
                    </button>
                </nav>

                <div className="p-4 m-4 bg-emerald-50 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold shadow-sm border border-emerald-100">
                            {user.fullName ? user.fullName.charAt(0) : 'C'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{user.fullName}</p>
                            <p className="text-xs text-emerald-600 font-semibold">Role: Kontributor</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-gray-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-5xl mx-auto pb-20">
                        {activeTab === 'beranda' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                    <h1 className="text-3xl font-black mb-2 relative z-10">Misi Kebiasaan Indonesia Hebat</h1>
                                    <p className="text-emerald-100 max-w-2xl text-lg font-medium relative z-10">
                                        Sebagai kontributor, Anda berperan penting dalam memberikan penilaian sikap dan tantangan untuk membentuk karakter siswa.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {habits.map((habit, idx) => (
                                        <div key={idx} className="p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-3xl">{habit.icon}</span>
                                                <h3 className="text-lg font-black text-gray-800">{habit.title}</h3>
                                            </div>
                                            <div className={`p-3 rounded-xl ${habit.color} bg-opacity-20 border border-opacity-20`}>
                                                <p className="text-xs font-bold uppercase mb-1 opacity-80 flex items-center gap-1"><Target size={12}/> Indikator</p>
                                                <p className="text-sm font-medium leading-snug">{habit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'misi' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-6">
                                    <button onClick={() => setActiveMissionTab('sikap')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeMissionTab === 'sikap' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-2"><Award size={16}/> Penilaian Sikap</div>
                                    </button>
                                    <button onClick={() => setActiveMissionTab('jadwal')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeMissionTab === 'jadwal' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-2"><CalendarDays size={16}/> Agenda Misi Siswa</div>
                                    </button>
                                </div>

                                {activeMissionTab === 'sikap' && (
                                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 max-w-2xl">
                                        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
                                            <span className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><Award size={20}/></span>
                                            Input Nilai Sikap
                                        </h2>
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Peran Anda</label>
                                                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500" value={sikapForm.role} onChange={(e) => setSikapForm({...sikapForm, role: e.target.value})}>
                                                    {contributorRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Target Siswa</label>
                                                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500" value={sikapForm.studentId} onChange={(e) => setSikapForm({...sikapForm, studentId: e.target.value})}>
                                                    <option value="">-- Pilih Siswa --</option>
                                                    {students.map((s:any) => (
                                                        // MODIFIKASI: Menampilkan nama kelas relasional jika ada (s.class_name)
                                                        <option key={s.id} value={s.id}>{s.full_name} ({s.class_name || s.class || '-'})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Kategori Kebiasaan</label>
                                                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500" value={sikapForm.category} onChange={(e) => setSikapForm({...sikapForm, category: e.target.value})}>
                                                    {habits.map((h, i) => <option key={i} value={h.title}>{h.icon} {h.title}</option>)}
                                                </select>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                                                <div className="mt-1 text-blue-600"><CalendarDays size={18}/></div>
                                                <div>
                                                    <p className="text-sm font-bold text-blue-800 uppercase">Tanggal Penilaian</p>
                                                    <input type="date" className="bg-transparent border-b border-blue-300 text-blue-900 font-bold text-sm outline-none mt-1" value={sikapForm.date} onChange={(e) => setSikapForm({...sikapForm, date: e.target.value})} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex justify-between">
                                                    <span>Skor Sikap</span>
                                                    <span className="text-emerald-600 font-black text-lg">{sikapForm.score}</span>
                                                </label>
                                                <input type="range" min="0" max="100" step="5" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" value={sikapForm.score} onChange={(e) => setSikapForm({...sikapForm, score: parseInt(e.target.value)})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Catatan (Opsional)</label>
                                                <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-sm text-gray-700 outline-none focus:border-emerald-500" rows={2} placeholder="Contoh: Sangat sopan..." value={sikapForm.notes} onChange={(e) => setSikapForm({...sikapForm, notes: e.target.value})} />
                                            </div>
                                            <button onClick={handleKirimSikap} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg flex justify-center items-center gap-2">
                                                <Send size={20}/> Kirim Penilaian
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeMissionTab === 'jadwal' && (
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                            <h2 className="text-xl font-black text-gray-800 mb-2">Agenda Misi Siswa</h2>
                                            <p className="text-gray-500 text-sm">Tantangan akan muncul di dashboard target.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {habits.map((habit, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-3xl group-hover:scale-110 transition-transform">{habit.icon}</div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-700">{habit.title}</h3>
                                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Buat Agenda</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => openMissionModal(habit.title)} className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-xs rounded-lg hover:bg-emerald-100 hover:text-emerald-700 transition-colors uppercase">
                                                        Buat Misi
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'riwayat' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-800">Kalender Kontribusi</h2>
                                        <p className="text-gray-500 text-sm">Daftar penilaian yang telah Anda lakukan.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 lg:col-span-1">
                                        <Calendar className="w-full border-none font-sans" locale="id-ID"/>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 lg:col-span-2">
                                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><History size={18} className="text-emerald-600"/> Log Aktivitas</h3>
                                        <div className="overflow-y-auto max-h-[400px] space-y-3 pr-2 custom-scrollbar">
                                            {historyData.length === 0 ? (
                                                <p className="text-center text-gray-400 text-sm py-10">Belum ada riwayat.</p>
                                            ) : (
                                                historyData.map((h: any) => (
                                                    <div key={h.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center group hover:bg-emerald-50 transition-colors">
                                                        <div>
                                                            <div className="flex gap-2 mb-1">
                                                                <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">{new Date(h.record_date).toLocaleDateString('id-ID')}</span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">{h.type}</span>
                                                            </div>
                                                            <p className="font-bold text-gray-800 text-sm">{h.student_name} <span className="text-gray-400 text-xs">({h.class_name || h.class})</span></p>
                                                            <p className="text-xs text-gray-500">{h.category || h.type_detail}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-xl font-black text-emerald-600">+{h.score}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL JADWAL MISI */}
            {modalMisiOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl scale-100 transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-black text-xl text-gray-800">Buat Misi Baru</h3>
                                <p className="text-sm text-emerald-600 font-bold">{selectedHabitForMission}</p>
                            </div>
                            <button onClick={() => setModalMisiOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Judul Misi (Tantangan)</label>
                                <input type="text" placeholder="Contoh: Membaca buku 15 menit" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500" value={misiForm.title} onChange={(e) => setMisiForm({...misiForm, title: e.target.value})} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Target Penerima</label>
                                <div className="flex gap-2 mb-2">
                                    <button onClick={() => setMisiForm({...misiForm, targetType: 'siswa', targetId: ''})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${misiForm.targetType === 'siswa' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                                        <UserCircle size={14} className="inline mr-1"/> Perorangan
                                    </button>
                                    <button onClick={() => setMisiForm({...misiForm, targetType: 'kelas', targetId: ''})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${misiForm.targetType === 'kelas' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                                        <Users size={14} className="inline mr-1"/> Satu Kelas
                                    </button>
                                </div>
                                
                                {misiForm.targetType === 'siswa' ? (
    <select 
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500"
        value={misiForm.targetId} 
        onChange={(e) => setMisiForm({...misiForm, targetId: e.target.value})}
    >
        <option value="">-- Pilih Siswa --</option>
        {students.map(s => (
            <option key={s.id} value={s.id}>
                {/* FIX: Gunakan s.class_name dari hasil JOIN backend */}
                {s.full_name} ({s.class_name || 'Tanpa Kelas'})
            </option>
        ))}
    </select>
) : (
    /* Bagian Dropdown Satu Kelas */
    <select 
        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500"
        value={misiForm.targetId} 
        onChange={(e) => setMisiForm({...misiForm, targetId: e.target.value})}
    >
        <option value="">-- Pilih Kelas --</option>
        {classes.map(c => (
            // FIX: Gunakan c.id sebagai value dan c.name sebagai tampilan
            <option key={c.id} value={c.id}>{c.name}</option>
        ))}
    </select>
)}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tenggat Waktu</label>
                                <input type="date" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-gray-700 outline-none focus:border-emerald-500" value={misiForm.dueDate} onChange={(e) => setMisiForm({...misiForm, dueDate: e.target.value})} />
                            </div>

                            <button onClick={handleJadwalkanMisi} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg mt-4 flex justify-center items-center gap-2">
                                <CheckCircle size={18}/> Simpan Misi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContributorDashboard;