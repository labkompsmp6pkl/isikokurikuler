import React, { useState, useEffect } from 'react';
import { 
    Save, 
    Sparkles, 
    FileText, 
    Download, 
    Users, 
    Loader2, 
    Plus, 
    Trash2, 
    AlertCircle,
    Info
} from 'lucide-react';
import teacherService from '../../../services/teacherService';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // [FIX] Import default function

// --- TIPE DATA & INTERFACE ---

interface Props {
    students: any[];
    teacherClass: string;
    teacherName: string;
    teacherNip: string;
    classId: number;
}

interface ParentOption {
    id: number;
    full_name: string;
    relationship: string;
}

interface ExtracurricularData {
    name: string;
    predikat: string;
}

interface AttendanceData {
    sakit: number;
    izin: number;
    alpha: number;
}

interface AIResultData {
    kokurikuler_report: string;       
    teacher_notes_suggestion: string; 
}

const AIReportView: React.FC<Props> = ({ 
    students, 
    teacherClass, 
    teacherName, 
    teacherNip, 
    classId 
}) => {
    // --- STATE UTAMA ---
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [comparisonMode, setComparisonMode] = useState('last_semester');
    
    // State Loading & Proses
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingParents, setLoadingParents] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- STATE DATA FORM RAPOR ---
    const [attendance, setAttendance] = useState<AttendanceData>({ 
        sakit: 0, 
        izin: 0, 
        alpha: 0 
    });
    
    const [extracurricular, setExtracurricular] = useState<ExtracurricularData[]>([
        { name: '', predikat: '' }
    ]);
    
    const [aiResult, setAiResult] = useState<AIResultData>({ 
        kokurikuler_report: '', 
        teacher_notes_suggestion: '' 
    });
    
    const [manualNote, setManualNote] = useState('');

    // --- STATE PENANDA TANGAN ---
    const [parents, setParents] = useState<ParentOption[]>([]);
    const [selectedParentName, setSelectedParentName] = useState<string>('');

    // --- SETTING AKADEMIK ---
    const ACADEMIC_YEAR = '2025/2026';
    const SEMESTER = 'Genap';

    // ==================================================================================
    // 1. USE EFFECT: LOAD DATA SAAT SISWA DIPILIH
    // ==================================================================================
    useEffect(() => {
        if (selectedStudent) {
            loadStudentReportData(selectedStudent.id);
            loadStudentParents(selectedStudent.id);
        } else {
            resetForm();
        }
    }, [selectedStudent]);

    const resetForm = () => {
        setAttendance({ sakit: 0, izin: 0, alpha: 0 });
        setExtracurricular([{ name: '', predikat: '' }]);
        setAiResult({ kokurikuler_report: '', teacher_notes_suggestion: '' });
        setManualNote('');
        setParents([]);
        setSelectedParentName('');
    };

    // ==================================================================================
    // 2. API CALLS (LOAD DATA)
    // ==================================================================================

    const loadStudentReportData = async (studentId: number) => {
        setLoadingData(true);
        try {
            const res = await teacherService.getStudentReportData({ 
                studentId, 
                academicYear: ACADEMIC_YEAR, 
                semester: SEMESTER 
            });

            if (res) {
                setAttendance({ 
                    sakit: res.attendance_sakit || 0, 
                    izin: res.attendance_izin || 0, 
                    alpha: res.attendance_alpha || 0 
                });
                
                const eskulData = res.extracurricular && Array.isArray(res.extracurricular) && res.extracurricular.length > 0 
                    ? res.extracurricular 
                    : [{ name: '', predikat: '' }];
                setExtracurricular(eskulData);

                setManualNote(res.teacher_notes || '');
            } else {
                setAttendance({ sakit: 0, izin: 0, alpha: 0 });
                setExtracurricular([{ name: '', predikat: '' }]);
                setManualNote('');
            }
        } catch (error) {
            console.error("Gagal memuat data rapor:", error);
            toast.error("Gagal menyinkronkan data rapor siswa.");
        } finally {
            setLoadingData(false);
        }
    };

    const loadStudentParents = async (studentId: number) => {
        setLoadingParents(true);
        try {
            const data = await teacherService.getStudentParents(studentId);
            setParents(data);
            if (data.length > 0) {
                setSelectedParentName(data[0].full_name);
            } else {
                setSelectedParentName('');
            }
        } catch (error) {
            console.error("Gagal memuat ortu:", error);
        } finally {
            setLoadingParents(false);
        }
    };

    // ==================================================================================
    // 3. HANDLERS (SAVE, AI, PDF)
    // ==================================================================================

    const handleSaveDraft = async () => {
        if (!selectedStudent) return;
        
        setIsSaving(true);
        const toastId = toast.loading("Menyimpan draft rapor...");
        
        try {
            const cleanEskul = extracurricular.filter(ex => ex.name.trim() !== '');

            await teacherService.saveReportData({
                studentId: selectedStudent.id,
                classId,
                academicYear: ACADEMIC_YEAR,
                semester: SEMESTER,
                extracurricular: cleanEskul,
                attendance,
                teacherNotes: manualNote
            });
            
            toast.success("Data rapor berhasil disimpan!", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Gagal menyimpan data.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedStudent) return toast.error("Pilih siswa terlebih dahulu");
        
        setLoadingAI(true);
        const toastId = toast.loading("AI sedang menganalisis & menyusun laporan...", { id: 'ai-gen' });
        
        try {
            const res = await teacherService.generateReport({
                studentId: selectedStudent.id,
                classId,
                semester: SEMESTER,
                academicYear: ACADEMIC_YEAR,
                comparisonMode
            });
            
            let result: AIResultData;
            if (typeof res.result === 'string') {
                result = { 
                    kokurikuler_report: res.result, 
                    teacher_notes_suggestion: "" 
                };
            } else {
                result = res.result;
            }

            setAiResult(result);
            
            if (!manualNote && result.teacher_notes_suggestion) {
                setManualNote(result.teacher_notes_suggestion);
            }

            toast.success("Laporan Kokurikuler Selesai!", { id: toastId, icon: '✨' });
        } catch (e) {
            console.error(e);
            toast.error("Gagal generate analisis AI. Coba lagi nanti.", { id: toastId });
        } finally {
            setLoadingAI(false);
        }
    };

    // --- PDF GENERATION LOGIC ---
    const handleDownloadPDF = () => {
        if (!selectedStudent) return;
        const toastId = toast.loading("Memproses PDF...");
        
        try {
            const doc: any = new jsPDF();
            
            const img = new Image();
            img.src = '/logo-smpn6.png'; 
            
            img.onload = () => {
                // --- KOP SURAT ---
                doc.addImage(img, 'PNG', 20, 10, 20, 20);
                
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text("SMP NEGERI 6 PEKALONGAN", 105, 20, { align: 'center' });
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text("LAPORAN PENGEMBANGAN KARAKTER (RAPOR KOKURIKULER)", 105, 26, { align: 'center' });
                
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text("Jl. Teratai No.31, Poncol, Kota Pekalongan, Jawa Tengah 51122", 105, 31, { align: 'center' });
                
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(20, 36, 190, 36);
                doc.setLineWidth(0.1);
                doc.line(20, 37, 190, 37);

                // --- IDENTITAS SISWA ---
                doc.setTextColor(0);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                
                doc.setFillColor(248, 250, 252);
                doc.rect(20, 42, 170, 28, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.rect(20, 42, 170, 28, 'S');

                const startYIdentitas = 50;
                doc.text("Nama Siswa", 25, startYIdentitas); 
                doc.text(`:  ${selectedStudent.full_name}`, 60, startYIdentitas);
                doc.text("Nomor Induk / NISN", 25, startYIdentitas + 6); 
                doc.text(`:  ${selectedStudent.nisn || '-'}`, 60, startYIdentitas + 6);
                doc.text("Kelas", 25, startYIdentitas + 12);      
                doc.text(`:  ${teacherClass}`, 60, startYIdentitas + 12);
                doc.text("Semester", 25, startYIdentitas + 18);   
                doc.text(`:  ${SEMESTER} ${ACADEMIC_YEAR}`, 60, startYIdentitas + 18);

                let y = 85; 

                // --- BAGIAN A: LAPORAN KOKURIKULER ([FIX] Teks Judul Diperbaiki) ---
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text("A. LAPORAN KOKURIKULER", 20, y);
                doc.setLineWidth(0.5);
                doc.line(20, y+1, 190, y+1);
                y += 8;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                const reportText = doc.splitTextToSize(aiResult.kokurikuler_report || "Belum ada laporan.", 170);
                doc.text(reportText, 20, y);
                y += (reportText.length * 5) + 10;

                // --- BAGIAN B: KEGIATAN EKSTRAKULIKULER ---
                if (y > 220) { doc.addPage(); y = 20; }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text("B. KEGIATAN EKSTRAKULIKULER", 20, y);
                doc.line(20, y+1, 190, y+1);
                y += 8;

                const eskulBody = extracurricular
                    .filter(ex => ex.name.trim() !== '')
                    .map(ex => [ex.name, ex.predikat || '-']);

                if (eskulBody.length > 0) {
                    // [FIX] Menggunakan autoTable(doc, ...)
                    autoTable(doc, {
                        startY: y,
                        head: [['Nama Kegiatan', 'Predikat / Keterangan']],
                        body: eskulBody,
                        margin: { left: 20 },
                        theme: 'grid',
                        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
                        styles: { fontSize: 10, cellPadding: 3 },
                        columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 60 } }
                    });
                    // [FIX] Mengakses lastAutoTable dari properti doc
                    y = (doc as any).lastAutoTable.finalY + 10;
                } else {
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text("- Tidak ada data ekstrakulikuler -", 25, y);
                    y += 15;
                    doc.setTextColor(0);
                }

                // --- BAGIAN C: KETIDAKHADIRAN ---
                if (y > 230) { doc.addPage(); y = 20; }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text("C. KETIDAKHADIRAN", 20, y);
                doc.line(20, y+1, 190, y+1);
                y += 8;

                // [FIX] Menggunakan autoTable(doc, ...)
                autoTable(doc, {
                    startY: y,
                    head: [['Keterangan', 'Jumlah Hari']],
                    body: [
                        ['Sakit', `${attendance.sakit} Hari`],
                        ['Izin', `${attendance.izin} Hari`],
                        ['Tanpa Keterangan', `${attendance.alpha} Hari`],
                    ],
                    margin: { left: 20 },
                    theme: 'grid',
                    tableWidth: 100,
                    headStyles: { fillColor: [55, 65, 81] }
                });
                y = (doc as any).lastAutoTable.finalY + 10;

                // --- BAGIAN D: CATATAN WALI KELAS ([FIX] Teks Judul Diperbaiki) ---
                if (y > 220) { doc.addPage(); y = 20; }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text("D. CATATAN WALI KELAS", 20, y);
                doc.line(20, y+1, 190, y+1);
                y += 8;

                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                const notes = doc.splitTextToSize(manualNote || "Tetap semangat dan tingkatkan prestasimu!", 160);
                
                const boxHeight = (notes.length * 5) + 10;
                doc.setFillColor(250, 250, 250);
                doc.rect(20, y-4, 170, boxHeight, 'F');
                doc.setDrawColor(200);
                doc.rect(20, y-4, 170, boxHeight, 'S'); 
                doc.text(notes, 25, y);
                y += boxHeight + 20;

                // --- TANDA TANGAN ---
                if (y > 230) { doc.addPage(); y = 30; }
                
                const dateStr = new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'});
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                doc.text("Mengetahui,", 20, y);
                doc.text("Orang Tua / Wali,", 20, y+5);
                
                doc.text(`Pekalongan, ${dateStr}`, 140, y);
                doc.text("Wali Kelas,", 140, y + 5);
                
                doc.setFont('helvetica', 'bold');
                const parentName = selectedParentName || "..........................";
                
                y += 30; 

                doc.text(`( ${parentName} )`, 20, y);
                doc.text(`( ${teacherName} )`, 140, y);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(`NIP. ${teacherNip}`, 140, y + 5);

                doc.save(`Rapor_${selectedStudent.full_name.replace(/\s+/g, '_')}.pdf`);
                toast.success("PDF berhasil diunduh!", { id: toastId });
            };

            img.onerror = () => {
                toast.error("Gagal memuat logo sekolah.", { id: toastId });
            };

        } catch (err) {
            console.error(err);
            toast.error("Gagal membuat PDF", { id: toastId });
        }
    };

    // ==================================================================================
    // 4. HELPER COMPONENTS
    // ==================================================================================
    
    const handleAddEskul = () => {
        setExtracurricular([...extracurricular, { name: '', predikat: '' }]);
    };

    const handleRemoveEskul = (idx: number) => {
        const newEx = [...extracurricular];
        newEx.splice(idx, 1);
        setExtracurricular(newEx);
    };

    const handleChangeEskul = (idx: number, field: keyof ExtracurricularData, value: string) => {
        const newEx = [...extracurricular];
        newEx[idx][field] = value;
        setExtracurricular(newEx);
    };

    // ==================================================================================
    // 5. RENDER UI
    // ==================================================================================

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in pb-20">
            {/* PANEL KIRI (30%) - INPUT DATA */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-4">
                    <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
                        <FileText className="text-violet-600" size={20}/> 
                        Input Data Rapor
                    </h3>
                    
                    {/* 1. PILIH SISWA */}
                    <div className="mb-6">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Pilih Siswa</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-violet-500 transition-all cursor-pointer hover:bg-slate-100"
                            value={selectedStudent?.id || ''}
                            onChange={(e) => {
                                const s = students.find(x => x.id === parseInt(e.target.value));
                                setSelectedStudent(s);
                            }}
                        >
                            <option value="">-- Pilih Siswa dari Daftar --</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.nisn || '-'})</option>)}
                        </select>
                    </div>

                    {selectedStudent ? (
                        <div className="space-y-6 animate-slide-up">
                            {/* 2. MODE KOMPARASI AI */}
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mode Analisis AI</label>
                                <div className="p-1 bg-slate-100 rounded-xl flex">
                                    <button 
                                        onClick={() => setComparisonMode('last_semester')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${comparisonMode === 'last_semester' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Semester Lalu
                                    </button>
                                    <button 
                                        onClick={() => setComparisonMode('all_time')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${comparisonMode === 'all_time' ? 'bg-white shadow text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Awal Masuk
                                    </button>
                                </div>
                            </div>

                            <hr className="border-slate-100"/>

                            {/* 3. INPUT ABSENSI */}
                            <div>
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Ketidakhadiran (Hari)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="relative">
                                        <input type="number" min="0" value={attendance.sakit} onChange={e => setAttendance({...attendance, sakit: +e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"/>
                                        <span className="text-[10px] text-center block text-slate-400 mt-1 font-bold">SAKIT</span>
                                    </div>
                                    <div className="relative">
                                        <input type="number" min="0" value={attendance.izin} onChange={e => setAttendance({...attendance, izin: +e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"/>
                                        <span className="text-[10px] text-center block text-slate-400 mt-1 font-bold">IZIN</span>
                                    </div>
                                    <div className="relative">
                                        <input type="number" min="0" value={attendance.alpha} onChange={e => setAttendance({...attendance, alpha: +e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold text-slate-700 outline-none focus:border-violet-500 transition-all"/>
                                        <span className="text-[10px] text-center block text-slate-400 mt-1 font-bold">ALPHA</span>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100"/>

                            {/* 4. INPUT ESKUL */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ekstrakulikuler</label>
                                    <button onClick={handleAddEskul} className="text-xs text-violet-600 font-bold hover:bg-violet-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"><Plus size={14}/> Tambah</button>
                                </div>
                                <div className="space-y-2">
                                    {extracurricular.map((ex, idx) => (
                                        <div key={idx} className="flex gap-2 group">
                                            <input 
                                                type="text" 
                                                placeholder="Kegiatan (Cth: Pramuka)" 
                                                className="w-2/3 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500 transition-all" 
                                                value={ex.name} 
                                                onChange={e => handleChangeEskul(idx, 'name', e.target.value)}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Predikat" 
                                                className="w-1/3 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500 transition-all" 
                                                value={ex.predikat} 
                                                onChange={e => handleChangeEskul(idx, 'predikat', e.target.value)}
                                            />
                                            {extracurricular.length > 1 && (
                                                <button onClick={() => handleRemoveEskul(idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={16}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 space-y-3">
                                <button 
                                    onClick={handleSaveDraft}
                                    disabled={isSaving}
                                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 flex justify-center items-center gap-2 transition-all active:scale-95"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                                    Simpan Data Manual
                                </button>

                                <button 
                                    onClick={handleGenerateAI}
                                    disabled={loadingAI}
                                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-200 flex justify-center items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                                >
                                    {loadingAI ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>}
                                    {loadingAI ? "AI Sedang Menganalisis..." : "Generate Rapor AI"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <Users className="mx-auto text-slate-300 mb-2" size={32}/>
                            <p className="text-xs text-slate-400 font-medium">Silakan pilih siswa untuk mulai mengisi rapor.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PANEL KANAN (8 Kolom): PREVIEW RAPOR */}
            <div className="lg:col-span-8 bg-white p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 relative min-h-[800px]">
                {loadingData && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                        <Loader2 className="animate-spin text-violet-600" size={40}/>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Preview Rapor</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">
                            {selectedStudent ? `Draft Rapor: ${selectedStudent.full_name}` : 'Pratinjau konten rapor sebelum dicetak.'}
                        </p>
                    </div>
                    
                    {selectedStudent && (
                        <div className="flex flex-wrap gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                            {/* SELECTOR PENANDA TANGAN */}
                            <div className="relative group">
                                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"/>
                                <select 
                                    className="pl-9 pr-4 py-2 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-200 outline-none appearance-none cursor-pointer hover:border-violet-300 transition-colors min-w-[180px]"
                                    value={selectedParentName}
                                    onChange={(e) => setSelectedParentName(e.target.value)}
                                >
                                    <option value="">-- Pilih Wali Murid --</option>
                                    {loadingParents ? <option disabled>Memuat data ortu...</option> : 
                                        parents.map(p => <option key={p.id} value={p.full_name}>{p.full_name} ({p.relationship})</option>)
                                    }
                                </select>
                            </div>

                            <button 
                                onClick={handleDownloadPDF} 
                                disabled={!aiResult.kokurikuler_report} 
                                className="px-5 py-2 bg-slate-800 text-white rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition-all shadow-md active:scale-95"
                            >
                                <Download size={14}/> Download PDF
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    {/* BAGIAN A: GABUNGAN KOKURIKULER (TEKS JUDUL DIPERBAIKI) */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-violet-500 pl-3">
                                A. Laporan Kokurikuler
                            </h4>
                            <span className="text-[10px] bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-bold uppercase">
                                Auto-Generated
                            </span>
                        </div>
                        <textarea 
                            className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed text-slate-700 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none group-hover:border-violet-200"
                            value={aiResult.kokurikuler_report}
                            onChange={(e) => setAiResult({...aiResult, kokurikuler_report: e.target.value})}
                            placeholder="Laporan kokurikuler (ringkasan & evaluasi diri) akan muncul otomatis di sini..."
                        />
                        {!aiResult.kokurikuler_report && (
                            <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                                <AlertCircle size={12}/> Belum ada analisis AI. Klik 'Generate Rapor AI' di panel kiri.
                            </div>
                        )}
                    </div>

                    {/* BAGIAN B & C (Tabel Data Statis - Tidak perlu preview teks) */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                        <Info size={16}/> Bagian B (Eskul) dan C (Absensi) akan otomatis ditampilkan dalam tabel saat dicetak.
                    </div>

                    {/* BAGIAN D: CATATAN WALI KELAS (TEKS JUDUL DIPERBAIKI) */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-l-4 border-violet-500 pl-3">
                                D. Catatan Wali Kelas
                            </h4>
                            
                            {/* Tombol Helper ambil saran AI */}
                            {aiResult.teacher_notes_suggestion && (
                                <button 
                                    onClick={() => setManualNote(aiResult.teacher_notes_suggestion)}
                                    className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold uppercase hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                    title="Gunakan saran yang dibuat AI"
                                >
                                    <Sparkles size={10}/> Gunakan Saran AI
                                </button>
                            )}
                        </div>
                        
                        <textarea 
                            className="w-full h-32 p-4 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none placeholder:italic transition-all focus:ring-4 focus:ring-violet-50 resize-none"
                            value={manualNote}
                            onChange={(e) => setManualNote(e.target.value)}
                            placeholder="Tuliskan pesan motivasi... (AI juga akan memberikan saran di sini)"
                        />
                    </div>

                    {/* PREVIEW TANDA TANGAN */}
                    {selectedStudent && (
                        <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between px-10 opacity-70 hover:opacity-100 transition-opacity">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-16">Mengetahui,<br/>Orang Tua / Wali</p>
                                <p className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 px-4 min-w-[150px]">
                                    {selectedParentName || ".........................."}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-16">Pekalongan, {new Date().toLocaleDateString('id-ID')}<br/>Wali Kelas</p>
                                <p className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1 px-4 min-w-[150px]">
                                    {teacherName}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">NIP. {teacherNip}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIReportView;