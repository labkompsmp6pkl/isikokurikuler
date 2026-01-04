import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Trash2, ChevronLeft, ChevronRight, 
    GraduationCap, Briefcase, 
    Mail, Hash, Phone, BookOpen, Edit, Sparkles, Save, ArrowLeft, User, Key, Filter, Shield
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

// --- TIPE DATA ---
interface UserFormState {
    full_name: string;
    email: string;
    role: string;
    class_id: string | number;
    nisn?: string;
    nip?: string;
    whatsapp_number?: string;
    password?: string;
}

const UserManagement: React.FC = () => {
    // --- STATE UTAMA ---
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    // --- STATE DATA ---
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    // --- FORM STATE ---
    const initialForm: UserFormState = { 
        full_name: '', email: '', role: 'student', class_id: '', 
        nisn: '', nip: '', whatsapp_number: '', password: '' 
    };
    const [formData, setFormData] = useState<UserFormState>(initialForm);

    // --- FILTER STATE ---
    const [filters, setFilters] = useState({ role: 'all', class_id: 'all', search: '', limit: 6 });

    const roles = [
        { value: 'student', label: 'Siswa' },
        { value: 'teacher', label: 'Guru' },
        { value: 'parent', label: 'Orang Tua' },
        { value: 'contributor', label: 'Kontributor' },
        { value: 'admin', label: 'Administrator' }
    ];

    // --- INITIAL FETCH ---
    useEffect(() => {
        const initData = async () => {
            try {
                // Mengambil data kelas lengkap (termasuk info wali kelas)
                const response = await adminService.getClasses();
                
                let classesData = [];
                if (Array.isArray(response)) {
                    classesData = response;
                } else if (response && Array.isArray(response.data)) {
                    classesData = response.data;
                }
                setAvailableClasses(classesData);

                fetchUsers(1);
            } catch (error) { 
                console.error("Init Error:", error);
                setAvailableClasses([]); 
            }
        };
        initData();
    }, []);

    // Debounce Search & Filter Change
    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 300); // Reset ke halaman 1 saat filter berubah
        return () => clearTimeout(timer);
    }, [filters.search, filters.role, filters.class_id]);

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            // Mengirim parameter filter ke backend (termasuk class_id='none')
            const res = await adminService.getUsers({ ...filters, page });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // --- HANDLERS NAVIGASI ---
    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditMode(false);
        setSelectedUserId(null);
        setViewMode('form');
    };

    const handleEdit = async (user: any) => {
        setFormData({
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            // Prioritaskan real_class_id jika ada (dari backend logic), fallback ke class_id biasa
            class_id: user.real_class_id || user.class_id || '',
            nisn: user.nisn || '',
            nip: user.nip || '',
            whatsapp_number: user.whatsapp_number || '',
            password: ''
        });
        setIsEditMode(true);
        setSelectedUserId(user.id);
        setViewMode('form');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setFormData(initialForm);
        fetchUsers(meta.page);
        // Refresh data kelas agar status wali kelas terbaru terupdate di dropdown
        adminService.getClasses().then(res => {
             let data = Array.isArray(res) ? res : (res.data || []);
             setAvailableClasses(data);
        });
    };

    // --- HANDLER KHUSUS PERUBAHAN KELAS (GURU) ---
    const handleClassChangeForTeacher = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClassId = e.target.value;
        
        if (!newClassId) {
            setFormData({ ...formData, class_id: '' });
            return;
        }

        const selectedClass = availableClasses.find(c => String(c.id) === newClassId);
        const isTaken = selectedClass?.teacher_id && selectedClass?.teacher_id !== 0;

        // LOGIKA KONFIRMASI (Hanya di Edit Mode)
        if (isEditMode && isTaken) {
            if (String(selectedClass.teacher_id) !== String(selectedUserId)) {
                const result = await Swal.fire({
                    title: 'Wali Kelas Sudah Ada!',
                    text: `Kelas ${selectedClass.name} sudah dipegang oleh ${selectedClass.teacher_name}. Apakah Anda yakin ingin menimpanya?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#f59e0b',
                    confirmButtonText: 'Ya, Ganti',
                    cancelButtonText: 'Batal'
                });

                if (!result.isConfirmed) {
                    return; 
                }
            }
        }

        setFormData({ ...formData, class_id: newClassId });
    };

    // --- LOGIKA GENERATE EMAIL OTOMATIS ---
    const generateAutoEmail = (data: UserFormState): string => {
        if (data.role === 'admin') return data.email;

        switch (data.role) {
            case 'teacher':
                return `${data.nip}@teacher.isokul`;
            case 'student':
                return `${data.nisn}@student.isokul`;
            case 'parent':
                return `${data.whatsapp_number}@parent.isokul`;
            case 'contributor':
                return `${data.whatsapp_number}@contributor.isokul`;
            default:
                return `${Date.now()}@user.isokul`;
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const autoEmail = generateAutoEmail(formData);
            const payload = {
                ...formData,
                email: autoEmail,
                class_id: formData.class_id ? Number(formData.class_id) : null
            };

            if (isEditMode && selectedUserId) {
                await adminService.updateUser(String(selectedUserId), payload);
                Swal.fire("Sukses", `Data diperbarui. Email: ${autoEmail}`, "success");
            } else {
                await adminService.createUser(payload);
                Swal.fire("Sukses", `User dibuat. Email: ${autoEmail}`, "success");
            }
            handleBackToList();
        } catch (error: any) {
            Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Pengguna?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#4F46E5', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
            try {
                await adminService.deleteUser(id);
                Swal.fire('Terhapus!', '', 'success');
                fetchUsers(meta.page);
            } catch (error) { Swal.fire('Gagal', 'Error sistem', 'error'); }
        }
    };

    const getRoleBadge = (role: string) => {
        const base = "px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 border";
        if (role === 'student') return <span className={`${base} bg-blue-50 text-blue-600 border-blue-100`}><GraduationCap size={14}/> Siswa</span>;
        if (role === 'teacher') return <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100`}><Briefcase size={14}/> Guru</span>;
        if (role === 'admin') return <span className={`${base} bg-purple-50 text-purple-600 border-purple-100`}><Sparkles size={14}/> Admin</span>;
        return <span className={`${base} bg-gray-50 text-gray-600 border-gray-100`}>{role}</span>;
    };

    if (viewMode === 'form') {
        return (
            <div className="animate-fade-in-up space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleBackToList} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group">
                        <ArrowLeft size={20} className="text-slate-500 group-hover:text-indigo-600"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</h2>
                        <p className="text-slate-500 text-sm font-medium">Email akan digenerate otomatis berdasarkan Role & ID.</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Peran (Role)</label>
                                <select className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value, class_id: '', nisn: '', nip: '', whatsapp_number: ''})}>
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                                    <input required type="text" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" placeholder="Nama Lengkap" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                                </div>
                            </div>

                            {formData.role === 'admin' && (
                                <div className="col-span-1 md:col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <label className="block text-xs font-bold text-purple-600 uppercase mb-2">Email Admin (Manual)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 text-purple-400" size={18}/>
                                        <input required type="email" className="w-full pl-11 pr-4 py-3 bg-white border border-purple-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="admin@sekolah.sch.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password {isEditMode && <span className="text-orange-500 font-normal lowercase">(kosongkan jika tidak ubah)</span>}</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                                    <input type="password" required={!isEditMode} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" placeholder="********" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* INFO EMAIL PREVIEW */}
                        {formData.role !== 'admin' && (
                            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                                <Mail size={20} className="text-slate-400"/>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Preview Email Login</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {formData.role === 'teacher' ? (formData.nip ? `${formData.nip}@teacher.isokul` : 'Isi NIP untuk generate email') :
                                         formData.role === 'student' ? (formData.nisn ? `${formData.nisn}@student.isokul` : 'Isi NISN untuk generate email') :
                                         (formData.whatsapp_number ? `${formData.whatsapp_number}@${formData.role}.isokul` : 'Isi No WA untuk generate email')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* DETAIL ROLE SPESIFIK */}
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 space-y-4">
                            <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2 mb-4">
                                <Sparkles size={16}/> Informasi Khusus Role: <span className="uppercase underline">{formData.role}</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* FORM SISWA */}
                                {formData.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NISN (Wajib - Jadi Email)</label>
                                            <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Nomor Induk Siswa Nasional" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">Pilih Kelas</label>
                                            <select required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}>
                                                <option value="">-- Pilih Kelas --</option>
                                                {Array.isArray(availableClasses) && availableClasses.map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name} {c.teacher_name ? `(Wali: ${c.teacher_name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* FORM GURU (Wali Kelas Logic) */}
                                {formData.role === 'teacher' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NIP / ID Guru (Wajib - Jadi Email)</label>
                                            <input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Nomor Induk Pegawai" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">Wali Kelas Untuk (Opsional)</label>
                                            <select 
                                                className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                                                value={formData.class_id} 
                                                onChange={handleClassChangeForTeacher} 
                                            >
                                                <option value="">-- Bukan Wali Kelas --</option>
                                                {Array.isArray(availableClasses) && availableClasses.map(c => {
                                                    const isTaken = c.teacher_id && c.teacher_id !== 0;
                                                    const isMyClass = isEditMode && selectedUserId && String(c.teacher_id) === String(selectedUserId);
                                                    const isDisabled = !isEditMode && isTaken;

                                                    return (
                                                        <option 
                                                            key={c.id} 
                                                            value={c.id} 
                                                            disabled={isDisabled}
                                                            className={isTaken && !isMyClass ? 'text-amber-600 bg-amber-50 italic font-medium' : 'text-slate-800'}
                                                        >
                                                            {c.name} {isTaken ? `(Sudah ada: ${c.teacher_name})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                                {isEditMode 
                                                    ? "*Anda bisa menimpa wali kelas yang sudah ada (akan muncul konfirmasi)." 
                                                    : "*Kelas yang sudah ada wali kelasnya tidak bisa dipilih saat membuat baru."}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {(formData.role === 'parent' || formData.role === 'contributor') && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">Nomor WhatsApp (Wajib - Jadi Email)</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 text-slate-400" size={18}/>
                                            <input required type="text" className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Contoh: 08123456789" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                                
                                {formData.role === 'admin' && (
                                    <div className="md:col-span-2 text-center py-4 text-slate-400 italic text-sm">
                                        Gunakan kolom email manual di atas untuk login Admin.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={handleBackToList} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                                Batal
                            </button>
                            <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2">
                                <Save size={20}/> Simpan Data
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
                        <input type="text" placeholder="Cari user (nama, nisn, email)..." className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none font-medium text-slate-700" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}/>
                    </div>
                    <div className="h-px md:h-auto md:w-px bg-slate-100 mx-2"></div>
                    <div className="flex gap-2">
                        {/* Filter Role */}
                        <div className="relative flex items-center">
                            <Shield size={16} className="absolute left-3 text-slate-400 z-10"/>
                            <select className="bg-slate-50 border border-slate-100 pl-9 pr-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value, class_id: 'all'})}>
                                <option value="all">Semua Role</option>
                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>

                        {/* Filter Class - UPDATED */}
                        {(filters.role === 'all' || filters.role === 'student' || filters.role === 'teacher') && (
                            <div className="relative flex items-center">
                                <Filter size={16} className="absolute left-3 text-slate-400 z-10"/>
                                <select 
                                    className="bg-slate-50 border border-slate-100 pl-9 pr-8 py-2.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none" 
                                    value={filters.class_id} 
                                    onChange={(e) => setFilters({...filters, class_id: e.target.value})}
                                >
                                    <option value="all">Semua Kelas</option>
                                    <option value="none" className="text-rose-600 font-bold">⚠ Belum Ada Kelas</option>
                                    {Array.isArray(availableClasses) && availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                    <Plus size={20}/> <span className="hidden sm:inline">Tambah User</span>
                </button>
            </div>

            {/* List User Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div><p className="text-indigo-400 font-bold text-xs">Memuat Data...</p></div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                    <User size={48} className="mx-auto text-slate-300 mb-3"/>
                    <p className="text-slate-500 font-medium">Tidak ada pengguna ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {users.map((u) => (
                        <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md">{u.full_name.charAt(0)}</div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-800 truncate text-sm leading-tight max-w-[150px] group-hover:text-indigo-600 transition-colors">{u.full_name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-500 mt-1"><Mail size={12}/><p className="text-[11px] font-medium truncate max-w-[140px]">{u.email}</p></div>
                                    </div>
                                </div>
                                {getRoleBadge(u.role)}
                            </div>

                            <div className="space-y-2 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100 mx-2">
                                {(u.role === 'student' || u.role === 'teacher') && (
                                    <>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><BookOpen size={12}/> {u.role === 'teacher' ? 'Wali Kelas' : 'Kelas'}</span> 
                                            {u.role === 'student' && !u.class_name && !u.class_id ? (
                                                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                                                    ⚠ Belum Masuk Kelas
                                                </span>
                                            ) : (
                                                <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">
                                                    {u.class_name || (u.class_id ? `ID: ${u.class_id}` : '-')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><Hash size={12}/> {u.role === 'student' ? 'NISN' : 'NIP'}</span> 
                                            <span className="font-bold text-slate-700 font-mono">{u.nisn || u.nip || '-'}</span>
                                        </div>
                                    </>
                                )}
                                {u.whatsapp_number && (
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><Phone size={12}/> WA</span> 
                                        <span className="font-bold text-slate-700">{u.whatsapp_number}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2 px-2">
                                <button onClick={() => handleEdit(u)} className="flex-1 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-[11px] hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                                    <Edit size={14}/> Edit
                                </button>
                                <button onClick={() => handleDelete(u.id)} className="w-10 h-10 rounded-xl bg-white text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && users.length > 0 && (
                <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-200 gap-4">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Menampilkan {users.length} dari {meta.total} Data</p>
                    <div className="flex items-center gap-2">
                        <button disabled={meta.page === 1} onClick={() => fetchUsers(meta.page - 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all text-slate-600"><ChevronLeft size={20}/></button>
                        <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs shadow-md">{meta.page}</span>
                        <button disabled={meta.page === meta.totalPages} onClick={() => fetchUsers(meta.page + 1)} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-all text-slate-600"><ChevronRight size={20}/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;