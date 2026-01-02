import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import adminService from '../../../services/adminService';

const UserDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(false);
    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        nisn: '',
        nip: '',
        class_id: '', // Diubah dari 'class' menjadi 'class_id'
        whatsapp_number: ''
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 1. Ambil daftar kelas untuk dropdown
                const classes = await adminService.getClasses();
                setAvailableClasses(classes);

                // 2. Jika edit, ambil data user
                if (!isNew && id) {
                    const data = await adminService.getUserById(id);
                    setFormData({ 
                        ...data, 
                        class_id: data.class_id || '', // Pastikan menggunakan class_id
                        password: '' 
                    });
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal memuat data', 'error');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Di dalam UserDetail.tsx, pastikan fungsi handleSubmit melakukan casting ke Number
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = { 
            ...formData,
            // FIX: Pastikan class_id dikirim sebagai angka, jika kosong kirim null
            class_id: formData.class_id ? Number(formData.class_id) : null 
        };

        if (isNew) {
            await adminService.createUser(payload);
        } else {
            await adminService.updateUser(id!, payload);
        }
        Swal.fire('Sukses', 'Data berhasil disimpan', 'success');
        navigate('/admin/users');
    } catch (error: any) {
        Swal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan', 'error');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="p-6 max-w-4xl mx-auto animate-fade-in">
            <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-bold transition-colors">
                <ArrowLeft size={20}/> Kembali
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                    <h1 className="text-2xl font-black text-indigo-900">
                        {isNew ? 'Tambah User Baru' : `Edit User: ${formData.full_name}`}
                    </h1>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Nama Lengkap</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Password {isNew ? '(Wajib)' : '(Kosongkan jika tidak ganti)'}</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required={isNew} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Role Pengguna</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="student">Siswa</option>
                                <option value="teacher">Guru</option>
                                <option value="parent">Orang Tua</option>
                                <option value="contributor">Kontributor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="py-2"><div className="border-t border-slate-100"></div></div>

                    {/* FIELD KHUSUS ROLE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 p-6 rounded-2xl border border-indigo-50">
                        {formData.role === 'student' && (
                            <>
                                <div>
                                    <label className="block text-xs font-black text-indigo-600 uppercase mb-2">NISN</label>
                                    <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:bg-white"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-indigo-600 uppercase mb-2">Penempatan Kelas</label>
                                    <select 
    name="class_id" 
    value={formData.class_id || ""} // Mencegah uncontrolled component
    onChange={handleChange} 
    className="w-full p-3 border rounded-xl bg-white"
>
    <option value="">Tidak Ada / Pilih Kelas</option>
    {availableClasses.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
    ))}
</select>
                                </div>
                            </>
                        )}

                        {formData.role === 'teacher' && (
                            <>
                                <div>
                                    <label className="block text-xs font-black text-indigo-600 uppercase mb-2">NIP / ID Guru</label>
                                    <input type="text" name="nip" value={formData.nip} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:bg-white"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-indigo-600 uppercase mb-2">Wali Kelas (Opsional)</label>
                                    <select name="class_id" value={formData.class_id} onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white">
                                        <option value="">Bukan Wali Kelas</option>
                                        {availableClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {(formData.role === 'parent' || formData.role === 'contributor') && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-indigo-600 uppercase mb-2">Nomor WhatsApp Aktif</label>
                                <input type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="Contoh: 08123456789" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:bg-white"/>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="px-10 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:translate-y-0">
                            <Save size={20}/> {loading ? 'Memproses...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDetail;