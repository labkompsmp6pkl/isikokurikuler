import { Request, Response } from 'express';
import pool from '../config/db';

// Fungsi untuk menautkan siswa ke orang tua berdasarkan NISN
export const linkStudent = async (req: Request, res: Response) => {
    const { nisn } = req.body;
    const parentId = (req as any).user.id; // Diambil dari token JWT

    if (!nisn) {
        return res.status(400).json({ message: 'NISN siswa diperlukan.' });
    }

    try {
        // 1. Cari ID siswa berdasarkan NISN
        const [studentRows]: any[] = await pool.query('SELECT id, parent_id FROM users WHERE nisn = ? AND role = \'student\'', [nisn]);
        
        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NISN ini tidak ditemukan.' });
        }
        
        const student = studentRows[0];

        // 2. Cek apakah siswa sudah punya orang tua (parent_id tidak null)
        if (student.parent_id) {
            if (student.parent_id === parentId) {
                return res.status(200).json({ message: 'Siswa ini sudah tertaut dengan akun Anda.' });
            } else {
                return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
            }
        }

        // 3. Update parent_id di data siswa (users table)
        await pool.query('UPDATE users SET parent_id = ? WHERE id = ?', [parentId, student.id]);
        
        res.status(200).json({ message: 'Siswa berhasil ditautkan!' });

    } catch (error) {
        console.error("Error linking student:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

// Fungsi untuk mengambil data awal dasbor orang tua
export const getDashboardData = async (req: Request, res: Response) => {
    const parentId = (req as any).user.id;

    try {
        // 1. Cari siswa yang parent_id-nya adalah user yang sedang login
        // Kita langsung cari di tabel users
        const [studentRows]: any[] = await pool.query(
            'SELECT id, full_name, class FROM users WHERE parent_id = ?',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        
        // Asumsi satu orang tua satu siswa (jika banyak, perlu loop, tapi di sini kita ambil yg pertama dulu sesuai logika awal)
        const student = studentRows[0]; 

        // 2. Ambil log karakter siswa yang perlu persetujuan
        const [logRows]: any[] = await pool.query(
            'SELECT * FROM character_logs WHERE student_id = ? AND status = \'pending\' ORDER BY created_at DESC',
            [student.id]
        );

        res.json({ student, logs: logRows });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ message: 'Gagal memuat data dasbor.' });
    }
};

// Fungsi untuk melihat riwayat log karakter
export const getLogHistory = async (req: Request, res: Response) => {
    const parentId = (req as any).user.id;

    try {
        // 1. Cari siswa berdasarkan parent_id
        const [studentRows]: any[] = await pool.query(
            'SELECT id FROM users WHERE parent_id = ?',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        const studentId = studentRows[0].id;

        // 2. Ambil semua riwayat log
        const [historyRows]: any[] = await pool.query(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY created_at DESC',
            [studentId]
        );

        res.json(historyRows);

    } catch (error) {
        console.error("Error fetching log history:", error);
        res.status(500).json({ message: 'Gagal memuat riwayat log.' });
    }
};

// Fungsi untuk menyetujui log karakter
export const approveCharacterLog = async (req: Request, res: Response) => {
    const { logId } = req.params;
    const parentId = (req as any).user.id;

    try {
        // Validasi: Join ke tabel users untuk memastikan siswa pemilik log ini adalah anak dari parent yang login
        const [logRows]: any[] = await pool.query(
            `SELECT cl.id 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE cl.id = ? AND u.parent_id = ?`,
            [logId, parentId]
        );

        if (logRows.length === 0) {
            return res.status(403).json({ message: 'Anda tidak berhak mengakses log ini atau log tidak ditemukan.' });
        }

        // Update status log menjadi 'approved'
        // ENUM di database adalah: 'Tersimpan', 'Disetujui', 'Disahkan'
        // Jadi kita ubah 'approved' menjadi 'Disetujui' sesuai SQL Dump
        const [updateResult]: any = await pool.query(
            'UPDATE character_logs SET status = \'Disetujui\' WHERE id = ?',
            [logId]
        );

        if (updateResult.affectedRows === 0) {
             return res.status(404).json({ message: 'Gagal mengupdate log.' });
        }

        // Ambil data log yang sudah diupdate untuk dikirim balik
        const [updatedLogRows]: any[] = await pool.query('SELECT * FROM character_logs WHERE id = ?', [logId]);

        res.json(updatedLogRows[0]);

    } catch (error) {
        console.error('Error approving log:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

export const previewStudentByNisn = async (req: Request, res: Response) => {
  const { nisn } = req.body;

  if (!nisn) {
      return res.status(400).json({ message: 'NISN siswa diperlukan.' });
  }

  try {
      // Cari siswa berdasarkan NISN (hanya ambil nama dan kelas)
      const [studentRows]: any[] = await pool.query(
          'SELECT full_name, class, parent_id FROM users WHERE nisn = ? AND role = \'student\'', 
          [nisn]
      );

      if (studentRows.length === 0) {
          return res.status(404).json({ message: 'Siswa dengan NISN ini tidak ditemukan.' });
      }

      const student = studentRows[0];

      // Cek apakah sudah ada orang tua lain (opsional, untuk warning awal)
      if (student.parent_id) {
           return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
      }

      // Kembalikan data preview
      res.json({
          fullName: student.full_name,
          class: student.class
      });

  } catch (error) {
      console.error("Error previewing student:", error);
      res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};