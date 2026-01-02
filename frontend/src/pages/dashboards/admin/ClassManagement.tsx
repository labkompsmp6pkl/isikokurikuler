import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, LogOut, 
    Plus, Trash2, Edit, Save, X, Eye, BookOpen, User, GraduationCap, Sparkles, Database, Menu, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const ClassManagement: React.FC = () => {
    const navigate = useNavigate();
    
    // --- LAYOUT & DATA STATE ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    // --- FILTER & PAGINATION STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [isGenerate, setIsGenerate] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ id: 0, name: '', teacher_id: '' });
    const [generateData, setGenerateData] = useState({ grade: '7', start: 'A', end: 'G' });
    const [selectedClass, setSelectedClass] = useState<any>(null);

    // --- HANDLERS ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

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

    const handleFixDatabase = async () => {
        const result = await Swal.fire({
            title: 'Inisialisasi Database?',
            text: "Sistem akan membuat tabel kelas dan memindahkan data siswa/guru yang sudah ada secara otomatis.",
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses Sekarang',
            confirmButtonColor: '#10B981'
        });

        if (result.isConfirmed) {
            try {
                await adminService.setupClassDatabase();
                Swal.fire('Berhasil!', 'Database kelas siap digunakan.', 'success');
                fetchData();
            } catch (error) {
                Swal.fire('Gagal', 'Tidak dapat memproses database.', 'error');
            }
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- LOGIKA FILTER & PAGINATION ---
    const filteredClasses = classes.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentClasses = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);

    // Reset ke halaman 1 jika user melakukan pencarian
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const getAvailableTeachers = () => {
        const assignedTeacherIds = classes
            .map(c => c.teacher_id)
            .filter(id => id !== null && id !== undefined);

        return teachers.filter(t => {
            if (isEdit && t.id === formData.teacher_id) return true;
            return !assignedTeacherIds.includes(t.id);
        });
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
                Swal.fire("Sukses", "Kelas berhasil diperbarui", "success");
            } else {
                await adminService.createClass(formData);
                Swal.fire("Sukses", "Kelas berhasil dibuat", "success");
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
            text: "Data kelas akan dihapus.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        });
        if (result.isConfirmed) {
            try {
                await adminService.deleteClass(id);
                fetchData();
                Swal.fire("Terhapus", "", "success");
            } catch (e) { Swal.fire("Gagal", "Tidak bisa menghapus kelas", "error"); }
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] font-sans flex text-gray-800">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 font-medium transition-all">
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 font-medium transition-all">
                        <Users size={20}/> Manajemen User
                    </button>
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg font-medium transition-all">
                        <BookOpen size={20}/> Manajemen Kelas
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-gray-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto pb-20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Kelas</h1>
                                <p className="text-slate-500 text-sm font-medium">Kelola data kelas, wali kelas, dan daftar siswa per kelas.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setIsGenerate(true); setShowModal(true); }} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                    <Sparkles size={18}/> Auto-Generate
                                </button>
                                <button onClick={() => { setIsEdit(false); setIsGenerate(false); setFormData({ id: 0, name: '', teacher_id: '' }); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                    <Plus size={18}/> Tambah Kelas
                                </button>
                            </div>
                        </div>

                        {/* FILTER & SEARCH BAR */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
                            <Search className="text-slate-400" size={22}/>
                            <input 
                                type="text" 
                                placeholder="Cari nama kelas (contoh: 7A)..." 
                                className="flex-1 outline-none font-medium text-slate-700 placeholder-slate-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {dbError ? (
                            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><Database size={20}/> Database Belum Siap</h3>
                                    <p className="text-red-600 text-sm mt-1">Lakukan migrasi untuk mengaktifkan fitur Class ID Relational.</p>
                                </div>
                                <button onClick={handleFixDatabase} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center gap-2">
                                    <Sparkles size={18}/> Migrasi Sekarang
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div></div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentClasses.map((cls) => (
                                        <div key={cls.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-indigo-50 text-indigo-700 font-black text-2xl px-5 py-2.5 rounded-2xl">
                                                    {cls.name}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setIsEdit(true); setIsGenerate(false); setFormData({ id: cls.id, name: cls.name, teacher_id: cls.teacher_id || '' }); setShowModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18}/></button>
                                                    <button onClick={() => handleDelete(cls.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 text-sm text-slate-600 mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><User size={16} className="text-slate-400"/></div>
                                                    <span>Wali: <span className={`font-bold ${cls.teacher_name ? 'text-slate-800' : 'text-amber-600 italic'}`}>{cls.teacher_name || 'Belum Ada'}</span></span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><GraduationCap size={16} className="text-slate-400"/></div>
                                                    <span>Siswa: <span className="font-bold text-slate-800">{cls.student_count} Anak</span></span>
                                                </div>
                                            </div>

                                            <button onClick={async () => { const data = await adminService.getClassDetail(cls.id); setSelectedClass(data); setShowDetailModal(true); }} className="w-full py-3 bg-slate-900 text-white font-black rounded-2xl text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100 uppercase tracking-widest">
                                                <Eye size={16}/> Detail Siswa
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* PAGINATION CONTROLS */}
                                {totalPages > 1 && (
                                    <div className="mt-12 flex justify-center items-center gap-6">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all text-indigo-600"
                                        >
                                            <ChevronLeft size={24}/>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black shadow-lg shadow-indigo-100">{currentPage}</span>
                                            <span className="text-slate-400 font-bold">/</span>
                                            <span className="text-slate-600 font-bold">{totalPages}</span>
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="p-3 rounded-2xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-all text-indigo-600"
                                        >
                                            <ChevronRight size={24}/>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {!loading && filteredClasses.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                                <BookOpen size={48} className="mx-auto text-slate-200 mb-4"/>
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Tidak ada kelas ditemukan</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL (Create/Edit/Generate) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">
                                {isGenerate ? 'Gen Kelas' : (isEdit ? 'Update Kelas' : 'Kelas Baru')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isGenerate ? (
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Tingkat</label>
                                        <select value={generateData.grade} onChange={e => setGenerateData({...generateData, grade: e.target.value})} className="w-full p-3.5 border rounded-xl font-bold bg-slate-50">
                                            {['7','8','9'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Dari</label>
                                        <select value={generateData.start} onChange={e => setGenerateData({...generateData, start: e.target.value})} className="w-full p-3.5 border rounded-xl font-bold bg-slate-50">
                                            {['A','B','C','D','E','F','G'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sampai</label>
                                        <select value={generateData.end} onChange={e => setGenerateData({...generateData, end: e.target.value})} className="w-full p-3.5 border rounded-xl font-bold bg-slate-50">
                                            {['E','F','G','H','I','J'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Nama Kelas</label>
                                        <input type="text" required placeholder="Contoh: 7A" className="w-full p-4 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Pilih Wali Kelas (Opsional)</label>
                                        <select 
                                            className="w-full p-4 border border-slate-200 rounded-2xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" 
                                            value={formData.teacher_id} 
                                            onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                                        >
                                            <option value="">-- Kosongkan / Pilih Nanti --</option>
                                            {getAvailableTeachers().map(t => (
                                                <option key={t.id} value={t.id}>{t.full_name}</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-slate-400 mt-2 italic px-1">* Hanya menampilkan guru yang belum ditugaskan.</p>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex justify-center items-center gap-2 uppercase tracking-widest text-sm">
                                <Save size={20}/> SIMPAN DATA
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL SISWA */}
            {showDetailModal && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="font-black text-3xl">Kelas {selectedClass.name}</h3>
                                <p className="text-indigo-100 font-medium mt-1">Wali Kelas: {selectedClass.teacher_name || 'Tidak Ada'}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-3 hover:bg-white/20 rounded-full transition-colors"><X size={28}/></button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-black text-slate-800 text-xl tracking-tight flex items-center gap-3">
                                    <Users size={24} className="text-indigo-600"/> 
                                    DAFTAR SISWA ({selectedClass.students.length})
                                </h4>
                            </div>
                            {selectedClass.students.length === 0 ? (
                                <div className="text-center py-12">
                                    <GraduationCap size={48} className="mx-auto text-slate-200 mb-4" />
                                    <p className="text-slate-400 font-medium italic">Belum ada siswa yang ditautkan ke kelas ini.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedClass.students.map((s: any) => (
                                        <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all group">
                                            <div>
                                                <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors text-lg leading-none">{s.full_name}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NISN: {s.nisn || '-'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{s.email}</span>
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