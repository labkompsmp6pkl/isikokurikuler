import React, { useState, useEffect } from 'react';
import { 
    ArrowRight, RefreshCw, Save, 
    Users, ArrowUpRight, CheckCircle2, Search, Calendar, Settings, X, Info, AlertTriangle, ArrowRightLeft, TrendingUp
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';
// Import Modal Promosi
import PromoteModal from '../../../components/PromoteModal';

const PromotionManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'year' | 'mass' | 'manual'>('year');
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- STATE TAB 1: PENGATURAN TAHUN & SEMESTER ---
    const [currentDbYear, setCurrentDbYear] = useState('...');
    const [currentDbSemester, setCurrentDbSemester] = useState('...');
    
    // Form State Terpisah untuk Tahun
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [newSemester, setNewSemester] = useState('Ganjil');

    // --- STATE TAB 2: MAPPING MASSAL ---
    const [mappings, setMappings] = useState<{from: string, to: string}[]>([]);

    // --- STATE TAB 3: MANUAL ---
    const [manualSourceClass, setManualSourceClass] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

    // State untuk Modal Promosi Manual
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [selectedStudentObjects, setSelectedStudentObjects] = useState<any[]>([]);
    const [manualMode, setManualMode] = useState<'move' | 'promote'>('move'); 

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
            
            const parts = (settings.current_academic_year || "").split('/');
            if (parts.length === 2) {
                setStartYear(parts[0]);
                setEndYear(parts[1]);
            } else {
                setStartYear("2025");
                setEndYear("2026");
            }
            setNewSemester(settings.current_semester || 'Ganjil');
        } catch (e) { 
            setCurrentDbYear('2025/2026'); 
            setCurrentDbSemester('Ganjil');
        }
    };

    // [VALIDASI] Cek apakah boleh melakukan promosi (Semester Genap)
    const canPromote = currentDbSemester.toLowerCase() === 'genap';

    // Helper: Hitung Tahun Berikutnya
    const getNextYear = (currentYear: string) => {
        if (!currentYear) return "";
        const parts = currentYear.split('/');
        if (parts.length !== 2) return "";
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if(isNaN(start) || isNaN(end)) return "";
        return `${start + 1}/${end + 1}`;
    };

    // Helper: Ambil Level Kelas (misal "7A" -> 7)
    const getLevel = (name: string) => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    };

    const nextDbYear = getNextYear(currentDbYear);

    // Helper: Filter Kelas ASAL (Hanya Tahun Aktif)
    const sourceClasses = classes.filter(c => c.academic_year === currentDbYear);

    // Helper: Filter Kelas TUJUAN (Hanya Tahun Berikutnya)
    const targetClasses = classes.filter(c => c.academic_year === nextDbYear);

    // ========================================================================
    // LOGIKA TAB 1: PENGATURAN TAHUN AJARAN
    // ========================================================================
    const handleUpdateSettings = async () => {
        if (!startYear || !endYear) return Swal.fire('Error', 'Tahun awal dan akhir harus diisi.', 'warning');
        
        const start = parseInt(startYear);
        const end = parseInt(endYear);

        if (isNaN(start) || isNaN(end)) return Swal.fire('Error', 'Tahun harus berupa angka.', 'warning');
        if (end !== start + 1) return Swal.fire('Format Salah', `Tahun harus berurutan. Contoh: ${start}/${start + 1}.`, 'error');

        const finalNewYear = `${start}/${end}`;
        const isSameYear = finalNewYear === currentDbYear;

        const result = await Swal.fire({
            title: isSameYear ? 'Update Semester?' : 'Ganti Tahun Ajaran?',
            text: isSameYear ? `Ubah semester ke ${newSemester}?` : `Ganti ke T.A ${finalNewYear}? Data lama akan diarsipkan.`,
            icon: isSameYear ? 'info' : 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const response = await adminService.updateGlobalSettings(finalNewYear, newSemester, false);
                await Swal.fire('Sukses!', response.details, 'success');
                fetchCurrentSettings();
                fetchClasses();
            } catch (e) { Swal.fire('Gagal', 'Error update settings', 'error'); } 
            finally { setLoading(false); }
        }
    };

    // ========================================================================
    // LOGIKA TAB 2: MAPPING MASSAL (LOGIKA STRICT: HANYA NAIK)
    // ========================================================================
    const handleAddMapping = () => setMappings([...mappings, { from: '', to: '' }]);
    const updateMapping = (index: number, field: 'from' | 'to', value: string) => {
        const newMappings = [...mappings];
        newMappings[index][field] = value;
        setMappings(newMappings);
    };
    const removeMapping = (index: number) => setMappings(mappings.filter((_, i) => i !== index));

    // Helper Filter Mapping: Hanya kembalikan kelas NAIK TINGKAT
    const getStrictTargetsForMapping = (fromClassId: string) => {
        if (!fromClassId) return [];

        const fromClass = classes.find(c => c.id.toString() === fromClassId);
        if (!fromClass) return [];

        const currentLevel = getLevel(fromClass.name);
        const nextLevel = currentLevel + 1;

        // Jika kelas 9, return kosong (karena opsinya hanya Alumni/Lulus)
        if (currentLevel === 9) {
            return [];
        } else {
            // Jika kelas 7 atau 8, HANYA return kelas tingkat selanjutnya (N+1)
            // Tidak mengembalikan kelas tingkat sama (Tinggal Kelas)
            return targetClasses.filter(c => getLevel(c.name) === nextLevel);
        }
    };

    const handleProcessBatch = async () => {
        const validMappings = mappings.filter(m => m.from && (m.to || m.to === 'alumni'));
        if (validMappings.length === 0) return Swal.fire('Error', 'Buat minimal satu pemetaan kelas.', 'error');

        const result = await Swal.fire({ title: 'Proses Kenaikan?', text: `Memindahkan siswa dari ${validMappings.length} kelas.`, icon: 'question', showCancelButton: true, confirmButtonText: 'Ya, Pindahkan' });
        
        if (result.isConfirmed) {
            setLoading(true);
            try {
                const payload = validMappings.map(m => ({
                    fromClassId: parseInt(m.from),
                    toClassId: m.to === 'alumni' ? null : parseInt(m.to),
                    isAlumni: m.to === 'alumni'
                }));
                await adminService.promoteBatch(payload);
                Swal.fire('Sukses', 'Siswa dipindahkan.', 'success');
                setMappings([]); 
                fetchClasses();
            } catch (error) { Swal.fire('Gagal', 'Terjadi kesalahan.', 'error'); } 
            finally { setLoading(false); }
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
        if (e.target.checked) setSelectedStudents(students.map(s => s.id));
        else setSelectedStudents([]);
    };

    const handleManualAction = (mode: 'move' | 'promote') => {
        if (selectedStudents.length === 0) return Swal.fire('Pilih Siswa', 'Silakan pilih minimal satu siswa.', 'warning');

        if (mode === 'promote' && !canPromote) {
            return Swal.fire('Belum Waktunya', 'Kenaikan kelas hanya bisa dilakukan di Semester Genap.', 'warning');
        }

        const fullStudentData = students.filter(s => selectedStudents.includes(s.id));
        const sourceClassObj = classes.find(c => c.id.toString() === manualSourceClass);
        const sourceClassName = sourceClassObj ? sourceClassObj.name : "Unknown";

        const dataWithContext = fullStudentData.map(s => ({
            ...s,
            class_name: sourceClassName,
            _manualMode: mode, 
            _targetYear: mode === 'promote' ? nextDbYear : currentDbYear
        }));

        setManualMode(mode);
        setSelectedStudentObjects(dataWithContext);
        setIsPromoteModalOpen(true);
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
                    <Users size={18}/> 3. Pindah Perorang/Lebih
                </button>
            </div>

            {/* CONTENT: TAB 1 PENGATURAN TAHUN */}
            {activeTab === 'year' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shadow-sm"><Settings size={24}/></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Pengaturan Akademik</h3>
                                <p className="text-sm text-slate-500">
                                    TA Aktif: <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{currentDbYear} ({currentDbSemester})</span>
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tahun Ajaran Baru</label>
                                        <div className="flex items-center gap-2">
                                            <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 text-center" value={startYear} onChange={(e) => { setStartYear(e.target.value); if(e.target.value.length===4) setEndYear(String(parseInt(e.target.value)+1)); }} placeholder="2025"/>
                                            <span className="text-xl font-bold text-slate-400">/</span>
                                            <input type="number" className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 text-center" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="2026"/>
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester</label>
                                        <select className="w-full p-3 border border-slate-300 rounded-xl font-bold text-gray-700 bg-white" value={newSemester} onChange={(e) => setNewSemester(e.target.value)}>
                                            <option value="Ganjil">Ganjil</option>
                                            <option value="Genap">Genap</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={handleUpdateSettings} disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                    {loading ? <RefreshCw className="animate-spin"/> : <Save size={20}/>} Simpan Pengaturan
                                </button>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-full">
                                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Info size={16} className="text-indigo-500"/> Informasi Sistem</h4>
                                <ul className="text-sm text-slate-600 space-y-3">
                                    <li className="flex gap-2"><div className="mt-1 min-w-[6px] h-[6px] bg-emerald-500 rounded-full"></div><div><b>Jika Tahun Sama:</b> Hanya ganti semester. Data aman.</div></li>
                                    <li className="flex gap-2"><div className="mt-1 min-w-[6px] h-[6px] bg-indigo-500 rounded-full"></div><div><b>Jika Tahun Berbeda:</b> Sistem membuat kelas baru (kosong) dan mengarsipkan data lama.</div></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENT: TAB 2 MASSAL */}
            {activeTab === 'mass' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!canPromote ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="p-4 bg-amber-50 rounded-full mb-4"><AlertTriangle size={40} className="text-amber-500"/></div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Fitur Belum Tersedia</h3>
                            <p className="text-slate-500 max-w-md">Kenaikan kelas hanya dapat dilakukan pada <b>Semester Genap</b>.<br/>Saat ini: <b>{currentDbSemester}</b>.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-slate-800">Mapping Kenaikan Kelas</h3>
                                <p className="text-slate-500 text-sm">Mapping dari Tahun <span className="font-bold text-rose-500">{currentDbYear}</span> ke Tahun <span className="font-bold text-emerald-600">{nextDbYear}</span>.</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {mappings.map((map, idx) => {
                                    // Ambil kelas asal untuk cek levelnya
                                    const fromClass = classes.find(c => c.id.toString() === map.from);
                                    const fromLevel = fromClass ? getLevel(fromClass.name) : 0;
                                    
                                    // Filter opsi tujuan: HANYA KELAS NAIK (N+1)
                                    const strictTargets = getStrictTargetsForMapping(map.from);

                                    return (
                                        <div key={idx} className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <div className="flex-1 w-full">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Dari ({currentDbYear})</label>
                                                <select 
                                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 text-sm"
                                                    value={map.from}
                                                    onChange={(e) => updateMapping(idx, 'from', e.target.value)}
                                                >
                                                    <option value="">Pilih Kelas Asal...</option>
                                                    {sourceClasses.map(c => <option key={c.id} value={c.id}>{c.name} - {c.student_count || 0} Siswa</option>)}
                                                </select>
                                            </div>
                                            <ArrowRight className="text-slate-300 hidden md:block mt-5" />
                                            <div className="flex-1 w-full">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Ke ({nextDbYear})</label>
                                                {/* FORM TUJUAN DISABLED JIKA BELUM PILIH ASAL */}
                                                <select 
                                                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400"
                                                    value={map.to}
                                                    onChange={(e) => updateMapping(idx, 'to', e.target.value)}
                                                    disabled={!map.from}
                                                >
                                                    <option value="">-- Pilih Tujuan --</option>
                                                    
                                                    {/* OPSI ALUMNI (Hanya untuk Kelas 9) */}
                                                    {fromLevel === 9 && (
                                                        <option value="alumni" className="bg-amber-100 text-amber-800 font-bold">🎓 LULUS (Alumni)</option>
                                                    )}

                                                    {/* OPSI KELAS LAIN (Hanya Naik Kelas) */}
                                                    {/* Kelas 9 tidak akan menampilkan opsi ini karena strictTargets kosong utk lvl 9 */}
                                                    {strictTargets.map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            Naik ke Kelas {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button onClick={() => removeMapping(idx)} className="mt-5 text-rose-500 hover:bg-rose-100 p-2 rounded-lg"><X size={18}/></button>
                                        </div>
                                    );
                                })}
                                {mappings.length === 0 && (
                                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
                                        <p className="mb-2">Belum ada pemetaan kelas.</p>
                                        <button onClick={handleAddMapping} className="text-indigo-600 font-bold hover:underline">+ Tambah Baris Mapping</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-6">
                                <button onClick={handleAddMapping} className="text-indigo-600 font-bold text-sm hover:underline flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-lg">+ Tambah Baris</button>
                                <button onClick={handleProcessBatch} disabled={loading || mappings.length === 0} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg flex items-center gap-2 disabled:opacity-50">{loading ? <RefreshCw className="animate-spin"/> : <Save size={20}/>} Proses Kenaikan</button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* TAB 3: MANUAL MOVE */}
            {activeTab === 'manual' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">1. Pilih Kelas Asal ({currentDbYear})</label>
                            <div className="flex gap-2">
                                <select 
                                    className="flex-1 p-3 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500"
                                    value={manualSourceClass}
                                    onChange={(e) => setManualSourceClass(e.target.value)}
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {sourceClasses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academic_year}) - {c.student_count || 0} Siswa</option>)}
                                </select>
                                <button onClick={() => fetchStudents(manualSourceClass)} disabled={!manualSourceClass || loading} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                                    {loading ? <RefreshCw className="animate-spin size={20}"/> : <Search size={20}/>}
                                </button>
                            </div>
                        </div>
                        
                        <div>
                             <div className="h-full flex flex-col justify-center text-slate-400 text-sm italic border border-dashed rounded-xl p-4 bg-slate-50">
                                <p>Silakan pilih siswa, lalu tentukan tindakan.</p>
                             </div>
                        </div>
                    </div>

                    {students.length > 0 ? (
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" onChange={handleSelectAll} checked={selectedStudents.length === students.length && students.length > 0}/>
                                    <span className="font-bold text-slate-700">Pilih Semua ({selectedStudents.length})</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    {/* TOMBOL 1: PINDAH (PARALEL) */}
                                    <button 
                                        onClick={() => handleManualAction('move')} 
                                        disabled={selectedStudents.length === 0}
                                        className="bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ArrowRightLeft size={16}/> Pindah Kelas (Paralel)
                                    </button>

                                    {/* TOMBOL 2: KENAIKAN (NAIK TINGKAT) - HANYA MUNCUL DI SEMESTER GENAP */}
                                    {canPromote && (
                                        <button 
                                            onClick={() => handleManualAction('promote')} 
                                            disabled={selectedStudents.length === 0}
                                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <TrendingUp size={16}/> Proses Kenaikan Kelas
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto p-2 bg-white">
                                {students.map(s => (
                                    <div key={s.id} onClick={() => toggleStudent(s.id)} className={`flex items-center gap-4 p-3 mb-1 rounded-lg cursor-pointer transition-all border ${selectedStudents.includes(s.id) ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-gray-50'}`}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStudents.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'}`}>{selectedStudents.includes(s.id) && <CheckCircle2 size={14}/>}</div>
                                        <div><p className="font-bold text-sm text-slate-800">{s.full_name}</p><div className="flex gap-2 text-xs"><span className="text-slate-500">NISN: {s.nisn || '-'}</span><span className={`${s.is_active ? 'text-emerald-600' : 'text-amber-600'} font-bold`}>{s.is_active ? 'Aktif' : 'Belum Aktivasi'}</span></div></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        manualSourceClass && !loading && (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 italic">Tidak ada siswa di kelas ini.</div>
                        )
                    )}
                </div>
            )}

            {/* Render Component Modal Promosi */}
            {isPromoteModalOpen && (
                <PromoteModal 
                    isOpen={isPromoteModalOpen}
                    onClose={() => setIsPromoteModalOpen(false)}
                    selectedStudents={selectedStudentObjects}
                    userRole="admin"
                    mode={manualMode}
                    sourceClassId={manualSourceClass}
                    onSuccess={() => {
                        fetchStudents(manualSourceClass); 
                        fetchClasses();
                    }}
                />
            )}
        </div>
    );
};

export default PromotionManagement;