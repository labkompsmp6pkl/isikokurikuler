import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, Save, X, Eye, User, 
    GraduationCap, Sparkles, Search, ChevronLeft, ChevronRight,
    UserPlus, CheckSquare, Calendar, Info, BookOpen, Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const ClassManagement: React.FC = () => {
    // --- STATE UTAMA ---
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State Pengaturan Global (Tampilan Header)
    const [activeYear, setActiveYear] = useState(''); 
    const [activeSemester, setActiveSemester] = useState('');

    // State Filter
    const [filterYear, setFilterYear] = useState('active'); 
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Modals Control
    const [showModal, setShowModal] = useState(false); 
    const [showDetailModal, setShowDetailModal] = useState(false); 
    const [showAddStudentModal, setShowAddStudentModal] = useState(false); 

    // Mode Form
    const [isEdit, setIsEdit] = useState(false);
    const [isGenerate, setIsGenerate] = useState(false);

    // Data Forms (Create/Edit Class)
    const [formData, setFormData] = useState({ id: 0, name: '', teacher_id: '', kapasitas: 40, academic_year: '' });
    const [generateData, setGenerateData] = useState({ grade: '7', start: 'A', end: 'G', kapasitas: 40, academic_year: '' });
    
    const [selectedClass, setSelectedClass] = useState<any>(null);

    // --- STATE MANAJEMEN SISWA (BULK ACTION) ---
    const [selectedToRemove, setSelectedToRemove] = useState<number[]>([]);
    const [studentPage, setStudentPage] = useState(1); 
    const studentsPerPage = 5;

    const [studentsForAdd, setStudentsForAdd] = useState<any[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
    const [searchStudent, setSearchStudent] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [addStudentPage, setAddStudentPage] = useState(1);
    const [, setTotalAddStudentPages] = useState(1);
    const addStudentLimit = 5; 

    // --- FETCH DATA UTAMA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const settings = await adminService.getAppSettings();
            const currentActiveYear = settings.current_academic_year || '2025/2026';
            const currentActiveSemester = settings.current_semester || 'Ganjil';
            
            setActiveYear(currentActiveYear);
            setActiveSemester(currentActiveSemester);

            const queryYear = filterYear === 'active' ? currentActiveYear : filterYear;

            const [classesResponse, teachersResponse] = await Promise.all([
                adminService.getClasses({ academic_year: queryYear }), 
                adminService.getTeachersList()
            ]);

            const validClasses = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.data || []);
            setClasses(validClasses);

            const allResponse = await adminService.getClasses({ academic_year: 'all' });
            const allClasses = Array.isArray(allResponse) ? allResponse : (allResponse?.data || []);
            const years = Array.from(new Set(allClasses.map((c: any) => c.academic_year))).sort().reverse();
            setAvailableYears(years as string[]);

            const validTeachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse?.data || []);
            setTeachers(validTeachers);

            // Pre-fill form state dengan tahun aktif (untuk create baru)
            setFormData(prev => ({ ...prev, academic_year: currentActiveYear }));
            setGenerateData(prev => ({ ...prev, academic_year: currentActiveYear }));

        } catch (error: any) {
            console.error("Error fetching data:", error);
            Swal.fire("Error", "Gagal memuat data kelas.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [filterYear]);

    // --- LOGIC: PAGINATION & FILTER NAMA ---
    const filteredClasses = classes.filter(cls => 
        cls?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const currentClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    // Variabel ini diperlukan untuk modal detail siswa
    const safeStudents = selectedClass && Array.isArray(selectedClass.students) ? selectedClass.students : [];
    const totalStudentPages = Math.ceil(safeStudents.length / studentsPerPage);
    const currentStudents = safeStudents.slice((studentPage - 1) * studentsPerPage, studentPage * studentsPerPage);

    // --- HANDLER LAINNYA ---
    const handleBatchDelete = async () => {
        const targetYear = filterYear === 'active' ? activeYear : filterYear;
        if (targetYear === 'all') return Swal.fire('Error', 'Pilih tahun spesifik di filter.', 'warning');

        const result = await Swal.fire({
            title: 'Hapus Massal Kelas?',
            html: `Hapus SEMUA kelas di <b>${targetYear}</b>? <br/>Data tidak bisa kembali.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus Semua!'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                const res = await adminService.deleteClassesBatch(targetYear);
                await Swal.fire('Terhapus!', res.message, 'success');
                if (filterYear === targetYear) fetchData(); 
            } catch (error: any) { Swal.fire('Gagal', error.response?.data?.message, 'error'); } 
            finally { setLoading(false); }
        }
    };

    const refreshDetail = async (classId: number) => {
        try {
            const detailResponse = await adminService.getClassDetail(classId);
            const classData = detailResponse.data || detailResponse;
            setSelectedClass(classData);
            setSelectedToRemove([]);
        } catch (e) { console.error(e); }
    };

    const handleAddStudents = async () => {
        if (selectedToAdd.length === 0) return;
        try {
            await adminService.addStudentsToClass(selectedClass.id, selectedToAdd);
            Swal.fire("Sukses", `${selectedToAdd.length} siswa ditambahkan!`, "success");
            setShowAddStudentModal(false);
            refreshDetail(selectedClass.id);
            fetchData();
        } catch (e) { Swal.fire("Gagal", "Error", "error"); }
    };

    const handleRemoveStudents = async () => {
        if (selectedToRemove.length === 0) return;
        if (!await Swal.fire({ title: 'Keluarkan Siswa?', text: 'Siswa akan menjadi tanpa kelas.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya' }).then(r => r.isConfirmed)) return;
        try {
            await adminService.removeStudentsFromClass(selectedClass.id, selectedToRemove);
            Swal.fire("Sukses", "Siswa dikeluarkan.", "success");
            refreshDetail(selectedClass.id);
            fetchData();
        } catch (e) { Swal.fire("Gagal", "Error", "error"); }
    };

    const toggleSelectToAdd = (id: number) => setSelectedToAdd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleSelectToRemove = (id: number) => setSelectedToRemove(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const fetchStudentsForModal = async (page: number, search: string) => {
        setLoadingStudents(true);
        try {
            const res = await adminService.getUsers({ role: 'student', page, limit: addStudentLimit, search });
            setStudentsForAdd(res.data);
            setTotalAddStudentPages(res.meta.totalPages);
            setAddStudentPage(page);
        } catch (e) { console.error(e); } finally { setLoadingStudents(false); }
    };

    useEffect(() => {
        if (showAddStudentModal) {
            const timer = setTimeout(() => fetchStudentsForModal(addStudentPage, searchStudent), 500); 
            return () => clearTimeout(timer);
        }
    }, [showAddStudentModal, addStudentPage, searchStudent]);

    const getAvailableTeachers = () => {
        const assignedTeacherIds = classes.map(c => c.teacher_id).filter(id => id !== null && id !== undefined);
        return teachers.filter(t => {
            if (isEdit && String(t.id) === String(formData.teacher_id)) return true;
            return !assignedTeacherIds.includes(t.id);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Validasi tambahan: Pastikan tahun yang disubmit = activeYear (karena form disabled)
            const targetYear = isGenerate ? generateData.academic_year : formData.academic_year;
            
            if (targetYear !== activeYear && !isEdit) {
               // Fallback: paksa ke activeYear jika create baru
               if(isGenerate) generateData.academic_year = activeYear;
               else formData.academic_year = activeYear;
            }

            if (isGenerate) { await adminService.generateClasses(generateData); Swal.fire("Sukses", "Generate berhasil!", "success"); } 
            else if (isEdit) { await adminService.updateClass(formData.id, formData); Swal.fire("Sukses", "Kelas diperbarui", "success"); } 
            else { await adminService.createClass(formData); Swal.fire("Sukses", "Kelas dibuat", "success"); }
            setShowModal(false);
            fetchData();
        } catch (error: any) { Swal.fire("Gagal", error.response?.data?.message, "error"); }
    };

    const handleDeleteClass = async (id: number) => {
        if (!await Swal.fire({ title: 'Hapus Kelas?', text: "Data tidak bisa kembali.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Hapus' }).then(r => r.isConfirmed)) return;
        try { await adminService.deleteClass(id); fetchData(); Swal.fire("Terhapus", "", "success"); } 
        catch (e) { Swal.fire("Gagal", "Error", "error"); }
    };

    // Helper Modals
    const handleOpenCreate = () => { setIsEdit(false); setIsGenerate(false); setFormData({ id: 0, name: '', teacher_id: '', kapasitas: 40, academic_year: activeYear }); setShowModal(true); };
    const handleOpenGenerate = () => { setIsGenerate(true); setGenerateData({ grade: '7', start: 'A', end: 'G', kapasitas: 40, academic_year: activeYear }); setShowModal(true); };
    const handleOpenEdit = (cls: any) => { setIsEdit(true); setIsGenerate(false); setFormData({ id: cls.id, name: cls.name, teacher_id: cls.teacher_id || '', kapasitas: cls.kapasitas || 40, academic_year: cls.academic_year }); setShowModal(true); };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen bg-gray-50">
            {/* HEADER */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        {/* STATUS SISTEM DIPERBAHARUI */}
                        <div className="mt-2 text-sm text-slate-500">
                            <span className="font-bold text-slate-600">Status TA:</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-black flex items-center gap-2 border border-indigo-200">
                                    <Calendar size={14}/> {activeYear}
                                </span>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-black flex items-center gap-2 border border-emerald-200">
                                    <Info size={14}/> Semester {activeSemester}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {/* TOMBOL "Atur T.A" DIHAPUS */}
                        
                        <button onClick={handleOpenGenerate} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-emerald-200 transition-all text-sm">
                            <Sparkles size={18}/> Auto-Generate
                        </button>
                        <button onClick={handleOpenCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all text-sm">
                            <Plus size={18}/> Buat Kelas
                        </button>
                    </div>
                </div>

                {/* FILTER & BATCH DELETE */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <div className="px-3 py-1.5 bg-white rounded-md shadow-sm border border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-600">
                                <Filter size={14} className="text-indigo-500"/>
                                Filter:
                            </div>
                            <select 
                                className="bg-transparent text-sm font-bold text-slate-700 outline-none px-2 cursor-pointer hover:text-indigo-600 min-w-[140px]"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                            >
                                <option value="active">Tahun Aktif</option>
                                <option value="all">Semua Tahun</option>
                                <optgroup label="Pilih Tahun">
                                    {availableYears.filter(y => y !== activeYear).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                type="text" 
                                placeholder="Cari nama kelas..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {filterYear !== 'all' && classes.length > 0 && (
                        <button onClick={handleBatchDelete} className="text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-lg text-xs font-bold border border-transparent hover:border-rose-200 transition-all flex items-center gap-2 whitespace-nowrap">
                            <Trash2 size={14}/> Hapus Semua Kelas {filterYear === 'active' ? activeYear : filterYear}
                        </button>
                    )}
                </div>
            </div>

            {/* GRID KELAS */}
            {loading ? (
                <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div></div>
            ) : (
                <>
                    {currentClasses.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4 text-slate-300"><BookOpen size={40}/></div>
                            <h3 className="text-slate-800 font-bold text-lg">Tidak ada kelas ditemukan</h3>
                            <p className="text-slate-500 text-sm mb-4">{filterYear === 'active' ? `Belum ada kelas untuk Tahun Ajaran ${activeYear}.` : 'Silakan ubah filter atau buat kelas baru.'}</p>
                            {filterYear === 'active' && <button onClick={handleOpenGenerate} className="text-indigo-600 font-bold hover:underline">+ Generate Kelas Sekarang</button>}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentClasses.map((cls) => (
                            <div key={cls.id} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1.5 ${cls.academic_year === activeYear ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-slate-300'}`}></div>
                                <div className="absolute top-4 right-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${cls.academic_year === activeYear ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        <Calendar size={10} /> {cls.academic_year}
                                    </span>
                                </div>
                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div><h2 className="text-2xl font-black text-slate-800">{cls.name}</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat {cls.name.charAt(0)}</p></div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm"><User size={16}/></div>
                                        <div className="flex-1 min-w-0"><p className="text-[10px] text-slate-400 font-bold uppercase">Wali Kelas</p><p className={`text-sm font-semibold truncate ${cls.teacher_name ? 'text-slate-700' : 'text-amber-500 italic'}`}>{cls.teacher_name || 'Belum Ditentukan'}</p></div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm"><GraduationCap size={16}/></div>
                                        <div><p className="text-[10px] text-slate-400 font-bold uppercase">Kuota Kelas</p><p className="text-sm font-bold text-slate-700">{cls.student_count} / <span className="text-slate-500">{cls.kapasitas || 40}</span> Siswa</p></div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => { refreshDetail(cls.id); setShowDetailModal(true); setStudentPage(1); }} className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-md"><Eye size={16}/> Lihat Daftar Siswa</button>
                                    <div className="flex gap-2 justify-end mt-1 pt-3 border-t border-slate-100">
                                        <button onClick={() => handleOpenEdit(cls)} className="px-3 py-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Edit size={14}/> Edit</button>
                                        <button onClick={() => handleDeleteClass(cls.id)} className="px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Trash2 size={14}/> Hapus</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-4">
                    <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="p-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeft size={20}/></button>
                    <span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-lg border">Hal {currentPage} dari {totalPages}</span>
                    <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="p-2 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRight size={20}/></button>
                </div>
            )}

            {/* --- MODAL DETAIL SISWA --- */}
            {showDetailModal && selectedClass && (
                <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
                            <div><h3 className="font-bold text-xl">Kelas {selectedClass.name} <span className="opacity-75 text-sm font-normal">({selectedClass.academic_year})</span></h3><p className="text-indigo-100 text-sm opacity-90">{selectedClass.students?.length || 0} Siswa Terdaftar</p></div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">{selectedToRemove.length > 0 && (<button onClick={handleRemoveStudents} className="flex items-center gap-2 px-3 py-1.5 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-200 transition-colors"><Trash2 size={14}/> Keluarkan ({selectedToRemove.length})</button>)}</div>
                            <button onClick={() => { setShowAddStudentModal(true); setSelectedToAdd([]); setSearchStudent(''); setAddStudentPage(1); }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"><UserPlus size={16}/> Tambah Siswa</button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                            {(!safeStudents.length) ? (<div className="flex flex-col items-center justify-center h-48 text-slate-400 italic"><BookOpen size={48} className="mb-2 opacity-20"/>Belum ada siswa di kelas ini.</div>) : (
                                <div className="space-y-2">{currentStudents.map((s: any) => (<div key={s.id} onClick={() => toggleSelectToRemove(s.id)} className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${selectedToRemove.includes(s.id) ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100 hover:border-indigo-200'}`}><div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedToRemove.includes(s.id) ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-300'}`}>{selectedToRemove.includes(s.id) && <CheckSquare size={14}/>}</div><div><p className={`font-bold text-sm ${selectedToRemove.includes(s.id) ? 'text-rose-700' : 'text-slate-800'}`}>{s.full_name}</p><p className="text-xs text-slate-500">{s.nisn || '-'}</p></div></div>))}</div>
                            )}
                        </div>
                        {totalStudentPages > 1 && (<div className="p-3 border-t border-slate-100 flex justify-center gap-4 bg-slate-50 rounded-b-2xl"><button disabled={studentPage===1} onClick={()=>setStudentPage(p=>p-1)} className="p-1.5 rounded bg-white border hover:bg-slate-100 disabled:opacity-50"><ChevronLeft size={16}/></button><span className="text-xs font-bold text-slate-600 flex items-center">Halaman {studentPage} / {totalStudentPages}</span><button disabled={studentPage===totalStudentPages} onClick={()=>setStudentPage(p=>p+1)} className="p-1.5 rounded bg-white border hover:bg-slate-100 disabled:opacity-50"><ChevronRight size={16}/></button></div>)}
                    </div>
                </div>
            )}

            {/* --- MODAL TAMBAH SISWA --- */}
            {showAddStudentModal && (
                <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Tambah Siswa ke {selectedClass?.name}</h3><button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
                        <div className="p-4 border-b border-slate-100 bg-slate-50"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="text" placeholder="Cari nama atau NISN..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={searchStudent} onChange={e => { setSearchStudent(e.target.value); setAddStudentPage(1); }} /></div><p className="text-xs text-slate-500 mt-2 ml-1">Menampilkan siswa yang tersedia.</p></div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loadingStudents ? (<div className="text-center py-8"><div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div></div>) : studentsForAdd.length === 0 ? (<div className="text-center py-8 text-slate-400 text-sm">Tidak ada siswa ditemukan.</div>) : (
                                <div className="space-y-2">{studentsForAdd.map(s => { const isAlreadyInThisClass = s.class_id === selectedClass?.id; return (<div key={s.id} onClick={() => !isAlreadyInThisClass && toggleSelectToAdd(s.id)} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isAlreadyInThisClass ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-300'} ${selectedToAdd.includes(s.id) ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200'}`}><div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedToAdd.includes(s.id) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'} ${isAlreadyInThisClass ? 'bg-slate-200' : ''}`}>{selectedToAdd.includes(s.id) && <CheckSquare size={14}/>}</div><div className="flex-1"><div className="flex justify-between items-start"><p className="text-sm font-bold text-slate-800">{s.full_name}</p>{s.class_name && (<span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${isAlreadyInThisClass ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{s.class_name}</span>)}</div><p className="text-xs text-slate-500">{s.nisn || 'No NISN'}</p></div></div>); })}</div>
                            )}
                        </div>
                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl"><button onClick={() => setShowAddStudentModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">Batal</button><button onClick={handleAddStudents} disabled={selectedToAdd.length === 0} className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">Tambahkan ({selectedToAdd.length})</button></div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREATE/EDIT/GENERATE --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform scale-100 transition-all">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">{isGenerate ? 'Generate Kelas Massal' : (isEdit ? 'Edit Kelas' : 'Buat Kelas Baru')}</h3><button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button></div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tahun Ajaran Target</label>
                                {/* INPUT TAHUN AJARAN - DISABLED & LOCKED TO ACTIVE YEAR */}
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full p-3 pl-10 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-bold cursor-not-allowed focus:ring-0" 
                                        value={isGenerate ? generateData.academic_year : formData.academic_year} 
                                        disabled 
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Calendar size={18} /></div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-600 bg-indigo-50 p-2 rounded-lg font-medium"><Info size={14}/><span>Tahun Ajaran Aktif Saat Ini: {activeYear} (Semester {activeSemester})</span></div>
                            </div>
                            {isGenerate ? (<><div className="grid grid-cols-3 gap-4"><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tingkat</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={generateData.grade} onChange={e=>setGenerateData({...generateData, grade:e.target.value})}>{['7','8','9'].map(g=><option key={g} value={g}>{g}</option>)}</select></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mulai</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={generateData.start} onChange={e=>setGenerateData({...generateData, start:e.target.value})}>{['A','B','C','D'].map(l=><option key={l} value={l}>{l}</option>)}</select></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sampai</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={generateData.end} onChange={e=>setGenerateData({...generateData, end:e.target.value})}>{['E','F','G','H'].map(l=><option key={l} value={l}>{l}</option>)}</select></div></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kuota Per Kelas</label><input type="number" min="1" required className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={generateData.kapasitas} onChange={e=>setGenerateData({...generateData, kapasitas: parseInt(e.target.value) || 0})} placeholder="40"/></div></>) : (<><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nama Kelas</label><input type="text" required className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} placeholder="Contoh: 7A"/></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kuota Siswa</label><input type="number" min="1" required className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" value={formData.kapasitas} onChange={e=>setFormData({...formData, kapasitas: parseInt(e.target.value) || 0})} placeholder="40"/></div><div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Wali Kelas</label><select className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" value={formData.teacher_id} onChange={e=>setFormData({...formData, teacher_id:e.target.value})}><option value="">-- Pilih Nanti --</option>{getAvailableTeachers().map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div></>)}
                            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex justify-center items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"><Save size={20}/> Simpan Data</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;