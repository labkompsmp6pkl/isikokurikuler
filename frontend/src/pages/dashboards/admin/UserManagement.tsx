import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Trash2, ChevronLeft, ChevronRight, 
    GraduationCap, Briefcase, Heart, Users,
    LayoutDashboard, LogOut, Menu, X, Edit, BookOpen,
    Mail, Hash, Phone
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    
    // --- LAYOUT & UI STATE ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- DATA STATE ---
    const [users, setUsers] = useState<any[]>([]);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({
        role: 'all',
        class_id: 'all', // Sekarang menyimpan ID kelas (integer atau 'all')
        search: '',
        limit: 6
    });

    const roles = [
        { value: 'student', label: 'Siswa' },
        { value: 'teacher', label: 'Guru' },
        { value: 'parent', label: 'Orang Tua' },
        { value: 'contributor', label: 'Kontributor' },
        { value: 'admin', label: 'Administrator' }
    ];

    // --- INITIAL FETCH ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // 1. Ambil daftar kelas dari database (berisi id dan name)
                const classRes = await adminService.getClasses();
                setAvailableClasses(classRes);
                
                // 2. Ambil data user pertama kali
                fetchUsers(1);
            } catch (error) {
                console.error("Initialization Error:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Fetch users saat filter berubah
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers(1);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.role, filters.class_id]);

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            // Pastikan mengirim parameter class_id ke API
            const res = await adminService.getUsers({ ...filters, page });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (error) {
            console.error("Fetch Users Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Pengguna?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await adminService.deleteUser(id);
                Swal.fire('Terhapus!', 'Pengguna berhasil dihapus.', 'success');
                fetchUsers(meta.page);
            } catch (error) {
                Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'student': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><GraduationCap size={12}/> Siswa</span>;
            case 'teacher': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><Briefcase size={12}/> Guru</span>;
            case 'parent': return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><Heart size={12}/> Orang Tua</span>;
            case 'admin': return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><Users size={12}/> Admin</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1">{role}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-800">
            {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
            
            <aside className={`fixed md:sticky top-0 h-screen w-72 bg-white border-r border-slate-200 z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo-smpn6.png" className="w-9 h-9" alt="Logo" />
                        <div>
                            <h1 className="font-black text-lg text-indigo-900 leading-tight">ISIKOKURIKULER</h1>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Admin Panel</p>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><X size={24} /></button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all font-bold text-sm">
                        <LayoutDashboard size={20}/> Dashboard
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-bold text-sm">
                        <Users size={20}/> Manajemen User
                    </button>
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all font-bold text-sm">
                        <BookOpen size={20}/> Manajemen Kelas
                    </button>
                </nav>

                <div className="p-6 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-black text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all">
                        <LogOut size={18} /> Keluar Aplikasi
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-black text-slate-800 text-xs">ISIKOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
                                <p className="text-slate-500 font-medium">Kelola akses dan data berdasarkan Class ID relasional.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/admin/users/new')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                            >
                                <Plus size={20}/> Tambah User
                            </button>
                        </div>

                        {/* FILTER BAR - Sinkronisasi dengan Class ID */}
                        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm mb-8 flex flex-col lg:flex-row gap-4 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-4 top-3.5 text-slate-400" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="Cari nama, NISN, atau email..." 
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
                                <select 
                                    className="bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl text-xs font-black text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                                    value={filters.role}
                                    onChange={(e) => setFilters({...filters, role: e.target.value, class_id: 'all'})}
                                >
                                    <option value="all">Semua Role</option>
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                
                                {/* Dropdown Filter Kelas menggunakan ID */}
                                {(filters.role === 'all' || filters.role === 'student' || filters.role === 'teacher') && (
                                    <select 
                                        className="bg-slate-50 border border-slate-100 px-5 py-3.5 rounded-2xl text-xs font-black text-slate-600 outline-none uppercase tracking-wider cursor-pointer"
                                        value={filters.class_id}
                                        onChange={(e) => setFilters({...filters, class_id: e.target.value})}
                                    >
                                        <option value="all">Semua Kelas</option>
                                        {availableClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600 mb-4"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Menghubungkan Database...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.map((u) => (
                                    <div key={u.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 hover:shadow-xl transition-all relative group flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-lg">
                                                        {u.full_name.charAt(0)}
                                                    </div>
                                                    <div className="max-w-[140px]">
                                                        <h3 className="font-black text-slate-800 truncate text-base leading-tight">{u.full_name}</h3>
                                                        <div className="flex items-center gap-1 text-slate-400 mt-1">
                                                            <Mail size={12}/>
                                                            <p className="text-[10px] font-medium truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {getRoleBadge(u.role)}
                                            </div>

                                            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                {/* Tampilan informasi kelas berdasarkan JOIN class_name dari backend */}
                                                {(u.role === 'student' || u.role === 'teacher') && (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                            <BookOpen size={12}/> 
                                                            {u.role === 'teacher' ? 'Wali Kelas' : 'Kelas'}
                                                        </span> 
                                                        {/* class_name didapat dari hasil JOIN di backend */}
                                                        <span className="font-black text-indigo-600">
                                                            {u.class_name || (u.class_id ? `ID: ${u.class_id}` : 'Tidak Ada')}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {u.role === 'student' && (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Hash size={12}/> NISN</span> 
                                                        <span className="font-black text-slate-700">{u.nisn || '-'}</span>
                                                    </div>
                                                )}

                                                {u.role === 'teacher' && (
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Hash size={12}/> NIP</span> 
                                                        <span className="font-black text-slate-700">{u.nip || '-'}</span>
                                                    </div>
                                                )}

                                                {u.role === 'parent' && (
                                                    <div className="text-xs">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter block mb-2">Orang Tua dari:</span> 
                                                        <span className="font-black text-slate-700 line-clamp-2 leading-snug">{u.children_names || 'Belum ditautkan'}</span>
                                                    </div>
                                                )}

                                                {u.whatsapp_number && (
                                                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 mt-1">
                                                        <span className="text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1"><Phone size={12}/> WA</span> 
                                                        <span className="font-black text-slate-700">{u.whatsapp_number}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => navigate(`/admin/users/${u.id}`)} 
                                                className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit size={14}/> EDIT DATA
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(u.id)} 
                                                className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-100"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* PAGINATION */}
                        {!loading && users.length > 0 && (
                            <div className="flex flex-col md:flex-row justify-between items-center mt-12 gap-4">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    Menampilkan {users.length} dari {meta.total} pengguna
                                </p>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                    <button 
                                        disabled={meta.page === 1}
                                        onClick={() => fetchUsers(meta.page - 1)}
                                        className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-600"
                                    >
                                        <ChevronLeft size={20}/>
                                    </button>
                                    <div className="flex gap-1 px-2">
                                        <span className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black text-sm shadow-lg shadow-indigo-100">
                                            {meta.page}
                                        </span>
                                        <span className="text-slate-300 w-10 h-10 flex items-center justify-center font-bold text-sm italic">
                                            / {meta.totalPages}
                                        </span>
                                    </div>
                                    <button 
                                        disabled={meta.page === meta.totalPages}
                                        onClick={() => fetchUsers(meta.page + 1)}
                                        className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-600"
                                    >
                                        <ChevronRight size={20}/>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {!loading && users.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                                <Users size={48} className="mx-auto text-slate-200 mb-4"/>
                                <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Tidak ada pengguna ditemukan</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManagement;