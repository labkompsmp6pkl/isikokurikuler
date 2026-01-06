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
    Ban,
    Users,
    Loader2,
    Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import teacherService from '../../../services/teacherService';
import StudentSelectorView from './StudentSelectorView';

interface AIReportViewProps {
    students: any[];
    teacherClass?: string;
    teacherName: string;
    teacherNip: string;
}

interface ParentOption {
    id: number;
    full_name: string;
    relationship: string;
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

    // State untuk Penanda Tangan Orang Tua
    const [parents, setParents] = useState<ParentOption[]>([]);
    const [selectedParentName, setSelectedParentName] = useState<string>('');
    const [loadingParents, setLoadingParents] = useState(false);

    const selectedStudent = students.find(s => String(s.id) === config.studentId);

    // --- EFFECT: Cek Data & Load Parents Saat Siswa Dipilih ---
    useEffect(() => {
        const checkStudentData = async () => {
            if (!config.studentId) {
                setDataRange(null);
                setParents([]);
                setSelectedParentName('');
                return;
            }

            setIsCheckingData(true);
            setLoadingParents(true);

            try {
                // 1. Cek Range Data (History)
                const logs = await teacherService.getClassHistory(config.studentId);
                
                if (logs && logs.length > 0) {
                    const sortedLogs = logs.sort((a: any, b: any) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
                    const firstDate = sortedLogs[0].log_date;
                    const lastDate = sortedLogs[sortedLogs.length - 1].log_date;
                    
                    setDataRange({
                        start: firstDate,
                        end: lastDate,
                        count: logs.length
                    });
                } else {
                    setDataRange(null);
                }

                // 2. Ambil Data Orang Tua untuk Tanda Tangan
                try {
                    const parentsData = await teacherService.getStudentParents(parseInt(config.studentId));
                    setParents(parentsData);
                    if (parentsData.length > 0) {
                        setSelectedParentName(parentsData[0].full_name); 
                    } else {
                        setSelectedParentName('');
                    }
                } catch (e) {
                    console.warn("Gagal load parents, lanjut tanpa parent data");
                }

            } catch (error) {
                console.error("Gagal cek data siswa", error);
                setDataRange(null);
            } finally {
                setIsCheckingData(false);
                setLoadingParents(false);
            }
        };

        checkStudentData();
    }, [config.studentId]);

    const handleGenerate = async () => {
        // [FIX] Tambahkan ID 'form-warning' agar toast warning tidak menumpuk
        if (!config.studentId || !config.startDate || !config.endDate) {
            return toast.error('Lengkapi data siswa dan periode tanggal.', { id: 'form-warning' });
        }
        setIsGenerating(true);
        // [INFO] Loading sudah menggunakan ID, jadi aman
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

    // [BARU] Generate PDF Resmi, Berwarna, & Ada Logo
    const generatePDF = () => {
        if (!result || !selectedStudent) return;

        // [FIX] Tambahkan toast loading dengan ID
        const toastId = toast.loading("Sedang membuat PDF...", { id: 'pdf-gen' });

        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // --- LOGO & KOP SURAT ---
        const img = new Image();
        img.src = '/logo-smpn6.png'; 
        
        img.onload = () => {
            try {
                // Gambar Logo (x, y, width, height)
                doc.addImage(img, 'PNG', 20, 10, 20, 20); 

                // Text Kop Surat
                doc.setTextColor(0, 0, 0); // Hitam
                doc.setFontSize(16);
                doc.setFont("helvetica", "bold");
                doc.text("SMP NEGERI 6 PEKALONGAN", 105, 20, { align: "center" });
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text("LAPORAN PEMBIASAAN KARAKTER SISWA (AI ANALYSIS)", 105, 26, { align: "center" });
                
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100); // Abu-abu
                doc.text("Jl. Teratai No.31, Poncol, Kota Pekalongan, Jawa Tengah 51122", 105, 31, { align: "center" });
                
                // Garis Pembatas (Double Line Effect)
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.line(20, 36, 190, 36);
                doc.setLineWidth(0.1);
                doc.line(20, 37, 190, 37);

                // --- INFO SISWA (Box Style) ---
                let currentY = 48;
                
                // Background Box Tipis
                doc.setFillColor(245, 247, 255); // Biru sangat muda
                doc.rect(20, 42, 170, 28, 'F');

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                
                doc.text("Nama Siswa", 25, 50);
                doc.text("Kelas", 25, 56);
                doc.text("Periode", 25, 62);

                doc.setFont("helvetica", "normal");
                doc.text(`:  ${selectedStudent.full_name}`, 60, 50);
                doc.text(`:  ${teacherClass || '-'}`, 60, 56);
                doc.text(`:  ${new Date(config.startDate).toLocaleDateString('id-ID')} s/d ${new Date(config.endDate).toLocaleDateString('id-ID')}`, 60, 62);
                
                currentY = 80;

                // --- KONTEN ANALISIS ---
                const addSection = (title: string, content: string, color: [number, number, number]) => {
                    // Judul Section Berwarna
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.setTextColor(color[0], color[1], color[2]); 
                    doc.text(title, 20, currentY);
                    
                    // Garis Bawah Judul
                    doc.setDrawColor(color[0], color[1], color[2]);
                    doc.setLineWidth(0.5);
                    doc.line(20, currentY + 1, 190, currentY + 1);

                    currentY += 8;
                    
                    // Isi Konten
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(10);
                    doc.setTextColor(0, 0, 0); // Kembali hitam untuk teks
                    const splitText = doc.splitTextToSize(content || "-", 170);
                    doc.text(splitText, 20, currentY);
                    currentY += splitText.length * 5 + 10; // Spasi antar paragraf
                };

                // 1. Ringkasan (Warna Orange Tua)
                addSection("I. Ringkasan Eksekutif", result.executive_summary, [234, 88, 12]); 

                // 2. Perkembangan (Warna Biru)
                addSection("II. Perkembangan Karakter", result.character_progress, [37, 99, 235]);

                // 3. Catatan (Warna Ungu)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(124, 58, 237); // Ungu
                doc.text("III. Catatan Wali Kelas", 20, currentY);
                doc.setDrawColor(124, 58, 237);
                doc.line(20, currentY + 1, 190, currentY + 1);
                currentY += 8;

                doc.setFont("helvetica", "italic");
                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50); // Abu gelap
                
                // Box Quote untuk Catatan
                const narrative = doc.splitTextToSize(`"${result.report_narrative}"`, 160);
                
                // Background Box Quote
                const boxHeight = narrative.length * 5 + 6;
                doc.setFillColor(250, 245, 255); // Ungu sangat muda
                doc.rect(20, currentY - 4, 170, boxHeight, 'F');
                
                // Garis Kiri Quote
                doc.setDrawColor(124, 58, 237);
                doc.setLineWidth(1);
                doc.line(20, currentY - 4, 20, currentY + boxHeight - 4);

                doc.text(narrative, 25, currentY); // Indent text
                currentY += boxHeight + 15;

                // --- TANDA TANGAN (AUTO PAGE BREAK IF NEEDED) ---
                if (currentY > 230) {
                    doc.addPage();
                    currentY = 40;
                }

                doc.setTextColor(0, 0, 0); // Hitam
                doc.setFont("helvetica", "normal");
                
                // Kiri: Orang Tua
                doc.text("Mengetahui,", 20, currentY);
                doc.text("Orang Tua / Wali", 20, currentY + 5);
                
                // Kanan: Guru
                doc.text(`Pekalongan, ${dateStr}`, 140, currentY);
                doc.text("Wali Kelas", 140, currentY + 5);

                // Space Tanda Tangan
                currentY += 30;

                // Nama Penanda Tangan
                doc.setFont("helvetica", "bold");
                
                // Gunakan nama orang tua yang dipilih
                const finalParentName = selectedParentName || "..........................";
                doc.text(`( ${finalParentName} )`, 20, currentY);
                
                doc.text(`( ${teacherName} )`, 140, currentY);
                
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(`NIP. ${teacherNip}`, 140, currentY + 5);

                doc.save(`Rapor_Karakter_${selectedStudent.full_name}.pdf`);
                
                // [FIX] Update toast sukses menggunakan ID yang sama
                toast.success("PDF berhasil diunduh!", { id: toastId });
                
            } catch (err) {
                console.error(err);
                toast.error("Gagal membuat PDF", { id: toastId });
            }
        };

        // Fallback jika gambar gagal load
        img.onerror = () => {
            toast.error("Gagal memuat logo sekolah.", { id: toastId });
        };
    };

