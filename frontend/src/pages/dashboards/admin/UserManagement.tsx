import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Trash2, ChevronLeft, ChevronRight, 
    GraduationCap, Briefcase, Heart, Users,
    LayoutDashboard, BrainCircuit, LogOut, Menu, X, Edit, BookOpen
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    
    // --- LAYOUT STATE ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // --- DATA STATE ---
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({
        role: 'all',
        class: 'all',
        search: '',
        limit: 6
    });

    const roles = [
        { value: 'student', label: 'Siswa' },
        { value: 'teacher', label: 'Guru' },
        { value: 'parent', label: 'Orang Tua' },
        { value: 'contributor', label: 'Kontributor' }
    ];

    const classes = ['7A', '7B', '8A', '8B', '9A', '9B'];

    // --- HANDLERS ---

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({ ...filters, page });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, [filters]); 

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus User?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!'
        });

        if (result.isConfirmed) {
            try {
                await adminService.deleteUser(id);
                Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success');
                fetchUsers(meta.page);
            } catch (error) {
                Swal.fire('Gagal', 'Terjadi kesalahan.', 'error');
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'student': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><GraduationCap size={12}/> Siswa</span>;
            case 'teacher': return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Briefcase size={12}/> Guru</span>;
            case 'parent': return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Heart size={12}/> Orang Tua</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Users size={12}/> {role}</span>;
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

                {/* Navigasi Menu */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <LayoutDashboard size={20}/> <span>Dashboard Utama</span>
                    </button>
                    <button onClick={() => navigate('/admin/analysis')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <BrainCircuit size={20}/> <span>Sintesis AI</span>
                    </button>
                    {/* Menu Aktif */}
                    <button onClick={() => navigate('/admin/users')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-medium transition-all">
                        <Users size={20}/> <span>Manajemen User</span>
                    </button>
                    <button onClick={() => navigate('/admin/classes')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-medium">
                        <BookOpen size={20}/> <span>Manajemen Kelas</span>
                    </button>
                </nav>

                {/* Footer Sidebar (Profil & Logout - KONSISTEN) */}
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
                
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <img src="/logo-smpn6.png" className="w-8 h-8" alt="Logo" />
                        <span className="font-bold text-gray-800">ISOKURIKULER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600"><Menu size={24} /></button>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto pb-20">
                        
                        {/* Header Halaman */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in">
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">Manajemen Pengguna</h1>
                                <p className="text-slate-500 text-sm">Kelola data seluruh civitas akademika.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/admin/users/new')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all"
                            >
                                <Plus size={18}/> Tambah User
                            </button>
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center animate-fade-in">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
                                <input 
                                    type="text" 
                                    placeholder="Cari Nama, NISN, atau Email..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                                <select 
                                    className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 outline-none"
                                    value={filters.role}
                                    onChange={(e) => setFilters({...filters, role: e.target.value})}
                                >
                                    <option value="all">Semua Role</option>
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                
                                {(filters.role === 'all' || filters.role === 'student' || filters.role === 'teacher') && (
                                    <select 
                                        className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 outline-none"
                                        value={filters.class}
                                        onChange={(e) => setFilters({...filters, class: e.target.value})}
                                    >
                                        <option value="all">Semua Kelas</option>
                                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* USER GRID */}
                        {loading ? (
                            <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                                {users.map((user) => (
                                    <div key={user.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all relative group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                                                    {user.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 line-clamp-1">{user.full_name}</h3>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            {getRoleBadge(user.role)}
                                        </div>

                                        <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl">
                                            {user.role === 'student' && (
                                                <>
                                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Kelas:</span> <span className="font-bold text-slate-700">{user.class || '-'}</span></div>
                                                    <div className="flex justify-between text-xs"><span className="text-slate-500">NISN:</span> <span className="font-bold text-slate-700">{user.nisn || '-'}</span></div>
                                                </>
                                            )}
                                            {user.role === 'teacher' && (
                                                <>
                                                    <div className="flex justify-between text-xs"><span className="text-slate-500">NIP:</span> <span className="font-bold text-slate-700">{user.nip || '-'}</span></div>
                                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Wali Kelas:</span> <span className="font-bold text-slate-700">{user.class ? user.class : 'Tidak'}</span></div>
                                                </>
                                            )}
                                            {user.role === 'parent' && (
                                                <div className="text-xs">
                                                    <span className="text-slate-500 block mb-1">Orang Tua dari:</span> 
                                                    <span className="font-bold text-indigo-600 line-clamp-2">{user.children_names || 'Belum ditautkan'}</span>
                                                </div>
                                            )}
                                            {user.role === 'contributor' && (
                                                <div className="text-xs text-slate-500 italic">Kontributor Eksternal</div>
                                            )}
                                        </div>

                                        <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                                            <button onClick={() => navigate(`/admin/users/${user.id}`)} className="flex-1 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1">
                                                <Edit size={14}/> Edit
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && users.length > 0 && (
                            <div className="flex justify-between items-center mt-8 bg-white p-3 rounded-xl border border-slate-200">
                                <button 
                                    disabled={meta.page === 1}
                                    onClick={() => fetchUsers(meta.page - 1)}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft size={20}/>
                                </button>
                                <span className="text-sm font-bold text-slate-600">Halaman {meta.page} dari {meta.totalPages}</span>
                                <button 
                                    disabled={meta.page === meta.totalPages}
                                    onClick={() => fetchUsers(meta.page + 1)}
                                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight size={20}/>
                                </button>
                            </div>
                        )}
                        {!loading && users.length === 0 && (
                            <div className="text-center py-10 text-slate-400">Tidak ada data ditemukan.</div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManagement;