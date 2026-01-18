import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'; 
import teacherService from '../services/teacherService';
import { X, RefreshCw, Save, Info } from 'lucide-react';

interface StudentData {
  id: number;
  full_name: string;
  nisn?: string;
  class_name?: string; 
  // Properti tambahan untuk logic
  _manualMode?: 'move' | 'promote'; 
  _targetYear?: string;
}

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: StudentData[]; 
  userRole: 'teacher' | 'admin';
  onSuccess: () => void;
  sourceClassId?: string; 
  // [BARU] Mode operasi yang dikirim dari parent
  mode?: 'move' | 'promote'; 
}

const PromoteModal: React.FC<PromoteModalProps> = ({ 
  isOpen, onClose, selectedStudents, onSuccess, sourceClassId, mode = 'move' 
}) => {
  const [targetClass, setTargetClass] = useState('');
  const [isAlumni, setIsAlumni] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Ambil data siswa pertama sebagai sampel info
  const sampleStudent = selectedStudents[0];

  // Helper: Deteksi Level Kelas (7, 8, 9)
  const getLevel = (name: string) => parseInt(name?.match(/\d+/)?.[0] || "0");

  // Helper: Parse Tahun Ajaran (misal 2025/2026 -> start: 2025)

  // Helper: Generate Next Year String (2025/2026 -> 2026/2027)
  const getNextYearString = (currentYear: string) => {
      if (!currentYear) return "";
      const parts = currentYear.split('/');
      if (parts.length !== 2) return "";
      return `${parseInt(parts[0]) + 1}/${parseInt(parts[1]) + 1}`;
  };

  // 1. Load Daftar Kelas (Sekali saat modal buka)
  useEffect(() => {
    if (isOpen) {
      setTargetClass('');
      setIsAlumni(false);
      
      teacherService.getAllClasses()
        .then(res => {
            const list = res.data || res;
            setClasses(list);
        })
        .catch(err => {
            console.error(err);
            toast.error("Gagal memuat daftar kelas.");
        });
    }
  }, [isOpen]);

  // 2. LOGIKA FILTER UTAMA (SESUAI REQUEST ANDA)
  useEffect(() => {
    if (classes.length === 0) return;

    // Cari Object Kelas Asal untuk tau Tahun Ajarannya
    const sourceClassObj = classes.find(c => c.id.toString() === sourceClassId?.toString());
    const currentYear = sourceClassObj?.academic_year || "";
    const currentLevel = getLevel(sourceClassObj?.name || "");

    // ----------------------------------------------------------------
    // SKENARIO A: PINDAH KELAS (PARALEL / BEBAS)
    // ----------------------------------------------------------------
    if (mode === 'move') {
        // Instruksi: "Bebas dari kelas 7 ke alumni juga bisa"
        // Filter: Tampilkan SEMUA kelas kecuali kelas asal dia sendiri
        const options = classes.filter(c => c.id.toString() !== sourceClassId?.toString());
        setFilteredClasses(options);
        // Alumni selalu boleh dipilih di mode ini
        return; 
    }

    // ----------------------------------------------------------------
    // SKENARIO B: KENAIKAN KELAS (PROMOTE) - STRICT
    // ----------------------------------------------------------------
    if (mode === 'promote') {
        // Instruksi: "Hanya menampilkan kelas yang ada di tahun ajaran baru"
        // "Tahun ajaran lama gaboleh nampil"
        
        const targetYearString = getNextYearString(currentYear);
        const nextLevel = currentLevel + 1;

        // Filter 1: Harus Tahun Ajaran Baru
        let validClasses = classes.filter(c => c.academic_year === targetYearString);

        // Filter 2: Logika Tingkat (Hanya Naik atau Tinggal Kelas)
        // Kelas 9 -> Hanya bisa Tinggal Kelas 9 (di tahun baru) atau Alumni. Tidak ada kelas 10.
        // Kelas 7/8 -> Bisa Naik (N+1) atau Tinggal (N)
        
        if (currentLevel === 9) {
            // Jika kelas 9, hanya tampilkan kelas 9 tahun depan (untuk yang tidak lulus)
            validClasses = validClasses.filter(c => getLevel(c.name) === 9);
        } else {
            // Jika kelas 7 atau 8, tampilkan N dan N+1
            validClasses = validClasses.filter(c => {
                const lvl = getLevel(c.name);
                return lvl === currentLevel || lvl === nextLevel;
            });
        }

        setFilteredClasses(validClasses);
        // Reset checkbox alumni jika ganti filter
        setIsAlumni(false);
    }

  }, [isOpen, classes, sourceClassId, mode]);


  const handleSubmit = async () => {
    if (!isAlumni && !targetClass) {
      toast.error("Mohon pilih kelas tujuan!");
      return;
    }

    // Ambil nama kelas tujuan untuk konfirmasi visual
    const targetClassObj = classes.find(c => c.id == targetClass);
    const targetNameDisplay = isAlumni 
        ? "<span class='text-emerald-600 font-bold'>LULUS (ALUMNI)</span>" 
        : `<span class='text-indigo-600 font-bold'>${targetClassObj?.name} (${targetClassObj?.academic_year})</span>`;

    // Tampilan Konfirmasi
    const result = await Swal.fire({
      title: mode === 'promote' ? 'Konfirmasi Kenaikan' : 'Konfirmasi Pindah',
      html: `
        <div class="text-left text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2">
          <p class="font-bold text-gray-500 text-xs uppercase mb-2">Ringkasan:</p>
          <ul class="list-disc pl-4 space-y-1 mb-3 text-gray-700">
            <li><b>Siswa:</b> ${selectedStudents.length} Orang</li>
            <li><b>Asal:</b> ${sampleStudent?.class_name || 'Kelas Lama'}</li>
          </ul>
          
          <div class="flex items-center gap-2 justify-center my-4 bg-white p-3 rounded border border-gray-100">
             <span class="text-xs font-bold text-gray-500">TUJUAN:</span>
             ${targetNameDisplay}
          </div>

          <p class="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2 border border-amber-100">
            ⚠ Pastikan data benar. Riwayat kelas lama akan tersimpan.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d1d5db',
      confirmButtonText: 'Ya, Proses',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const studentIds = selectedStudents.map(s => s.id);
      
      await teacherService.promoteStudents({
        studentIds: studentIds,
        targetClassId: isAlumni ? null : Number(targetClass),
        isAlumni: isAlumni
      });

      await Swal.fire({
        title: 'Berhasil!',
        text: 'Data siswa berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal memproses data.";
      Swal.fire('Gagal', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Logic UI: Apakah opsi Alumni boleh muncul?
  // Mode Move: Bebas (Selalu boleh).
  // Mode Promote: Hanya boleh jika kelas 9 (atau 12).
  const currentLvl = sampleStudent?.class_name ? getLevel(sampleStudent.class_name) : 0;
  const showAlumniOption = mode === 'move' || (mode === 'promote' && currentLvl === 9);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* HEADER */}
        <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${mode === 'promote' ? 'bg-indigo-50' : 'bg-gray-50'}`}>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
                {mode === 'promote' ? 'Proses Kenaikan Kelas' : 'Pindah Kelas (Paralel)'}
            </h2>
            <p className="text-xs text-gray-500">
                {mode === 'promote' ? 'Menuju Tahun Ajaran Baru' : 'Perpindahan bebas antar kelas'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* BODY */}
        <div className="p-6">
            <div className="mb-5">
               <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Siswa Terpilih</label>
               <div className="p-3 bg-slate-50 text-slate-800 rounded-lg text-sm font-medium border border-slate-200 flex justify-between items-center">
                  <span>{selectedStudents.length} Siswa</span>
                  <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">Dari: <b>{sampleStudent?.class_name || '-'}</b></span>
               </div>
            </div>

            {/* OPSI ALUMNI (Kondisional) */}
            {showAlumniOption && (
                <div className="mb-5">
                    <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={isAlumni} 
                            onChange={(e) => {
                                setIsAlumni(e.target.checked);
                                if(e.target.checked) setTargetClass('');
                            }}
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <div>
                            <span className="block font-bold text-emerald-800">Set Sebagai Alumni (Lulus)</span>
                            <span className="text-xs text-emerald-600">Siswa akan dikeluarkan dari kelas aktif.</span>
                        </div>
                    </label>
                </div>
            )}

            {/* DROPDOWN KELAS */}
            {!isAlumni && (
                <div className="mb-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                        {mode === 'promote' ? 'Target Kenaikan Kelas:' : 'Pindah Ke Kelas:'}
                    </label>
                    <select 
                        className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        value={targetClass}
                        onChange={e => setTargetClass(e.target.value)}
                    >
                        <option value="">-- Pilih Kelas Tujuan --</option>
                        {filteredClasses.length === 0 ? (
                            <option disabled>Tidak ada kelas tersedia</option>
                        ) : (
                            filteredClasses.map((c: any) => {
                                // Logic Label di Dropdown
                                let label = `${c.name} (${c.academic_year})`;
                                if (mode === 'promote') {
                                    // Beri hint visual apakah naik atau tinggal
                                    const cLvl = getLevel(c.name);
                                    if (cLvl === currentLvl) label += " - [Tinggal Kelas]";
                                    else if (cLvl > currentLvl) label += " - [Naik Kelas]";
                                }
                                return (
                                    <option key={c.id} value={c.id}>{label}</option>
                                );
                            })
                        )}
                    </select>
                    
                    {/* HINT TEXT */}
                    {mode === 'promote' && (
                        <p className="text-[10px] text-gray-400 mt-2 flex gap-1">
                            <Info size={12} className="mt-0.5"/>
                            <span>Hanya menampilkan kelas di tahun ajaran baru.</span>
                        </p>
                    )}
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-6 pt-0 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Batal</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || (!isAlumni && !targetClass)}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}
              {loading ? 'Memproses...' : 'Simpan Perubahan'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteModal;