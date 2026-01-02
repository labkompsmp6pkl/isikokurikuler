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
      const data = await characterService.getHistory();
      setLogs(data);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

  // Styling Kalender
  const tileClassName = ({ date, view }: any) => {
    if (view === 'month') {
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();

      const dateStr = formatDateLocal(date);
      
      const log = logs.find((l: any) => l.log_date === dateStr);
      
      if (log) {
          // Status Priority
          if (log.status === 'Disahkan') return 'bg-blue-100 text-blue-800 font-bold rounded-lg border border-blue-300'; // Guru
          if (log.status === 'Disetujui') return 'bg-green-100 text-green-800 font-bold rounded-lg border border-green-300'; // Ortu
          if (log.status === 'Tersimpan') return 'bg-yellow-100 text-yellow-800 font-bold rounded-lg border border-yellow-300'; // Baru Input
      }

      if (isToday) return 'text-blue-600 font-black border-b-2 border-blue-600';
    }
    return null;
  };

  const onDateChange = (date: any) => {
    setSelectedDate(date);
    const dateStr = formatDateLocal(date);
    const log = logs.find((l: any) => l.log_date === dateStr);
    setSelectedLog(log || null);
  };

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-20">
      {/* Calendar Section */}
      <div className="lg:w-1/2">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Kalender Aktivitas</h2>
          <div className="custom-calendar-wrapper">
             <Calendar
              onChange={onDateChange}
              value={selectedDate}
              tileClassName={tileClassName}
              className="w-full border-none rounded-xl p-2"
              locale="id-ID"
            />
          </div>
          
          {/* Legend Status */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-medium text-gray-600 bg-gray-50 p-4 rounded-xl">
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                <span>Menunggu Ortu</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Disetujui Ortu</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                <span>Disahkan Guru</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-3 h-3 border border-gray-400 rounded-full"></span>
                <span>Belum Mengisi</span>
             </div>
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="lg:w-1/2">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 min-h-[400px]">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
             {selectedDate.toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </h2>
          
          {selectedLog ? (
             <div className="mb-4">
                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                     selectedLog.status === 'Disahkan' ? 'bg-blue-100 text-blue-700' :
                     selectedLog.status === 'Disetujui' ? 'bg-green-100 text-green-700' :
                     'bg-yellow-100 text-yellow-700'
                 }`}>
                     <span>Status: {selectedLog.status}</span>
                     {selectedLog.status === 'Tersimpan' && <span>(Menunggu Persetujuan Ortu)</span>}
                 </div>
             </div>
          ) : null}

          <div className="border-t pt-4">
          {selectedLog ? (
            <div className="space-y-4 animate-fade-in">
              {!selectedLog.is_execution_submitted && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-center font-medium border border-red-200 text-sm">
                    ⚠️ Kamu baru mengisi Rencana, segera isi Eksekusi!
                </div>
              )}
              
              <InfoRow icon="☀️" label="Bangun Pagi" value={selectedLog.wake_up_time ? `${selectedLog.wake_up_time} WIB` : '-'} />
              <InfoRow 
                icon="🙏" label="Ibadah" 
                value={parseJson(selectedLog.worship_activities)} 
                sub={selectedLog.worship_detail} 
              />
              <InfoRow 
                icon="🏃" label="Olahraga" 
                value={selectedLog.sport_activities} 
                sub={selectedLog.sport_detail} 
              />
              <InfoRow icon="🥗" label="Makan" value={selectedLog.meal_text} />
              <InfoRow 
                icon="📚" label="Belajar" 
                value={parseJson(selectedLog.study_activities)} 
                sub={selectedLog.study_detail} 
              />
              <InfoRow 
                icon="🌍" label="Sosial" 
                value={parseJson(selectedLog.social_activities)} 
                sub={selectedLog.social_detail} 
              />
              <InfoRow icon="🌙" label="Tidur" value={selectedLog.sleep_time ? `${selectedLog.sleep_time} WIB` : '-'} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-6xl mb-4 grayscale opacity-50">📅</span>
              <p>Tidak ada laporan aktivitas.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, sub }: any) => (
  <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="text-2xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0">{icon}</div>
    <div>
      <h4 className="font-bold text-gray-700 text-sm">{label}</h4>
      <p className="text-gray-600 font-medium text-sm">{value || '-'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border border-gray-100 italic">"{sub}"</p>}
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