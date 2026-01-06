import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { History, CheckCircle2, Award, CalendarDays, Loader2 } from 'lucide-react';
import characterService from '../../../services/characterService';

// Interface untuk data Log (Sesuaikan dengan backend)
interface CharacterLog {
    id: number;
    log_date: string;
    status: 'Tersimpan' | 'Disetujui' | 'Disahkan';
    approved_by?: string; // Tambahan field dari backend
}

const Riwayat: React.FC = () => {
    const navigate = useNavigate();
    const [historyLogs, setHistoryLogs] = useState<CharacterLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await characterService.getHistory();
            setHistoryLogs(data);
        } catch (error) {
            console.error("Gagal mengambil riwayat:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper untuk format tanggal ke YYYY-MM-DD (Waktu lokal)
    const formatISODate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Navigasi ke halaman jurnal dengan parameter tanggal
    const handleDateClick = (date: Date) => {
        const dateStr = formatISODate(date);
        navigate(`/student/journal?date=${dateStr}`);
    };

    // --- LOGIKA MENGHITUNG STATISTIK ---
    const totalInput = historyLogs.length;
    
    // Hitung yang sudah divalidasi Orang Tua (Status Disetujui ATAU Disahkan)
    const sahOrtuCount = historyLogs.filter(l => l.status === 'Disetujui' || l.status === 'Disahkan').length;
    
    // Hitung yang sudah divalidasi Guru (Hanya status Disahkan)
    const sahGuruCount = historyLogs.filter(l => l.status === 'Disahkan').length;

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <CalendarDays size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Kalender Kegiatan</h2>
                    <p className="text-sm text-gray-500">Klik tanggal untuk melihat atau mengisi jurnal.</p>
                </div>
            </div>

            {/* Calendar Section (Full Width) */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-50">
                <style>{`
                    .react-calendar { width: 100%; border: none; font-family: inherit; }
                    .react-calendar__tile { height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; transition: all 0.2s; font-weight: bold; }
                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus { background-color: #EFF6FF; color: #2563EB; }
                    .react-calendar__tile--now { background: #FEF3C7; color: #D97706; }
                    .react-calendar__tile--active { background: #2563EB !important; color: white !important; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                    
                    /* Custom Markers */
                    .has-log { position: relative; }
                    .has-log::after { content: '●'; font-size: 8px; position: absolute; bottom: 8px; }
                    
                    .log-saved::after { color: #10B981; } /* Hijau (Tersimpan) */
                    .log-approved::after { color: #F59E0B; } /* Kuning (Disetujui Ortu) */
                    .log-verified::after { color: #2563EB; } /* Biru (Disahkan Guru) */
                `}</style>
                
                <Calendar 
                    locale="id-ID"
                    onClickDay={handleDateClick}
                    tileClassName={({ date }) => {
                        const dateStr = formatISODate(date);
                        const log = historyLogs.find(l => l.log_date.startsWith(dateStr));
                        
                        if (log) {
                            if (log.status === 'Disahkan') return 'has-log log-verified';
                            if (log.status === 'Disetujui') return 'has-log log-approved';
                            return 'has-log log-saved';
                        }
                        return '';
                    }}
                />
                
                {/* Legenda Status */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-6 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="text-emerald-500 text-lg leading-none">●</span> Tersimpan
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        <span className="text-amber-500 text-lg leading-none">●</span> Disetujui Ortu
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <span className="text-blue-600 text-lg leading-none">●</span> Disahkan Guru
                    </div>
                </div>
            </div>

            {/* Statistik Counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Total Input */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Mengisi</p>
                        <h3 className="text-3xl font-black text-gray-800">{totalInput} <span className="text-sm text-gray-400 font-medium">Hari</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                        <History size={24} />
                    </div>
                </div>

                {/* 2. Sah Orang Tua */}
                <div className="bg-white p-6 rounded-2xl border-b-4 border-amber-400 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
                    <div>
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Sah Orang Tua</p>
                        <h3 className="text-3xl font-black text-gray-800">{sahOrtuCount} <span className="text-sm text-gray-400 font-medium">Jurnal</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                        <CheckCircle2 size={24} />
                    </div>
                </div>

                {/* 3. Sah Guru */}
                <div className="bg-white p-6 rounded-2xl border-b-4 border-blue-600 shadow-sm flex items-center justify-between transition-transform hover:-translate-y-1">
                    <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Sah Wali Kelas</p>
                        <h3 className="text-3xl font-black text-gray-800">{sahGuruCount} <span className="text-sm text-gray-400 font-medium">Jurnal</span></h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Award size={24} />
                    </div>
                </div>
            </div>

            {/* DAFTAR RIWAYAT TERBARU (Opsional: Menampilkan detail siapa yang menyetujui) */}
            {historyLogs.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Aktivitas Terakhir</h3>
                    <div className="space-y-3">
                        {historyLogs.slice(0, 3).map((log) => (
                            <div key={log.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-800">
                                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {log.status === 'Tersimpan' && <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Menunggu</span>}
                                        
                                        {/* BADGE KHUSUS: Disetujui Siapa? */}
                                        {log.status === 'Disetujui' && (
                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                <CheckCircle2 size={10} /> Disetujui {log.approved_by || 'Orang Tua'}
                                            </span>
                                        )}
                                        
                                        {log.status === 'Disahkan' && (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Award size={10} /> Disahkan Guru
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDateClick(new Date(log.log_date))}
                                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                                >
                                    Lihat
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Riwayat;