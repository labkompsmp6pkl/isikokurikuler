import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Spinner from './components/Spinner';
import characterService from '../../../services/characterService';

const Riwayat: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      // Menggunakan Service, bukan axios manual
      const data = await characterService.getHistory();
      setLogs(data);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk styling kalender
  const tileClassName = ({ date, view }: any) => {
    if (view === 'month') {
      // Konversi date kalender ke format YYYY-MM-DD (Waktu lokal)
      // Tip: Menggunakan offset timezone agar akurat
      const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const dateStr = offsetDate.toISOString().split('T')[0];
      
      const log = logs.find((l: any) => l.log_date.startsWith(dateStr));
      
      // HANYA jika eksekusi sudah disubmit (Hijau)
      if (log && log.is_execution_submitted) {
        return 'bg-green-100 text-green-800 font-bold rounded-full border-2 border-green-300'; 
      }
      // Warna kuning jika baru rencana (Belum eksekusi)
      if (log && log.is_plan_submitted && !log.is_execution_submitted) {
        return 'bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300';
      }
    }
    return null;
  };

  const onDateChange = (date: any) => {
    setSelectedDate(date);
    
    // Konversi date kalender ke format YYYY-MM-DD untuk pencarian
    const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const dateStr = offsetDate.toISOString().split('T')[0];
    
    const log = logs.find((l: any) => l.log_date.startsWith(dateStr));
    setSelectedLog(log || null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      {/* Calendar Section */}
      <div className="lg:w-1/2">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Kalender Aktivitas</h2>
          <div className="custom-calendar-wrapper">
             <Calendar
              onChange={onDateChange}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full border-none rounded-xl"
              locale="id-ID" // Format bahasa Indonesia
            />
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-full"></div>
                <span>Selesai (Eksekusi)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded-full"></div>
                <span>Hanya Rencana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="lg:w-1/2">
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[400px]">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
            Detail: {selectedDate.toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </h2>

          {selectedLog ? (
            <div className="space-y-4 animate-fade-in">
              {!selectedLog.is_execution_submitted && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-center font-medium border border-yellow-200">
                    ⚠️ Data Eksekusi belum lengkap/dikirim.
                </div>
              )}
              
              <InfoRow icon="☀️" label="Bangun Pagi" value={selectedLog.wake_up_time ? `${selectedLog.wake_up_time} WIB` : '-'} />
              <InfoRow icon="🙏" label="Ibadah" value={parseJson(selectedLog.worship_activities)} />
              <InfoRow icon="🏃" label="Olahraga" value={selectedLog.sport_activities} sub={selectedLog.sport_detail} />
              <InfoRow icon="🥗" label="Makan" value={selectedLog.meal_text} />
              <InfoRow icon="📚" label="Belajar" value={parseJson(selectedLog.study_activities)} />
              <InfoRow icon="🌍" label="Sosial" value={parseJson(selectedLog.social_activities)} />
              <InfoRow icon="🌙" label="Tidur" value={selectedLog.sleep_time ? `${selectedLog.sleep_time} WIB` : '-'} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-6xl mb-4">📅</span>
              <p>Tidak ada data jurnal untuk tanggal ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, sub }: any) => (
  <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="text-2xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full">{icon}</div>
    <div>
      <h4 className="font-bold text-gray-700 text-sm">{label}</h4>
      <p className="text-gray-600 font-medium">{value || '-'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1 italic">{sub}</p>}
    </div>
  </div>
);

const parseJson = (json: any) => {
    try {
        if (Array.isArray(json)) return json.join(', ');
        if (typeof json === 'string') {
            const parsed = JSON.parse(json);
            return Array.isArray(parsed) ? parsed.join(', ') : parsed;
        }
        return '-';
    } catch (e) {
        return '-';
    }
}

export default Riwayat;