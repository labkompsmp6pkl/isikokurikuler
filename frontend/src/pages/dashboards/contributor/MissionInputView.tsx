import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Star, PenTool, Users, Briefcase, ChevronRight, Send
} from 'lucide-react';
import contributorService from '../../../services/contributorService'; 
import { authApi } from '../../../services/authService';
import StudentSelectorView from './StudentSelectorView';

const MissionInputView: React.FC = () => {
    // ... (STATE DAN LOGIC TETAP SAMA, TIDAK ADA YANG DIUBAH) ...
    const [students, setStudents] = useState<any[]>([]);
    const [contributorRole, setContributorRole] = useState('Guru Mata Pelajaran');
    const [customRole, setCustomRole] = useState('');
    const [targetStudentId, setTargetStudentId] = useState<string>(''); 
    const [score, setScore] = useState(80);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await authApi.get('/auth/students-list'); 
                setStudents(res.data.data || []);
            } catch (err) { console.error(err); }
        };
        fetchStudents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetStudentId) return toast.error('Mohon pilih target siswa.');
        if (!notes.trim()) return toast.error('Mohon isi bukti nyata.');
        const finalRole = contributorRole === 'Lainnya' ? customRole.trim() : contributorRole;
        if (!finalRole) return toast.error('Mohon isi identitas penilai.');

        setIsSubmitting(true);
        const toastId = toast.loading('Mengirim bukti sikap...');

        try {
            const payloadBase = {
                contributor_role: finalRole,
                behavior_category: 'Misi Harian',
                score: score,
                notes: notes,
                record_date: new Date().toISOString().split('T')[0]
            };

            if (targetStudentId === 'all') {
                const promises = students.map(student => 
                    contributorService.submitScore({ ...payloadBase, student_id: student.id })
                );
                await Promise.all(promises);
                toast.success(`Terkirim ke ${students.length} siswa!`, { id: toastId });
            } else {
                await contributorService.submitScore({ ...payloadBase, student_id: parseInt(targetStudentId) });
                toast.success('Bukti sikap berhasil dikirim!', { id: toastId });
            }
            
            setTargetStudentId('');
            setScore(80);
            setNotes('');
            setCustomRole('');
        } catch (err) {
            toast.error('Gagal mengirim data.', { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSelectedStudentLabel = () => {
        if (targetStudentId === 'all') return 'Semua Siswa (Broadcast)';
        const s = students.find(st => st.id == targetStudentId);
        return s ? s.full_name : '-- Pilih Target Siswa --';
    };

    if (isSelectorOpen) {
        return (
            <StudentSelectorView 
                students={students}
                onSelect={(id) => { setTargetStudentId(id); setIsSelectorOpen(false); }}
                onBack={() => setIsSelectorOpen(false)}
            />
        );
    }

    // PERUBAHAN: Hapus class layout wrapper (max-w, mx-auto)
    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-rose-100">
            
            <div className="flex items-center gap-4 mb-10 border-b border-rose-50 pb-6">
                <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
                    <PenTool size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">Input Penilaian</h2>
                    <p className="text-rose-500 font-bold text-sm uppercase tracking-widest">Formulir Kontributor</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. IDENTITAS PENILAI */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Briefcase size={14}/> Identitas Penilai
                    </label>
                    <div className="relative">
                        <select value={contributorRole} onChange={(e) => setContributorRole(e.target.value)} className="w-full bg-rose-50/50 border-2 border-rose-100 px-5 py-4 rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-500 cursor-pointer">
                            <option>Guru Mata Pelajaran</option>
                            <option>Guru Tamu / Motivator</option>
                            <option>Pelatih Ekskul / Coach</option>
                            <option>Tamu / Masyarakat</option>
                            <option>Lainnya</option>
                        </select>
                    </div>
                    {contributorRole === 'Lainnya' && (
                        <input type="text" placeholder="Tuliskan peran Anda..." value={customRole} onChange={(e) => setCustomRole(e.target.value)} className="w-full px-5 py-4 border-2 border-rose-200 rounded-2xl font-bold text-gray-700 outline-none focus:border-rose-600" />
                    )}
                </div>

                {/* 2. TARGET SISWA */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Users size={14}/> Target Siswa
                    </label>
                    <button type="button" onClick={() => setIsSelectorOpen(true)} className={`w-full text-left px-5 py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-between group ${targetStudentId ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-white border-gray-200 text-gray-400 hover:border-rose-300'}`}>
                        <span className="truncate">{getSelectedStudentLabel()}</span>
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-rose-500 transition-colors"/>
                    </button>
                </div>

                {/* 3. SKOR */}
                <div className="space-y-4 bg-rose-50/50 p-5 rounded-[1.5rem] border-2 border-rose-100/50">
                    <div className="flex justify-between items-end mb-2">
                        <label className="text-[11px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                            <Star size={14} className="text-rose-500"/> Skor Penilaian
                        </label>
                        <div className="text-3xl font-black text-rose-700">{score}</div>
                    </div>
                    <input type="range" min="0" max="100" step="1" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full h-3 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600 hover:accent-rose-700 transition-all" />
                    <div className="flex justify-between text-[10px] font-bold text-rose-400 uppercase tracking-wider px-1">
                        <span>Kurang (0)</span><span>Cukup (50)</span><span>Baik (100)</span>
                    </div>
                </div>

                {/* 4. BUKTI */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <PenTool size={14}/> Bukti Nyata
                    </label>
                    <textarea rows={4} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-gray-700 outline-none focus:border-rose-500 transition-all resize-none placeholder:text-gray-400" placeholder="Tuliskan bukti nyata yang Anda lihat..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-rose-700 text-white font-black rounded-2xl shadow-xl hover:bg-rose-800 hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-8 group">
                    {isSubmitting ? <span className="animate-pulse">Mengirim...</span> : <><Send size={20} className="group-hover:translate-x-1 transition-transform" /> KIRIM BUKTI SIKAP</>}
                </button>
            </div>
        </form>
    );
};

export default MissionInputView;