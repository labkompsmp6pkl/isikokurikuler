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
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        nisn: '',
        nip: '',
        class: '',
        whatsapp_number: ''
    });

    useEffect(() => {
        if (!isNew && id) {
            fetchUser(id);
        }
    }, [id]);

    const fetchUser = async (userId: string) => {
        setLoading(true);
        try {
            const data = await adminService.getUserById(userId);
            setFormData({ ...data, password: '' }); // Kosongkan password saat edit
        } catch (error) {
            Swal.fire('Error', 'User tidak ditemukan', 'error');
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isNew) {
                await adminService.createUser(formData);
                Swal.fire('Sukses', 'User berhasil dibuat!', 'success');
            } else {
                await adminService.updateUser(id!, formData);
                Swal.fire('Sukses', 'Data user berhasil diperbarui!', 'success');
            }
            navigate('/admin/users');
        } catch (error) {
            Swal.fire('Gagal', 'Terjadi kesalahan sistem.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isNew) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-bold">
                <ArrowLeft size={20}/> Kembali
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-indigo-50">
                    <h1 className="text-2xl font-black text-indigo-900">
                        {isNew ? 'Tambah User Baru' : `Edit User: ${formData.full_name}`}
                    </h1>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Nama Lengkap</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Password {isNew ? '(Wajib)' : '(Kosongkan jika tidak ubah)'}</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required={isNew} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-600 mb-2">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                                <option value="student">Siswa</option>
                                <option value="teacher">Guru</option>
                                <option value="parent">Orang Tua</option>
                                <option value="contributor">Kontributor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-100"/>

                    {/* Conditional Fields based on Role */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl">
                        {formData.role === 'student' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NISN</label>
                                    <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kelas</label>
                                    <select name="class" value={formData.class} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg">
                                        <option value="">Pilih Kelas</option>
                                        {['7A','7B','8A','8B','9A','9B'].map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.role === 'teacher' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIP</label>
                                    <input type="text" name="nip" value={formData.nip} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Wali Kelas (Opsional)</label>
                                    <select name="class" value={formData.class} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg">
                                        <option value="">Bukan Wali Kelas</option>
                                        {['7A','7B','8A','8B','9A','9B'].map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {(formData.role === 'parent' || formData.role === 'contributor') && (
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nomor WhatsApp / HP</label>
                                <input type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-lg"/>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <Save size={20}/> {loading ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDetail;