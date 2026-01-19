import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
    CheckSquare, 
    Clock, 
    ChevronRight, 
    CalendarDays, 
    UserCheck,
    CheckCircle2,
    Users,
    Loader2
} from 'lucide-react';
import teacherService from '../../../services/teacherService';
import LogDetailView from './LogDetailView'; 

interface ValidationViewProps {
    logs: any[];
    onRefresh: () => void;
}

const ValidationView: React.FC<ValidationViewProps> = ({ logs, onRefresh }) => {
    // --- STATE ---
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [filterTab, setFilterTab] = useState<'teacher_pending' | 'parent_pending' | 'history'>('teacher_pending');
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // --- FILTER LOGIC ---
    const groupedLogs = useMemo(() => {
        return {
            // Menunggu Guru (Sudah disetujui Ortu)
            teacher_pending: logs.filter(l => l.status === 'Disetujui'), 
            // Menunggu Orang Tua (Masih pending/menunggu)
            parent_pending: logs.filter(l => l.status === 'Pending' || l.status === 'Menunggu'), 
            // Selesai (Sudah disahkan Guru)
            history: logs.filter(l => l.status === 'Disahkan') 
        };
    }, [logs]);

    const currentLogs = groupedLogs[filterTab];

    // --- HANDLERS ---

    // 1. Handle Checkbox Selection
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === currentLogs.length) {
            setSelectedIds([]); // Unselect all
        } else {
            setSelectedIds(currentLogs.map(l => l.id)); // Select all visible
        }
    };

    // 2. Handle Bulk Approve
    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        
        if (!window.confirm(`Yakin ingin mengesahkan ${selectedIds.length} jurnal sekaligus?`)) return;

        setIsBulkProcessing(true);
        const toastId = toast.loading('Memproses pengesahan massal...');

        try {
            await teacherService.validateBulkLogs(selectedIds);
            toast.success(`Berhasil mengesahkan ${selectedIds.length} jurnal!`, { id: toastId });
            setSelectedIds([]); 
            onRefresh(); 
        } catch (error) {
            console.error(error);
            toast.error('Terjadi kesalahan saat memproses beberapa data.', { id: toastId });
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // --- RENDER DETAIL VIEW ---
    if (selectedLog) {
        return <LogDetailView log={selectedLog} onBack={() => setSelectedLog(null)} onRefresh={onRefresh} />;
    }

    // --- RENDER MAIN VIEW ---
    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* 1. SUMMARY STATS CARDS (FILTER TABS) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button 
                    onClick={() => { setFilterTab('teacher_pending'); setSelectedIds([]); }}
                    className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all ${filterTab === 'teacher_pending' ? 'bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-200' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                >
                    <div className="flex justify-between w-full">
                        <CheckSquare size={20} className={filterTab === 'teacher_pending' ? 'opacity-80' : 'text-violet-500'} />
                        <span className="font-black text-xl">{groupedLogs.teacher_pending.length}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">Perlu Disahkan</p>
                        <p className={`text-[10px] ${filterTab === 'teacher_pending' ? 'opacity-70' : 'text-slate-400'}`}>Menunggu Guru</p>
                    </div>
                </button>

                <button 
                    onClick={() => { setFilterTab('parent_pending'); setSelectedIds([]); }}
                    className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all ${filterTab === 'parent_pending' ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                >
                    <div className="flex justify-between w-full">
                        <Users size={20} className={filterTab === 'parent_pending' ? 'opacity-80' : 'text-amber-500'} />
                        <span className="font-black text-xl">{groupedLogs.parent_pending.length}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">Tertunda</p>
                        <p className={`text-[10px] ${filterTab === 'parent_pending' ? 'opacity-70' : 'text-slate-400'}`}>Menunggu Orang Tua</p>
                    </div>
                </button>

                <button 
                    onClick={() => { setFilterTab('history'); setSelectedIds([]); }}
                    className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all ${filterTab === 'history' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                >
                    <div className="flex justify-between w-full">
                        <CheckCircle2 size={20} className={filterTab === 'history' ? 'opacity-80' : 'text-emerald-500'} />
                        <span className="font-black text-xl">{groupedLogs.history.length}</span>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">Selesai</p>
                        <p className={`text-[10px] ${filterTab === 'history' ? 'opacity-70' : 'text-slate-400'}`}>Riwayat Validasi</p>
                    </div>
                </button>
            </div>

            {/* 2. TOOLBAR (BULK ACTIONS) - Hanya muncul di tab Teacher Pending */}
            {filterTab === 'teacher_pending' && currentLogs.length > 0 && (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                            checked={currentLogs.length > 0 && selectedIds.length === currentLogs.length}
                            onChange={toggleSelectAll}
                        />
                        <span className="text-sm font-bold text-slate-700">
                            {selectedIds.length > 0 ? `${selectedIds.length} Dipilih` : 'Pilih Semua'}
                        </span>
                    </div>

                    <button 
                        onClick={handleBulkApprove}
                        disabled={selectedIds.length === 0 || isBulkProcessing}
                        className="px-5 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md shadow-violet-200"
                    >
                        {isBulkProcessing ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16} />}
                        Sahkan ({selectedIds.length})
                    </button>
                </div>
            )}

            {/* 3. LIST JURNAL */}
            <div className="space-y-3">
                {currentLogs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-medium">Tidak ada data untuk kategori ini.</p>
                    </div>
                ) : (
                    currentLogs.map(log => {
                        const isSelected = selectedIds.includes(log.id);
                        
                        // Indikator Pengisian (Rencana & Eksekusi)
                        // Asumsi backend mengirim flag: is_plan_submitted, is_execution_submitted
                        const planFilled = !!log.is_plan_submitted;
                        const execFilled = !!log.is_execution_submitted;
                        
                        return (
                            <div 
                                key={log.id} 
                                className={`group relative bg-white border rounded-2xl transition-all duration-200 
                                    ${isSelected ? 'border-violet-500 bg-violet-50/30' : 'border-slate-100 hover:border-violet-200 hover:shadow-md'}
                                `}
                            >
                                <div className="p-4 flex items-center gap-4">
                                    
                                    {/* CHECKBOX (Hanya di tab pending guru) */}
                                    {filterTab === 'teacher_pending' && (
                                        <div className="shrink-0">
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleSelect(log.id)}
                                                className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                            />
                                        </div>
                                    )}

                                    {/* AVATAR & NAMA */}
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
                                        {log.student_name?.charAt(0) || 'S'}
                                    </div>

                                    {/* INFO UTAMA */}
                                    <div className="flex-1 min-w-0" onClick={() => setSelectedLog(log)}>
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                            <h4 className="font-bold text-slate-800 truncate cursor-pointer hover:text-violet-600">
                                                {log.student_name}
                                            </h4>
                                            <span className="hidden md:inline text-slate-300">•</span>
                                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                                <CalendarDays size={12} />
                                                {new Date(log.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>

                                        {/* INDIKATOR PROGRESS & ORTU */}
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            {/* Progress Rencana & Eksekusi */}
                                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                                                <span className={`font-bold ${planFilled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    Rencana {planFilled ? '✓' : '✗'}
                                                </span>
                                                <span className="text-slate-300">|</span>
                                                <span className={`font-bold ${execFilled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    Eksekusi {execFilled ? '✓' : '✗'}
                                                </span>
                                            </div>

                                            {/* Status Ortu (Jika pending) */}
                                            {filterTab === 'parent_pending' && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    <Clock size={10} /> Menunggu Ortu
                                                </div>
                                            )}
                                            
                                            {/* Nama Penyetuju (Jika ada) */}
                                            {(log.parent_name || log.approved_by) && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <UserCheck size={10} /> {log.parent_name || log.approved_by}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* TOMBOL DETAIL (Mobile Friendly) */}
                                    <button 
                                        onClick={() => setSelectedLog(log)}
                                        className="p-2 text-slate-300 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ValidationView;