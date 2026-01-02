import React from 'react';
import { ArrowLeft, CheckCircle, Clock, Heart, BookOpen, User, Coffee, Activity, AlertCircle } from 'lucide-react';
import { CharacterLog } from '../../../services/parentService';

interface LogDetailViewProps {
    log: CharacterLog;
    onBack: () => void;
}

const LogDetailView: React.FC<LogDetailViewProps> = ({ log, onBack }) => {
    if (!log) return null;

    // --- HELPER 1: Format Jam ---
    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '-';
        return timeStr.substring(0, 5);
    };

    // --- HELPER 2: Parsing & Render Section ---
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
                    {/* List Items */}
                    {hasList && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {items.map((item, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-2 py-1 rounded-md">
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}
                    
                    {/* Detail Text */}
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
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-4">
                <button 
                    onClick={onBack}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h3 className="text-xl font-black text-gray-800">Detail Kegiatan</h3>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                        {new Date(log.log_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-6">
                
                {/* Status Badge */}
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    log.status === 'Disahkan' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    log.status === 'Disetujui' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                    <div className={`p-3 rounded-full ${
                         log.status === 'Disahkan' ? 'bg-blue-100' :
                         log.status === 'Disetujui' ? 'bg-emerald-100' :
                         'bg-amber-100'
                    }`}>
                        {log.status === 'Disahkan' ? <CheckCircle size={24} /> :
                         log.status === 'Disetujui' ? <CheckCircle size={24} /> :
                         <AlertCircle size={24} />}
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase opacity-70">Status Laporan</p>
                        <p className="font-black text-xl">{log.status}</p>
                    </div>
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
        </div>
    );
};

export default LogDetailView;