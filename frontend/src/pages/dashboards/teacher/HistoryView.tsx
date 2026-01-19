import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Filter, CalendarDays, Loader2, ArrowLeft, CheckCircle2, UserCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import teacherService from '../../../services/teacherService';
import LogDetailView from './LogDetailView'; 

interface HistoryViewProps {
    students: any[];
    teacherClass?: string;
}

const HistoryView: React.FC<HistoryViewProps> = ({ students, teacherClass }) => {
    const [filterStudentId, setFilterStudentId] = useState<string>('');
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- VIEW NAVIGATION STATE ---
    const [view, setView] = useState<'calendar' | 'daily-list' | 'detail'>('calendar');
    const [selectedDateLogs, setSelectedDateLogs] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedLog, setSelectedLog] = useState<any>(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const res = await teacherService.getClassHistory(filterStudentId || undefined);
            setHistoryLogs(res || []);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat riwayat.', { id: 'history-fetch-error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        setView('calendar');
        setSelectedLog(null);
        setSelectedDateLogs([]);
    }, [filterStudentId]);

    const formatISODate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (date: Date) => {
        const dateStr = formatISODate(date);
        const logsOnDate = historyLogs.filter((l: any) => l.log_date.startsWith(dateStr));

        if (logsOnDate.length === 0) {
            toast('Tidak ada data jurnal pada tanggal ini.', { icon: '📅', id: 'no-data' });
            return;
        }

        setSelectedDate(date);
        setSelectedDateLogs(logsOnDate);

        if (filterStudentId) {
            setSelectedLog(logsOnDate[0]);
            setView('detail');
        } else {
            setView('daily-list');
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        if (view === 'detail') {
            if (filterStudentId) {
                setView('calendar');
                setSelectedLog(null);
            } else {
                setView('daily-list');
                setSelectedLog(null);
            }
        } else if (view === 'daily-list') {
            setView('calendar');
            setSelectedDateLogs([]);
        }
    };

    // --- [BARU] FUNGSI RENDER STATUS ---
    const renderStatusBadge = (log: any) => {
        // 1. Jika Disahkan (oleh Guru)
        if (log.status === 'Disahkan') {
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-bold uppercase">Disahkan oleh Anda</span>
                </div>
            );
        }
        
        // 2. Jika Disetujui (oleh Orang Tua)
        if (log.status === 'Disetujui') {
            // Ambil relasi dari data log (pastikan backend mengirim field ini, misal: validator_relationship)
            // Jika tidak ada, fallback ke 'Wali Murid'
            const approver = log.validator_relationship || 'Wali Murid';
            
            return (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <UserCheck size={14} />
                    <span className="text-[10px] font-bold uppercase">Disetujui oleh {approver}</span>
                </div>
            );
        }

        // 3. Menunggu / Belum Diisi
        return (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase">Menunggu Validasi</span>
            </div>
        );
    };

    // --- RENDERERS ---

    if (view === 'detail' && selectedLog) {
        return (
            <LogDetailView 
                log={selectedLog} 
                onBack={handleBack} 
                onRefresh={fetchHistory} 
            />
        );
    }

    if (view === 'daily-list') {
        return (
            <div className="space-y-4 animate-slide-up">
                <div className="p-6 border-b border-gray-100 bg-white rounded-[2rem] shadow-sm mb-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h3 className="text-lg font-black text-gray-800">Jurnal Harian</h3>
                            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">
                                {selectedDate?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">{selectedDateLogs.length} Siswa</span>
                </div>

                <div className="grid gap-3">
                    {selectedDateLogs.map(log => (
                        <div 
                            key={log.id} 
                            onClick={() => { setSelectedLog(log); setView('detail'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-violet-200 hover:shadow-lg transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-violet-50 text-violet-600 font-bold w-12 h-12 flex items-center justify-center">
                                    {log.student_name ? log.student_name.charAt(0) : '?'}
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-800 group-hover:text-violet-700 transition-colors">{log.student_name}</h4>
                                    <p className="text-xs text-gray-400 font-medium group-hover:text-violet-500">Klik untuk melihat detail</p>
                                </div>
                            </div>
                            
                            {/* [FIX] Gunakan fungsi render baru */}
                            {renderStatusBadge(log)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filter Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Filter Siswa</label>
                    <div className="relative group w-full">
                        <Filter className="absolute left-4 top-4 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20}/>
                        <select 
                            className="w-full border-2 border-gray-100 bg-gray-50 pl-12 pr-4 py-3 rounded-2xl font-bold text-gray-700 outline-none focus:border-violet-500 transition-all appearance-none cursor-pointer" 
                            value={filterStudentId} 
                            onChange={(e) => setFilterStudentId(e.target.value)}
                        >
                            <option value="">-- Tampilkan Seluruh Kelas {teacherClass} --</option>
                            {students.map((s: any) => (
                                <option key={s.id} value={s.id}>
                                    {s.full_name} ({s.class_name || teacherClass})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-gray-100 mx-4"></div>
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <CalendarDays size={18} />
                    <span>Total Rekaman: <strong>{historyLogs.length}</strong></span>
                </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50">
                <style>{`
                    .react-calendar { width: 100%; border: none; font-family: inherit; }
                    .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; transition: all 0.2s; font-weight: bold; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #F5F3FF; color: #7C3AED; }
                    .react-calendar__tile--now { background: #FEF3C7; color: #D97706; }
                    .react-calendar__tile--active { background: #7C3AED !important; color: white !important; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); }
                    .has-log { position: relative; }
                    .has-log::after { content: '●'; font-size: 8px; position: absolute; bottom: 8px; color: #7C3AED; }
                    .log-valid::after { color: #7C3AED; }
                `}</style>
                
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-violet-600" size={32} />
                    </div>
                ) : (
                    <>
                         <div className="mb-6 flex items-center gap-3">
                            <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                                <CalendarDays size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">Kalender Aktivitas</h2>
                        </div>
                        
                        <Calendar 
                            locale="id-ID" 
                            className="w-full border-none font-sans text-lg" 
                            tileClassName={({ date }) => {
                                const dateStr = formatISODate(date);
                                const hasLog = historyLogs.some((l:any) => l.log_date.startsWith(dateStr));
                                if (hasLog) return 'has-log log-valid bg-violet-50 text-violet-700'; 
                                return '';
                            }}
                            onClickDay={handleDateClick}
                        />

                        <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-violet-600 rounded-full"></span> 
                                <span className="text-xs font-bold uppercase text-gray-500 tracking-widest">Terisi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-white border border-gray-300 rounded-full"></span> 
                                <span className="text-xs font-bold uppercase text-gray-500 tracking-widest">Kosong</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HistoryView;