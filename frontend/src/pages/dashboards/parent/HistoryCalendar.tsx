import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import toast from 'react-hot-toast';
import parentService, { CharacterLog } from '../../../services/parentService';
import LogDetailModal from './LogDetailModal';
import Spinner from '../student/components/Spinner';
import 'react-calendar/dist/Calendar.css'; // Impor CSS default

// Kustomisasi CSS untuk Kalender agar lebih modern
const calendarCustomStyle = `
  .custom-calendar {
    border-radius: 1rem; /* rounded-xl */
    border: none;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); /* shadow-lg */
    padding: 1.5rem; /* p-6 */
    background-color: white;
    width: 100%;
  }
  .custom-calendar .react-calendar__tile--now {
    background: #f0e6ff;
    color: #5b21b6;
    font-weight: bold;
  }
  .custom-calendar .react-calendar__tile--active {
    background: #6d28d9;
    color: white;
  }
  .custom-calendar .react-calendar__month-view__days__day--neighboringMonth {
    color: #d1d5db; /* text-gray-300 */
  }
  /* Style untuk menandai tanggal dengan log */
  .has-log {
    background-color: #e0f2fe; /* bg-sky-100 */
    border-radius: 50%;
    font-weight: bold;
    color: #0c4a6e; /* text-sky-800 */
  }
   /* Style untuk menandai log yang sudah disetujui */
  .has-approved-log {
    background-color: #dcfce7; /* bg-green-200 */
    border-radius: 50%;
    font-weight: bold;
    color: #166534; /* text-green-800 */
  }
`;

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const HistoryCalendar: React.FC = () => {
    const [logs, setLogs] = useState<CharacterLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
    const [calendarDate, setCalendarDate] = useState<CalendarValue>(new Date());

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const historyData = await parentService.getLogHistory();
                setLogs(historyData);
            } catch (error: any) {
                toast.error(error.message || 'Gagal memuat riwayat.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const logDates = React.useMemo(() => {
        const dateMap = new Map<string, 'approved' | 'pending'>();
        logs.forEach(log => {
            const dateKey = new Date(log.log_date).toDateString();
            // Prioritaskan status 'Disetujui'
            if (log.status === 'Disetujui') {
                 dateMap.set(dateKey, 'approved');
            } else if (!dateMap.has(dateKey)) {
                 dateMap.set(dateKey, 'pending');
            }
        });
        return dateMap;
    }, [logs]);

    const handleDateClick = (value: Date) => {
        const clickedDateString = value.toDateString();
        const logForDate = logs.find(log => new Date(log.log_date).toDateString() === clickedDateString);
        
        if (logForDate) {
            setSelectedLog(logForDate);
        } else {
            toast.error('Tidak ada data log untuk tanggal ini.');
        }
    };

    const tileClassName = ({ date, view }: { date: Date, view: string }) => {
        if (view === 'month') {
            const dateKey = date.toDateString();
            if (logDates.has(dateKey)) {
                return logDates.get(dateKey) === 'approved' ? 'has-approved-log' : 'has-log';
            }
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-full">
                <Spinner />
                <p className="text-gray-600 mt-2">Memuat Riwayat Kalender...</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <style>{calendarCustomStyle}</style>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Riwayat Lengkap (Kalender)</h2>
            <Calendar
                onChange={setCalendarDate} // Meskipun kita tidak menggunakan ini, ini diperlukan oleh library
                value={calendarDate}
                onClickDay={handleDateClick}
                tileClassName={tileClassName}
                className="custom-calendar"
                locale="id-ID" // Menggunakan lokalisasi Indonesia
            />
             <div className="mt-4 flex justify-center space-x-4 text-sm">
                <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-sky-100 mr-2"></span>Tersimpan</div>
                <div className="flex items-center"><span className="w-4 h-4 rounded-full bg-green-200 mr-2"></span>Disetujui</div>
            </div>
            <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        </div>
    );
};

export default HistoryCalendar;
