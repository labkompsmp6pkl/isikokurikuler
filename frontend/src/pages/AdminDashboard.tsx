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
    if (isEditing) {
      // Logika pembaruan
      await adminService.updateStudent(form.id!, { name: form.name, email: form.email });
    } else {
      // Logika pembuatan
      await adminService.createStudent({ name: form.name, email: form.email, password: form.password });
    }
    resetForm();
    fetchStudents(); // Muat ulang daftar
  };

  // Mengisi formulir untuk diedit
  const handleEdit = (student: Student) => {
    setIsEditing(true);
    setForm({ id: student.id, name: student.name, email: student.email, password: '' });
  };

  // Handler untuk penghapusan
  const handleDelete = async (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      await adminService.deleteStudent(id);
      fetchStudents(); // Muat ulang daftar
    }
  };

  // Reset formulir
  const resetForm = () => {
    setIsEditing(false);
    setForm({ id: null, name: '', email: '', password: '' });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h2>Dasbor Admin</h2>

      {/* Formulir Tambah/Edit */}
      <form onSubmit={handleFormSubmit} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>{isEditing ? 'Edit Siswa' : 'Tambah Siswa Baru'}</h3>
        <input
          type="text"
          name="name"
          placeholder="Nama"
          value={form.name}
          onChange={handleFormChange}
          required
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleFormChange}
          required
          style={{ padding: '8px', marginRight: '10px' }}
        />
        {!isEditing && (
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleFormChange}
            required
            style={{ padding: '8px', marginRight: '10px' }}
          />
        )}
        <button type="submit" style={{ padding: '8px 12px', cursor: 'pointer' }}>{isEditing ? 'Perbarui' : 'Simpan'}</button>
        {isEditing && <button type="button" onClick={resetForm} style={{ padding: '8px 12px', marginLeft: '10px' }}>Batal</button>}
      </form>

      <h3>Daftar Siswa</h3>
      {isLoading && <p>Memuat siswa...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nama</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.name}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{student.email}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(student)} style={{ marginRight: '5px' }}>Edit</button>
                  <button onClick={() => handleDelete(student.id)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminDashboard;
