import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Trash2, ChevronLeft, ChevronRight, 
    GraduationCap, Briefcase, 
    Mail, Hash, Phone, BookOpen, Edit, Sparkles, Save, ArrowLeft, User, Filter, Shield, Eye, Heart, Users, Lock, Link as LinkIcon, X, UserPlus, AlertCircle, History, CheckCircle2, School
} from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';

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
    // Field Kontributor
    contributor_type?: string;
    agency_name?: string;
}

const UserManagement: React.FC = () => {
    // --- STATE UTAMA ---
    const [viewMode, setViewMode] = useState<'list' | 'form' | 'detail'>('list');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    // --- STATE DATA ---
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });

    // --- STATE DETAIL DATA ---
    const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // --- STATE LINK PARENT ---
    const [isLinking, setIsLinking] = useState(false); 
    const [parentSearch, setParentSearch] = useState('');
    const [foundParents, setFoundParents] = useState<any[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
    const [selectedRelationship, setSelectedRelationship] = useState('Wali');
    const [, setLoadingSearch] = useState(false);

    const initialForm: UserFormState = { 
        full_name: '', email: '', role: 'student', class_id: '', 
        nisn: '', nip: '', whatsapp_number: '', password: '',
        contributor_type: '', agency_name: ''
    };
    const [formData, setFormData] = useState<UserFormState>(initialForm);
    const [filters, setFilters] = useState({ role: 'all', class_id: 'all', status: 'all', search: '', limit: 6 });

    // [PERBAIKAN 1] Hapus 'Administrator' dari Opsi Role
    const roles = [
        { value: 'student', label: 'Siswa' },
        { value: 'teacher', label: 'Guru' },
        { value: 'parent', label: 'Orang Tua' },
        { value: 'contributor', label: 'Kontributor' },
        { value: 'alumni', label: 'Alumni' }
    ];

    // Opsi Kontributor
    const contributorOptions = [
        'Guru', 'Dinas Pendidikan', 'Komite Sekolah', 'KPAI', 'Lainnya'
    ];

    useEffect(() => {
        const initData = async () => {
            try {
                const response = await adminService.getClasses();
                let classesData = Array.isArray(response) ? response : (response?.data || []);
                setAvailableClasses(classesData);
                fetchUsers(1);
            } catch (error) { 
                console.error("Init Error:", error);
                setAvailableClasses([]); 
            }
        };
        initData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(1), 300);
        return () => clearTimeout(timer);
    }, [filters.search, filters.role, filters.class_id, filters.status]);

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await adminService.getUsers({ ...filters, page });
            setUsers(res.data);
            setMeta(res.meta);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // --- HANDLERS ---

    const handleViewDetail = async (userId: number) => {
        setLoadingDetail(true);
        setViewMode('detail');
        setIsLinking(false); 
        try {
            const data = await adminService.getUserDetail(userId);
            setSelectedUserDetail(data);
        } catch (error) {
            console.error(error);
            setViewMode('list');
            Swal.fire("Error", "Gagal memuat detail user", "error");
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setFormData(initialForm);
        setSelectedUserDetail(null);
        fetchUsers(meta.page);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditMode(false);
        setSelectedUserId(null);
        setViewMode('form');
    };

    const handleEdit = (user: any) => {
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '', 
            role: user.role || 'student',
            class_id: user.real_class_id || user.class_id || '',
            nisn: user.nisn || '',
            nip: user.nip || '',
            whatsapp_number: user.whatsapp_number || '', // Pastikan WA terambil
            password: '',
            contributor_type: user.contributor_type || '',
            agency_name: user.agency_name || ''
        });
        setIsEditMode(true);
        setSelectedUserId(user.id);
        setViewMode('form');
    };

    const handleContributorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setFormData(prev => ({
            ...prev,
            contributor_type: val,
            agency_name: val === 'Lainnya' ? '' : val
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClassChangeForTeacher = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClassId = e.target.value;
        if (!newClassId) { setFormData({ ...formData, class_id: '' }); return; }
        const selectedClass = availableClasses.find(c => String(c.id) === newClassId);
        const isTaken = selectedClass?.teacher_id && selectedClass?.teacher_id !== 0;
        if (isEditMode && isTaken) {
            if (String(selectedClass.teacher_id) !== String(selectedUserId)) {
                const result = await Swal.fire({
                    title: 'Wali Kelas Sudah Ada!',
                    text: `Kelas ${selectedClass.name} sudah dipegang oleh ${selectedClass.teacher_name}. Timpa?`,
                    icon: 'warning',
                    showCancelButton: true, confirmButtonText: 'Ya, Ganti', cancelButtonText: 'Batal'
                });
                if (!result.isConfirmed) return;
            }
        }
        setFormData({ ...formData, class_id: newClassId });
    };

    // --- LOGIKA SIMPAN ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.role === 'student' && !formData.class_id) {
            Swal.fire('Peringatan', 'Siswa aktif wajib memiliki kelas.', 'warning');
            return;
        }

        try {
            let emailToSave = formData.email;
            
            // Generate email fake jika bukan admin dan email kosong
            if (formData.role !== 'admin' && !emailToSave) {
                if (formData.role === 'student' || formData.role === 'alumni') {
                    if (!formData.nisn) return toast.error("NISN Wajib diisi");
                    emailToSave = `${formData.nisn}@student.isokul`;
                } 
                else if (formData.role === 'teacher') {
                    if (!formData.nip) return toast.error("NIP Wajib diisi");
                    emailToSave = `${formData.nip}@teacher.isokul`;
                } 
                else if (formData.role === 'parent') {
                    if (!formData.whatsapp_number) return toast.error("No WA Wajib diisi");
                    emailToSave = `${formData.whatsapp_number}@parent.isokul`;
                } 
                else if (formData.role === 'contributor') {
                    // Kontributor pakai NIP untuk email login, TAPI WA WAJIB UNTUK AKSES
                    if (!formData.nip) return toast.error("NIP/ID Wajib diisi");
                    emailToSave = `${formData.nip}@contributor.isokul`;
                }
            }
            
            const payload = { 
                ...formData, 
                email: emailToSave, 
                class_id: formData.role === 'alumni' ? null : (formData.class_id ? Number(formData.class_id) : null),
                agency_name: formData.role === 'contributor' ? (formData.agency_name || formData.contributor_type) : null
            };

            if (isEditMode && selectedUserId) {
                await adminService.updateUser(String(selectedUserId), payload);
                Swal.fire("Sukses", `Data diperbarui.`, "success");
                
                if (viewMode === 'detail' || selectedUserDetail) {
                    const updated = await adminService.getUserDetail(selectedUserId);
                    setSelectedUserDetail(updated);
                    setViewMode('detail'); 
                } else {
                    handleBackToList();
                }
            } else {
                await adminService.createUser(payload);
                Swal.fire("Sukses", `User dibuat.`, "success");
                handleBackToList();
            }
        } catch (error: any) {
            Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Hapus Pengguna?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Ya, Hapus!', cancelButtonText: 'Batal'
        });
        if (result.isConfirmed) {
            try { await adminService.deleteUser(id); Swal.fire('Terhapus!', '', 'success'); fetchUsers(meta.page); } 
            catch (error) { Swal.fire('Gagal', 'Error sistem', 'error'); }
        }
    };

    const handleSearchParents = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setParentSearch(val);
        if (val.length > 2) {
            setLoadingSearch(true);
            try {
                const res = await adminService.searchParents(val);
                setFoundParents(res);
            } catch (err) { console.error(err); } 
            finally { setLoadingSearch(false); }
        } else {
            setFoundParents([]);
        }
    };

    const handleLinkParent = async () => {
        if (!selectedParentId || !selectedUserDetail?.id) return;
        try {
            await adminService.linkParent({
                studentId: selectedUserDetail.id, parentId: selectedParentId, relationship: selectedRelationship
            });
            Swal.fire("Sukses", "Orang tua berhasil dihubungkan.", "success");
            setIsLinking(false);
            handleViewDetail(selectedUserDetail.id);
            setParentSearch(''); setFoundParents([]); setSelectedParentId(null);
        } catch (error: any) {
            Swal.fire("Gagal", error.response?.data?.message || "Terjadi kesalahan", "error");
        }
    };

    const handleUnlinkParent = async (parentId: number, parentName: string) => {
        const result = await Swal.fire({
            title: 'Lepas Kaitan?', text: `Yakin ingin melepas ${parentName}?`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#EF4444', confirmButtonText: 'Ya, Lepas'
        });
        if (result.isConfirmed) {
            try {
                await adminService.unlinkParent({ studentId: selectedUserDetail.id, parentId: parentId });
                Swal.fire("Berhasil", "Hubungan dilepas.", "success");
                handleViewDetail(selectedUserDetail.id);
            } catch (error) { Swal.fire("Gagal", "Error sistem", "error"); }
        }
    };

    const getRoleBadge = (user: any) => {
        const role = user.role;
        const base = "px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 border";
        if (role === 'student') return <span className={`${base} bg-blue-50 text-blue-600 border-blue-100`}><GraduationCap size={14}/> Siswa</span>;
        if (role === 'teacher') return <span className={`${base} bg-emerald-50 text-emerald-600 border-emerald-100`}><Briefcase size={14}/> Guru</span>;
        if (role === 'admin') return <span className={`${base} bg-purple-50 text-purple-600 border-purple-100`}><Sparkles size={14}/> Admin</span>;
        if (role === 'alumni') return <span className={`${base} bg-amber-50 text-amber-600 border-amber-100`}><CheckCircle2 size={14}/> Alumni</span>;
        if (role === 'contributor') return <span className={`${base} bg-green-50 text-green-600 border-green-100`}><School size={14}/> {user.agency_name || 'Kontributor'}</span>;
        return <span className={`${base} bg-gray-50 text-gray-600 border-gray-100`}>{role}</span>;
    };

    // ==========================================
    // RENDER: VIEW DETAIL (PAGE STYLE)
    // ==========================================
    if (viewMode === 'detail' && selectedUserDetail) {
        return (
            <div className="animate-fade-in-up space-y-6 pb-20">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={handleBackToList} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 group-hover:bg-indigo-50 group-hover:border-indigo-100"><ArrowLeft size={18}/></div>
                        <span>Kembali ke Daftar</span>
                    </button>
                    <button 
                        onClick={() => handleEdit(selectedUserDetail)} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5"
                    >
                        <Edit size={16}/> Edit Data
                    </button>
                </div>

                {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-slate-200">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
                        <p className="text-slate-400 text-sm font-bold">Memuat Data Lengkap...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* KIRI: Profil Utama */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-white">
                                <div className={`p-8 text-center relative overflow-hidden ${selectedUserDetail.role === 'alumni' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-indigo-600 to-violet-700'}`}>
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-white/30 shadow-2xl mb-4">
                                            {selectedUserDetail.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <h1 className="text-xl font-black text-white leading-tight mb-2">{selectedUserDetail.full_name}</h1>
                                        
                                        {selectedUserDetail.role === 'student' && !selectedUserDetail.is_active && (
                                            <div className="mb-3"><span className="bg-amber-400/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm backdrop-blur-sm"><Lock size={10} /> Belum Aktivasi</span></div>
                                        )}

                                        <div className="flex flex-wrap justify-center gap-2">
                                            <span className="bg-black/20 text-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
                                                <Shield size={10} /> 
                                                {selectedUserDetail.role === 'contributor' ? (selectedUserDetail.agency_name || 'Kontributor') : selectedUserDetail.role}
                                            </span>
                                            {selectedUserDetail.role !== 'alumni' && selectedUserDetail.class_name && (
                                                <span className="bg-emerald-500/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm shadow-sm">
                                                    <GraduationCap size={10} /> {selectedUserDetail.role === 'teacher' ? 'Wali' : 'Kelas'} {selectedUserDetail.class_name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg text-violet-500 shadow-sm"><Mail size={18}/></div>
                                        <div className="overflow-hidden"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p><p className="font-bold text-slate-700 text-sm truncate">{selectedUserDetail.email}</p></div>
                                    </div>
                                    {(selectedUserDetail.nisn || selectedUserDetail.nip) && (
                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="p-2 bg-white rounded-lg text-blue-500 shadow-sm"><Hash size={18}/></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {selectedUserDetail.role === 'student' || selectedUserDetail.role === 'alumni' ? 'NISN' : 'NIP / ID'}
                                                </p>
                                                <p className="font-mono font-bold text-slate-700 text-sm">{selectedUserDetail.nisn || selectedUserDetail.nip}</p>
                                            </div>
                                        </div>
                                    )}
                                    {selectedUserDetail.whatsapp_number && (
                                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="p-2 bg-white rounded-lg text-green-500 shadow-sm"><Phone size={18}/></div>
                                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp</p><p className="font-bold text-slate-700 text-sm">{selectedUserDetail.whatsapp_number}</p></div>
                                        </div>
                                    )}
                                    {selectedUserDetail.role === 'contributor' && selectedUserDetail.agency_name && (
                                         <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50 border border-green-100">
                                            <div className="p-2 bg-white rounded-lg text-green-600 shadow-sm"><School size={18}/></div>
                                            <div><p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Instansi</p><p className="font-bold text-slate-700 text-sm">{selectedUserDetail.agency_name}</p></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KANAN: Data Keluarga / Relasi */}
                        <div className="lg:col-span-2 space-y-6">
                            {(selectedUserDetail.role === 'student' || selectedUserDetail.role === 'alumni') && (
                                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white h-full relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Heart size={24} /></div>
                                        <div>
                                            <h3 className="font-black text-xl text-slate-800">Orang Tua / Wali</h3>
                                            <p className="text-sm text-slate-500 font-medium">Data keluarga yang terhubung (Siswa & Alumni).</p>
                                        </div>
                                        {!isLinking && (
                                            <button onClick={() => setIsLinking(true)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors shadow-sm">
                                                <UserPlus size={16}/> Hubungkan
                                            </button>
                                        )}
                                    </div>

                                    {isLinking && (
                                        <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-slide-up relative">
                                            <button onClick={() => setIsLinking(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-indigo-500"/> Cari Orang Tua</h4>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
                                                    <input type="text" placeholder="Cari nama / email / WA..." className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={parentSearch} onChange={handleSearchParents}/>
                                                </div>
                                                {parentSearch.length > 2 && (
                                                    <div className="bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto p-2">
                                                        {foundParents.length === 0 ? <p className="text-center py-2 text-xs text-slate-400">Tidak ditemukan.</p> : 
                                                            foundParents.map(p => (
                                                                <div key={p.id} onClick={() => setSelectedParentId(p.id)} className={`p-3 rounded-lg border cursor-pointer flex justify-between ${selectedParentId === p.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-slate-50 border-slate-100'}`}>
                                                                    <div><p className="font-bold text-sm text-slate-800">{p.full_name}</p><p className="text-xs text-slate-500">{p.email || p.whatsapp_number}</p></div>
                                                                    {selectedParentId === p.id && <div className="w-4 h-4 bg-indigo-500 rounded-full"/>}
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                                <div className="flex gap-4 items-end">
                                                    <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sebagai</label><select className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" value={selectedRelationship} onChange={(e) => setSelectedRelationship(e.target.value)}><option value="Ayah">Ayah</option><option value="Ibu">Ibu</option><option value="Wali">Wali</option></select></div>
                                                    <button onClick={handleLinkParent} disabled={!selectedParentId} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50">Simpan</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {['Ayah', 'Ibu', 'Wali'].map((rel) => {
                                            const parent = selectedUserDetail?.family_data?.find((p: any) => p.relationship === rel);
                                            return (
                                                <div key={rel} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${rel==='Ayah'?'bg-blue-50 text-blue-500':rel==='Ibu'?'bg-rose-50 text-rose-500':'bg-emerald-50 text-emerald-500'}`}><User size={18} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rel}</p>
                                                            {parent ? <p className="font-bold text-slate-800 text-sm">{parent.full_name}</p> : <p className="text-sm text-slate-400 italic font-medium">(Belum Terhubung)</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {parent && parent.whatsapp_number && <div className="text-right hidden sm:block"><span className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp</span><p className="text-sm font-mono text-slate-600">{parent.whatsapp_number}</p></div>}
                                                        {parent && <button onClick={() => handleUnlinkParent(parent.id, parent.full_name)} className="p-2 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100" title="Lepas Hubungan"><Trash2 size={16} /></button>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedUserDetail.role === 'alumni' && (
                                <div className="bg-slate-800 text-white rounded-[2rem] p-8 shadow-xl border border-slate-700 relative overflow-hidden">
                                    {/* ... (Konten Alumni sama) ... */}
                                    <div className="absolute top-0 right-0 p-6 opacity-10"><History size={100} /></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-600">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-slate-700 text-amber-400 rounded-xl"><GraduationCap size={24} /></div>
                                                <div><h3 className="font-black text-xl text-white">Data Alumni</h3><p className="text-sm text-slate-400 font-medium">Status kelulusan siswa ini.</p></div>
                                            </div>
                                            <button onClick={() => handleEdit(selectedUserDetail)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold border border-slate-600 transition-colors">Ubah ke Siswa</button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Kelas Terakhir</p>
                                                <p className="text-lg font-bold text-white flex items-center gap-2">{selectedUserDetail.last_class_name || selectedUserDetail.class_name || "-"}</p>
                                            </div>
                                            <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tahun Lulus</p>
                                                <p className="text-lg font-bold text-emerald-400 font-mono">{selectedUserDetail.graduation_year || (selectedUserDetail.updated_at ? new Date(selectedUserDetail.updated_at).getFullYear() : "-")}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs text-slate-400 flex items-start gap-2">
                                            <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                                            <p>Siswa ini telah dinyatakan lulus. Data orang tua dan riwayat tetap tersimpan.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedUserDetail.role === 'parent' && (
                                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white h-full">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Users size={24} /></div>
                                        <div><h3 className="font-black text-xl text-slate-800">Daftar Anak</h3><p className="text-sm text-slate-500 font-medium">Siswa yang terhubung.</p></div>
                                    </div>
                                    {selectedUserDetail.family_data && selectedUserDetail.family_data.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedUserDetail.family_data.map((child: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-blue-200 transition-all">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm">{child.full_name.charAt(0)}</div>
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">{child.relationship}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{child.full_name}</h4>
                                                    <div className="space-y-1 text-xs text-slate-500">
                                                        <div className="flex items-center gap-2"><Hash size={12}/> <span className="font-mono">{child.nisn}</span></div>
                                                        <div className="flex items-center gap-2">
                                                            <GraduationCap size={12}/> 
                                                            {child.role === 'alumni' ? (<span className="text-emerald-600 font-bold">Sudah Lulus</span>) : (<span>{child.class_name ? `Kelas ${child.class_name}` : 'Tanpa Kelas'}</span>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">Belum ada anak terhubung.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- FORM VIEW (CREATE/EDIT) ---
    if (viewMode === 'form') {
        return (
            <div className="animate-fade-in-up space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={handleBackToList} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm group">
                        <ArrowLeft size={20} className="text-slate-500 group-hover:text-indigo-600"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">{isEditMode ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}</h2>
                        <p className="text-slate-500 text-sm font-medium">Lengkapi form di bawah ini untuk menyimpan data.</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Role Selection */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-2">Role Pengguna</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500">
                                    {roles.map(r => (
                                         <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* LOGIKA KONTRIBUTOR KHUSUS */}
                            {formData.role === 'contributor' && (
                                <div className="md:col-span-2 bg-green-50 p-6 rounded-2xl border border-green-100 animate-slide-up">
                                    <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2"><School size={18}/> Detail Kontributor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 mb-2">Pilih Identitas</label>
                                            <select 
                                                name="contributor_type"
                                                value={formData.contributor_type}
                                                onChange={handleContributorTypeChange}
                                                className="w-full p-3 border border-green-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="">-- Pilih Instansi/Peran --</option>
                                                {contributorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        {/* Input Manual jika Lainnya */}
                                        {(formData.contributor_type === 'Lainnya' || (formData.contributor_type && !contributorOptions.includes(formData.contributor_type))) && (
                                            <div className="animate-fade-in">
                                                <label className="block text-xs font-bold text-green-700 mb-2">Nama Instansi / Detail</label>
                                                <input 
                                                    type="text" 
                                                    name="agency_name" 
                                                    placeholder="Tuliskan nama instansi..." 
                                                    value={formData.agency_name} 
                                                    onChange={handleChange} 
                                                    className="w-full p-3 border border-green-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>
                                        )}
                                        {/* Input NIP untuk Kontributor */}
                                        <div className="animate-fade-in">
                                            <label className="block text-xs font-bold text-green-700 mb-2">NIP / Nomor Kepegawaian</label>
                                            <input 
                                                type="text" 
                                                name="nip" 
                                                placeholder="NIP / No. Pegawai" 
                                                value={formData.nip || ''} 
                                                onChange={handleChange} 
                                                className="w-full p-3 border border-green-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                        
                                        {/* [PERBAIKAN 2] Input WhatsApp untuk Kontributor (WAJIB UTK UNLOCK) */}
                                        <div className="animate-fade-in">
                                            <label className="block text-xs font-bold text-green-700 mb-2">WhatsApp (Wajib Aktif)</label>
                                            <input 
                                                type="text" 
                                                name="whatsapp_number" 
                                                placeholder="08xxxxxxxxxx" 
                                                value={formData.whatsapp_number || ''} 
                                                onChange={handleChange} 
                                                className="w-full p-3 border border-green-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div><label className="block text-xs font-bold text-slate-600 mb-2">Nama Lengkap</label><input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            
                            {/* EMAIL: HANYA ADMIN YANG BISA ISI MANUAL */}
                            {formData.role === 'admin' && (
                                <div><label className="block text-xs font-bold text-slate-600 mb-2">Email (Wajib untuk Admin)</label><input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            )}

                            <div><label className="block text-xs font-bold text-slate-600 mb-2">Password {!isEditMode ? '(Wajib)' : '(Kosongkan jika tidak ubah)'}</label><input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            
                            <div className="md:col-span-2 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* FIELD KHUSUS SISWA & ALUMNI */}
                                {(formData.role === 'student' || formData.role === 'alumni') && (
                                    <>
                                        <div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NISN</label><input type="text" name="nisn" value={formData.nisn || ''} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"/></div>
                                        <div>
                                            <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">{formData.role === 'alumni' ? 'Kelas (Tidak Aktif)' : 'Penempatan Kelas (Wajib)'}</label>
                                            <select 
                                                name="class_id" 
                                                value={formData.class_id} 
                                                onChange={handleChange} 
                                                disabled={formData.role === 'alumni'} 
                                                className={`w-full p-3 border rounded-xl outline-none ${formData.role === 'alumni' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
                                            >
                                                <option value="">{formData.role === 'alumni' ? '-- Status Alumni --' : '-- Pilih Kelas --'}</option>
                                                {availableClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            {formData.role === 'alumni' && <p className="text-[10px] text-slate-500 mt-1">*Ubah role ke "Siswa" untuk memilih kelas kembali.</p>}
                                        </div>
                                    </>
                                )}
                                
                                {/* FIELD KHUSUS GURU */}
                                {formData.role === 'teacher' && (<><div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NIP</label><input required type="text" name="nip" className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500" value={formData.nip || ''} onChange={handleChange} /></div><div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">Wali Kelas (Opsional)</label><select className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500" value={formData.class_id} onChange={handleClassChangeForTeacher}><option value="">-- Bukan Wali Kelas --</option>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} {c.teacher_id ? '(Ada Guru)' : ''}</option>)}</select></div></>)}
                                
                                {/* FIELD KHUSUS ORTU */}
                                {formData.role === 'parent' && (<div className="md:col-span-2"><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">WhatsApp</label><input required type="text" name="whatsapp_number" className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white focus:ring-2 focus:ring-indigo-500" value={formData.whatsapp_number || ''} onChange={handleChange} /></div>)}
                            </div>
                        </div>

                        <div className="flex gap-4 justify-end pt-4">
                            <button type="button" onClick={handleBackToList} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                            <button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Save size={20}/> Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- LIST VIEW (DEFAULT) ---
    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20}/>
                        <input type="text" placeholder="Cari user (nama, nisn, email)..." className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none font-medium text-slate-700" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}/>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex items-center"><Shield size={16} className="absolute left-3 text-slate-400 z-10"/><select className="bg-slate-50 border border-slate-100 pl-9 pr-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer" value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value, class_id: 'all', status: 'all'})}><option value="all">Semua Role</option>{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                        {filters.role === 'student' && (<div className="relative flex items-center animate-in slide-in-from-left-2 fade-in duration-300"><Lock size={16} className="absolute left-3 text-slate-400 z-10"/><select className="bg-slate-50 border border-slate-100 pl-9 pr-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}><option value="all">Semua Status</option><option value="active">Sudah Aktivasi</option><option value="inactive">Belum Aktivasi</option></select></div>)}
                        {(filters.role === 'all' || filters.role === 'student' || filters.role === 'teacher') && (<div className="relative flex items-center"><Filter size={16} className="absolute left-3 text-slate-400 z-10"/><select className="bg-slate-50 border border-slate-100 pl-9 pr-8 py-2.5 rounded-lg text-xs font-bold text-slate-600 outline-none cursor-pointer" value={filters.class_id} onChange={(e) => setFilters({...filters, class_id: e.target.value})}><option value="all">Semua Kelas</option><option value="none">Belum Ada Kelas</option>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>)}
                    </div>
                </div>
                <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all"><Plus size={20}/> <span className="hidden sm:inline">Tambah User</span></button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div><p className="text-indigo-400 font-bold text-xs">Memuat Data...</p></div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300"><User size={48} className="mx-auto text-slate-300 mb-3"/><p className="text-slate-500 font-medium">Tidak ada data.</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {users.map((u) => (
                        <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-md">{u.full_name.charAt(0)}</div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-slate-800 truncate text-sm leading-tight max-w-[150px]">{u.full_name}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-500 mt-1"><Mail size={12}/><p className="text-[11px] font-medium truncate max-w-[140px]">{u.email}</p></div>
                                    </div>
                                </div>
                                {getRoleBadge(u)}
                            </div>
                            <div className="space-y-2 mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                {u.role === 'student' && !u.is_active && (<div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200 text-amber-600"><Lock size={12} /> <span className="text-[10px] font-bold uppercase">Belum Aktivasi</span></div>)}
                                {(u.role === 'student' || u.role === 'teacher') && (
                                    <>
                                        <div className="flex justify-between items-center text-[11px]"><span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><BookOpen size={12}/> {u.role === 'teacher' ? 'Wali Kelas' : 'Kelas'}</span> <span className="font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">{u.class_name || (u.class_id ? `ID: ${u.class_id}` : '-')}</span></div>
                                        <div className="flex justify-between items-center text-[11px]"><span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><Hash size={12}/> {u.role === 'student' ? 'NISN' : 'NIP'}</span> <span className="font-bold text-slate-700 font-mono">{u.nisn || u.nip || '-'}</span></div>
                                    </>
                                )}
                                {u.whatsapp_number && (<div className="flex justify-between items-center text-[11px]"><span className="text-slate-400 font-bold uppercase flex items-center gap-1.5"><Phone size={12}/> WA</span> <span className="font-bold text-slate-700">{u.whatsapp_number}</span></div>)}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleViewDetail(u.id)} className="flex-1 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"><Eye size={14}/> Detail</button>
                                <button onClick={() => handleDelete(u.id)} className="w-8 h-8 rounded-lg bg-white text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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