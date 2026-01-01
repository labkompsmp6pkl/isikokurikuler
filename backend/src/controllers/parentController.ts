import { Request, Response } from 'express';
import pool from '../config/db';

// Fungsi untuk menautkan siswa ke orang tua berdasarkan NISN
export const linkStudent = async (req: Request, res: Response) => {
    const { nisn } = req.body;
    const parentId = (req as any).user.id;

    if (!nisn) {
        return res.status(400).json({ message: 'NISN siswa diperlukan.' });
    }

    try {
        const [studentRows]: any[] = await pool.query('SELECT id, parent_id FROM users WHERE nisn = ? AND role = \'student\'', [nisn]);
        
        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NISN ini tidak ditemukan.' });
        }
        
        const student = studentRows[0];

        if (student.parent_id) {
            if (student.parent_id === parentId) {
                return res.status(200).json({ message: 'Siswa ini sudah tertaut dengan akun Anda.' });
            } else {
                return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
            }
        }

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
        // 1. Cari siswa
        const [studentRows]: any[] = await pool.query(
            'SELECT id, full_name, class FROM users WHERE parent_id = ?',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        
        const student = studentRows[0]; 

        // 2. Ambil log karakter siswa yang statusnya 'Tersimpan' (Bukan 'pending')
        // PERBAIKAN DI SINI: Mengubah 'pending' menjadi 'Tersimpan'
        const [logRows]: any[] = await pool.query(
            "SELECT * FROM character_logs WHERE student_id = ? AND status = 'Tersimpan' ORDER BY log_date DESC",
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
        const [studentRows]: any[] = await pool.query(
            'SELECT id FROM users WHERE parent_id = ?',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        const studentId = studentRows[0].id;

        // Ambil semua riwayat
        const [historyRows]: any[] = await pool.query(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC',
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
        // Validasi kepemilikan
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

        // Update status menjadi 'Disetujui'
        const [updateResult]: any = await pool.query(
            "UPDATE character_logs SET status = 'Disetujui' WHERE id = ?",
            [logId]
        );

        if (updateResult.affectedRows === 0) {
             return res.status(404).json({ message: 'Gagal mengupdate log.' });
        }

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
      const [studentRows]: any[] = await pool.query(
          'SELECT full_name, class, parent_id FROM users WHERE nisn = ? AND role = \'student\'', 
          [nisn]
      );

      if (studentRows.length === 0) {
          return res.status(404).json({ message: 'Siswa dengan NISN ini tidak ditemukan.' });
      }

      const student = studentRows[0];

      if (student.parent_id) {
           return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
      }

      res.json({
          fullName: student.full_name,
          class: student.class
      });

  } catch (error) {
      console.error("Error previewing student:", error);
      res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};