import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { 
    CheckSquare, 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    Heart, 
    BookOpen, 
    User, 
    Coffee, 
    Activity, 
    ChevronRight,
    AlertCircle,
    CalendarDays
} from 'lucide-react';
import teacherService from '../../../services/teacherService';

interface ValidationViewProps {
    logs: any[];
    onRefresh: () => void;
}

const DetailPage: React.FC<{ log: any, onBack: () => void, onRefresh: () => void }> = ({ log, onBack, onRefresh }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleValidate = async () => {
        setIsProcessing(true);
        const toastId = toast.loading('Mengesahkan jurnal...', { id: 'validate-process' });
        try {
            await teacherService.validateLog(log.id);
            toast.success('Jurnal berhasil disahkan! ✅', { id: toastId });
            onRefresh(); // Refresh data utama
            onBack();    // Kembali ke list
        } catch (error) {
            toast.error('Gagal mengesahkan jurnal.', { id: toastId });
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper render section
    const renderActivitySection = (title: string, icon: any, activities: any, detail: string, colorClass: string) => {
        let items: string[] = [];
        if (Array.isArray(activities)) items = activities.filter((x: any) => !!x);
        else if (typeof activities === 'string' && activities) items = [activities];

        const hasList = items.length > 0;
        const hasDetail = detail && detail !== '-' && detail.trim() !== '';

        if (!hasList && !hasDetail) return null;

        return (
            <div className={`p-4 rounded-xl border-l-4 ${colorClass} bg-white shadow-sm`}>
                <div className="flex items-center gap-2 mb-2">
                    {icon}
                    <h4 className="font-bold text-gray-800 text-sm uppercase">{title}</h4>
                </div>
                <div className="pl-7">
                    {hasList && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {items.map((item, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-2 py-1 rounded-md">{item}</span>
                            ))}
                        </div>
                    )}
                    {hasDetail && <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic border border-gray-100">"{detail}"</p>}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            {/* Header Detail */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="text-xl font-black text-gray-800">{log.student_name}</h3>
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium text-amber-800">
                        Jurnal ini telah disetujui oleh Orang Tua. Silakan validasi sebagai langkah terakhir (Pengesahan).
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex items-center gap-2 text-orange-600 mb-1"><Clock size={18} /><span className="text-xs font-bold uppercase">Bangun</span></div>
                        <span className="text-2xl font-black text-gray-800">{log.wake_up_time?.substring(0,5)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><Clock size={18} /><span className="text-xs font-bold uppercase">Tidur</span></div>
                        <span className="text-2xl font-black text-gray-800">{log.sleep_time?.substring(0,5)}</span>
                    </div>
                </div>

                <div className="space-y-4">
                     {renderActivitySection("Ibadah", <Heart size={18} className="text-emerald-600"/>, log.worship_activities, log.worship_detail, "border-emerald-500")}
                    {renderActivitySection("Olahraga", <Activity size={18} className="text-blue-600"/>, [log.sport_activities], log.sport_detail, "border-blue-500")}
                    {renderActivitySection("Makan Sehat", <Coffee size={18} className="text-green-600"/>, [], log.meal_text, "border-green-500")}
                    {renderActivitySection("Belajar", <BookOpen size={18} className="text-purple-600"/>, log.study_activities, log.study_detail, "border-purple-500")}
                    {renderActivitySection("Sosial", <User size={18} className="text-teal-600"/>, log.social_activities, log.social_detail, "border-teal-500")}
                </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                    onClick={handleValidate} 
                    disabled={isProcessing}
                    className="w-full md:w-auto px-8 py-4 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all shadow-lg hover:shadow-violet-200 flex justify-center items-center gap-3 disabled:opacity-70"
                >
                    {isProcessing ? 'Memproses...' : <><CheckCircle size={20} /> Sahkan Jurnal</>}
                </button>
            </div>
        </div>
    );
};

const ValidationView: React.FC<ValidationViewProps> = ({ logs, onRefresh }) => {
    const [selectedLog, setSelectedLog] = useState<any>(null);

    // Filter log yang statusnya 'Disetujui' (artinya disetujui ortu, menunggu guru)
    const pendingLogs = logs.filter(l => l.status === 'Disetujui');

    if (selectedLog) {
        return <DetailPage log={selectedLog} onBack={() => setSelectedLog(null)} onRefresh={onRefresh} />;
    }

    if (pendingLogs.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-6 text-violet-600">
                    <CheckSquare size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Semua Tervalidasi!</h3>
                <p className="text-gray-500 font-medium">Tidak ada jurnal siswa yang perlu disahkan saat ini.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-slide-up">
            <div className="p-6 border-b border-gray-100 bg-white rounded-[2rem] shadow-sm mb-6 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-widest">Antrean Pengesahan</h3>
                <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-bold">{pendingLogs.length} Jurnal</span>
            </div>

            {pendingLogs.map(log => (
                <div 
                    key={log.id} 
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 bg-white hover:border-violet-200 hover:shadow-lg transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-lg group-hover:text-violet-700 transition-colors">
                                {log.student_name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                    <CalendarDays size={12} /> {new Date(log.log_date).toLocaleDateString('id-ID')}
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                    Disetujui Ortu
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-2 bg-gray-50 rounded-full text-gray-300 group-hover:bg-violet-600 group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ValidationView;