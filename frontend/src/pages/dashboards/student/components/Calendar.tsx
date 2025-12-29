import React from 'react';
import { HistoryLog } from '../Riwayat'; // Impor tipe data

interface CalendarProps {
  month: number; // 0-11
  year: number;
  historyLogs: HistoryLog[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onDateClick: (date: string) => void; // Fungsi callback baru
}

const Calendar: React.FC<CalendarProps> = ({ month, year, historyLogs, onPrevMonth, onNextMonth, onGoToToday, onDateClick }) => {
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Minggu) - 6 (Sabtu)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Membuat map untuk pencarian cepat data riwayat berdasarkan tanggal
  const historyMap = new Map(historyLogs.map(log => [new Date(log.log_date).getDate(), log.status]));

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-transparent';
    switch (status) {
      case 'Tersimpan': return 'bg-yellow-400';
      case 'Disetujui': return 'bg-green-500';
      case 'Disahkan': return 'bg-blue-600';
      default: return 'bg-transparent';
    }
  }

  // Fungsi untuk menangani klik pada tanggal
  const handleDayClick = (day: number) => {
    // Hanya panggil onDateClick jika ada log untuk hari itu
    if (historyMap.has(day)) {
      // Format tanggal ke YYYY-MM-DD
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      onDateClick(dateString);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Header Kalender */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
        <div className="text-center">
            <h2 className="font-bold text-lg text-gray-800">{monthNames[month]} {year}</h2>
            <button onClick={onGoToToday} className='text-xs text-blue-600 hover:underline'>Hari Ini</button>
        </div>
        <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
      </div>

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {/* Header Hari */}
        {daysOfWeek.map(day => (
          <div key={day} className="font-semibold text-gray-600 py-2">{day}</div>
        ))}

        {/* Spasi Kosong Sebelum Tanggal 1 */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="border-t border-gray-100"></div>
        ))}

        {/* Tanggal-tanggal */}
        {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
          const day = dayIndex + 1;
          const status = historyMap.get(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const hasLog = !!status;

          return (
            <div 
              key={day} 
              className={`border-t border-gray-100 py-2 flex flex-col items-center justify-center h-16 ${hasLog ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span className={`w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white font-bold' : ''}`}>
                {day}
              </span>
              {status && (
                <span className={`mt-1 w-2 h-2 rounded-full ${getStatusColor(status)}`} title={status}></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
