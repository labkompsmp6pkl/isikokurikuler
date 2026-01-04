import React, { useState } from 'react';
import { ArrowLeft, User, Star, FileText, CalendarDays, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';

interface RecordDetailViewProps {
    records: any[]; 
    initialIndex: number;
    onBack: () => void;
}

const RecordDetailView: React.FC<RecordDetailViewProps> = ({ records, initialIndex, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const record = records[currentIndex];

    if (!record) return null;

    const nextRecord = () => {
        if (currentIndex < records.length - 1) setCurrentIndex(curr => curr + 1);
    };

    const prevRecord = () => {
        if (currentIndex > 0) setCurrentIndex(curr => curr - 1);
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden animate-fade-in relative min-h-[500px] flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h3 className="text-xl font-black text-gray-800">Detail Aktivitas</h3>
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                            <CalendarDays size={12} /> {new Date(record.record_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                        </p>
                    </div>
                </div>
                
                {/* Pagination Indicator */}
                <div className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {records.length}
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="p-8 space-y-6 flex-1 pb-32">
                
                {/* Score Card */}
                <div className={`p-6 rounded-2xl text-white shadow-lg flex items-center justify-between ${
                    record.type === 'Karakter Rutin' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                    : 'bg-gradient-to-r from-rose-600 to-pink-600'
                }`}>
                    <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">
                            {record.type === 'Karakter Rutin' ? 'Karakter Selesai' : 'Skor Diberikan'}
                        </p>
                        <span className="text-4xl font-black">{record.score}</span>
                        <span className="text-lg opacity-70">/100</span>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                        <Star size={32} fill="white" />
                    </div>
                </div>

                {/* Info Siswa & Penilai */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold shadow-sm">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Siswa</p>
                            <p className="font-black text-gray-800 text-lg">{record.student_name}</p>
                            <p className="text-xs font-bold text-gray-500">Kelas {record.class_name}</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border-2 border-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identitas Penilai</p>
                            <p className="font-black text-gray-800 text-lg">{record.contributor_role || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Catatan */}
                <div className="p-4 rounded-xl border-l-4 border-slate-500 bg-white shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                        <FileText size={18} />
                        <h4 className="font-bold text-sm uppercase">
                            {record.type === 'Karakter Rutin' ? 'Judul Karakter' : 'Bukti / Catatan'}
                        </h4>
                    </div>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-4 rounded-lg border border-gray-100 leading-relaxed">
                        "{record.notes || '-'}"
                    </p>
                </div>
            </div>

            {/* Slideshow Controls (Floating at Bottom) */}
            {records.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-between items-center z-20">
                    
                    <button 
                        onClick={prevRecord} 
                        disabled={currentIndex === 0}
                        className="px-6 py-3 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        <ChevronLeft size={20} /> Sebelumnya
                    </button>

                    <button 
                        onClick={nextRecord} 
                        disabled={currentIndex === records.length - 1}
                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                    >
                        Selanjutnya <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecordDetailView;