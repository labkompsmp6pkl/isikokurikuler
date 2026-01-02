import React from 'react';
import { X, CheckCircle, Clock, Heart, BookOpen, User, Coffee, Activity } from 'lucide-react';
import { CharacterLog } from '../../../services/parentService';

interface ApprovalModalProps {
    log: CharacterLog;
    onClose: () => void;
    onApprove: () => void;
    isProcessing: boolean;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ log, onClose, onApprove, isProcessing }) => {
    if (!log) return null;

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '-';
        return timeStr.substring(0, 5);
    };

    const renderActivitySection = (
        title: string, 
        icon: React.ReactNode, 
        activities: string | string[] | undefined, 
        detail: string | undefined, 
        colorTheme: string
    ) => {
        let items: string[] = [];
        if (Array.isArray(activities)) {
            items = activities.filter((item): item is string => !!item);
        } else if (typeof activities === 'string') {
            try {
                const parsed = JSON.parse(activities);
                if (Array.isArray(parsed)) items = parsed;
                else items = [activities];
            } catch (e) {
                if (activities.trim() !== '') items = [activities];
            }
        }

        const safeDetail = detail || ''; 
        const hasList = items.length > 0;
        const hasDetail = safeDetail.trim() !== '' && safeDetail !== '-';

        if (!hasList && !hasDetail) {
            return (
                <div className={`p-4 rounded-xl border border-gray-100 bg-gray-50 opacity-60`}>
                    <div className="flex items-center gap-2 mb-1">
                        {icon}
                        <h4 className="font-bold text-gray-500 text-sm uppercase">{title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 pl-7 italic">Tidak ada aktivitas</p>
                </div>
            );
        }

        return (
            <div className={`p-4 rounded-xl border-l-4 ${colorTheme} bg-white shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <h4 className="font-bold text-gray-800 text-sm uppercase">{title}</h4>
                </div>
                <div className="pl-7">
                    {hasList && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {items.map((item, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-2 py-1 rounded-md">
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}
                    {hasDetail && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic border border-gray-100">
                            "{safeDetail}"
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-50 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-white p-5 border-b border-gray-200 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-gray-800">Konfirmasi Validasi</h3>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 text-sm font-medium mb-2">
                        Pastikan Anda telah memeriksa kegiatan ananda dengan seksama sebelum menyetujuinya.
                    </div>
                    
                    {/* Waktu */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-orange-200 flex flex-col items-center justify-center shadow-sm">
                            <div className="flex items-center gap-1 text-orange-600 mb-1">
                                <Clock size={16} /> <span className="text-xs font-bold uppercase">Bangun</span>
                            </div>
                            <span className="text-2xl font-black text-gray-800">{formatTime(log.wake_up_time)}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-indigo-200 flex flex-col items-center justify-center shadow-sm">
                            <div className="flex items-center gap-1 text-indigo-600 mb-1">
                                <Clock size={16} /> <span className="text-xs font-bold uppercase">Tidur</span>
                            </div>
                            <span className="text-2xl font-black text-gray-800">{formatTime(log.sleep_time)}</span>
                        </div>
                    </div>

                    {renderActivitySection("Ibadah", <Heart size={18} className="text-emerald-600"/>, log.worship_activities, log.worship_detail, "border-emerald-500")}
                    {renderActivitySection("Olahraga", <Activity size={18} className="text-blue-600"/>, [log.sport_activities].filter((x): x is string => !!x), log.sport_detail, "border-blue-500")}
                    {renderActivitySection("Makan Sehat", <Coffee size={18} className="text-green-600"/>, [], log.meal_text, "border-green-500")}
                    {renderActivitySection("Belajar", <BookOpen size={18} className="text-purple-600"/>, log.study_activities, log.study_detail, "border-purple-500")}
                    {renderActivitySection("Sosial", <User size={18} className="text-teal-600"/>, log.social_activities, log.social_detail, "border-teal-500")}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-200 bg-white rounded-b-2xl flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors" disabled={isProcessing}>
                        Batal
                    </button>
                    <button onClick={onApprove} className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-emerald-200 flex justify-center items-center gap-2" disabled={isProcessing}>
                        {isProcessing ? <span className="animate-pulse">Memproses...</span> : <><CheckCircle size={20} /> Saya Setuju & Validasi</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;