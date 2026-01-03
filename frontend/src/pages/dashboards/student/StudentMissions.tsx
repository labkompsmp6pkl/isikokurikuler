import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Target, 
    CheckCircle2, 
    Circle, 
    Search, 
    User, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Filter,
    ListFilter
} from 'lucide-react';
import characterService from '../../../services/characterService';
import Spinner from './components/Spinner';

interface Mission {
    id: number;
    title: string;
    habit_category: string;
    contributor_role: string;
    contributor_name: string;
    frequency: string;
    is_completed: number;
}

const StudentMissions: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State Search, Pagination & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6; 

    const fetchMissions = async () => {
        setLoading(true);
        try {
            const data = await characterService.getStudentMissions();
            setMissions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Gagal load misi:", error);
            toast.error("Gagal memuat daftar misi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMissions();
    }, []);

    const handleComplete = async (missionId: number) => {
        const toastId = toast.loading('Memverifikasi misi...');
        try {
            const success = await characterService.completeMission(missionId);
            if (success) {
                toast.success('Misi selesai! Poin bertambah.', { id: toastId });
                fetchMissions(); 
            } else {
                toast.error('Gagal verifikasi misi.', { id: toastId });
            }
        } catch (error) {
            toast.error('Terjadi kesalahan sistem.', { id: toastId });
        }
    };

    // --- LOGIC FILTER ---
    const filteredMissions = missions.filter(m => {
        // 1. Filter Text (Search)
        const matchesSearch = 
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.contributor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.habit_category.toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Filter Status (Selesai / Belum)
        let matchesStatus = true;
        if (filterStatus === 'completed') {
            matchesStatus = m.is_completed > 0;
        } else if (filterStatus === 'incomplete') {
            matchesStatus = m.is_completed === 0;
        }

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMissions = filteredMissions.slice(startIndex, startIndex + itemsPerPage);

    // Reset ke halaman 1 jika search atau filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><Spinner /></div>;

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
            
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                            Misi & Tantangan
                        </h2>
                        <p className="text-sm text-gray-500">
                            Selesaikan tugas dari guru untuk meningkatkan poin karaktermu.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <Target size={24} />
                        <span className="font-bold text-lg">{filteredMissions.length} Misi</span>
                    </div>
                </div>
            </div>

            {/* Search Bar & Filter */}
            <div className="space-y-4 mb-6">
                {/* Input Pencarian */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-400" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full pl-11 pr-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm font-medium"
                        placeholder="Cari misi, nama guru, atau kategori..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tombol Filter Kategori */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button 
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                            filterStatus === 'all' 
                            ? 'bg-slate-800 text-white border-slate-800' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        <ListFilter size={16} /> Semua
                    </button>
                    
                    <button 
                        onClick={() => setFilterStatus('incomplete')}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                            filterStatus === 'incomplete' 
                            ? 'bg-rose-600 text-white border-rose-600' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-rose-50 hover:text-rose-600'
                        }`}
                    >
                        <Circle size={16} /> Belum Selesai
                    </button>

                    <button 
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                            filterStatus === 'completed' 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                    >
                        <CheckCircle2 size={16} /> Selesai
                    </button>
                </div>
            </div>

            {/* Grid Misi */}
            {currentMissions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter size={32} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-600">Tidak ada misi ditemukan</h3>
                    <p className="text-sm text-gray-400">
                        {searchTerm ? 'Coba kata kunci lain.' : 'Belum ada data untuk filter ini.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentMissions.map((mission) => (
                        <div 
                            key={mission.id} 
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between ${
                                mission.is_completed 
                                ? 'bg-emerald-50 border-emerald-100 opacity-90' 
                                : 'bg-white border-indigo-50 hover:border-indigo-200 hover:shadow-md'
                            }`}
                        >
                            <div>
                                {/* Header Card */}
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                        mission.is_completed 
                                        ? 'bg-white text-emerald-600 border border-emerald-100' 
                                        : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                        {mission.habit_category}
                                    </span>
                                    
                                    {mission.is_completed > 0 && (
                                        <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 px-2 py-1 rounded-md">
                                            <CheckCircle2 size={14} /> Selesai
                                        </span>
                                    )}
                                </div>

                                {/* Judul */}
                                <h3 className={`text-lg font-black leading-snug mb-4 ${
                                    mission.is_completed ? 'text-emerald-900 line-through decoration-2 decoration-emerald-300' : 'text-slate-800'
                                }`}>
                                    {mission.title}
                                </h3>

                                {/* Info Kontributor */}
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Briefcase size={14} className="text-indigo-400"/>
                                        <span>{mission.contributor_role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-bold bg-slate-50 p-2 rounded-lg border border-slate-100">
                                        <User size={16} className="text-indigo-500"/>
                                        <span className="truncate">{mission.contributor_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium pl-1">
                                        <Calendar size={12}/>
                                        <span>{mission.frequency === 'daily' ? 'Misi Harian' : 'Misi Mingguan'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Aksi */}
                            {mission.is_completed ? (
                                <button disabled className="w-full py-3 rounded-xl bg-emerald-200 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 cursor-default shadow-sm border border-emerald-300">
                                    <CheckCircle2 size={18} /> Terverifikasi
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleComplete(mission.id)}
                                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Circle size={18} className="text-indigo-200 group-hover:text-white transition-colors" />
                                    Tandai Selesai
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-bold text-sm flex items-center gap-1"
                    >
                        <ChevronLeft size={18} /> Prev
                    </button>
                    
                    <span className="text-sm font-bold text-gray-500">
                        Halaman <span className="text-indigo-600">{currentPage}</span> dari {totalPages}
                    </span>

                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 font-bold text-sm flex items-center gap-1"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentMissions;