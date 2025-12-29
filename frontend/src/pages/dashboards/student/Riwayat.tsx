import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import characterService from '../../../services/characterService';
import Calendar from './components/Calendar';
import Spinner from './components/Spinner';
import LogDetailModal from './components/LogDetailModal'; // Impor Modal

// Tipe data untuk log riwayat singkat
export interface HistoryLog {
  log_date: string; // Format YYYY-MM-DD
  status: 'Tersimpan' | 'Disetujui' | 'Disahkan';
}

// Tipe data untuk detail log lengkap (pastikan sesuai dengan backend dan modal)
interface CharacterLog {
  id: number;
  log_date: string;
  wake_up_time: string | null;
  sleep_time: string | null;
  worship_activities: string[];
  worship_notes: string | null;
  exercise_type: string | null;
  exercise_details: string | null;
  healthy_food_notes: string | null;
  learning_subject: string | null;
  learning_details: string | null;
  social_activity_notes: string | null;
  status?: 'Tersimpan' | 'Disetujui' | 'Disahkan';
}

const Riwayat: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyData, setHistoryData] = useState<HistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
  const [, setIsModalLoading] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Memuat data riwayat setiap kali bulan atau tahun berubah
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const data = await characterService.getLogHistory(currentMonth, currentYear);
        setHistoryData(data);
      } catch (error) {
        toast.error('Gagal memuat riwayat.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [currentMonth, currentYear]);

  // Fungsi yang akan dipanggil saat tanggal di kalender diklik
  const handleDateClick = useCallback(async (date: string) => {
    setIsModalLoading(true);
    setIsModalOpen(true);
    try {
      const logDetails = await characterService.getLogByDate(date);
      setSelectedLog(logDetails);
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            toast.error('Tidak ada data untuk tanggal ini.');
        } else {
            toast.error('Gagal mengambil detail log.');
        }
        setIsModalOpen(false); // Tutup modal jika ada error
        console.error(error);
    } finally {
        setIsModalLoading(false);
    }
  }, []);

  // Fungsi untuk navigasi bulan
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  }

  // Menghitung statistik untuk legenda
  const stats = {
      total: historyData.length,
      tersimpan: historyData.filter(h => h.status === 'Tersimpan').length,
      disetujui: historyData.filter(h => h.status === 'Disetujui').length,
      disahkan: historyData.filter(h => h.status === 'Disahkan').length,
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengisian</h1>
        {/* Legenda Status */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0 text-xs">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>Tersimpan ({stats.tersimpan})</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>Disetujui ({stats.disetujui})</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-600 mr-2"></span>Disahkan ({stats.disahkan})</div>
            <div className="font-bold">Total: {stats.total}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-96"><Spinner /></div>
      ) : (
        <Calendar 
            month={currentMonth}
            year={currentYear}
            historyLogs={historyData}
            onPrevMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
            onGoToToday={goToToday}
            onDateClick={handleDateClick} // Teruskan fungsi ke Calendar
        />
      )}

      {/* Render Modal */}
       <LogDetailModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLog(null);
          }}
          logData={selectedLog}
       />
    </div>
  );
};

export default Riwayat;
