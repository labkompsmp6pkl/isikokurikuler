import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Calendar, Save, ChevronDown, Repeat, Briefcase 
} from 'lucide-react';
import contributorService from '../../../services/contributorService';
import { authApi } from '../../../services/authService';

interface ClassData {
    id: string;
    name: string;
    student_count: number;
}

const CharacterScheduleView: React.FC = () => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    
    const [contributorRole, setContributorRole] = useState('Guru Mata Pelajaran');
    const [customRole, setCustomRole] = useState('');
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
                setClasses(res.data || []);
            } catch (err) { console.error(err); }
        };
        fetchClasses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalRole = contributorRole === 'Lainnya' ? customRole.trim() : contributorRole;
        if (!finalRole) return toast.error('Isi identitas penilai', { id: 'val-role' });
        if (!title.trim()) return toast.error('Judul karakter wajib diisi', { id: 'val-title' });
        if (!targetClass) return toast.error('Pilih target kelas', { id: 'val-class' });

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
            setCustomRole('');
        } catch (err) {
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
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-rose-100">
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
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Briefcase size={14}/> Identitas Penilai</label>
                    <div className="relative">
                        <select value={contributorRole} onChange={(e) => setContributorRole(e.target.value)} className="w-full bg-rose-50/50 border-2 border-rose-100 px-5 py-4 rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                            <option>Guru Mata Pelajaran</option><option>Guru Tamu / Motivator</option><option>Pelatih Ekskul / Coach</option><option>Tamu / Masyarakat</option><option>Lainnya</option>
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" size={20} />
                    </div>
                    {contributorRole === 'Lainnya' && <input type="text" placeholder="Tuliskan peran Anda..." value={customRole} onChange={(e) => setCustomRole(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-200 rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-600" />}
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Karakter / Tugas</label>
                    <input type="text" className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500" placeholder="Contoh: Membaca Buku Paket Hal 10-15" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                        <div className="relative">
                            <select value={habitCategory} onChange={(e) => setHabitCategory(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">{habits.map(h => <option key={h} value={h}>{h}</option>)}</select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Kelas</label>
                        <div className="relative">
                            <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                                <option value="">-- Seluruh Kelas --</option>
                                {classes.map((cls) => 
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} ({cls.student_count} siswa)
                                    </option>
                                )}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1"><Repeat size={14} className="inline mr-1"/> Frekuensi</label>
                        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer"><option value="weekly">Mingguan (Weekly)</option><option value="daily">Harian (Daily)</option></select>
                    </div>
                    <div className={`space-y-2 ${frequency === 'daily' ? 'opacity-50 pointer-events-none' : ''}`}>
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Hari</label>
                        <div className="relative">
                            <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-100 bg-white rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">{days.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}</select>
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