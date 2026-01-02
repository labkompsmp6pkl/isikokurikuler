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
        // Ambil Data Siswa dengan JOIN ke tabel classes untuk dapat Nama Kelas
        const [studentRows]: any[] = await pool.query(
            `SELECT u.id, u.full_name, u.class_id, c.name as class 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.parent_id = ? AND u.role = 'student' 
             LIMIT 1`,
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Belum ada siswa yang terhubung.' });
        }
        
        const student = studentRows[0]; 

        // Ambil Log Karakter
        const [logRows]: any[] = await pool.query(
            "SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC LIMIT 50",
            [student.id]
        );

        const processedLogs = logRows.map((log: any) => ({
            ...log,
            worship_activities: parseJSON(log.worship_activities),
            study_activities: parseJSON(log.study_activities),
            social_activities: parseJSON(log.social_activities),
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

export const approveCharacterLog = async (req: Request, res: Response) => {
    const { logId } = req.params;
    const parentId = (req as any).user.id;
    try {
        const [logRows]: any[] = await pool.query(
            `SELECT cl.id FROM character_logs cl JOIN users u ON cl.student_id = u.id WHERE cl.id = ? AND u.parent_id = ?`,
            [logId, parentId]
        );
        if (logRows.length === 0) return res.status(403).json({ message: 'Akses ditolak.' });

        await pool.query("UPDATE character_logs SET status = 'Disetujui' WHERE id = ?", [logId]);
        const [updated]: any[] = await pool.query('SELECT * FROM character_logs WHERE id = ?', [logId]);
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal validasi.' });
    }
};

export const previewStudentByNisn = async (req: Request, res: Response) => {
    const { nisn } = req.body;

    if (!nisn) {
        return res.status(400).json({ message: 'NISN siswa diperlukan.' });
    }

    try {
        const [studentRows]: any[] = await pool.query(
            `SELECT u.full_name, u.parent_id, c.name as class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.nisn = ? AND u.role = 'student'`, 
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
            class: student.class_name || 'Tanpa Kelas' // Mengirim nama kelas asli
        });

    } catch (error) {
        console.error("Error previewing student:", error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};