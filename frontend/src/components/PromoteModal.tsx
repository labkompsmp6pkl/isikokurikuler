import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'; 
import teacherService from '../services/teacherService';
import { X, RefreshCw, Save, Info, UserCheck, UserX, ArrowRight, XCircle, GraduationCap } from 'lucide-react';

interface StudentData {
  id: number;
  full_name: string;
  nisn?: string;
  class_name?: string; 
}

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: StudentData[]; 
  userRole: 'teacher' | 'admin';
  onSuccess: () => void;
  sourceClassId?: string; 
  mode?: 'move' | 'promote'; 
  currentTeacherName?: string; 
}

type ActionType = 'promote' | 'retain' | 'graduate';

const PromoteModal: React.FC<PromoteModalProps> = ({ 
  isOpen, onClose, selectedStudents, onSuccess, sourceClassId, mode = 'move', currentTeacherName
}) => {
  const [targetClass, setTargetClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State baru untuk menangani tipe aksi (Naik, Tinggal, Lulus)
  const [actionType, setActionType] = useState<ActionType>('promote');
  
  const sampleStudent = selectedStudents[0];

  // Helper
  const getLevel = (name: string) => parseInt(name?.match(/\d+/)?.[0] || "0");
  const getNextYearString = (currentYear: string) => {
      if (!currentYear) return "";
      const parts = currentYear.split('/');
      return parts.length === 2 ? `${parseInt(parts[0]) + 1}/${parseInt(parts[1]) + 1}` : "";
  };

  useEffect(() => {
    if (isOpen) {
      setTargetClass('');
      // Reset action type based on logic later, but default to promote
      setActionType('promote'); 
      teacherService.getAllClasses()
        .then(res => setClasses(res.data || res))
        .catch(() => toast.error("Gagal memuat daftar kelas."));
    }
  }, [isOpen]);

  useEffect(() => {
    if (classes.length === 0) return;

    const sourceClassObj = classes.find(c => c.id.toString() === sourceClassId?.toString());
    const currentYear = sourceClassObj?.academic_year || "";
    const currentLevel = getLevel(sourceClassObj?.name || "");

    // Set default action type based on level if opening for the first time
    if (isOpen && currentLevel === 9) {
        // Default kelas 9 adalah Lulus, tapi user bisa ubah
        // setActionType('graduate'); 
    }

    if (mode === 'move') {
        // Pindah kelas biasa (Tahun ajaran sama)
        setFilteredClasses(classes.filter(c => c.id.toString() !== sourceClassId?.toString()));
    } else if (mode === 'promote') {
        const targetYearString = getNextYearString(currentYear);
        const nextLevel = currentLevel + 1;

        let validClasses: any[] = [];

        if (actionType === 'graduate') {
            // Jika Lulus, tidak perlu load kelas
            validClasses = [];
        } else if (actionType === 'retain') {
            // KASUS TIDAK NAIK KELAS:
            // Cari kelas di Tahun Ajaran BARU, tapi Level SAMA (misal 7 -> 7)
            validClasses = classes.filter(c => 
                c.academic_year === targetYearString && 
                getLevel(c.name) === currentLevel
            );
        } else {
            // KASUS NAIK KELAS (Default):
            // Cari kelas di Tahun Ajaran BARU, Level + 1 (misal 7 -> 8)
            validClasses = classes.filter(c => 
                c.academic_year === targetYearString && 
                getLevel(c.name) === nextLevel
            );
        }
        
        setFilteredClasses(validClasses);
        
        // Reset pilihan kelas jika list berubah
        setTargetClass('');
    }
  }, [isOpen, classes, sourceClassId, mode, actionType]);

  const generateStudentListHtml = () => {
    if (selectedStudents.length === 1) {
        return `<div class="p-2 bg-gray-50 border rounded text-left font-bold text-gray-700">${selectedStudents[0].full_name}</div>`;
    }
    return `<div class="p-2 bg-gray-50 border rounded text-left text-xs text-gray-600">
        <ul class="list-disc pl-4">${selectedStudents.slice(0, 3).map(s => `<li>${s.full_name}</li>`).join('')}</ul>
        ${selectedStudents.length > 3 ? `...dan ${selectedStudents.length - 3} lainnya` : ''}
    </div>`;
  };

  const handleSubmit = async () => {
    const isAlumni = actionType === 'graduate';

    if (!isAlumni && !targetClass) {
      toast.error("Mohon pilih kelas tujuan!");
      return;
    }

    const targetClassObj = classes.find(c => c.id == targetClass);
    
    // Validasi Wali Kelas
    if (!isAlumni && !targetClassObj?.teacher_name) {
        Swal.fire({
            icon: 'error',
            title: 'Wali Kelas Kosong!',
            html: `Kelas tujuan <b>${targetClassObj?.name}</b> belum memiliki Wali Kelas.<br/><br/>
            Siswa tidak dapat dipindahkan ke kelas tanpa pengampu. Silakan hubungi Admin.`,
            confirmButtonColor: '#d33'
        });
        return;
    }

    const targetNameDisplay = isAlumni ? "LULUS (ALUMNI)" : targetClassObj?.name;
    const sourceNameDisplay = sampleStudent?.class_name || 'Kelas Lama';
    const processorName = currentTeacherName || 'Guru Wali Kelas';

    // Text konfirmasi yang dinamis
    let actionText = "Kenaikan Kelas";
    if (actionType === 'retain') actionText = "Tinggal Kelas (Tidak Naik)";
    if (actionType === 'graduate') actionText = "Kelulusan";

    const result = await Swal.fire({
      title: `<span class="text-xl font-bold">Konfirmasi ${actionText}</span>`,
      html: `
        <div class="text-sm text-left space-y-3">
            <div>
                <p class="text-xs text-gray-500 uppercase font-bold">Siswa yang diproses:</p>
                ${generateStudentListHtml()}
            </div>
            
            <div class="flex items-center gap-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <div class="flex-1 text-center">
                    <p class="text-[10px] text-gray-400">DARI</p>
                    <p class="font-bold text-gray-800">${sourceNameDisplay}</p>
                </div>
                <div class="text-indigo-400">➝</div>
                <div class="flex-1 text-center">
                    <p class="text-[10px] text-gray-400">MENUJU</p>
                    <p class="font-bold text-indigo-700">${targetNameDisplay}</p>
                    ${!isAlumni ? `<p class="text-[9px] text-gray-500">TA: ${targetClassObj?.academic_year}</p>` : ''}
                </div>
            </div>

            ${!isAlumni ? `
            <div class="flex items-start gap-2 bg-emerald-50 p-2 rounded border border-emerald-100">
                <div class="mt-0.5 text-emerald-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-emerald-600 uppercase">Wali Kelas Baru:</p>
                    <p class="text-xs font-bold text-gray-700">${targetClassObj?.teacher_name || '?'}</p>
                </div>
            </div>` : ''}

            <div class="text-xs text-gray-400 mt-2 border-t pt-2">
                Diproses oleh: <b>${processorName}</b>
            </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ya, Proses',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await teacherService.promoteStudents({
        studentIds: selectedStudents.map(s => s.id),
        targetClassId: isAlumni ? null : Number(targetClass),
        isAlumni: isAlumni
      });

      Swal.fire('Berhasil!', 'Data siswa berhasil diperbarui.', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      Swal.fire('Gagal', error.response?.data?.message || "Terjadi kesalahan.", 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Cek Level Kelas Saat Ini
  const sourceClassObj = classes.find(c => c.id.toString() === sourceClassId?.toString());
  const currentLvl = getLevel(sourceClassObj?.name || "");
  const isFinalGrade = currentLvl === 9 || currentLvl === 12; // Cek apakah kelas akhir

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-800 flex gap-2 items-center">
            <RefreshCw size={18} className="text-indigo-600"/> Proses Kenaikan Kelas
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500"/></button>
        </div>
        
        <div className="p-6 space-y-5">
            
            {/* 1. PILIH JENIS PROSES */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jenis Proses:</label>
                <div className="grid grid-cols-2 gap-3">
                    {/* Opsi 1: Naik Kelas / Lulus (Default Positif) */}
                    <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                        (isFinalGrade ? actionType === 'graduate' : actionType === 'promote')
                        ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-700' 
                        : 'bg-white hover:bg-gray-50 text-gray-600'
                    }`}>
                        <input 
                            type="radio" 
                            name="actionType" 
                            className="hidden"
                            checked={isFinalGrade ? actionType === 'graduate' : actionType === 'promote'}
                            onChange={() => setActionType(isFinalGrade ? 'graduate' : 'promote')}
                        />
                        {isFinalGrade ? <GraduationCap size={24} className="mb-1"/> : <ArrowRight size={24} className="mb-1 -rotate-45"/>}
                        <span className="text-xs font-bold">{isFinalGrade ? 'Lulus (Alumni)' : 'Naik Kelas'}</span>
                    </label>

                    {/* Opsi 2: Tidak Naik / Tidak Lulus (Negatif) */}
                    <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${
                        actionType === 'retain'
                        ? 'bg-red-50 border-red-500 ring-1 ring-red-500 text-red-700' 
                        : 'bg-white hover:bg-gray-50 text-gray-600'
                    }`}>
                        <input 
                            type="radio" 
                            name="actionType" 
                            className="hidden"
                            checked={actionType === 'retain'}
                            onChange={() => setActionType('retain')}
                        />
                        <XCircle size={24} className="mb-1"/>
                        <span className="text-xs font-bold">{isFinalGrade ? 'Tidak Lulus' : 'Tidak Naik Kelas'}</span>
                    </label>
                </div>
            </div>

            {/* 2. PILIH KELAS TUJUAN (Hanya jika bukan Lulus) */}
            {actionType !== 'graduate' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        {actionType === 'promote' ? 'Pilih Kelas Lanjutan:' : 'Pilih Kelas (Mengulang):'}
                    </label>
                    <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar border border-gray-100 rounded-lg p-1 bg-gray-50/50">
                        {filteredClasses.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-gray-400 italic">Tidak ada kelas tersedia untuk opsi ini di tahun ajaran baru.</p>
                            </div>
                        ) : (
                            filteredClasses.map((c: any) => {
                                // Logic visual untuk kelas tanpa wali
                                const hasTeacher = !!c.teacher_name; 
                                return (
                                    <label key={c.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                        targetClass === c.id.toString() 
                                            ? 'border-indigo-500 bg-white ring-1 ring-indigo-500 shadow-sm' 
                                            : hasTeacher ? 'bg-white hover:border-indigo-300' : 'opacity-60 bg-gray-100 cursor-not-allowed'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="radio" 
                                                name="targetClass" 
                                                value={c.id} 
                                                checked={targetClass === c.id.toString()} 
                                                onChange={(e) => setTargetClass(e.target.value)}
                                                disabled={!hasTeacher} // DISABLED JIKA TIDAK ADA GURU
                                                className="text-indigo-600"
                                            />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                    {c.name}
                                                    {/* Badge Level */}
                                                    {getLevel(c.name) === currentLvl ? 
                                                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">Mengulang</span> :
                                                        <span className="text-[9px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200">Naik Level</span>
                                                    }
                                                </p>
                                                <p className="text-[10px] text-gray-500">TA: {c.academic_year}</p>
                                            </div>
                                        </div>
                                        {/* Indikator Guru */}
                                        {hasTeacher ? (
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                    <UserCheck size={12} /> {c.teacher_name.split(' ')[0]}..
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                                                <UserX size={12} /> Kosong
                                            </div>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                    {actionType === 'retain' && (
                        <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded">
                            <Info size={12} /> 
                            <b>Perhatian:</b> Siswa akan tetap berada di tingkat {currentLvl} pada tahun ajaran baru.
                        </p>
                    )}
                </div>
            )}
        </div>

        <div className="p-6 pt-0 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || (actionType !== 'graduate' && !targetClass)}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}
              Proses Sekarang
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteModal;