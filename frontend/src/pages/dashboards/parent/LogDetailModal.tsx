import React from 'react';
import { CharacterLog } from '../../../services/parentService';
import { XCircle } from 'lucide-react';

interface Props {
  log: CharacterLog | null;
  onClose: () => void;
}

// Helper untuk format waktu
const formatTime = (timeString: string) => {
    // Tambahkan pengecekan jika timeString null atau undefined
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
    // Tambahkan pengecekan jika dateString null atau undefined
    if (!dateString) return "Tanggal tidak valid";
    return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

const LogDetailModal: React.FC<Props> = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-transform transform hover:scale-125">
            <XCircle size={32} />
        </button>

        <div className="mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800">Detail Aktivitas</h2>
            <p className="text-lg text-gray-500 mt-1">{formatDate(log.log_date)}</p>
             <span className={`mt-3 inline-block px-4 py-1 text-sm font-semibold rounded-full ${log.status === 'Disetujui' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {log.status}
            </span>
        </div>

        <div className="space-y-6">
            {/* Kebiasaan Pagi & Malam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-semibold text-blue-800">Bangun Pagi</p>
                    <p className="text-2xl font-bold text-blue-900">{formatTime(log.wake_up_time)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="font-semibold text-indigo-800">Tidur Malam</p>
                    <p className="text-2xl font-bold text-indigo-900">{formatTime(log.sleep_time)}</p>
                </div>
            </div>

            {/* Aktivitas Ibadah */}
            <div className="p-5 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-xl mb-3 text-gray-700">Aktivitas Ibadah</h3>
                {log.worship_activities && Array.isArray(log.worship_activities) && log.worship_activities.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {log.worship_activities.map((activity: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined, i: React.Key | null | undefined) => (
                            <span key={i} className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full font-medium">
                                {activity}
                            </span>
                        ))}
                    </div>
                ) : <p className="text-gray-500 italic">Tidak ada aktivitas ibadah yang dicatat.</p>}
                {log.worship_notes && <p className="text-gray-700 mt-3 bg-white p-3 rounded">Catatan: {log.worship_notes}</p>}
            </div>

            {/* Lainnya */}
             <div className="p-5 bg-gray-50 rounded-lg space-y-4">
                 <h3 className="font-semibold text-xl mb-3 text-gray-700">Aktivitas Lainnya</h3>
                 <div>
                     <p className="font-semibold text-gray-600">Olahraga:</p>
                     <p className="text-gray-800">{log.exercise_type || '-'} - {log.exercise_details || '-'}</p>
                 </div>
                 <div>
                     <p className="font-semibold text-gray-600\">Makan Sehat:</p>
                     <p className="text-gray-800">{log.healthy_food_notes || '-'}</p>
                 </div>
                 <div>
                     <p className="font-semibold text-gray-600">Belajar:</p>
                     <p className="text-gray-800">{log.learning_subject || '-'} - {log.learning_details || '-'}</p>
                 </div>
                 <div>
                     <p className="font-semibold text-gray-600">Aktivitas Sosial:</p>
                     <p className="text-gray-800">{log.social_activity_notes || '-'}</p>
                 </div>
             </div>

        </div>

      </div>
    </div>
  );
};

export default LogDetailModal;
