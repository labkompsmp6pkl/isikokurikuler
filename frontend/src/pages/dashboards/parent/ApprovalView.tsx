import React from 'react';
import { 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    Heart, 
    BookOpen, 
    User, 
    Coffee, 
    Activity, 
    AlertCircle 
} from 'lucide-react';
import { CharacterLog } from '../../../services/parentService';

interface ApprovalViewProps {
    log: CharacterLog;
    onBack: () => void;
    onApprove: () => void;
    isProcessing: boolean;
}

const ApprovalView: React.FC<ApprovalViewProps> = ({ log, onBack, onApprove, isProcessing }) => {
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
            <div className={`p-4 rounded-xl border-l-4 ${colorTheme} bg-white shadow-sm transition-all hover:shadow-md`}>
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
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            
            {/* Header Halaman Detail */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        disabled={isProcessing}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h3 className="text-xl font-black text-gray-800">Tinjau Validasi</h3>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                            {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6">
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-amber-800">
                        Mohon periksa laporan kegiatan ananda. Setelah disetujui, data akan diteruskan ke wali kelas.
                    </p>
                </div>

                {/* Grid Layout Waktu */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm hover:border-orange-300 transition-colors">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                            <Clock size={18} /> <span className="text-xs font-bold uppercase">Bangun</span>
                        </div>
                        <span className="text-3xl font-black text-gray-800 tracking-tight">{formatTime(log.wake_up_time)}</span>
                        <span className="text-[10px] font-bold text-gray-400">WIB</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center shadow-sm hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1">
                            <Clock size={18} /> <span className="text-xs font-bold uppercase">Tidur</span>
                        </div>
                        <span className="text-3xl font-black text-gray-800 tracking-tight">{formatTime(log.sleep_time)}</span>
                        <span className="text-[10px] font-bold text-gray-400">WIB</span>
                    </div>
                </div>

                {/* Aktivitas List */}
                <div className="space-y-4">
                    {renderActivitySection("Ibadah", <Heart size={18} className="text-emerald-600"/>, log.worship_activities, log.worship_detail, "border-emerald-500")}
                    {renderActivitySection("Olahraga", <Activity size={18} className="text-blue-600"/>, [log.sport_activities].filter((x): x is string => !!x), log.sport_detail, "border-blue-500")}
                    {renderActivitySection("Makan Sehat", <Coffee size={18} className="text-green-600"/>, [], log.meal_text, "border-green-500")}
                    {renderActivitySection("Belajar", <BookOpen size={18} className="text-purple-600"/>, log.study_activities, log.study_detail, "border-purple-500")}
                    {renderActivitySection("Sosial", <User size={18} className="text-teal-600"/>, log.social_activities, log.social_detail, "border-teal-500")}
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 justify-end items-center">
                 <button 
                    onClick={onBack} 
                    className="w-full md:w-auto px-6 py-4 bg-white text-slate-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
                    disabled={isProcessing}
                >
                    Kembali
                </button>
                <button 
                    onClick={onApprove} 
                    disabled={isProcessing}
                    className="w-full md:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 flex justify-center items-center gap-3 disabled:opacity-70"
                >
                    {isProcessing ? (
                        <>Memproses...</>
                    ) : (
                        <><CheckCircle size={20} /> Saya Setuju & Validasi</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ApprovalView;