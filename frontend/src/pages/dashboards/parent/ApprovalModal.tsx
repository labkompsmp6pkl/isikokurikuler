
import React from 'react';
import { CharacterLog } from '../../../services/parentService';
import { FaTimes, FaBed, FaSun, FaDumbbell, FaBook, FaUsers, FaPrayingHands, FaUtensils, FaCheck } from 'react-icons/fa';

interface ApprovalModalProps {
  isOpen: boolean;
  log: CharacterLog | null;
  onClose: () => void;
  onApprove: (logId: number) => void;
  isApproving: boolean; // <-- [PERBAIKAN] Menambahkan prop isApproving
}

const DetailItem: React.FC<{ icon: React.ElementType, label: string, value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-3">
        <Icon className="text-blue-500 mt-1 mr-4 flex-shrink-0" size={20} />
        <div>
            <p className="font-semibold text-gray-700">{label}</p>
            <div className="text-gray-600 text-md">{value}</div>
        </div>
    </div>
);

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, log, onClose, onApprove, isApproving }) => {
  if (!isOpen || !log) return null;

  const worshipDisplay = Array.isArray(log.worship_activities) ? log.worship_activities.join(', ') : 'Tidak ada data';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 animate-modal-pop-in">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Detail Catatan Harian</h2>
                    <p className="text-gray-500">Tanggal: {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition">
                    <FaTimes size={24} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {/* ... (Detail items tidak berubah) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    
                    <DetailItem icon={FaSun} label="Jam Bangun Tidur" value={`${log.wake_up_time} WIB`} />
                    
                    <DetailItem icon={FaBed} label="Jam Tidur Malam" value={`${log.sleep_time} WIB`} />

                    <DetailItem 
                        icon={FaPrayingHands} 
                        label="Aktivitas Ibadah" 
                        value={worshipDisplay}
                    />

                    <DetailItem 
                        icon={FaUtensils} 
                        label="Makan Makanan Sehat" 
                        value={log.healthy_food_notes || 'Tidak ada catatan khusus'}
                    />

                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <DetailItem 
                            icon={FaDumbbell} 
                            label={`Olahraga (${log.exercise_type})`} 
                            value={log.exercise_details || 'Tidak ada detail tambahan'}
                        />
                    </div>

                    <div className="md:col-span-2 border-t pt-4 mt-2">
                        <DetailItem 
                            icon={FaBook} 
                            label={`Belajar Mandiri (${log.learning_subject})`}
                            value={log.learning_details || 'Tidak ada detail tambahan'}
                        />
                    </div>

                     <div className="md:col-span-2 border-t pt-4 mt-2">
                        <DetailItem 
                            icon={FaUsers} 
                            label="Aktivitas Sosial / Membantu Orang Tua"
                            value={log.social_activity_notes || 'Tidak ada catatan khusus'}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center p-5 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl z-10">
                <button 
                    onClick={onClose} 
                    className="px-6 py-2 mr-3 text-gray-700 bg-gray-100 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                    Tutup
                </button>
                {/* [PERBAIKAN] Tombol sekarang akan dinonaktifkan saat isApproving true */}
                <button 
                    onClick={() => onApprove(log.id)} 
                    disabled={isApproving} // Menonaktifkan tombol
                    className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition flex items-center ${isApproving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    <FaCheck className="mr-2"/>
                    {isApproving ? 'Memproses...' : 'Setujui Log Ini'} 
                </button>
            </div>
        </div>
         <style>{`
            @keyframes modal-pop-in {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            .animate-modal-pop-in {
                animation: modal-pop-in 0.3s ease-out forwards;
            }
        `}</style>
    </div>
  );
};

export default ApprovalModal;
