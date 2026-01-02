import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import toast from 'react-hot-toast';
import { History, CheckCircle2, Award, CalendarDays, Loader2 } from 'lucide-react';
import parentService, { CharacterLog } from '../../../services/parentService';
import LogDetailView from './LogDetailView'; // Import komponen baru
import 'react-calendar/dist/Calendar.css';

const HistoryCalendar: React.FC = () => {
    const [logs, setLogs] = useState<CharacterLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State untuk navigasi view
    const [view, setView] = useState<'calendar' | 'detail'>('calendar');
    const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyData = await parentService.getLogHistory();
                setLogs(historyData);
            } catch (error: any) {
                console.error(error);
                toast.error('Gagal memuat riwayat', { id: 'history-error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const formatDateLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (value: Date) => {
        const dateStr = formatDateLocal(value);
        const logForDate = logs.find(log => log.log_date === dateStr);
        
        if (logForDate) {
            setSelectedLog(logForDate);
            setView('detail'); // Ganti view ke detail
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas
        } else {
            toast('Tidak ada kegiatan pada tanggal ini', { icon: '📅', id: 'no-date' });
        }
    };

    // Fungsi kembali ke kalender
    const handleBackToCalendar = () => {
        setView('calendar');
        setSelectedLog(null);
    };

    // --- LOGIKA MENGHITUNG STATISTIK ---
    const totalInput = logs.length;
    const sahOrtuCount = logs.filter(l => l.status === 'Disetujui' || l.status === 'Disahkan').length;
    const sahGuruCount = logs.filter(l => l.status === 'Disahkan').length;

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
    );

    // TAMPILAN 1: DETAIL VIEW (Halaman Baru)
    if (view === 'detail' && selectedLog) {
        return <LogDetailView log={selectedLog} onBack={handleBackToCalendar} />;
    }

    // TAMPILAN 2: KALENDER (Default)
    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Calendar Section */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-50">
                <style>{`
                    .react-calendar { width: 100%; border: none; font-family: inherit; }
                    .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; transition: all 0.2s; font-weight: bold; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #ECFDF5; color: #059669; }
                    .react-calendar__tile--now { background: #FEF3C7; color: #D97706; }
                    .react-calendar__tile--active { background: #059669 !important; color: white !important; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
                    .has-log { position: relative; }
                    .has-log::after { content: '●'; font-size: 8px; position: absolute; bottom: 8px; color: #10B981; }
                    .log-pending::after { color: #F59E0B; } 
                    .log-valid::after { color: #059669; }
                `}</style>
                
                <div className="mb-6 flex items-center gap-3">
                     <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <CalendarDays size={24} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Kalender Aktivitas Anak</h2>
                </div>

                <Calendar
                    locale="id-ID"
                    onClickDay={handleDateClick}
                    tileClassName={({ date }) => {
                        const dateStr = formatDateLocal(date);
                        const log = logs.find(l => l.log_date === dateStr);
                        
                        if (log) {
                            if (log.status === 'Disahkan') return 'has-log log-valid';
                            if (log.status === 'Disetujui') return 'has-log log-valid';
                            return 'has-log log-pending';
                        }
                        return '';
                    }}
                />
                
                <div className="flex justify-center gap-6 mt-6 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><span className="text-amber-500">●</span> Belum Disetujui</div>
                    <div className="flex items-center gap-2"><span className="text-emerald-600">●</span> Sudah Disetujui</div>
                </div>
            </div>

            {/* Statistik Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Input Anak</p>
                        <h3 className="text-3xl font-black text-gray-800">{totalInput} <span className="text-sm text-gray-400 font-medium">Hari</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                        <History size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-b-4 border-emerald-500 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Status Sah oleh Anda</p>
                        <h3 className="text-3xl font-black text-gray-800">{sahOrtuCount} <span className="text-sm text-gray-400 font-medium">Jurnal</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border-b-4 border-blue-600 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Status Sah oleh Guru</p>
                        <h3 className="text-3xl font-black text-gray-800">{sahGuruCount} <span className="text-sm text-gray-400 font-medium">Jurnal</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Award size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryCalendar;