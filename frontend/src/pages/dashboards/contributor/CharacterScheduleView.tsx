import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Calendar, Save, ChevronDown, Repeat, Filter
} from 'lucide-react';
import contributorService from '../../../services/contributorService';
import { authApi, useAuth } from '../../../services/authService';

interface ClassData {
    id: string;
    name: string;
    academic_year: string; // [PENTING] Tambahkan field ini dari API
    student_count: number;
}

const CharacterScheduleView: React.FC = () => {
    const { user } = useAuth(); 
    const [classes, setClasses] = useState<ClassData[]>([]);
    
    // State Filter Tahun Ajaran
    const [activeYearFilter, setActiveYearFilter] = useState('');
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    // State Form
    const [targetClass, setTargetClass] = useState('');
    const [habitCategory, setHabitCategory] = useState('Gemar Belajar');
    const [title, setTitle] = useState('');
    const [frequency, setFrequency] = useState('weekly');
    const [dayOfWeek, setDayOfWeek] = useState('Monday');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await authApi.get('/auth/classes-list');
                
                let receivedData: ClassData[] = [];
                if (Array.isArray(res.data)) {
                    receivedData = res.data;
                } else if (res.data && Array.isArray(res.data.data)) {
                    receivedData = res.data.data;
                }

                if (Array.isArray(receivedData)) {
                    setClasses(receivedData);
                    
                    // Ekstrak Tahun Ajaran Unik & Urutkan (Terbaru di atas)
                    const years = Array.from(new Set(receivedData.map(c => c.academic_year)))
                        .filter(y => y) // Hapus null/undefined
                        .sort()
                        .reverse();
                    
                    setAvailableYears(years);
                    
                    // Set default filter ke tahun terbaru (biasanya tahun aktif)
                    if (years.length > 0) setActiveYearFilter(years[0]);
                } else {
                    console.error("API Error: Data format not recognized", res.data);
                    setClasses([]); 
                }
            } catch (err) { 
                console.error("Failed to fetch classes:", err); 
                setClasses([]); 
            }
        };
        fetchClasses();
    }, []);

    // Filter Kelas berdasarkan Tahun Ajaran yang dipilih
    const filteredClasses = classes.filter(c => 
        activeYearFilter ? c.academic_year === activeYearFilter : true
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalRole = (user as any)?.agency_name || (user as any)?.contributor_type || 'Kontributor';
        
        if (!title.trim()) return toast.error('Judul karakter wajib diisi', { id: 'val-title' });

        setIsSubmitting(true);
        const toastId = toast.loading('Menjadwalkan karakter...', { id: 'schedule-process' });

        try {
            await contributorService.createMissionSchedule({
                contributor_role: finalRole, 
                title,
                habit_category: habitCategory,
                target_class: targetClass,
                frequency,
                day_of_week: dayOfWeek
            });

            toast.success('Jadwal karakter berhasil dibuat!', { id: toastId });
            setTitle('');
        } catch (err) {
            console.error(err);
            toast.error('Gagal membuat jadwal.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const days = [
        { val: 'Monday', label: 'Senin' }, { val: 'Tuesday', label: 'Selasa' },
        { val: 'Wednesday', label: 'Rabu' }, { val: 'Thursday', label: 'Kamis' },
        { val: 'Friday', label: 'Jumat' }, { val: 'Saturday', label: 'Sabtu' },
    ];

    const habits = ["Bangun Pagi", "Beribadah", "Berolahraga", "Makan Sehat", "Gemar Belajar", "Bermasyarakat", "Tidur Cepat"];

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-rose-100 animate-fade-in">
            
            <div className="flex items-center gap-4 mb-10 border-b border-rose-50 pb-6">
                <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                    <Calendar size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Target Karakter (Jadwal)</h2>
                    <p className="text-rose-500 font-bold text-sm uppercase tracking-widest">Penugasan Berulang</p>
                </div>
            </div>

            <div className="space-y-6">
                
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Karakter / Tugas</label>
                    <input type="text" className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500" placeholder="Contoh: Membaca Buku Paket Hal 10-15" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                        <div className="relative">
                            <select value={habitCategory} onChange={(e) => setHabitCategory(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                                {habits.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                            <span>Target Kelas</span>
                            {/* Filter Tahun Kecil di Label */}
                            {activeYearFilter && <span className="text-rose-500">({activeYearFilter})</span>}
                        </label>
                        
                        {/* Wrapper untuk Filter Tahun + Select Kelas */}
                        <div className="flex gap-2">
                            {/* 1. Filter Tahun Ajaran */}
                            <div className="relative w-1/3">
                                <select 
                                    value={activeYearFilter} 
                                    onChange={(e) => {
                                        setActiveYearFilter(e.target.value);
                                        setTargetClass(''); // Reset pilihan kelas saat tahun berubah
                                    }} 
                                    className="w-full pl-3 pr-8 py-4 border-2 border-rose-100 bg-rose-50/50 rounded-2xl font-bold text-rose-700 text-sm outline-none focus:border-rose-500 cursor-pointer appearance-none"
                                >
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" size={14} />
                            </div>

                            {/* 2. Select Kelas (Difilter) */}
                            <div className="relative w-2/3">
                                <select 
                                    value={targetClass} 
                                    onChange={(e) => setTargetClass(e.target.value)} 
                                    className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                                    disabled={!activeYearFilter}
                                >
                                    <option value="">-- Seluruh Kelas ({activeYearFilter}) --</option>
                                    {filteredClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} {cls.student_count ? `(${cls.student_count} siswa)` : ''}
                                        </option>
                                    ))}
                                    {filteredClasses.length === 0 && <option disabled>Tidak ada kelas di tahun ini</option>}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1"><Repeat size={14} className="inline mr-1"/> Frekuensi</label>
                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                            <option value="weekly">Mingguan (Weekly)</option>
                            <option value="daily">Harian (Daily)</option>
                        </select>
                    </div>
                    <div className={`space-y-2 ${frequency === 'daily' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Hari</label>
                        <div className="relative">
                            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                                {days.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-rose-700 text-white font-black rounded-2xl shadow-xl hover:bg-rose-800 transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4">
                        {isSubmitting ? 'Memproses...' : <><Save size={20} /> JADWALKAN KARAKTER</>}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default CharacterScheduleView;