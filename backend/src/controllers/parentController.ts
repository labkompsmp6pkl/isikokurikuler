
import { Request, Response } from 'express';
import db from '../config/db'; 
import { AuthenticatedRequest } from '../middleware/authMiddleware';

interface CharacterLog {
    id: number;
    student_id: number;
    log_date: string;
    status: 'Tersimpan' | 'Disetujui';
    worship_activities?: string[] | string;
}

export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;

    if (!parentId) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak valid.' });
    }

    try {
        // [PERBAIKAN] Mengganti 'fullName' menjadi 'full_name' agar sesuai dengan skema database
        const [studentRows]: any = await db.execute(
            'SELECT id, full_name, class FROM users WHERE parent_id = ? AND role = \'student\' LIMIT 1',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Tidak ada data siswa yang terhubung dengan akun orang tua ini.' });
        }

        const student = studentRows[0];
        const studentId = student.id;

        const [logRows]: any = await db.execute(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC',
            [studentId]
        );

        const processedLogs = logRows.map((log: CharacterLog) => {
            if (log.worship_activities && typeof log.worship_activities === 'string') {
                try {
                    log.worship_activities = JSON.parse(log.worship_activities);
                } catch (e) {
                    log.worship_activities = [];
                }
            } else if (!log.worship_activities) {
                log.worship_activities = [];
            }
            return log;
        });

        // [PERBAIKAN] Mengirim data siswa dengan nama properti yang konsisten (camelCase) ke frontend
        res.json({
            student: {
                id: student.id,
                fullName: student.full_name, // Mengubah snake_case ke camelCase
                class: student.class
            },
            logs: processedLogs,
        });

    } catch (error) {
        console.error('Error in getDashboardData (Parent):', error);
        res.status(500).json({ message: 'Kesalahan Server Internal', error: (error as Error).message });
    }
};

export const approveCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    const { logId } = req.params;

    if (!parentId) {
        return res.status(401).json({ message: 'Akses ditolak.' });
    }

    try {
        const [verificationRows]: any = await db.execute(`
            SELECT cl.id
            FROM character_logs cl
            JOIN users s ON cl.student_id = s.id
            WHERE cl.id = ? AND s.parent_id = ?
        `, [logId, parentId]);

        if (verificationRows.length === 0) {
            return res.status(404).json({ message: 'Log tidak ditemukan atau Anda tidak memiliki izin untuk menyetujui log ini.' });
        }

        const [updateResult]: any = await db.execute(
            'UPDATE character_logs SET status = ? WHERE id = ?',
            ['Disetujui', logId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Gagal memperbarui log. Log tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Log berhasil disetujui.' });

    } catch (error) {
        console.error('Error in approveCharacterLog:', error);
        res.status(500).json({ message: 'Kesalahan Server Internal', error: (error as Error).message });
    }
};

export const linkStudent = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    const { nisn } = req.body; // Mengambil NISN dari body permintaan

    if (!parentId) {
        return res.status(401).json({ message: 'Akses ditolak. Anda harus masuk sebagai orang tua.' });
    }

    if (!nisn) {
        return res.status(400).json({ message: 'NISN siswa diperlukan untuk menautkan akun.' });
    }

    try {
        // 1. Cari siswa di database berdasarkan NISN dan pastikan perannya adalah 'student'
        const [studentRows]: any = await db.execute(
            'SELECT * FROM users WHERE nisn = ? AND role = \'student\'',
            [nisn]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NISN tersebut tidak ditemukan.' });
        }

        const student = studentRows[0];

        // 2. Periksa apakah siswa sudah memiliki orang tua yang tertaut
        if (student.parent_id) {
            if (student.parent_id === parentId) {
                 return res.status(200).json({ 
                    message: 'Akun Anda sudah terhubung dengan siswa ini.',
                    student: {
                        id: student.id,
                        fullName: student.full_name,
                        class: student.class,
                    }
                });
            }
            return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
        }

        // 3. Jika belum, perbarui kolom parent_id siswa dengan id orang tua
        await db.execute(
            'UPDATE users SET parent_id = ? WHERE id = ?',
            [parentId, student.id]
        );

        // 4. Kirim respons sukses beserta data siswa yang baru ditautkan
        res.status(200).json({
            message: 'Akun siswa berhasil ditautkan!',
            student: {
                id: student.id,
                fullName: student.full_name,
                class: student.class,
            }
        });

    } catch (error) {
        console.error('Error in linkStudent:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mencoba menautkan siswa.' });
    }
};
