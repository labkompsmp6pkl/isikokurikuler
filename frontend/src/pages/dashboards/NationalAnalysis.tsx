import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Menu, X, 
  BrainCircuit, Sparkles, AlertTriangle, ScrollText, Play,
  BarChart3, Lightbulb, GraduationCap, LayoutDashboard, Users, BookOpen
} from 'lucide-react';
import adminService from '../../services/adminService';

const NationalAnalysis: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // --- STATE ANALISIS ---
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // --- HANDLERS ---
    
    // Fungsi Trigger AI
    const handleStartAnalysis = async () => {
        setLoading(true);
        try {
            const result = await adminService.generateAIAnalysis();
            setAnalysis(result);
        } catch (error) {
            alert("Maaf, sistem analisis sedang sibuk. Silakan coba sesaat lagi.");
        } finally {
            setLoading(false);
        }
    };

    // Logout Stabil (Sama seperti User Management)
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-800">
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* --- SIDEBAR (Struktur Baru) --- */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                
                {/* Header Sidebar */}
                <div className="p-6 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest">ADMINISTRATOR</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-red-500"><X size={24} /></button>
                </div>

                {/* Navigasi Menu */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {/* Dashboard */}
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-medium">
                        <LayoutDashboard size={20}/> <span>Dashboard Utama</span>
                    </button>

                    {/* Sintesis AI (Menu Aktif) */}
                    <button onClick={() => navigate('/admin/analysis')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-medium transition-all">
                        <BrainCircuit size={20}/> <span>Sintesis AI</span>
                    </button>

                    {/* Manajemen User */}
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-medium">
                        <Users size={20}/> <span>Manajemen User</span>
                    </button>

                    {/* Manajemen Kelas */}
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-medium">
                        <BookOpen size={20}/> <span>Manajemen Kelas</span>
                    </button>
                </nav>

                {/* --- Bagian Bawah: Profil & Logout (Sama persis Manajemen User) --- */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-md shadow-indigo-200">
                            A
                        </div>
                        
                        {/* Nama & Role */}
                        <h2 className="font-bold text-slate-800 text-base">Administrator</h2>
                        <p className="text-xs text-slate-500 font-medium mb-5">Super User</p>
                        
                        {/* Tombol Keluar */}
                        <button 
                            onClick={handleLogout} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                        >
                            <LogOut size={16} /> Keluar
                        </button>
                    </div>
                </div>

            </aside>

            {/* --- MAIN CONTENT (Konten Analisis) --- */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-slate-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-10">
                    <div className="max-w-5xl mx-auto pb-20 space-y-10">
                        
                        {/* HEADER SECTION */}
                        <div className="text-center space-y-6 py-8">
                            <div className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl mb-2 shadow-sm">
                                <GraduationCap size={56} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
                                    Laporan Karakter Nasional
                                </h1>
                                <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                                    Sistem cerdas ini akan menganalisis ribuan data jurnal siswa untuk memberikan wawasan mendalam tentang perkembangan karakter di sekolah.
                                </p>
                            </div>
                            
                            {!analysis && !loading && (
                                <button 
                                    onClick={handleStartAnalysis}
                                    className="mt-8 px-10 py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto text-lg"
                                >
                                    <Sparkles fill="currentColor" size={20} /> Mulai Analisis Data
                                </button>
                            )}

                            {loading && (
                                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md mx-auto mt-8">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BrainCircuit size={24} className="text-indigo-600 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-indigo-900 font-bold text-lg">Sedang Memproses...</p>
                                            <p className="text-slate-400 text-sm">Menghubungkan data lintas kelas</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RESULT SECTION */}
                        {analysis && !loading && (
                            <div className="space-y-8 animate-fade-in-up">
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* 1. KEKUATAN KOLEKTIF */}
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <BarChart3 size={140} className="text-emerald-600" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                                                <Sparkles size={24} fill="currentColor"/>
                                            </div>
                                            <h2 className="text-xl font-black text-emerald-900 mb-3">
                                                Kekuatan Utama
                                            </h2>
                                            <p className="text-slate-600 text-lg leading-relaxed">
                                                {analysis.strengths}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. AREA INTERVENSI */}
                                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <AlertTriangle size={140} className="text-amber-500" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                                                <Lightbulb size={24} fill="currentColor" />
                                            </div>
                                            <h2 className="text-xl font-black text-amber-900 mb-3">
                                                Area Perhatian
                                            </h2>
                                            <p className="text-slate-600 text-lg leading-relaxed">
                                                {analysis.interventions}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. REKOMENDASI KEBIJAKAN */}
                                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 shadow-2xl text-white relative overflow-hidden">
                                    {/* Decorative Elements */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                                <ScrollText size={24} className="text-indigo-200"/>
                                            </div>
                                            <h2 className="text-2xl font-black text-white">
                                                Rekomendasi Kebijakan Sekolah
                                            </h2>
                                        </div>
                                        
                                        <div className="relative">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-transparent rounded-full"></div>
                                            <blockquote className="pl-8 text-xl md:text-2xl font-medium leading-relaxed text-slate-200">
                                                "{analysis.recommendations}"
                                            </blockquote>
                                        </div>
                                        
                                        <div className="mt-10 flex justify-end">
                                            <button 
                                                onClick={handleStartAnalysis} 
                                                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all flex items-center gap-2 backdrop-blur-sm"
                                            >
                                                <Play size={14} fill="currentColor"/> Perbarui Analisis
                                            </button>
                                        </div>
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

export default NationalAnalysis;