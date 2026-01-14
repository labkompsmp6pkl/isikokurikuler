import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Edit, User, Mail, Hash, Shield, Calendar, Heart, Users, GraduationCap, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';
import Spinner from '../student/components/Spinner';

const UserDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    // State Mode
    const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
    const [loading, setLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [userData, setUserData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        full_name: '', email: '', password: '', role: 'student',
        nisn: '', nip: '', class_id: '', whatsapp_number: ''
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Ambil daftar kelas
                const classesResponse = await adminService.getClasses();
                const classesData = Array.isArray(classesResponse) ? classesResponse : (classesResponse?.data || []);
                setAvailableClasses(classesData);

                // 2. Ambil detail user jika bukan baru
                if (!isNew && id) {
                    const data = await adminService.getUserDetail(parseInt(id));
                    setUserData(data);
                    
                    // Isi form untuk persiapan edit
                    setFormData({ 
                        full_name: data.full_name,
                        email: data.email,
                        password: '',
                        role: data.role,
                        nisn: data.nisn || '',
                        nip: data.nip || '',
                        class_id: data.class_id || '', // Jika alumni, ini null/kosong
                        whatsapp_number: data.whatsapp_number || ''
                    });
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal memuat data', 'error');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, isNew]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Validasi Sederhana: Jika diubah jadi siswa, wajib pilih kelas
        if (formData.role === 'student' && !formData.class_id) {
            setLoading(false);
            Swal.fire('Peringatan', 'Jika status adalah Siswa, wajib memilih Kelas.', 'warning');
            return;
        }

        try {
            // Jika role alumni, class_id dipaksa null
            const payload = { 
                ...formData, 
                class_id: formData.role === 'alumni' ? null : (formData.class_id ? Number(formData.class_id) : null) 
            };

            if (isNew) {
                await adminService.createUser(payload);
                Swal.fire('Sukses', 'User berhasil dibuat', 'success');
                navigate('/admin/users');
            } else {
                await adminService.updateUser(id!, payload);
                Swal.fire('Sukses', 'Data berhasil diperbarui', 'success');
                
                // Refresh data user setelah update agar tampilan berubah
                const updatedData = await adminService.getUserDetail(parseInt(id!));
                setUserData(updatedData);
                setMode('view');
            }
        } catch (error: any) {
            Swal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper render baris orang tua
    const renderParentRow = (relationshipType: string, iconColor: string) => {
        const parent = userData?.family_data?.find((p: any) => p.relationship === relationshipType);
        return (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-${iconColor}-50 text-${iconColor}-500`}>
                        <User size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{relationshipType}</p>
                        {parent ? (
                            <p className="font-bold text-slate-800 text-sm">{parent.full_name}</p>
                        ) : (
                            <p className="text-sm text-slate-400 italic font-medium">(Belum Terhubung)</p>
                        )}
                    </div>
                </div>
                {parent && parent.whatsapp_number && (
                    <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp</span>
                        <p className="text-sm font-mono text-slate-600">{parent.whatsapp_number}</p>
                    </div>
                )}
            </div>
        );
    };

    if (loading && !userData && !isNew) return <div className="h-screen flex items-center justify-center"><Spinner /></div>;

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen bg-slate-50 font-sans animate-fade-in">
            {/* Header Navigasi */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
                    <ArrowLeft size={20}/> Kembali
                </button>
                {!isNew && mode === 'view' && (
                    <button onClick={() => setMode('edit')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                        <Edit size={16} /> Edit Data / Ubah Status
                    </button>
                )}
                {!isNew && mode === 'edit' && (
                    <button onClick={() => setMode('view')} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">
                        Batal Edit
                    </button>
                )}
            </div>

            {/* --- MODE VIEW (DETAIL PROFIL) --- */}
            {!isNew && mode === 'view' && userData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* KIRI: KARTU PROFIL UTAMA */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-white relative">
                            {/* Background Header sesuai Status */}
                            <div className={`p-8 text-center relative overflow-hidden ${userData.role === 'alumni' ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-indigo-600 to-violet-700'}`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl font-black text-white border-4 border-white/30 shadow-2xl mb-4">
                                        {userData.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <h1 className="text-xl font-black text-white leading-tight mb-2">{userData.full_name}</h1>
                                    
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <span className="bg-black/20 text-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
                                            <Shield size={10} /> {userData.role === 'alumni' ? 'ALUMNI' : userData.role.toUpperCase()}
                                        </span>
                                        
                                        {/* Tampilan Kelas */}
                                        {userData.role !== 'alumni' && userData.class_name && (
                                            <span className="bg-emerald-500/80 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm shadow-sm">
                                                <GraduationCap size={10} /> {userData.role === 'teacher' ? 'Wali' : 'Kelas'} {userData.class_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Detail Info Dasar */}
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg text-violet-500 shadow-sm"><Mail size={18}/></div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                                        <p className="font-bold text-slate-700 text-sm truncate">{userData.email}</p>
                                    </div>
                                </div>

                                {(userData.role === 'student' || userData.role === 'alumni') && userData.nisn && (
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="p-2 bg-white rounded-lg text-emerald-500 shadow-sm"><Hash size={18}/></div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NISN</p>
                                            <p className="font-mono font-bold text-slate-700 text-sm">{userData.nisn}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm"><Calendar size={18}/></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terdaftar Sejak</p>
                                        <p className="font-bold text-slate-700 text-sm">
                                            {new Date(userData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: DATA RELASI & RIWAYAT */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* --- BAGIAN 1: ORANG TUA (TAMPIL UNTUK SISWA & ALUMNI) --- */}
                        {(userData.role === 'student' || userData.role === 'alumni') && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white h-full relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                    <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Heart size={24} /></div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-800">Orang Tua / Wali</h3>
                                        <p className="text-sm text-slate-500 font-medium">Data keluarga yang terhubung (Siswa & Alumni).</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {renderParentRow('Ayah', 'blue')}
                                    {renderParentRow('Ibu', 'rose')}
                                    {renderParentRow('Wali', 'emerald')}
                                </div>
                            </div>
                        )}

                        {/* --- BAGIAN 2: STATUS ALUMNI & RIWAYAT --- */}
                        {userData.role === 'alumni' && (
                            <div className="bg-slate-800 text-white rounded-[2rem] p-8 shadow-xl border border-slate-700 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <History size={100} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-600">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-slate-700 text-amber-400 rounded-xl"><GraduationCap size={24} /></div>
                                            <div>
                                                <h3 className="font-black text-xl text-white">Data Alumni</h3>
                                                <p className="text-sm text-slate-400 font-medium">Status kelulusan siswa ini.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setMode('edit')} 
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold border border-slate-600 transition-colors"
                                        >
                                            Ubah ke Siswa
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status Akademik</p>
                                            <p className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                                <CheckCircle2 size={18}/> Lulus / Alumni
                                            </p>
                                        </div>
                                        
                                        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tahun Kelulusan (Estimasi)</p>
                                            <p className="text-lg font-bold text-white font-mono">
                                                {/* Menggunakan updated_at sebagai proxy tahun kelulusan */}
                                                {new Date(userData.updated_at).getFullYear()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-xs text-slate-400 flex items-start gap-2">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                                        <p>Data siswa ini disimpan sebagai arsip Alumni. Anda dapat mengubah status kembali menjadi "Siswa" melalui tombol Edit jika terjadi kesalahan input.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- PARENT VIEW (ANAK) --- */}
                        {userData.role === 'parent' && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white h-full">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl"><Users size={24} /></div>
                                    <div>
                                        <h3 className="font-black text-xl text-slate-800">Daftar Anak</h3>
                                        <p className="text-sm text-slate-500 font-medium">Siswa yang terhubung.</p>
                                    </div>
                                </div>
                                {userData.family_data && userData.family_data.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {userData.family_data.map((child: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-blue-200 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm">
                                                        {child.full_name.charAt(0)}
                                                    </div>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">{child.relationship}</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{child.full_name}</h4>
                                                <div className="space-y-1 text-xs text-slate-500">
                                                    <div className="flex items-center gap-2"><Hash size={12}/> <span className="font-mono">{child.nisn}</span></div>
                                                    <div className="flex items-center gap-2"><GraduationCap size={12}/> <span>{child.class_name ? `Kelas ${child.class_name}` : 'Tanpa Kelas'}</span></div>
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
            ) : (
                /* --- MODE EDIT (FORM EDITOR) --- */
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-4xl mx-auto">
                    <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                        <h1 className="text-2xl font-black text-indigo-900">{isNew ? 'Tambah User Baru' : `Edit User: ${formData.full_name}`}</h1>
                        <p className="text-sm text-slate-500 mt-1">Lengkapi form di bawah ini untuk menyimpan data.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-xs font-bold text-slate-600 mb-2">Nama Lengkap</label><input required type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            <div><label className="block text-xs font-bold text-slate-600 mb-2">Email</label><input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            <div><label className="block text-xs font-bold text-slate-600 mb-2">Password {isNew ? '(Wajib)' : '(Kosongkan jika tidak ubah)'}</label><input type="password" name="password" value={formData.password} onChange={handleChange} required={isNew} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/></div>
                            
                            {/* DROPDOWN ROLE (BISA GANTI SISWA <-> ALUMNI) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Role Pengguna</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white font-bold text-indigo-900">
                                    <option value="student">Siswa (Aktif)</option>
                                    <option value="alumni">Alumni (Lulus)</option>
                                    <option value="teacher">Guru</option>
                                    <option value="parent">Orang Tua</option>
                                    <option value="contributor">Kontributor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(formData.role === 'student' || formData.role === 'alumni') && (
                                <>
                                    <div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NISN</label><input type="text" name="nisn" value={formData.nisn} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl bg-white"/></div>
                                    
                                    {/* LOGIKA KELAS: Jika Siswa (Wajib), Jika Alumni (Disabled/Null) */}
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">
                                            {formData.role === 'alumni' ? 'Kelas (Tidak Aktif)' : 'Penempatan Kelas (Wajib)'}
                                        </label>
                                        <select 
                                            name="class_id" 
                                            value={formData.class_id} 
                                            onChange={handleChange} 
                                            disabled={formData.role === 'alumni'}
                                            className={`w-full p-3 border rounded-xl outline-none ${formData.role === 'alumni' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-200'}`}
                                        >
                                            <option value="">{formData.role === 'alumni' ? '-- Status Alumni --' : '-- Pilih Kelas --'}</option>
                                            {availableClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        {formData.role === 'alumni' && <p className="text-[10px] text-slate-500 mt-1">*Ubah role ke "Siswa" untuk memilih kelas kembali.</p>}
                                    </div>
                                </>
                            )}
                            {/* ... Field lain tetap sama ... */}
                            {formData.role === 'teacher' && (<><div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">NIP</label><input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white" value={formData.nip} onChange={e => setFormData({...formData, nip: e.target.value})} /></div><div><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">Wali Kelas (Opsional)</label><select className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white" value={formData.class_id} onChange={e => setFormData({...formData, class_id: e.target.value})}><option value="">-- Bukan Wali Kelas --</option>{availableClasses.map(c => <option key={c.id} value={c.id}>{c.name} {c.teacher_id ? '(Ada Guru)' : ''}</option>)}</select></div></>)}
                            {(formData.role === 'parent' || formData.role === 'contributor') && (<div className="md:col-span-2"><label className="block text-xs font-bold text-indigo-600 uppercase mb-2">WhatsApp</label><input required type="text" className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} /></div>)}
                        </div>

                        <div className="flex justify-end pt-4 gap-4">
                            {!isNew && <button type="button" onClick={() => setMode('view')} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>}
                            <button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"><Save size={20}/> Simpan</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UserDetail;