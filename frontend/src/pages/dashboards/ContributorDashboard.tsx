import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    LayoutDashboard, 
    Target, 
    CalendarDays, 
    LogOut, 
    Menu, 
    X,
    Trophy,
    Sun, Heart, Activity, Coffee, BookOpen, Users, Moon, ClipboardList
} from 'lucide-react';

import { useAuth } from '../../services/authService';
import Spinner from './student/components/Spinner';

// Sub-Components
import CharacterMainView from './contributor/CharacterMainView'; 
import HistoryView from './contributor/HistoryView';
import StudentSelectorView from './contributor/StudentSelectorView';

const contributorHabits = [
  { icon: <Sun size={32} />, title: "Bangun Pagi", indicator: "Ketepatan waktu kehadiran siswa di sekolah dan kesiapan memulai pelajaran jam pertama.", color: "bg-orange-50 border-orange-200 text-orange-800" },
  { icon: <Heart size={32} />, title: "Beribadah", indicator: "Ketaatan menjalankan jadwal ibadah sekolah dan sikap santun dalam bertindak harian.", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { icon: <Activity size={32} />, title: "Berolahraga", indicator: "Stamina siswa dalam mengikuti kegiatan sekolah dan partisipasi aktif dalam pelajaran PJOK.", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { icon: <Coffee size={32} />, title: "Makan Sehat", indicator: "Pilihan menu bekal siswa atau jajanan kantin yang dikonsumsi selama di sekolah.", color: "bg-green-50 border-green-200 text-green-800" },
  { icon: <BookOpen size={32} />, title: "Gemar Belajar", indicator: "Keaktifan bertanya di kelas, ketepatan mengumpulkan tugas, dan kemandirian dalam mencari sumber belajar.", color: "bg-purple-50 border-purple-200 text-purple-800" },
  { icon: <Users size={32} />, title: "Bermasyarakat", indicator: "Kemampuan berkolaborasi dengan teman sejawat dan empati terhadap lingkungan sekolah.", color: "bg-teal-50 border-teal-200 text-teal-800" },
  { icon: <Moon size={32} />, title: "Tidur Cepat", indicator: "Fokus konsentrasi siswa di dalam kelas dan tidak terlihat mengantuk saat jam pelajaran.", color: "bg-indigo-50 border-indigo-200 text-indigo-800" }
];

const ContributorDashboard: React.FC = () => {
    const { logout } = useAuth();
    
    const [user, setUser] = useState<any>({ fullName: 'Kontributor', role: 'contributor' });
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'beranda' | 'karakter' | 'riwayat'>('beranda');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [isStudentSelectorOpen, setStudentSelectorOpen] = useState(false);

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) setUser(JSON.parse(userString));
    }, []);

    const handleLogout = () => {
        const toastId = toast.loading('Keluar sistem...', { id: 'logout-process' });
        setTimeout(() => {
            logout();
            toast.success('Berhasil logout', { id: toastId });
        }, 800);
    };

    const navItems = [
        { id: 'beranda', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'karakter', label: 'Karakter', icon: <Target size={20} /> }, 
        { id: 'riwayat', label: 'Riwayat', icon: <CalendarDays size={20} /> },
    ];

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Spinner /></div>;

    if(isStudentSelectorOpen) {
        return <StudentSelectorView students={students} onSelect={() => {}} onBack={() => setStudentSelectorOpen(false)} />
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-slate-800">
            {/* OVERLAY MOBILE */}
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
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-rose-600"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <button 
                            key={item.id} 
                            type="button" 
                            onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors font-medium ${
                                activeTab === item.id 
                                ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold shadow-md uppercase">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="overflow-hidden w-full">
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{user.fullName}</p>
                            <div className="mt-1 flex flex-col">
                                <span className="text-[10px] font-semibold text-gray-500 truncate">Halaman Kontributor</span>
                                <span className="text-[10px] font-bold text-rose-600 mt-0.5 uppercase tracking-wider">Ekstrakurikuler</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm">
                        <LogOut size={18} /> <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT WRAPPER */}
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
                        <div className="w-9 h-9 shrink-0 rounded-full bg-rose-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {user.fullName.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Halaman Kontributor</p>
                            <p className="text-xs font-black text-gray-800 truncate mt-1">{user.fullName}</p>
                        </div>
                    </div>
                </header>

                {/* CONTENT AREA */}
                <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-20">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                            {activeTab === 'beranda' && 'Instruksi Pengembangan Karakter'}
                            {activeTab === 'karakter' && 'Pengembangan Karakter'} 
                            {activeTab === 'riwayat' && 'Riwayat Aktivitas'}
                        </h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Panel Kontributor</p>
                    </div>

                    {activeTab === 'beranda' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-gradient-to-r from-rose-700 to-pink-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><Trophy size={24} /></div>
                                        <span className="font-bold tracking-widest uppercase text-xs">Panduan Penilaian</span>
                                    </div>
                                    <h1 className="text-3xl font-black mb-4 leading-tight tracking-tighter">Halo, <span className="text-yellow-300 italic">{user.fullName}</span></h1>
                                    <p className="text-rose-100 text-lg font-medium max-w-2xl opacity-90">
                                        Peran Anda sangat penting. Anda bisa menilai sikap siswa secara langsung atau membuat target karakter terjadwal.
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                                    <ClipboardList size={200} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {contributorHabits.map((habit, idx) => (
                                    <div key={idx} className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg ${habit.color} bg-white`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm">{habit.icon}</div>
                                        </div>
                                        <h3 className="font-black text-lg mb-2">{habit.title}</h3>
                                        <div className="bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white/50">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1 flex items-center gap-1">
                                                <ClipboardList size={12}/> Target Penilaian
                                            </p>
                                            <p className="text-xs font-bold leading-relaxed">{habit.indicator}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'karakter' && <CharacterMainView />}
                    {activeTab === 'riwayat' && <HistoryView />}
                </main>
            </div>
        </div>
    );
};

export default ContributorDashboard;