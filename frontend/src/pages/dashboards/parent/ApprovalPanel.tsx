
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import parentService, { CharacterLog } from '../../../services/parentService';
import ApprovalModal from './ApprovalModal';
import { FaRegCalendarAlt, FaCheckCircle, FaHourglassHalf } from 'react-icons/fa';

interface ApprovalPanelProps {
  logs: CharacterLog[];
  onApproveSuccess: (updatedLog: CharacterLog) => void; 
}

const LogItem: React.FC<{ log: CharacterLog, onSelect: (log: CharacterLog) => void }> = ({ log, onSelect }) => {
    const isApproved = log.status === 'Disetujui';
    const statusIcon = isApproved ? 
        <FaCheckCircle className="text-green-500" /> : 
        <FaHourglassHalf className="text-yellow-500 animate-pulse" />;

    return (
        <div className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${isApproved ? 'bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}`}>
            <div className="flex items-center">
                <FaRegCalendarAlt className="text-gray-400 mr-4" size={20} />
                <div>
                    <p className="font-bold text-gray-800">
                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        {statusIcon}
                        <span className="ml-2">Status: {log.status}</span>
                    </div>
                </div>
            </div>
            {!isApproved && (
                 <button 
                    onClick={() => onSelect(log)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                    Tinjau & Setujui
                </button>
            )}
        </div>
    );
};


const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ logs, onApproveSuccess }) => {
  const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const handleSelectLog = (log: CharacterLog) => setSelectedLog(log);
  const handleCloseModal = () => setSelectedLog(null);

  const handleApproveLog = async (logId: number) => {
    if (isApproving) return;

    setIsApproving(true);
    const toastId = toast.loading('Menyetujui log...');

    try {
        // Panggil API, dapatkan log yang sudah diupdate dari respons
        const response = await parentService.approveLog(logId);
        
        // Teruskan log yang sudah diperbarui dari API ke fungsi state induk
        onApproveSuccess(response.log); 
        
        toast.success('Log berhasil disetujui!', { id: toastId });
        handleCloseModal();
    } catch (error: any) {
        toast.error(error.message || 'Gagal menyetujui log.', { id: toastId });
    } finally {
        setIsApproving(false);
    }
  };

  const pendingLogs = logs.filter(log => log.status !== 'Disetujui');

  if (pendingLogs.length === 0) {
    return (
        <div className="text-center py-12 px-6 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <h3 className="mt-2 text-xl font-semibold text-gray-800">Semua Sudah Beres!</h3>
            <p className="mt-1 text-gray-500">Tidak ada catatan baru yang perlu Anda tinjau saat ini.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Catatan Perlu Tinjauan</h2>
      {pendingLogs.map(log => (
        <LogItem key={log.id} log={log} onSelect={handleSelectLog} />
      ))}

      <ApprovalModal 
        isOpen={!!selectedLog}
        log={selectedLog}
        onClose={handleCloseModal}
        onApprove={handleApproveLog}
        isApproving={isApproving} 
      />
    </div>
  );
};

export default ApprovalPanel;
