import React, { useState } from 'react';
import toast from 'react-hot-toast';
import parentService, { CharacterLog } from '../../../services/parentService';
import ApprovalModal from './ApprovalModal';
import { CheckSquare, Clock } from 'lucide-react';

interface ApprovalPanelProps {
  logs: CharacterLog[];
  onApproveSuccess: (updatedLog: CharacterLog) => void; 
}

// Komponen Item Log Individual
const LogItem: React.FC<{ log: CharacterLog, onSelect: (log: CharacterLog) => void }> = ({ log, onSelect }) => {
    const isApproved = log.status === 'Disetujui';
    
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
            isApproved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:shadow-md'
        }`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isApproved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {isApproved ? <CheckSquare size={20} /> : <Clock size={20} />}
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">
                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">
                        STATUS: <span className={`ml-1 ${isApproved ? 'text-green-600' : 'text-yellow-600'}`}>{log.status}</span>
                    </div>
                </div>
            </div>
            
            {!isApproved && (
                 <button 
                    onClick={() => onSelect(log)}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                >
                    Tinjau
                </button>
            )}
        </div>
    );
};

// Komponen Utama Panel
const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ logs, onApproveSuccess }) => {
  const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectLog = (log: CharacterLog) => setSelectedLog(log);
  const handleCloseModal = () => setSelectedLog(null);

  // Fungsi Approve
  const handleApproveLog = async () => {
    if (!selectedLog || isProcessing) return;

    setIsProcessing(true);
    const toastId = toast.loading('Menyetujui log...');

    try {
        // [FIX] Mengambil response yang berisi { message, log }
        const response = await parentService.approveLog(selectedLog.id);
        
        // [FIX] Mengirim hanya objek 'log' ke parent component
        if (response && response.log) {
            onApproveSuccess(response.log); 
        } else {
            // Fallback jika struktur berbeda (misal langsung mengembalikan log)
            onApproveSuccess(response as unknown as CharacterLog);
        }
        
        toast.success('Log berhasil disetujui!', { id: toastId });
        handleCloseModal();
    } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Gagal menyetujui log.', { id: toastId });
    } finally {
        setIsProcessing(false);
    }
  };

  // Filter logs yang belum disetujui (Status: 'Tersimpan')
  const pendingLogs = logs.filter(log => log.status === 'Tersimpan');

  if (pendingLogs.length === 0) {
    return (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckSquare size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-800">Semua Beres!</h3>
            <p className="mt-1 text-gray-500 font-medium">Tidak ada catatan baru yang perlu ditinjau.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingLogs.map(log => (
        <LogItem key={log.id} log={log} onSelect={handleSelectLog} />
      ))}

      {/* Render Modal Hanya Jika Ada Selected Log */}
      {selectedLog && (
          <ApprovalModal 
            log={selectedLog}
            onClose={handleCloseModal}
            onApprove={handleApproveLog}
            isProcessing={isProcessing} 
          />
      )}
    </div>
  );
};

export default ApprovalPanel;