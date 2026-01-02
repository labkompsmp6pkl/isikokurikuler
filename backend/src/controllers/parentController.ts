import { Request, Response } from 'express';
import pool from '../config/db';

// Helper: Ubah string JSON database menjadi Array/Object JavaScript
const parseJSON = (data: any) => {
    if (!data) return [];
    try {
        // Jika sudah object/array, kembalikan langsung
        if (typeof data === 'object') return data;
        // Jika string, coba parse
        return JSON.parse(data);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return []; // Jika error (misal text biasa), kembalikan array kosong
    }
};

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

export const getDashboardData = async (req: Request, res: Response) => {
    const parentId = (req as any).user.id;

    try {
        // Ambil Data Siswa
        const [studentRows]: any[] = await pool.query(
            'SELECT id, full_name, class FROM users WHERE parent_id = ?',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        
        const student = studentRows[0]; 

        // Ambil Log (Hanya yang statusnya 'Tersimpan' untuk validasi, atau ambil semua utk history)
        // Di dashboard biasanya kita butuh list validasi & history, disini kita ambil yg Tersimpan dulu
        // atau sesuaikan dengan kebutuhan frontend Anda. 
        // Code ini mengambil SEMUA log untuk dipilah di frontend (pending vs history)
        const [logRows]: any[] = await pool.query(
            "SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC LIMIT 50",
            [student.id]
        );

        // [FIX] Lakukan Parsing JSON di sini sebelum dikirim ke Frontend
        const processedLogs = logRows.map((log: any) => ({
            ...log,
            // Parse data Eksekusi
            worship_activities: parseJSON(log.worship_activities),
            study_activities: parseJSON(log.study_activities),
            social_activities: parseJSON(log.social_activities),
            
            // Parse data Rencana (jika ada fitur rencana)
            plan_worship_activities: parseJSON(log.plan_worship_activities),
            plan_study_activities: parseJSON(log.plan_study_activities),
            plan_social_activities: parseJSON(log.plan_social_activities),
        }));

        res.json({ student, logs: processedLogs });

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