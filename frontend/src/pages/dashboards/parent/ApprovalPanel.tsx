import React, { useState } from 'react';
import toast from 'react-hot-toast';
import parentService, { CharacterLog } from '../../../services/parentService';
import ApprovalView from './ApprovalView'; 
import { CheckSquare, Clock, ChevronRight } from 'lucide-react';

interface ApprovalPanelProps {
  logs: CharacterLog[];
  onApproveSuccess: (updatedLog: CharacterLog) => void; 
  currentUserId: number; 
}

const LogItem: React.FC<{ log: CharacterLog, onSelect: (log: CharacterLog) => void }> = ({ log, onSelect }) => {
    return (
        <div 
            onClick={() => onSelect(log)}
            className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer group"
        >
            <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Clock size={24} />
                </div>
                <div>
                    <h4 className="font-black text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">
                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h4>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide group-hover:text-emerald-500">
                        Menunggu Persetujuan
                    </p>
                </div>
            </div>
            
            <div className="p-2 bg-gray-50 rounded-full text-gray-300 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ChevronRight size={20} />
            </div>
        </div>
    );
};

const ApprovalPanel: React.FC<ApprovalPanelProps> = ({ logs, onApproveSuccess }) => {
  const [selectedLog, setSelectedLog] = useState<CharacterLog | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Jika ada log yang dipilih, tampilkan halaman view detail
  if (selectedLog) {
      const handleApproveLog = async () => {
        if (!selectedLog || isProcessing) return;

        setIsProcessing(true);
        const toastId = toast.loading('Menyetujui log...');

        try {
            const response = await parentService.approveLog(selectedLog.id);
            
            let updatedData: CharacterLog;
            if (response && (response as any).log) {
                updatedData = (response as any).log;
            } else {
                updatedData = response as unknown as CharacterLog;
            }
            
            onApproveSuccess(updatedData); 
            
            toast.success('Log berhasil disetujui!', { id: toastId });
            setSelectedLog(null); 
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Gagal menyetujui log.', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
      };

      return (
          <ApprovalView 
            log={selectedLog}
            onBack={() => setSelectedLog(null)}
            onApprove={handleApproveLog}
            isProcessing={isProcessing}
          />
      );
  }

  // --- FILTER HANYA YANG PENDING ('Tersimpan') ---
  const pendingLogs = logs
    .filter(log => log.status === 'Tersimpan')
    .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  if (pendingLogs.length === 0) {
    return (
        <div className="text-center py-16 px-6 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 animate-fade-in">
            <div className="bg-emerald-50 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckSquare size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">Semua Beres!</h3>
            <p className="text-gray-500 font-medium">Tidak ada jurnal baru yang perlu ditinjau saat ini.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {pendingLogs.map(log => (
        <LogItem 
            key={log.id} 
            log={log} 
            onSelect={setSelectedLog} 
        />
      ))}
    </div>
  );
};

export default ApprovalPanel;