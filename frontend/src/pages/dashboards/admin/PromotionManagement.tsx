import React, { useState, useEffect } from 'react';
import { 
    AlertTriangle, ArrowRight, RefreshCw, Save, 
    Users, ArrowUpRight, CheckCircle2, Search, Calendar, Settings, X, Info
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
    const [updateExistingClasses, setUpdateExistingClasses] = useState(true);

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
            
            // Auto fill form dengan data saat ini (agar admin tinggal ganti dikit)
            setNewAcademicYear(settings.current_academic_year);
            setNewSemester(settings.current_semester);
        } catch (e) { 
            setCurrentDbYear('2025/2026'); 
            setCurrentDbSemester('Ganjil');
        }
    };

    // ========================================================================
    // LOGIKA TAB 1: PENGATURAN AKADEMIK
    // ========================================================================

    // 1. Update Tahun & Semester
    const handleUpdateSettings = async () => {
        if (!newAcademicYear) return Swal.fire('Error', 'Isi tahun ajaran baru', 'error');

        const result = await Swal.fire({
            title: 'Simpan Pengaturan?',
            html: `
                <div class="text-left text-sm">
                    <p class="mb-2">Sistem akan diperbarui menjadi:</p>
                    <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-3">
                        <p><strong>Tahun:</strong> ${newAcademicYear}</p>
                        <p><strong>Semester:</strong> ${newSemester}</p>
                    </div>
                    <ul class="list-disc pl-5 text-gray-600">
                        <li>Data ini akan menjadi default untuk kelas baru.</li>
                        ${updateExistingClasses 
                            ? '<li class="text-indigo-600 font-bold">Label tahun pada semua kelas yang ada JUGA akan diupdate.</li>' 
                            : '<li>Label tahun pada kelas lama <b>TIDAK</b> berubah.</li>'
                        }
                    </ul>
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan',
            confirmButtonColor: '#4f46e5'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Panggil endpoint baru yang mendukung semester
                await adminService.updateGlobalSettings(newAcademicYear, newSemester, updateExistingClasses);
                
                Swal.fire('Sukses', 'Pengaturan akademik berhasil diperbarui.', 'success');
                fetchCurrentSettings();
                fetchClasses();
            } catch (e) { 
                Swal.fire('Gagal', 'Terjadi kesalahan saat update pengaturan.', 'error'); 
            } finally { 
                setLoading(false); 
            }
        }
    };

    // 2. Reset Siswa (Kosongkan Kelas) - TERPISAH
    const handleResetStudentsOnly = async () => {
        const result = await Swal.fire({
            title: 'KOSONGKAN SEMUA KELAS?',
            html: `
                <p class="text-rose-600 font-bold mb-2">PERINGATAN KERAS!</p>
                <p class="text-sm">Semua siswa akan dikeluarkan dari kelas masing-masing.</p>
                <p class="text-sm mt-1">Status mereka akan menjadi <b>"Tanpa Kelas"</b>.</p>
                <p class="text-xs text-gray-500 mt-3">*Data nilai/jurnal TIDAK hilang, hanya relasi kelas yang dihapus.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Kosongkan Semua!',
            focusCancel: true
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await adminService.resetAllClasses();
                Swal.fire('Reset Berhasil', 'Semua kelas kini kosong (0 Siswa).', 'success');
                fetchClasses();
            } catch (e) { 
                Swal.fire('Gagal', 'Error saat reset.', 'error'); 
            } finally { 
                setLoading(false); 
            }
        }
    };

    // ========================================================================
    // LOGIKA TAB 2: MAPPING MASSAL
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

        const payload = validMappings.map(m => ({
            fromClassId: parseInt(m.from),
            toClassId: m.to === 'alumni' ? null : parseInt(m.to),
            isAlumni: m.to === 'alumni'
        }));

        const result = await Swal.fire({
            title: 'Proses Kenaikan Massal?',
            text: `Akan memindahkan siswa dari ${validMappings.length} kelas asal ke tujuan.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                await adminService.promoteBatch(payload);
                Swal.fire('Sukses', 'Kenaikan kelas massal berhasil!', 'success');
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
    // LOGIKA TAB 3: MANUAL
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
                <p className="text-slate-500 mt-2 font-medium">Urus pergantian tahun, reset kelas, dan promosi siswa.</p>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setActiveTab('year')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'year' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <Settings size={18}/> Pengaturan Akademik
                </button>
                <button onClick={() => setActiveTab('mass')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'mass' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <ArrowUpRight size={18}/> Kenaikan Massal
                </button>
                <button onClick={() => setActiveTab('manual')} className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'manual' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-white/50'}`}>
                    <Users size={18}/> Pindah Manual
                </button>
            </div>

            {/* CONTENT: TAB 1 PENGATURAN TAHUN */}
            {activeTab === 'year' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* CARD 1: UPDATE TAHUN & SEMESTER */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shadow-sm"><Calendar size={24}/></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Pengaturan Akademik Global</h3>
                                <p className="text-sm text-slate-500">
                                    Status Aktif: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{currentDbYear} ({currentDbSemester})</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Input Tahun */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tahun Ajaran</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                            value={newAcademicYear}
                                            onChange={(e) => setNewAcademicYear(e.target.value)}
                                            placeholder="Contoh: 2026/2027"
                                        />
                                    </div>
                                    
                                    {/* Input Semester */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester</label>
                                        <select 
                                            className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow"
                                            value={newSemester}
                                            onChange={(e) => setNewSemester(e.target.value)}
                                        >
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <input 
                                        type="checkbox" 
                                        id="updateExisting"
                                        className="w-5 h-5 text-indigo-600 rounded mt-0.5 focus:ring-indigo-500 cursor-pointer"
                                        checked={updateExistingClasses}
                                        onChange={(e) => setUpdateExistingClasses(e.target.checked)}
                                    />
                                    <label htmlFor="updateExisting" className="text-sm text-slate-600 cursor-pointer font-medium">
                                        Update juga label tahun pada semua kelas yang sudah ada.
                                        <span className="block text-xs text-slate-400 mt-1 font-normal">(Contoh: Kelas 7A {currentDbYear} 7A {newAcademicYear})</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex items-end">
                                <button 
                                    onClick={handleUpdateSettings}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    {loading ? <RefreshCw className="animate-spin"/> : <Save size={18}/>} 
                                    Simpan Pengaturan
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: RESET DATA (TERPISAH) */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertTriangle size={120} className="text-rose-600" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="p-4 bg-rose-100 text-rose-600 rounded-full shadow-inner"><RefreshCw size={32}/></div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-rose-700">Zona Reset Data (Akhir Tahun)</h3>
                                <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Fitur ini akan <strong>MENGELUARKAN SEMUA SISWA</strong> dari kelas masing-masing. 
                                    Gunakan ini jika Anda ingin memulai tahun ajaran baru dengan kondisi kelas kosong, lalu memetakan siswa kembali secara manual atau import.
                                </p>
                            </div>
                            <button 
                                onClick={handleResetStudentsOnly}
                                disabled={loading}
                                className="px-6 py-3 bg-white border-2 border-rose-500 text-rose-600 font-bold rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <AlertTriangle size={18}/> Kosongkan Semua Kelas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: TAB 2 MASSAL */}
            {activeTab === 'mass' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Mapping Kenaikan Kelas</h3>
                        <p className="text-slate-500 text-sm">Pindahkan semua siswa dari Kelas Lama ke Kelas Baru secara otomatis.</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        {mappings.map((map, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Dari Kelas (Lama)</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500"
                                        value={map.from}
                                        onChange={(e) => updateMapping(idx, 'from', e.target.value)}
                                    >
                                        <option value="">Pilih Kelas...</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.academic_year && `(${c.academic_year})`}</option>)}
                                    </select>
                                </div>
                                
                                <ArrowRight className="text-slate-400 hidden md:block mt-6" />

                                <div className="flex-1 w-full">
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Ke Kelas (Baru)</label>
                                    <select 
                                        className="w-full p-3 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500"
                                        value={map.to}
                                        onChange={(e) => updateMapping(idx, 'to', e.target.value)}
                                    >
                                        <option value="">Pilih Tujuan...</option>
                                        <option value="alumni" className="bg-amber-100 text-amber-800 font-bold">Lulus (Alumni)</option>
                                        {classes
                                            .filter(c => c.id.toString() !== map.from)
                                            .map(c => <option key={c.id} value={c.id}>{c.name} {c.academic_year && `(${c.academic_year})`}</option>)
                                        }
                                    </select>
                                </div>

                                <button onClick={() => removeMapping(idx)} className="mt-6 text-rose-500 hover:bg-rose-100 p-3 rounded-lg transition-colors"><X size={20}/></button>
                            </div>
                        ))}
                        
                        {mappings.length === 0 && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 italic flex flex-col items-center justify-center gap-2">
                                <Info size={32} className="text-slate-300"/>
                                <p>Belum ada mapping. Klik "+ Tambah Baris Mapping" untuk memulai.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between border-t border-slate-100 pt-6">
                        <button onClick={handleAddMapping} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-lg transition-colors">
                            + Tambah Baris Mapping
                        </button>
                        <button 
                            onClick={handleProcessBatch}
                            disabled={loading || mappings.length === 0}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <RefreshCw className="animate-spin"/> : <Save size={20}/>}
                            Proses Kenaikan Massal
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENT: TAB 3 MANUAL */}
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