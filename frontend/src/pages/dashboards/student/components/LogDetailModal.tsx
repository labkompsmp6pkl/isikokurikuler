import React from 'react';

// Tipe data yang sama seperti di Beranda.tsx, pastikan sinkron
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

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logData: CharacterLog | null;
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="mb-3">
        <p className="text-sm font-semibold text-gray-600">{label}</p>
        <div className="text-gray-800 text-base">{value || <span className="italic text-gray-400">Tidak diisi</span>}</div>
    </div>
);

const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, logData }) => {
  if (!isOpen || !logData) return null;

  const formattedDate = new Date(logData.log_date).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const getStatusBadge = (status: string | undefined) => {
    const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full';
    switch (status) {
      case 'Tersimpan': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Disetujui': return `${baseClasses} bg-green-100 text-green-800`;
      case 'Disahkan': return `${baseClasses} bg-blue-100 text-blue-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Detail Aktivitas</h2>
                    <p className="text-gray-600">{formattedDate}</p>
                </div>
                <span className={getStatusBadge(logData.status)}>{logData.status}</span>
            </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Waktu Tidur & Bangun */}
            <DetailItem label="Jam Bangun Pagi" value={logData.wake_up_time} />
            <DetailItem label="Jam Tidur Malam" value={logData.sleep_time} />

            {/* Ibadah */}
            <div className="md:col-span-2">
                <DetailItem label="Aktivitas Ibadah" value={logData.worship_activities.length > 0 ? logData.worship_activities.join(', ') : null} />
                <DetailItem label="Catatan Ibadah" value={logData.worship_notes} />
            </div>

            {/* Olahraga */}
            <div className="md:col-span-2">
                 <DetailItem label="Jenis Olahraga" value={logData.exercise_type} />
                 <DetailItem label="Detail Olahraga" value={logData.exercise_details} />
            </div>

            {/* Makan Sehat */}
             <div className="md:col-span-2">
                <DetailItem label="Menu Makan Sehat & Bergizi" value={logData.healthy_food_notes} />
            </div>
            
            {/* Belajar */}
            <div className="md:col-span-2">
                <DetailItem label="Materi yang Dipelajari" value={logData.learning_subject} />
                <DetailItem label="Detail Belajar" value={logData.learning_details} />
            </div>

            {/* Sosial */}
            <div className="md:col-span-2">
                <DetailItem label="Aktivitas Sosial / Kebaikan" value={logData.social_activity_notes} />
            </div>

        </div>

         <div className="p-6 border-t border-gray-200 sticky bottom-0 bg-white flex justify-end">
            <button 
                onClick={onClose} 
                className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-300"
            >
                Tutup
            </button>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
