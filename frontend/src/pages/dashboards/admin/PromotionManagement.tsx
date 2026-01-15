import React, { useState, useEffect } from 'react';
import { 
    ArrowRight, RefreshCw, Save, 
    Users, ArrowUpRight, CheckCircle2, Search, Calendar, Settings, X, Info, PlusCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const PromotionManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'year' | 'mass' | 'manual'>('year');
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- STATE TAB 1: PENGATURAN TAHUN & SEMESTER ---
    const [currentDbYear, setCurrentDbYear] = useState('...');
    const [currentDbSemester, setCurrentDbSemester] = useState('...');
    
    // Form State
    const [newAcademicYear, setNewAcademicYear] = useState('');
    const [newSemester, setNewSemester] = useState('Ganjil');

    // --- STATE TAB 2: MAPPING MASSAL ---
    const [mappings, setMappings] = useState<{from: string, to: string}[]>([]);

    // --- STATE TAB 3: MANUAL ---
    const [manualSourceClass, setManualSourceClass] = useState('');
    const [manualTargetClass, setManualTargetClass] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

    // --- INITIAL LOAD ---
    useEffect(() => {
        fetchClasses();
        fetchCurrentSettings();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await adminService.getClasses();
            const classList = Array.isArray(res) ? res : (res.data || []);
            setClasses(classList);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCurrentSettings = async () => {
        try {
            const settings = await adminService.getAppSettings();
            setCurrentDbYear(settings.current_academic_year);
            setCurrentDbSemester(settings.current_semester);
            
            // Auto fill form
            setNewAcademicYear(settings.current_academic_year);
            setNewSemester(settings.current_semester);
        } catch (e) { 
            setCurrentDbYear('2025/2026'); 
            setCurrentDbSemester('Ganjil');
        }
    };

    // ========================================================================
    // LOGIKA TAB 1: PENGATURAN AKADEMIK (SESUAI FLOWCHART)
    // ========================================================================

    const handleUpdateSettings = async () => {
        if (!newAcademicYear) return Swal.fire('Error', 'Isi tahun ajaran baru', 'error');

        // Validasi sederhana format tahun (opsional)
        if (!newAcademicYear.includes('/')) {
            return Swal.fire('Format Salah', 'Gunakan format tahun contoh: 2026/2027', 'warning');
        }

        const result = await Swal.fire({
            title: 'Ganti Tahun Ajaran Baru?',
            html: `
                <div class="text-left text-sm space-y-3">
                    <p>Anda akan mengaktifkan periode:</p>
                    <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-bold text-center text-indigo-800">
                        ${newAcademicYear} - Semester ${newSemester}
                    </div>
                    <p class="font-bold text-slate-700">Sistem akan melakukan:</p>
                    <ul class="list-disc pl-5 text-gray-600 space-y-1">
                        <li>Membuat <b>Salinan Kelas Baru</b> berdasarkan kelas tahun lalu.</li>
                        <li>Kelas baru akan dimulai dalam keadaan <b>KOSONG (0 Siswa)</b>.</li>
                        <li><b>Wali Kelas</b> akan di-reset (perlu diatur ulang).</li>
                        <li>Data kelas & siswa tahun lalu <b>TIDAK DIHAPUS</b> (disimpan sebagai history).</li>
                    </ul>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses Pergantian',
            confirmButtonColor: '#4f46e5',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Payload tidak perlu updateExistingClasses lagi karena logika backend sudah fix
                const response = await adminService.updateGlobalSettings(newAcademicYear, newSemester, false);
                
                await Swal.fire('Sukses!', response.details || 'Tahun ajaran berhasil diperbarui.', 'success');
                fetchCurrentSettings();
                fetchClasses();
            } catch (e) { 
                Swal.fire('Gagal', 'Terjadi kesalahan saat memproses tahun ajaran.', 'error'); 
            } finally { 
                setLoading(false); 
            }
        }
    };

    // ========================================================================
    // LOGIKA TAB 2: MAPPING MASSAL (TETAP SAMA, TAPI UI DIPERJELAS)
    // ========================================================================
    const handleAddMapping = () => setMappings([...mappings, { from: '', to: '' }]);
    
    const updateMapping = (index: number, field: 'from' | 'to', value: string) => {
        const newMappings = [...mappings];
        newMappings[index][field] = value;
        setMappings(newMappings);
    };

    const removeMapping = (index: number) => {
        const newMappings = mappings.filter((_, i) => i !== index);
        setMappings(newMappings);
    };

    const handleProcessBatch = async () => {
        const validMappings = mappings.filter(m => m.from && (m.to || m.to === 'alumni'));
        
        if (validMappings.length === 0) {
            return Swal.fire('Error', 'Buat minimal satu pemetaan kelas.', 'error');
        }

        const result = await Swal.fire({
            title: 'Proses Kenaikan?',
            text: `Memindahkan siswa dari ${validMappings.length} kelas lama ke kelas baru/alumni.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Pindahkan'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const payload = validMappings.map(m => ({
                    fromClassId: parseInt(m.from),
                    toClassId: m.to === 'alumni' ? null : parseInt(m.to),
                    isAlumni: m.to === 'alumni'
                }));

                await adminService.promoteBatch(payload);
                Swal.fire('Sukses', 'Siswa berhasil dipindahkan ke kelas baru.', 'success');
                setMappings([]); 
                fetchClasses();
            } catch (error) {
                Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    // ========================================================================
    // LOGIKA TAB 3: MANUAL (TETAP SAMA)
    // ========================================================================
    const fetchStudents = async (classId: string) => {
        if (!classId) return;
        setLoading(true);
        try {
            const res = await adminService.getUsers({ role: 'student', class_id: classId, limit: 1000 }); 
            setStudents(res.data || []);
            setSelectedStudents([]);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const toggleStudent = (id: number) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleManualMove = async () => {
        if (selectedStudents.length === 0) return Swal.fire('Pilih Siswa', 'Silakan pilih minimal satu siswa.', 'warning');
        if (!manualTargetClass) return Swal.fire('Pilih Tujuan', 'Silakan pilih kelas tujuan.', 'warning');

        try {
            await adminService.moveStudents({
                studentIds: selectedStudents,
                targetClassId: manualTargetClass === 'alumni' ? null : parseInt(manualTargetClass),
                isAlumni: manualTargetClass === 'alumni'
            });
            Swal.fire('Sukses', 'Siswa berhasil dipindahkan.', 'success');
            fetchStudents(manualSourceClass); 
            fetchClasses();
        } catch (error) {
            Swal.fire('Gagal', 'Error memindahkan siswa.', 'error');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen bg-gray-50">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Kenaikan & Tahun Ajaran</h1>
                <p className="text-slate-500 mt-2 font-medium">Atur pergantian tahun ajaran baru dan migrasi siswa.</p>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setActiveTab('year')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'year' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <Calendar size={18}/> 1. Ganti Tahun Ajaran
                </button>
                <button onClick={() => setActiveTab('mass')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'mass' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <ArrowUpRight size={18}/> 2. Naik Kelas Massal
                </button>
                <button onClick={() => setActiveTab('manual')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'manual' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <Users size={18}/> 3. Pindah Manual
                </button>
            </div>

            {/* CONTENT: TAB 1 PENGATURAN TAHUN */}
            {activeTab === 'year' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shadow-sm"><Settings size={24}/></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Mulai Tahun Ajaran Baru</h3>
                                <p className="text-sm text-slate-500">
                                    TA Aktif Saat Ini: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{currentDbYear} ({currentDbSemester})</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Form Input */}
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tahun Ajaran Baru</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                            value={newAcademicYear}
                                            onChange={(e) => setNewAcademicYear(e.target.value)}
                                            placeholder="2026/2027"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester Awal</label>
                                        <select 
                                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            value={newSemester}
                                            onChange={(e) => setNewSemester(e.target.value)}
                                        >
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleUpdateSettings}
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="animate-spin"/> : <PlusCircle size={20}/>} 
                                    Buat Tahun Ajaran & Generate Kelas
                                </button>
                            </div>

                            {/* Penjelasan Flow */}
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <Info size={16} className="text-indigo-500"/>
                                    Apa yang terjadi saat tombol ditekan?
                                </h4>
                                <ul className="text-sm text-slate-600 space-y-3 relative">
                                    {/* Garis vertikal timeline */}
                                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-300"></div>

                                    <li className="pl-6 relative">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-slate-400 rounded-full border-2 border-white"></div>
                                        Sistem mencatat <b>Tahun Ajaran Baru</b>.
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white"></div>
                                        Mengambil daftar nama kelas dari tahun sebelumnya (misal: 7A, 7B, dst).
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-white"></div>
                                        <b>Menduplikasi Kelas</b> tersebut untuk tahun baru.
                                    </li>
                                    <li className="pl-6 relative">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        Kelas baru dibuat dalam keadaan <b>KOSONG</b> (tanpa siswa) dan <b>TANPA WALI KELAS</b>.
                                    </li>
                                </ul>
                                <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 italic">
                                    *Setelah ini, silakan masuk ke menu "Manajemen User" untuk set Wali Kelas, dan menu "Naik Kelas Massal" untuk isi siswa.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: TAB 2 MASSAL (Tampilan disesuaikan sedikit agar lebih rapi) */}
            {activeTab === 'mass' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Mapping Kenaikan Kelas</h3>
                        <p className="text-slate-500 text-sm">Pindahkan siswa dari <span className="font-bold text-rose-500">Kelas Lama</span> ke <span className="font-bold text-emerald-600">Kelas Baru</span>.</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {mappings.map((map, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dari (Tahun Lalu)</label>
                                    <select 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 text-sm"
                                        value={map.from}
                                        onChange={(e) => updateMapping(idx, 'from', e.target.value)}
                                    >
                                        <option value="">Pilih Kelas Asal...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.academic_year}) - {c.student_count || 0} Siswa
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <ArrowRight className="text-slate-300 hidden md:block mt-5" />

                                <div className="flex-1 w-full">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ke (Tahun Baru)</label>
                                    <select 
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 text-sm"
                                        value={map.to}
                                        onChange={(e) => updateMapping(idx, 'to', e.target.value)}
                                    >
                                        <option value="">Pilih Tujuan...</option>
                                        <option value="alumni" className="bg-amber-100 text-amber-800 font-bold">🎓 LULUS (Alumni)</option>
                                        {classes
                                            .filter(c => c.id.toString() !== map.from)
                                            .map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} ({c.academic_year})
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <button onClick={() => removeMapping(idx)} className="mt-5 text-rose-500 hover:bg-rose-100 p-2 rounded-lg transition-colors"><X size={18}/></button>
                            </div>
                        ))}
                        
                        {mappings.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                <p className="mb-2">Belum ada pemetaan kelas.</p>
                                <button onClick={handleAddMapping} className="text-indigo-600 font-bold hover:underline">
                                    + Tambah Baris Mapping
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-6">
                        <button onClick={handleAddMapping} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-lg">
                            + Tambah Baris
                        </button>
                        <button 
                            onClick={handleProcessBatch}
                            disabled={loading || mappings.length === 0}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                        >
                            {loading ? <RefreshCw className="animate-spin"/> : <Save size={20}/>}
                            Proses Kenaikan
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: MANUAL MOVE (Kode sama persis seperti sebelumnya, tidak perlu diubah karena logikanya sudah benar: ambil siswa -> pindah ke class_id baru) */}
            {activeTab === 'manual' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">1. Pilih Kelas Asal</label>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                    value={manualSourceClass}
                                    onChange={(e) => setManualSourceClass(e.target.value)}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.academic_year && `(${c.academic_year})`} - {c.student_count || 0} Siswa</option>)}
                                </select>
                                <button 
                                    onClick={() => fetchStudents(manualSourceClass)} 
                                    disabled={!manualSourceClass || loading}
                                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? <RefreshCw className="animate-spin size={20}"/> : <Search size={20}/>}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">2. Pilih Kelas Tujuan</label>
                            <select 
                                className="w-full p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                value={manualTargetClass}
                                onChange={(e) => setManualTargetClass(e.target.value)}
                            >
                                <option value="">-- Pilih Tujuan --</option>
                                <option value="alumni" className="bg-amber-100 font-bold">Lulus (Alumni)</option>
                                {classes
                                    .filter(c => c.id.toString() !== manualSourceClass)
                                    .map(c => <option key={c.id} value={c.id}>{c.name} {c.academic_year && `(${c.academic_year})`}</option>)
                                }
                            </select>
                        </div>
                    </div>

                    {students.length > 0 ? (
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        onChange={handleSelectAll}
                                        checked={selectedStudents.length === students.length && students.length > 0}
                                    />
                                    <span className="font-bold text-slate-700">Pilih Semua ({selectedStudents.length} dipilih)</span>
                                </div>
                                <button 
                                    onClick={handleManualMove} 
                                    disabled={selectedStudents.length === 0}
                                    className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Pindahkan Siswa
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto p-2 bg-white">
                                {students.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => toggleStudent(s.id)} 
                                        className={`flex items-center gap-4 p-3 mb-1 rounded-lg cursor-pointer transition-all border ${selectedStudents.includes(s.id) ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-gray-50'}`}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStudents.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'}`}>
                                            {selectedStudents.includes(s.id) && <CheckCircle2 size={14}/>}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{s.full_name}</p>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-slate-500">NISN: {s.nisn || '-'}</span>
                                                <span className={`${s.is_active ? 'text-emerald-600' : 'text-amber-600'} font-bold`}>{s.is_active ? 'Aktif' : 'Belum Aktivasi'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        manualSourceClass && !loading && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 italic">
                                Tidak ada siswa di kelas ini.
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default PromotionManagement;