    const handleStudentSelect = (id: string) => {
        setConfig({ ...config, studentId: id, startDate: '', endDate: '' });
        setIsSelectorOpen(false);
        // [FIX] Tambahkan ID 'select-student' agar tidak menumpuk saat pilih cepat
        toast.success('Siswa dipilih', { icon: '👤', duration: 1500, id: 'select-student' });
    };

    const applyDataRange = () => {
        if (dataRange) {
            setConfig(prev => ({ ...prev, startDate: dataRange.start, endDate: dataRange.end }));
            // [FIX] Tambahkan ID 'date-range'
            toast.success('Tanggal disesuaikan', { icon: '📅', id: 'date-range' });
        }
    };

    // --- LOGIC DISPLAY ---
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

    // CSS Khusus Print (Browser Print)
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
                                disabled={isDataEmpty} 
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
                                disabled={isDataEmpty} 
                            />
                        </div>

                        {/* 4. TOMBOL GENERATE */}
                        <button 
                            onClick={handleGenerate} 
                            disabled={isButtonDisabled} 
                            className={`h-[60px] rounded-2xl font-black transition-all flex justify-center items-center gap-2 shadow-lg disabled:cursor-not-allowed ${
                                isDataEmpty 
                                ? 'bg-gray-200 text-gray-400 shadow-none border-2 border-gray-100' 
                                : 'bg-slate-900 text-white hover:bg-violet-600 hover:shadow-violet-200 disabled:opacity-50'
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
                        <div className="mt-6 pt-6 border-t border-gray-100 animate-slide-up">
                            {isCheckingData ? (
                                <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                                    <RefreshCw size={12} className="animate-spin"/> Memeriksa riwayat aktivitas...
                                </div>
                            ) : dataRange ? (
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <span className="text-xs font-medium text-gray-600">
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2">Data Ditemukan</span>
                                        Tersedia <strong>{dataRange.count}</strong> aktivitas dari <strong>{new Date(dataRange.start).toLocaleDateString('id-ID')}</strong> s.d <strong>{new Date(dataRange.end).toLocaleDateString('id-ID')}</strong>
                                    </span>
                                    <button 
                                        onClick={applyDataRange}
                                        className="px-3 py-1.5 bg-violet-50 text-violet-700 text-xs font-bold rounded-lg hover:bg-violet-100 transition-colors flex items-center gap-1.5"
                                    >
                                        <CalendarRange size={14} /> Gunakan Rentang Ini
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs text-rose-500 font-bold bg-rose-50 px-3 py-2 rounded-lg">
                                    <Ban size={14}/> Belum ada riwayat aktivitas untuk siswa ini.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Result Preview & PDF Generation */}
            {result && (
                <div ref={printRef} className="print-area animate-slide-up">
                    <div className="bg-slate-900 p-6 rounded-t-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-4 no-print shadow-xl">
                        <div className="flex items-center gap-3 text-white px-4">
                            <FileText size={24} className="text-violet-400"/>
                            <div>
                                <span className="font-bold uppercase tracking-wider text-sm block">Preview Dokumen</span>
                                <span className="text-xs text-slate-400">Pastikan data penanda tangan benar sebelum dicetak.</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={handlePrint} className="bg-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                                <Printer size={16} /> Print Browser
                            </button>
                            <button onClick={generatePDF} className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-violet-50 transition-all flex items-center gap-2 shadow-lg">
                                <Download size={18} /> Download PDF Resmi
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 md:p-16 rounded-b-[2.5rem] shadow-2xl border border-gray-100 text-black font-serif leading-relaxed">
                        
                        {/* --- OPSI PENANDA TANGAN (Hanya muncul di preview, tidak di print) --- */}
                        <div className="mb-10 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 no-print">
                            <h4 className="font-bold text-indigo-900 text-sm uppercase mb-3 flex items-center gap-2">
                                <Users size={16}/> Konfigurasi Tanda Tangan
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Pilih Orang Tua / Wali</label>
                                    {loadingParents ? (
                                        <div className="text-xs text-indigo-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin"/> Memuat data...</div>
                                    ) : parents.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {parents.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedParentName(p.full_name)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                        selectedParentName === p.full_name 
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                                    }`}
                                                >
                                                    {p.relationship}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-amber-600 italic">Belum ada data orang tua terhubung.</p>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Edit Nama Penanda Tangan (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={selectedParentName}
                                        onChange={(e) => setSelectedParentName(e.target.value)}
                                        className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                                        placeholder="Nama Wali Murid..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* --- KONTEN RAPOR (Visual Preview) --- */}
                        {/* KOP SURAT */}
                        <div className="flex items-center justify-center border-b-4 border-double border-black pb-6 mb-10 gap-6">
                            <img src="/logo-smpn6.png" alt="Logo" className="w-20 h-auto" />
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-black uppercase mb-1">SMP NEGERI 6 PEKALONGAN</h1>
                                <p className="text-xs font-bold text-gray-800 uppercase tracking-[0.2em] mb-1">LAPORAN PEMBIASAAN KARAKTER SISWA</p>
                                <p className="text-[10px] italic text-gray-600">Jl. Teratai No.31, Poncol, Kota Pekalongan, Jawa Tengah 51122</p>
                            </div>
                        </div>

                        {/* IDENTITAS */}
                        <div className="mb-10 text-sm font-sans border-b border-gray-100 pb-6">
                            <div className="grid grid-cols-[150px_20px_auto] mb-1">
                                <span className="font-bold uppercase text-gray-900">Nama Siswa</span>
                                <span>:</span>
                                <span className="font-bold uppercase text-black">{selectedStudent?.full_name}</span>
                            </div>
                            <div className="grid grid-cols-[150px_20px_auto] mb-1">
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
                        <div className="space-y-8 text-justify">
                            <section>
                                <h4 className="font-bold text-base uppercase mb-2 border-l-4 border-slate-800 pl-3 text-black">I. Ringkasan Eksekutif</h4>
                                <p className="text-gray-900 text-sm leading-relaxed">{result.executive_summary}</p>
                            </section>
                            
                            <section>
                                <h4 className="font-bold text-base uppercase mb-2 border-l-4 border-slate-800 pl-3 text-black">II. Perkembangan Karakter</h4>
                                <p className="text-gray-900 text-sm leading-relaxed">{result.character_progress}</p>
                            </section>
                            
                            <section>
                                <h4 className="font-bold text-base uppercase mb-2 border-l-4 border-slate-800 pl-3 text-black">III. Catatan Wali Kelas</h4>
                                <div className="p-4 bg-gray-50 rounded-lg border-l-2 border-gray-300 italic text-gray-800 text-sm leading-relaxed">
                                    "{result.report_narrative}"
                                </div>
                            </section>
                        </div>

                        {/* TTD PREVIEW */}
                        <div className="flex justify-between mt-16 pt-8 font-sans break-inside-avoid">
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="font-bold text-black text-xs mb-4">Mengetahui,<br/>Orang Tua / Wali Murid</p>
                                <div className="h-16"></div> 
                                <p className="font-bold uppercase text-xs border-b border-black pb-1 px-4 min-w-[150px]">
                                    {selectedParentName || "..........................."}
                                </p>
                            </div>
                            
                            <div className="text-center w-64 flex flex-col items-center">
                                <p className="font-bold text-black text-xs mb-1">
                                    Pekalongan, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                                </p>
                                <p className="text-xs font-normal mb-4 text-black">Wali Kelas</p>
                                <div className="h-12"></div>
                                <p className="font-bold underline uppercase mb-1 text-black text-xs">
                                    {teacherName || "..........................."}
                                </p>
                                <p className="text-[10px] font-bold text-black">
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