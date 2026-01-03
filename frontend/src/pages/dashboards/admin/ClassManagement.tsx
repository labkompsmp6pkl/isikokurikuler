import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit, Save, X, Eye, BookOpen, User, 
    GraduationCap, Sparkles, Database, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const ClassManagement: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    // Filter & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isGenerate, setIsGenerate] = useState(false);

    // Forms
    const [formData, setFormData] = useState({ id: 0, name: '', teacher_id: '' });
    const [generateData, setGenerateData] = useState({ grade: '7', start: 'A', end: 'G' });
    const [selectedClass, setSelectedClass] = useState<any>(null);

    // --- DATA FETCHING ---
    const fetchData = async () => {
        setLoading(true);
        setDbError(false);
        try {
            const [classesData, teachersData] = await Promise.all([
                adminService.getClasses(),
                adminService.getTeachersList()
            ]);
            setClasses(classesData);
            setTeachers(teachersData);
        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.code === 'NO_TABLE') {
                setDbError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIC: PAGINATION & FILTER ---
    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

    const getAvailableTeachers = () => {
        const assignedTeacherIds = classes
            .map(c => c.teacher_id)
            .filter(id => id !== null && id !== undefined);

        return teachers.filter(t => {
            if (isEdit && t.id === formData.teacher_id) return true;
            return !assignedTeacherIds.includes(t.id);
        });
    };

    // --- HANDLERS ---
    const handleFixDatabase = async () => {
        const result = await Swal.fire({
            title: 'Inisialisasi Database?',
            text: "Sistem akan membuat tabel kelas otomatis.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Proses',
            confirmButtonColor: '#4F46E5'
        });

        if (result.isConfirmed) {
            try {
                await adminService.setupClassDatabase();
                Swal.fire('Berhasil!', 'Database siap.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Gagal', 'Error memproses database.', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isGenerate) {
                await adminService.generateClasses({ 
                    grade: generateData.grade, 
                    startLetter: generateData.start, 
                    endLetter: generateData.end 
                });
                Swal.fire("Sukses", "Kelas berhasil digenerate!", "success");
            } else if (isEdit) {
                await adminService.updateClass(formData.id, formData);
                Swal.fire("Sukses", "Kelas diperbarui", "success");
            } else {
                await adminService.createClass(formData);
                Swal.fire("Sukses", "Kelas dibuat", "success");
            }
            setShowModal(false);
            fetchData();
        } catch (error: any) {
            Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Kelas?',
            text: "Data tidak bisa dikembalikan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'Hapus'
        });
        if (result.isConfirmed) {
            try {
                await adminService.deleteClass(id);
                fetchData();
                Swal.fire("Terhapus", "", "success");
            } catch (e) { Swal.fire("Gagal", "Error menghapus kelas", "error"); }
        }
    };

    // --- RENDER ---
    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex gap-3">
                    <button 
                        onClick={() => { setIsGenerate(true); setShowModal(true); }} 
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all border border-emerald-200"
                    >
                        <Sparkles size={18}/> 
                        <span className="hidden md:inline">Auto-Generate</span>
                    </button>
                    <button 
                        onClick={() => { setIsEdit(false); setIsGenerate(false); setFormData({ id: 0, name: '', teacher_id: '' }); setShowModal(true); }} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                    >
                        <Plus size={18}/> Tambah Kelas
                    </button>
                </div>
            </div>

            {/* SEARCH & ERROR HANDLING */}
            <div className="mb-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                        type="text" 
                        placeholder="Cari kelas (contoh: 7A)..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {dbError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Database className="text-red-500" size={24}/>
                        <div>
                            <h3 className="font-bold text-red-700">Database Belum Siap</h3>
                            <p className="text-red-600 text-sm">Tabel kelas belum ditemukan di database.</p>
                        </div>
                    </div>
                    <button onClick={handleFixDatabase} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm">
                        Perbaiki Sekarang
                    </button>
                </div>
            )}

            {/* MAIN CONTENT GRID */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-3"/>
                    <p className="text-slate-500 font-medium">Tidak ada data kelas ditemukan.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentClasses.map((cls) => (
                            <div key={cls.id} className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                                {/* Decorative top accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                                <div className="flex justify-between items-start mb-4 mt-2">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800">{cls.name}</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat {cls.name.charAt(0)}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setIsEdit(true); setIsGenerate(false); setFormData({ id: cls.id, name: cls.name, teacher_id: cls.teacher_id || '' }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(cls.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500"><User size={16}/></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Wali Kelas</p>
                                            <p className={`text-sm font-semibold truncate ${cls.teacher_name ? 'text-slate-700' : 'text-amber-500 italic'}`}>
                                                {cls.teacher_name || 'Belum Ditentukan'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500"><GraduationCap size={16}/></div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Siswa</p>
                                            <p className="text-sm font-bold text-slate-700">{cls.student_count} Siswa</p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={async () => { 
                                        const data = await adminService.getClassDetail(cls.id); 
                                        setSelectedClass(data); 
                                        setShowDetailModal(true); 
                                    }} 
                                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye size={16}/> Lihat Detail Siswa
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="mt-10 flex justify-center items-center gap-4">
                            <button 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent text-slate-600"
                            >
                                <ChevronLeft size={20}/>
                            </button>
                            <span className="text-sm font-medium text-slate-600">
                                Halaman <span className="font-bold text-indigo-600">{currentPage}</span> dari {totalPages}
                            </span>
                            <button 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent text-slate-600"
                            >
                                <ChevronRight size={20}/>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* MODAL INPUT/GENERATE */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">
                                {isGenerate ? 'Generate Kelas Otomatis' : (isEdit ? 'Edit Data Kelas' : 'Tambah Kelas Baru')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {isGenerate ? (
                                <div className="grid grid-cols-3 gap-4">
                                    {['grade', 'start', 'end'].map((field, idx) => (
                                        <div key={idx}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                {field === 'grade' ? 'Tingkat' : (field === 'start' ? 'Dari Huruf' : 'Sampai')}
                                            </label>
                                            <select 
                                                value={generateData[field as keyof typeof generateData]} 
                                                onChange={e => setGenerateData({...generateData, [field]: e.target.value})} 
                                                className="w-full p-2.5 border border-slate-200 rounded-lg font-semibold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                {field === 'grade' 
                                                    ? ['7','8','9'].map(g => <option key={g} value={g}>{g}</option>)
                                                    : ['A','B','C','D','E','F','G','H','I'].map(l => <option key={l} value={l}>{l}</option>)
                                                }
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Kelas</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Contoh: 7A" 
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wali Kelas</label>
                                        <select 
                                            className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={formData.teacher_id} 
                                            onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                                        >
                                            <option value="">-- Pilih Nanti --</option>
                                            {getAvailableTeachers().map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all flex justify-center items-center gap-2">
                                <Save size={18}/> {isGenerate ? 'Generate Sekarang' : 'Simpan Data'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL SISWA */}
            {showDetailModal && selectedClass && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-xl">Daftar Siswa Kelas {selectedClass.name}</h3>
                                <p className="text-indigo-100 text-sm opacity-90 mt-0.5">Wali Kelas: {selectedClass.teacher_name || '-'}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {selectedClass.students.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 italic">Belum ada siswa di kelas ini.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedClass.students.map((s: any, idx: number) => (
                                        <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{s.full_name}</p>
                                                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                                    <span>NISN: <span className="font-mono text-slate-700">{s.nisn || '-'}</span></span>
                                                    <span>•</span>
                                                    <span>{s.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;