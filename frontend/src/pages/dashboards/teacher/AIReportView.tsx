import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
    Sparkles, 
    FileText, 
    Printer, 
    RefreshCw, 
    User, 
    ChevronRight, 
    CalendarRange, 
    Clock,
    Ban
} from 'lucide-react';
import teacherService from '../../../services/teacherService';
import StudentSelectorView from './StudentSelectorView';

interface AIReportViewProps {
    students: any[];
    teacherClass?: string;
    teacherName: string;
    teacherNip: string;
}

const AIReportView: React.FC<AIReportViewProps> = ({ students, teacherClass, teacherName, teacherNip }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState({ studentId: '', startDate: '', endDate: '' });
    const [result, setResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // State untuk kontrol tampilan Selector & Range Data
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [dataRange, setDataRange] = useState<{ start: string, end: string, count: number } | null>(null);
    const [isCheckingData, setIsCheckingData] = useState(false);

    const selectedStudent = students.find(s => s.id == config.studentId);

    // --- EFFECT: Cek Data Saat Siswa Dipilih ---
    useEffect(() => {
        const checkStudentData = async () => {
            if (!config.studentId) {
                setDataRange(null);
                return;
            }

            setIsCheckingData(true);
            try {
                // Ambil history siswa
                const logs = await teacherService.getClassHistory(config.studentId);
                
                if (logs && logs.length > 0) {
                    // Sort logs berdasarkan tanggal
                    const sortedLogs = logs.sort((a: any, b: any) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
                    
                    const firstDate = sortedLogs[0].log_date; // YYYY-MM-DD
                    const lastDate = sortedLogs[sortedLogs.length - 1].log_date;
                    
                    setDataRange({
                        start: firstDate,
                        end: lastDate,
                        count: logs.length
                    });
                } else {
                    setDataRange(null);
                }
            } catch (error) {
                console.error("Gagal cek range data", error);
                setDataRange(null);
            } finally {
                setIsCheckingData(false);
            }
        };

        checkStudentData();
    }, [config.studentId]);

    const handleGenerate = async () => {
        if (!config.studentId || !config.startDate || !config.endDate) {
            return toast.error('Lengkapi data siswa dan periode tanggal.', { id: 'form-warning' });
        }
        setIsGenerating(true);
        const toastId = toast.loading('Kecerdasan Buatan sedang bekerja...', { id: 'ai-process' });
        
        try {
            const res = await teacherService.generateReport({
                studentId: parseInt(config.studentId),
                startDate: config.startDate,
                endDate: config.endDate
            });
            setResult(res);
            toast.success('Analisis AI Selesai!', { icon: '✨', id: toastId });
        } catch (err) {
            toast.error('Gagal menyusun analisis AI.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => window.print();

    const handleStudentSelect = (id: string) => {
        setConfig({ ...config, studentId: id, startDate: '', endDate: '' }); // Reset tanggal saat ganti siswa
        setIsSelectorOpen(false);
        toast.success('Siswa dipilih', { icon: '👤', duration: 1500 });
    };

    const applyDataRange = () => {
        if (dataRange) {
            setConfig(prev => ({ ...prev, startDate: dataRange.start, endDate: dataRange.end }));
            toast.success('Tanggal disesuaikan dengan data aktivitas', { icon: '📅' });
        }
    };

    // --- LOGIC DISPLAY ---

    // Variable Helper untuk kondisi tombol
    // Perbaikan: Menggunakan '!!' untuk memastikan tipe data boolean
    const isDataEmpty = !!config.studentId && !isCheckingData && !dataRange;
    const isButtonDisabled = isGenerating || !config.studentId || isCheckingData || !dataRange;

    if (isSelectorOpen) {
        return (
            <StudentSelectorView 
                students={students} 
                onSelect={handleStudentSelect} 
                onBack={() => setIsSelectorOpen(false)} 
            />
        );
    }

    // CSS Khusus Print
    const printStyles = `
        @media print {
            @page { size: portrait; margin: 1.5cm; }
            body { visibility: hidden; background: white; }
            .print-area { 
                visibility: visible; position: absolute; left: 0; top: 0; width: 100%; 
                margin: 0; padding: 0; background: white !important; 
                box-shadow: none !important; border: none !important; color: black !important;
            }
            .print-area * { visibility: visible; }
            .print-area p, .print-area h1, .print-area h2, .print-area h3, .print-area h4, .print-area span, .print-area div {
                color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;
            }
            .no-print { display: none !important; }
            .animate-fade-in, .animate-slide-up { animation: none !important; }
        }
    `;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <style>{printStyles}</style>

            {/* Config Panel */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-200 relative overflow-hidden no-print">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-200">
                            <Sparkles size={28}/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Generator Rapor Karakter AI</h2>
                            <p className="text-gray-500 font-medium text-sm">Sintesis data perilaku siswa secara otomatis menggunakan kecerdasan buatan.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        
                        {/* 1. PILIH SISWA */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Pilih Siswa</label>
                            <button 
                                onClick={() => setIsSelectorOpen(true)}
                                className={`w-full text-left px-4 py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-between group ${
                                    selectedStudent 
                                    ? 'bg-violet-50 border-violet-200 text-violet-800' 
                                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-violet-200 hover:text-gray-600'
                                }`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${selectedStudent ? 'bg-violet-200 text-violet-700' : 'bg-gray-200 text-gray-500'}`}>
                                        <User size={14} />
                                    </div>
                                    <span className="truncate">
                                        {selectedStudent ? selectedStudent.full_name : '-- Pilih Siswa --'}
                                    </span>
                                </div>
                                <ChevronRight size={18} className={`transition-transform group-hover:translate-x-1 ${selectedStudent ? 'text-violet-400' : 'text-gray-300'}`}/>
                            </button>
                        </div>

                        {/* 2. TANGGAL MULAI */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Mulai Tanggal</label>
                            <input 
                                type="date" 
                                className="w-full bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl font-bold text-gray-700 outline-none focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-400" 
                                value={config.startDate} 
                                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                                disabled={isDataEmpty} // Disable jika data kosong
                            />
                        </div>

                        {/* 3. TANGGAL AKHIR */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Hingga Tanggal</label>
                            <input 
                                type="date" 
                                className="w-full bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl font-bold text-gray-700 outline-none focus:border-violet-500 disabled:bg-gray-100 disabled:text-gray-400" 
                                value={config.endDate} 
                                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                                disabled={isDataEmpty} // Disable jika data kosong
                            />
                        </div>

                        {/* 4. TOMBOL GENERATE */}
                        <button 
                            onClick={handleGenerate} 
                            disabled={isButtonDisabled} 
                            className={`h-[60px] rounded-2xl font-black transition-all flex justify-center items-center gap-2 shadow-lg disabled:cursor-not-allowed ${
                                isDataEmpty 
                                ? 'bg-gray-200 text-gray-400 shadow-none border-2 border-gray-100' // Style Data Kosong
                                : 'bg-slate-900 text-white hover:bg-violet-600 hover:shadow-violet-200 disabled:opacity-50' // Style Normal
                            }`}
                        >
                            {isGenerating ? (
                                <RefreshCw className="animate-spin" size={20}/>
                            ) : isCheckingData ? (
                                <RefreshCw className="animate-spin" size={20}/> 
                            ) : isDataEmpty ? (
                                <><Ban size={18}/> DATA KOSONG</>
                            ) : (
                                <><Sparkles size={20}/> ANALISIS</>
                            )}
                        </button>
                    </div>

                    {/* SMART DATE HELPER */}
                    {selectedStudent && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4 animate-slide-up">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <Clock size={14} /> <span>Status Data:</span>
                            </div>
                            
                            {isCheckingData ? (
                                <span className="text-xs text-gray-400 italic flex items-center gap-2">
                                    <RefreshCw size={12} className="animate-spin"/> Memeriksa riwayat...
                                </span>
                            ) : dataRange ? (
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs font-medium text-gray-600">
                                        Ditemukan <strong>{dataRange.count}</strong> aktivitas dari <strong>{new Date(dataRange.start).toLocaleDateString('id-ID')}</strong> s.d <strong>{new Date(dataRange.end).toLocaleDateString('id-ID')}</strong>
                                    </span>
                                    <button 
                                        onClick={applyDataRange}
                                        className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <CalendarRange size={14} /> Sesuaikan dengan Data
                                    </button>
                                </div>
                            ) : (
                                <span className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-1 rounded-lg flex items-center gap-2">
                                    <Ban size={14}/> Belum ada riwayat aktivitas untuk siswa ini.
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Result Preview */}
            {result && (
                <div ref={printRef} className="print-area animate-slide-up">
                    <div className="bg-slate-900 p-6 rounded-t-[2.5rem] flex justify-between items-center no-print shadow-xl">
                        <div className="flex items-center gap-3 text-white px-4">
                            <FileText size={24} className="text-violet-400"/>
                            <span className="font-bold uppercase tracking-wider text-sm">Preview Dokumen</span>
                        </div>
                        <button onClick={handlePrint} className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-violet-50 transition-all flex items-center gap-2 shadow-lg">
                            <Printer size={18} /> CETAK / PDF
                        </button>
                    </div>

                    <div className="bg-white p-12 md:p-20 rounded-b-[2.5rem] shadow-2xl border border-gray-100 text-black font-serif leading-relaxed">
                        
                        {/* KOP SURAT */}
                        <div className="flex items-center justify-center border-b-4 border-double border-black pb-6 mb-10 gap-6">
                            <img src="/logo-smpn6.png" alt="Logo" className="w-24 h-auto" />
                            <div className="text-center">
                                <h1 className="text-3xl font-bold text-black uppercase mb-1">SMP NEGERI 6 PEKALONGAN</h1>
                                <p className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-1">LAPORAN PEMBIASAAN KARAKTER SISWA</p>
                                <p className="text-xs italic text-gray-600">Jl. Teratai No.31, Poncol, Kota Pekalongan, Jawa Tengah 51122</p>
                            </div>
                        </div>

                        {/* IDENTITAS */}
                        <div className="mb-12 text-sm font-sans">
                            <div className="grid grid-cols-[150px_20px_auto] mb-2">
                                <span className="font-bold uppercase text-gray-900">Nama Siswa</span>
                                <span>:</span>
                                <span className="font-bold uppercase text-black text-lg">{selectedStudent?.full_name}</span>
                            </div>
                            <div className="grid grid-cols-[150px_20px_auto] mb-2">
                                <span className="font-bold uppercase text-gray-900">Kelas</span>
                                <span>:</span>
                                <span className="font-bold uppercase text-black">{teacherClass}</span>
                            </div>
                            <div className="grid grid-cols-[150px_20px_auto]">
                                <span className="font-bold uppercase text-gray-900">Periode</span>
                                <span>:</span>
                                <span className="font-bold text-black">{new Date(config.startDate).toLocaleDateString('id-ID')} s.d {new Date(config.endDate).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="space-y-10 text-justify">
                            <section>
                                <h4 className="font-bold text-lg uppercase mb-2 border-l-4 border-orange-500 pl-4 text-black">I. Ringkasan Eksekutif</h4>
                                <p className="text-gray-900">{result.executive_summary}</p>
                            </section>
                            
                            <section>
                                <h4 className="font-bold text-lg uppercase mb-2 border-l-4 border-blue-500 pl-4 text-black">II. Progress Karakter</h4>
                                <p className="text-gray-900">{result.character_progress}</p>
                            </section>
                            
                            <section>
                                <h4 className="font-bold text-lg uppercase mb-2 border-l-4 border-violet-600 pl-4 text-black">III. Rekomendasi & Narasi Rapor</h4>
                                <div className="p-6 bg-gray-50 rounded-xl border-l-2 border-violet-200 italic text-gray-800">
                                    "{result.report_narrative}"
                                </div>
                            </section>
                        </div>

                        {/* TTD */}
                        <div className="flex justify-between mt-20 pt-10 font-sans break-inside-avoid">
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="font-bold text-black mb-4">Orang Tua / Wali Murid</p>
                                <div className="h-24"></div> 
                                <p className="font-bold uppercase text-xs border-b border-black pb-1 px-4 min-w-[150px]">
                                    {selectedStudent?.parent_name || "( ........................... )"}
                                </p>
                            </div>
                            
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="font-bold text-black mb-1">
                                    Pekalongan, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                                </p>
                                <p className="text-xs font-normal mb-4 text-black">Wali Kelas</p>
                                <div className="h-20"></div>
                                <p className="font-bold underline uppercase mb-1 text-black">
                                    {teacherName || "..........................."}
                                </p>
                                <p className="text-xs font-bold text-black">
                                    NIP. {teacherNip || "..........................."}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AIReportView;