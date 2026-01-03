import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { CalendarDays, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import contributorService from '../../../services/contributorService';
import RecordDetailView from './RecordDetailView';

const HistoryView: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // State untuk Detail View
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'calendar' | 'detail'>('calendar');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await contributorService.getHistory();
                setLogs(data);
            } catch (error) {
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
        // Filter semua log pada tanggal tersebut
        const logsForDate = logs.filter(log => log.record_date.startsWith(dateStr));
        
        if (logsForDate.length > 0) {
            setSelectedRecords(logsForDate);
            setViewMode('detail');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast('Tidak ada aktivitas tercatat pada tanggal ini', { icon: '📅', id: 'no-date' });
        }
    };

    if (viewMode === 'detail' && selectedRecords.length > 0) {
        return (
            <RecordDetailView 
                records={selectedRecords} 
                initialIndex={0} 
                onBack={() => setViewMode('calendar')} 
            />
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-50">
                <style>{`
                    .react-calendar { width: 100%; border: none; font-family: inherit; }
                    .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; transition: all 0.2s; font-weight: bold; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #FFF1F2; color: #BE123C; }
                    .react-calendar__tile--now { background: #FEF3C7; color: #D97706; }
                    .react-calendar__tile--active { background: #BE123C !important; color: white !important; box-shadow: 0 4px 12px rgba(190, 18, 60, 0.3); }
                    .has-log { position: relative; }
                    .has-log::after { content: '●'; font-size: 8px; position: absolute; bottom: 8px; color: #BE123C; }
                `}</style>
                
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-rose-600" size={32} />
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center gap-3">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                                <CalendarDays size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">Kalender Aktivitas Anda</h2>
                        </div>

                        <Calendar
                            locale="id-ID"
                            onClickDay={handleDateClick}
                            tileClassName={({ date }) => {
                                const dateStr = formatDateLocal(date);
                                const hasLog = logs.some(l => l.record_date.startsWith(dateStr));
                                return hasLog ? 'has-log bg-rose-50 text-rose-700' : '';
                            }}
                        />
                        
                        <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-rose-700 rounded-full"></span> 
                                <span className="text-xs font-bold uppercase text-gray-500 tracking-widest">Ada Aktivitas</span>
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