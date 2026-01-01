import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import toast from 'react-hot-toast';
import parentService, { CharacterLog } from '../../../services/parentService';
import LogDetailModal from './LogDetailModal';
import Spinner from '../student/components/Spinner';
import 'react-calendar/dist/Calendar.css';

// CSS Kustom untuk Indikator Status
const calendarCustomStyle = `
  .custom-calendar {
    border-radius: 1.5rem;
    border: none;
    padding: 1rem;
    width: 100%;
    font-family: inherit;
  }
  .react-calendar__tile {
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 10px;
  }
  /* Hari Ini */
  .react-calendar__tile--now {
    background: #eff6ff !important;
    color: #2563eb !important;
    border-radius: 12px;
  }
  .react-calendar__tile--active {
    background: #4f46e5 !important;
    color: white !important;
    border-radius: 12px;
  }
  
  /* Status Indikator (Dot) */
  .status-dot {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    margin-top: 4px;
  }
  .status-tersimpan { background-color: #fbbf24; } /* Kuning: Menunggu Ortu */
  .status-disetujui { background-color: #22c55e; } /* Hijau: Disetujui Ortu */
  .status-disahkan { background-color: #2563eb; }  /* Biru: Disahkan Guru */
`;

const HistoryCalendar: React.FC = () => {
    const [logs, setLogs] = useState<CharacterLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
    const [calendarDate, setCalendarDate] = useState<any>(new Date());

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyData = await parentService.getLogHistory();
                setLogs(historyData);
            } catch (error: any) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDateClick = (value: Date) => {
        // Konversi tanggal klik ke format YYYY-MM-DD lokal
        const offsetDate = new Date(value.getTime() - (value.getTimezoneOffset() * 60000));
        const dateStr = offsetDate.toISOString().split('T')[0];

        const logForDate = logs.find(log => log.log_date.startsWith(dateStr));
        
        if (logForDate) {
            setSelectedLog(logForDate);
        } else {
            toast('Tidak ada kegiatan pada tanggal ini', { icon: '📅' });
        }
    };

    // Fungsi Render Konten dalam Tanggal
    const tileContent = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            const dateStr = offsetDate.toISOString().split('T')[0];
            const log = logs.find(l => l.log_date.startsWith(dateStr));

            if (log) {
                let statusClass = '';
                if (log.status === 'Tersimpan') statusClass = 'status-tersimpan';
                else if (log.status === 'Disetujui') statusClass = 'status-disetujui';
                else if (log.status === 'Disahkan') statusClass = 'status-disahkan';

                return <div className={`status-dot ${statusClass}`} title={log.status}></div>;
            }
        }
        return null;
    };

    if (isLoading) return <Spinner />;

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
            <style>{calendarCustomStyle}</style>
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-black text-slate-800">Kalender Aktivitas</h2>
            </div>
            
            <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                onClickDay={handleDateClick}
                tileContent={tileContent}
                className="custom-calendar"
                locale="id-ID"
            />
            
            {/* Legend / Keterangan Status */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    Menunggu Persetujuan Anda
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Disetujui (Selesai)
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    Disahkan Guru
                </div>
            </div>

            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};

export default HistoryCalendar;