import React from 'react';
import { CharacterLog } from '../../../services/parentService';
import { XCircle } from 'lucide-react';

interface Props {
  log: CharacterLog | null;
  onClose: () => void;
}

// Helper untuk format waktu
const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    try {
        const [hour, minute] = timeString.split(':');
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    } catch (e) {
        return "-";
    }
};

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
    if (!dateString) return "Tanggal tidak valid";
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

// Helper Parse JSON aman
const parseJson = (data: any) => {
    try {
        if (Array.isArray(data)) return data;
        if (typeof data === 'string') {
             // Coba parse jika string JSON
             const parsed = JSON.parse(data);
             return Array.isArray(parsed) ? parsed : [parsed];
        }
        return [];
    } catch (e) {
        return []; 
    }
};

const LogDetailModal: React.FC<Props> = ({ log, onClose }) => {
  if (!log) return null;

  const worshipActs = parseJson(log.worship_activities);
  const studyActs = parseJson(log.study_activities);
  const socialActs = parseJson(log.social_activities);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-transform transform hover:scale-125">
            <XCircle size={32} />
        </button>

        <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800">Detail Aktivitas</h2>
            <p className="text-lg text-gray-500 mt-1">{formatDate(log.log_date)}</p>
            
            <div className="mt-3 flex justify-center gap-2">
                {log.status === 'Tersimpan' && <span className="px-4 py-1 text-sm font-bold rounded-full bg-yellow-100 text-yellow-800">Menunggu Persetujuan Anda</span>}
                {log.status === 'Disetujui' && <span className="px-4 py-1 text-sm font-bold rounded-full bg-green-100 text-green-800">Disetujui Orang Tua</span>}
                {log.status === 'Disahkan' && <span className="px-4 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-800">Disahkan Guru</span>}
            </div>
        </div>

        <div className="space-y-6">
            {/* Waktu Tidur & Bangun */}
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="font-bold text-orange-800 text-sm uppercase">Bangun Pagi</p>
                    <p className="text-2xl font-black text-orange-900">{formatTime(log.wake_up_time)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="font-bold text-indigo-800 text-sm uppercase">Tidur Malam</p>
                    <p className="text-2xl font-black text-indigo-900">{formatTime(log.sleep_time)}</p>
                </div>
            </div>

            {/* Ibadah */}
            <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🙏</span>
                    <h3 className="font-bold text-lg text-emerald-800">Ibadah</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                    {worshipActs.length > 0 ? worshipActs.map((act: any, idx: number) => (
                        <span key={idx} className="bg-white text-emerald-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-emerald-100">
                            {act}
                        </span>
                    )) : <span className="text-gray-400 italic text-sm">Tidak ada data</span>}
                </div>
                {log.worship_detail && (
                    <div className="mt-2 text-sm text-emerald-900 bg-white/60 p-2 rounded-lg italic">
                        "{log.worship_detail}"
                    </div>
                )}
            </div>

            {/* Olahraga & Makan */}
            <div className="grid grid-cols-1 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🏃</span>
                        <h3 className="font-bold text-blue-800">Olahraga</h3>
                    </div>
                    <p className="font-bold text-gray-800">{log.sport_activities || '-'}</p>
                    {log.sport_detail && <p className="text-sm text-gray-600 mt-1">{log.sport_detail}</p>}
                </div>
                
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🥗</span>
                        <h3 className="font-bold text-green-800">Makan Sehat</h3>
                    </div>
                    <p className="text-gray-800 text-sm font-medium">{log.meal_text || '-'}</p>
                </div>
            </div>

            {/* Belajar & Sosial */}
            <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📚</span>
                        <h3 className="font-bold text-purple-800">Belajar</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {studyActs.map((act: any, i: number) => (
                             <span key={i} className="bg-white text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-100">{act}</span>
                        ))}
                    </div>
                    {log.study_detail && <p className="text-sm text-gray-600 italic">"{log.study_detail}"</p>}
                </div>

                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🌍</span>
                        <h3 className="font-bold text-teal-800">Sosial</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {socialActs.map((act: any, i: number) => (
                             <span key={i} className="bg-white text-teal-700 px-2 py-1 rounded text-xs font-bold border border-teal-100">{act}</span>
                        ))}
                    </div>
                    {log.social_detail && <p className="text-sm text-gray-600 italic">"{log.social_detail}"</p>}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;