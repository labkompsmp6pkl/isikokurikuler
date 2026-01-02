import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Users, BrainCircuit, LogOut, 
    Plus, Trash2, Edit, Save, X, Eye, BookOpen, User, GraduationCap, Sparkles, Database, Menu
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const ClassManagement: React.FC = () => {
    const navigate = useNavigate();
    
    // --- LAYOUT STATE (Fixed) ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Data State
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

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

    const openCreate = () => { setIsEdit(false); setIsGenerate(false); setFormData({ id: 0, name: '', teacher_id: '' }); setShowModal(true); };
    const openGenerate = () => { setIsGenerate(true); setShowModal(true); };
    const openEdit = (cls: any) => { 
        setIsEdit(true); 
        setIsGenerate(false);
        setFormData({ id: cls.id, name: cls.name, teacher_id: cls.teacher_id || '' }); 
        setShowModal(true); 
    };
    
    const openDetail = async (clsId: number) => {
        try {
            const data = await adminService.getClassDetail(clsId);
            setSelectedClass(data);
            setShowDetailModal(true);
        } catch (error) {
            Swal.fire("Error", "Gagal memuat detail kelas", "error");
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
            
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            {/* --- SIDEBAR --- */}
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                
                {/* Header Sidebar */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-gray-500 font-bold tracking-widest">ADMINISTRATOR</p>
                        </div>
                    </div>
                    {/* Tombol Close Mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-red-500"><X size={24} /></button>
                </div>

                {/* Navigasi */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all">
                        <LayoutDashboard size={20}/> <span>Dashboard Utama</span>
                    </button>
                    <button onClick={() => navigate('/admin/analysis')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all">
                        <BrainCircuit size={20}/> <span>Sintesis AI</span>
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition-all">
                        <Users size={20}/> <span>Manajemen User</span>
                    </button>
                    {/* Menu Aktif */}
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-medium transition-all">
                        <BookOpen size={20}/> <span>Manajemen Kelas</span>
                    </button>
                </nav>

                {/* Footer Sidebar (Profil & Logout) */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 shadow-md shadow-indigo-200">
                            A
                        </div>
                        <h2 className="font-bold text-slate-800 text-base">Administrator</h2>
                        <p className="text-xs text-slate-500 font-medium mb-5">Super User</p>
                        <button 
                            onClick={handleLogout} 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                        >
                            <LogOut size={16} /> Keluar
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                
                {/* Mobile Header (Navbar) */}
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
                                <h1 className="text-2xl font-black text-slate-800">Manajemen Kelas</h1>
                                <p className="text-slate-500 text-sm">Atur data kelas, wali kelas, dan siswa.</p>
                            </div>
                            
                            {!dbError && !loading && (
                                <div className="flex gap-2">
                                    <button onClick={openGenerate} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                        <Sparkles size={18}/> Generate Otomatis
                                    </button>
                                    <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                        <Plus size={18}/> Tambah Kelas
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ERROR HANDLING JIKA TABEL BELUM ADA */}
                        {dbError ? (
                            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2"><Database size={20}/> Database Kelas Belum Dikonfigurasi</h3>
                                    <p className="text-red-600 text-sm mt-1">
                                        Tabel kelas belum ditemukan. Klik tombol di samping untuk membuat tabel dan memindahkan data siswa/guru yang sudah ada secara otomatis.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleFixDatabase}
                                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center gap-2"
                                >
                                    <Sparkles size={18}/> Perbaiki & Migrasi Data Sekarang
                                </button>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classes.map((cls) => (
                                    <div key={cls.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-indigo-50 text-indigo-700 font-black text-xl px-4 py-2 rounded-xl">
                                                {cls.name}
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => openEdit(cls)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit size={16}/></button>
                                                <button onClick={() => handleDelete(cls.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 text-sm text-slate-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-slate-400"/>
                                                <span>Wali Kelas: <span className="font-bold text-slate-800">{cls.teacher_name || 'Belum ada'}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap size={16} className="text-slate-400"/>
                                                <span>Total Siswa: <span className="font-bold text-slate-800">{cls.student_count}</span></span>
                                            </div>
                                        </div>

                                        <button onClick={() => openDetail(cls.id)} className="w-full py-2 bg-slate-50 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-100 flex items-center justify-center gap-2">
                                            <Eye size={14}/> Lihat Daftar Siswa
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* MODAL (Create/Edit/Generate) */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-xl text-slate-800">
                                {isGenerate ? 'Generate Kelas Otomatis' : (isEdit ? 'Edit Kelas' : 'Tambah Kelas Baru')}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isGenerate ? (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tingkat</label>
                                        <select value={generateData.grade} onChange={e => setGenerateData({...generateData, grade: e.target.value})} className="w-full p-3 border rounded-xl font-bold">
                                            {['7','8','9'].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dari Huruf</label>
                                        <select value={generateData.start} onChange={e => setGenerateData({...generateData, start: e.target.value})} className="w-full p-3 border rounded-xl font-bold">
                                            {['A','B','C','D','E','F','G'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sampai</label>
                                        <select value={generateData.end} onChange={e => setGenerateData({...generateData, end: e.target.value})} className="w-full p-3 border rounded-xl font-bold">
                                            {['A','B','C','D','E','F','G','H','I','J'].map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Kelas</label>
                                        <input type="text" required placeholder="Contoh: 7A" className="w-full p-3 border rounded-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wali Kelas</label>
                                        <select className="w-full p-3 border rounded-xl bg-white" value={formData.teacher_id} onChange={e => setFormData({...formData, teacher_id: e.target.value})}>
                                            <option value="">-- Pilih Guru --</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 mt-4 flex justify-center items-center gap-2">
                                <Save size={18}/> {isGenerate ? 'Generate Sekarang' : 'Simpan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL SISWA */}
            {showDetailModal && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <div>
                                <h3 className="font-black text-xl text-slate-800">Kelas {selectedClass.name}</h3>
                                <p className="text-sm text-slate-500">Wali Kelas: {selectedClass.teacher_name || '-'}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Users size={18}/> Daftar Siswa ({selectedClass.students.length})</h4>
                            {selectedClass.students.length === 0 ? (
                                <p className="text-slate-400 italic text-center py-4">Belum ada siswa di kelas ini.</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedClass.students.map((s: any) => (
                                        <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="font-bold text-slate-800">{s.full_name}</p>
                                                <p className="text-xs text-slate-500">{s.nisn}</p>
                                            </div>
                                            <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">{s.email}</span>
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