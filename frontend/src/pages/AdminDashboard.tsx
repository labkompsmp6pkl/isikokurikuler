import React, { useState, useEffect, ChangeEvent } from 'react';
import adminService from '../services/adminService';

// Definisikan tipe untuk objek siswa
interface Student {
  id: number;
  name: string;
  email: string;
}

const AdminDashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk formulir
  const [form, setForm] = useState({ id: null as number | null, name: '', email: '', password: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Fungsi untuk mengambil siswa
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getStudents();
      setStudents(response.data.students);
    } catch (err) {
      setError('Gagal memuat data siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Handler untuk perubahan input formulir
  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handler untuk pengiriman formulir
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Logika pembaruan
        await adminService.updateStudent(form.id!, { name: form.name, email: form.email });
      } else {
        // Logika pembuatan
        await adminService.createStudent({ name: form.name, email: form.email, password: form.password });
      }
      resetForm();
      fetchStudents(); // Muat ulang daftar
    } catch (err) {
      setError(isEditing ? 'Gagal memperbarui siswa.' : 'Gagal membuat siswa.');
    }
  };

  // Mengisi formulir untuk diedit
  const handleEdit = (student: Student) => {
    setIsEditing(true);
    setForm({ id: student.id, name: student.name, email: student.email, password: '' });
  };

  // Handler untuk penghapusan
  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      try {
        await adminService.deleteStudent(id);
        fetchStudents(); // Muat ulang daftar
      } catch (err) {
        setError('Gagal menghapus siswa.');
      }
    }
  };

  // Reset formulir
  const resetForm = () => {
    setIsEditing(false);
    setForm({ id: null, name: '', email: '', password: '' });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dasbor Admin</h2>

        {/* Formulir Tambah/Edit */}
        <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">{isEditing ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                placeholder="Nama Lengkap"
                value={form.name}
                onChange={handleFormChange}
                required
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Alamat Email"
                value={form.email}
                onChange={handleFormChange}
                required
                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {!isEditing && (
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleFormChange}
                  required
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
            <div className="flex items-center">
              <button type="submit" className="py-2 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
                {isEditing ? 'Perbarui Siswa' : 'Simpan Siswa'}
              </button>
              {isEditing && (
                <button type="button" onClick={resetForm} className="py-2 px-6 ml-4 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none">
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Daftar Siswa */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <h3 className="text-2xl font-semibold text-gray-700 p-6">Daftar Siswa</h3>
          {isLoading && <p className="p-6">Memuat siswa...</p>}
          {error && <p className="p-6 text-red-500 bg-red-100">{error}</p>}
          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Nama</th>
                    <th className="p-4 font-semibold text-gray-600">Email</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-4 text-gray-800">{student.name}</td>
                      <td className="p-4 text-gray-800">{student.email}</td>
                      <td className="p-4 text-center space-x-2">
                        <button onClick={() => handleEdit(student)} className="py-1 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Edit</button>
                        <button onClick={() => handleDelete(student.id)} className="py-1 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
