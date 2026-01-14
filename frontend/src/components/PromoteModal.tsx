import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import teacherService from '../services/teacherService';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: number[];
  userRole: 'teacher' | 'admin';
  onSuccess: () => void;
}

const PromoteModal: React.FC<PromoteModalProps> = ({ isOpen, onClose, selectedStudents, userRole, onSuccess }) => {
  const [targetClass, setTargetClass] = useState('');
  const [isAlumni, setIsAlumni] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Ambil daftar kelas saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      teacherService.getAllClasses()
        .then(res => {
            const list = res.data || res; // Handle response structure {data: []} or []
            setClasses(list);
        })
        .catch(err => {
            console.error(err);
            toast.error("Gagal memuat daftar kelas tujuan.");
        });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Validasi
    if (!isAlumni && !targetClass) {
      toast.error("Mohon pilih kelas tujuan!");
      return;
    }

    // Konfirmasi
    if (!confirm(`Yakin memproses ${selectedStudents.length} siswa ini?`)) return;

    setLoading(true);
    try {
      // Panggil API Kenaikan Kelas
      await teacherService.promoteStudents({
        studentIds: selectedStudents,
        targetClassId: isAlumni ? null : Number(targetClass),
        isAlumni: isAlumni
      });

      toast.success(isAlumni ? "Siswa berhasil diluluskan!" : "Siswa berhasil naik kelas!");
      onSuccess(); // Refresh data di dashboard utama
      onClose();   // Tutup modal
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Gagal memproses data.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {userRole === 'admin' ? 'Pindahkan / Koreksi Kelas' : 'Proses Kenaikan Kelas'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>
        
        {/* BODY */}
        <div className="p-6">
          {/* Info Box */}
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex gap-3 items-start mb-6 text-sm border border-blue-100">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Konfirmasi Tindakan</p>
              <p>
                Anda akan memproses <strong>{selectedStudents.length} Siswa</strong> terpilih. 
                Data profil dan riwayat jurnal siswa akan tetap tersimpan.
              </p>
            </div>
          </div>

          {/* Opsi Alumni */}
          <div className="mb-6">
            <label className={`flex items-center space-x-3 cursor-pointer group p-4 border rounded-xl transition-all ${isAlumni ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAlumni ? 'bg-violet-600 border-violet-600' : 'bg-white border-gray-300'}`}>
                {isAlumni && <CheckCircle2 size={14} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                checked={isAlumni} 
                onChange={e => {
                    setIsAlumni(e.target.checked);
                    if (e.target.checked) setTargetClass('');
                }}
                className="hidden"
              />
              <div>
                <span className={`block font-bold text-sm ${isAlumni ? 'text-violet-900' : 'text-gray-700'}`}>Luluskan Siswa (Set Alumni)</span>
                <span className="text-xs text-gray-500">Siswa akan menjadi alumni dan tidak masuk kelas manapun.</span>
              </div>
            </label>
          </div>

          {/* Opsi Pilih Kelas (Hanya jika bukan Alumni) */}
          {!isAlumni && (
            <div className="mb-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Pilih Kelas Tujuan:</label>
              <div className="relative">
                <select 
                  className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-3.5 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 font-medium transition-shadow"
                  value={targetClass}
                  onChange={e => setTargetClass(e.target.value)}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                        {c.name} {c.academic_year ? `(${c.academic_year})` : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 pt-0 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-colors"
                disabled={loading}
            >
                Batal
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || (!isAlumni && !targetClass)}
              className="px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-200 transition-all active:scale-95 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteModal;