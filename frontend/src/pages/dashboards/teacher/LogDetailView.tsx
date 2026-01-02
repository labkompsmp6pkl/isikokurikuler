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
    AlertCircle,
    CalendarDays
} from 'lucide-react';

interface LogDetailViewProps {
    log: any;
    onBack: () => void;
}

const LogDetailView: React.FC<LogDetailViewProps> = ({ log, onBack }) => {
    if (!log) return null;

    const renderActivitySection = (title: string, icon: any, activities: any, detail: string, colorClass: string) => {
        let items: string[] = [];
        if (Array.isArray(activities)) items = activities.filter((x: any) => !!x);
        else if (typeof activities === 'string' && activities) {
            try {
                const parsed = JSON.parse(activities);
                if (Array.isArray(parsed)) items = parsed;
                else items = [activities];
            } catch { items = [activities]; }
        }

        const hasList = items.length > 0;
        const hasDetail = detail && detail !== '-' && detail.trim() !== '';

        if (!hasList && !hasDetail) return null;

        return (
            <div className={`p-4 rounded-xl border-l-4 ${colorClass} bg-white shadow-sm hover:shadow-md transition-all`}>
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
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h3 className="text-xl font-black text-gray-800">{log.student_name}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                             <CalendarDays size={12}/> {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            log.status === 'Disahkan' ? 'bg-blue-100 text-blue-700' : 
                            log.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                            {log.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
                {/* Status Alert */}
                {log.status === 'Disahkan' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
                        <CheckCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm font-medium text-blue-800">
                            Jurnal ini telah valid dan disahkan oleh Guru.
                        </p>
                    </div>
                )}
                {log.status === 'Tersimpan' && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <p className="text-sm font-medium text-amber-800">
                            Jurnal ini masih dalam status draft/pending dan belum disetujui orang tua.
                        </p>
                    </div>
                )}

                {/* Waktu */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-orange-100 flex flex-col items-center justify-center shadow-sm hover:border-orange-300 transition-all">
                        <div className="flex items-center gap-2 text-orange-600 mb-1"><Clock size={18} /><span className="text-xs font-bold uppercase">Bangun</span></div>
                        <span className="text-3xl font-black text-gray-800">{log.wake_up_time?.substring(0,5) || '-'}</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center shadow-sm hover:border-indigo-300 transition-all">
                        <div className="flex items-center gap-2 text-indigo-600 mb-1"><Clock size={18} /><span className="text-xs font-bold uppercase">Tidur</span></div>
                        <span className="text-3xl font-black text-gray-800">{log.sleep_time?.substring(0,5) || '-'}</span>
                    </div>
                </div>

                {/* List Aktivitas */}
                <div className="space-y-4">
                     {renderActivitySection("Ibadah", <Heart size={18} className="text-emerald-600"/>, log.worship_activities, log.worship_detail, "border-emerald-500")}
                    {renderActivitySection("Olahraga", <Activity size={18} className="text-blue-600"/>, [log.sport_activities], log.sport_detail, "border-blue-500")}
                    {renderActivitySection("Makan Sehat", <Coffee size={18} className="text-green-600"/>, [], log.meal_text, "border-green-500")}
                    {renderActivitySection("Belajar", <BookOpen size={18} className="text-purple-600"/>, log.study_activities, log.study_detail, "border-purple-500")}
                    {renderActivitySection("Sosial", <User size={18} className="text-teal-600"/>, log.social_activities, log.social_detail, "border-teal-500")}
                </div>
            </div>
        </div>
    );
};

export default LogDetailView;