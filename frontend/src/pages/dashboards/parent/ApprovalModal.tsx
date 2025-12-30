
import React from 'react';
import { CharacterLog } from '../../../services/parentService';
import { X, ThumbsUp, Loader } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  log: CharacterLog | null;
  onClose: () => void;
  onApprove: (logId: number) => void;
  isApproving: boolean;
}

// Perbaikan: Fungsi ini sekarang menerima tipe `string | Date` untuk lebih aman.
const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "Tanggal tidak valid";
    // Menggunakan new Date() untuk menangani string atau objek Date.
    return new Date(dateInput).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
};

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, log, onClose, onApprove, isApproving }) => {
  if (!isOpen || !log) return null;

  // Perbaikan: Logika untuk menampilkan worship_activities dibuat lebih kuat.
  // Ini memastikan kita hanya memanggil .join() pada sebuah array.
  const worshipActivitiesText = (Array.isArray(log.worship_activities) && log.worship_activities.length > 0)
      ? log.worship_activities.join(', ')
      : 'Tidak ada';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-800">Tinjau dan Setujui</h2>
        <p className="text-sm text-gray-500 mb-4">{formatDate(log.log_date)}</p>

        <div className="space-y-2 text-sm text-gray-700 mb-6">
          <p><strong>Bangun Pagi:</strong> {log.wake_up_time || '-'}</p>
          <p><strong>Tidur Malam:</strong> {log.sleep_time || '-'}</p>
          <p><strong>Aktivitas Ibadah:</strong> {worshipActivitiesText}</p>
          <p><strong>Belajar:</strong> {log.learning_details || '-'}</p>
          <p><strong>Olahraga:</strong> {log.exercise_details || '-'}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold"
            disabled={isApproving}
          >
            Batal
          </button>
          <button
            onClick={() => onApprove(log.id)}
            className="px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 font-semibold flex items-center justify-center disabled:bg-green-400"
            disabled={isApproving}
          >
            {isApproving ? <Loader className="animate-spin mr-2" size={20} /> : <ThumbsUp className="mr-2" size={20} />}
            {isApproving ? 'Memproses...' : 'Setujui'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
