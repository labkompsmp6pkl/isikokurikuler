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

// --- Helper untuk memproses log --- //
const processLogs = (logs: any[]): CharacterLog[] => {
    return logs.map((log: CharacterLog) => {
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
};


// --- Controller untuk Dasbor Utama (data terbatas) --- //
export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ message: 'Akses ditolak.' });

    try {
        const [studentRows]: any = await db.execute(
            'SELECT id, full_name, class FROM users WHERE parent_id = ? AND role = \'student\' LIMIT 1',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Tidak ada siswa terhubung.' });
        }

        const student = studentRows[0];
        const [logRows]: any = await db.execute(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC LIMIT 15', // Ambil 15 log terbaru
            [student.id]
        );

        res.json({
            student: {
                id: student.id,
                fullName: student.full_name,
                class: student.class
            },
            logs: processLogs(logRows),
        });

    } catch (error) {
        console.error('Error in getDashboardData (Parent):', error);
        res.status(500).json({ message: 'Kesalahan Server Internal' });
    }
};

// --- [FITUR BARU] Controller untuk mengambil SEMUA riwayat log --- //
export const getLogHistory = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    if (!parentId) return res.status(401).json({ message: 'Akses ditolak.' });

    try {
        // 1. Dapatkan ID siswa yang terhubung dengan orang tua
        const [studentRows]: any = await db.execute(
            'SELECT id FROM users WHERE parent_id = ? AND role = \'student\' LIMIT 1',
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Tidak ada siswa terhubung.' });
        }

        const studentId = studentRows[0].id;

        // 2. Ambil semua log untuk siswa tersebut
        const [logRows]: any = await db.execute(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC',
            [studentId]
        );
        
        // 3. Proses dan kirim data
        res.json(processLogs(logRows));

    } catch (error) {
        console.error('Error fetching log history:', error);
        res.status(500).json({ message: 'Gagal mengambil riwayat log.' });
    }
};


// --- Controller untuk menyetujui log (tidak berubah) --- //
export const approveCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const { logId } = req.params;
    const parentId = req.user?.id;

    try {
        // Verifikasi bahwa log milik siswa dari orang tua ini
        const [logRows]: any = await db.execute(
            `SELECT cl.id FROM character_logs cl
             JOIN users s ON cl.student_id = s.id
             WHERE cl.id = ? AND s.parent_id = ?`,
            [logId, parentId]
        );

        if (logRows.length === 0) {
            return res.status(403).json({ message: 'Akses ditolak untuk log ini.' });
        }

        const [updateResult]: any = await db.execute(
            "UPDATE character_logs SET status = 'Disetujui' WHERE id = ?",
            [logId]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Log tidak ditemukan.' });
        }
        
        const [updatedLogRows]: any = await db.execute('SELECT * FROM character_logs WHERE id = ?', [logId]);

        res.json({ 
            message: 'Log berhasil disetujui.',
            log: processLogs(updatedLogRows)[0] 
        });

    } catch (error) {
        console.error('Error approving log:', error);
        res.status(500).json({ message: 'Gagal menyetujui log.' });
    }
};

// --- Controller untuk menautkan siswa (tidak berubah) --- //
export const linkStudent = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    const { nisn } = req.body;

    if (!nisn) {
        return res.status(400).json({ message: 'NISN diperlukan.' });
    }

    try {
        const [studentRows]: any = await db.execute(
            'SELECT id, full_name, class, parent_id FROM users WHERE nisn = ? AND role = \'student\' LIMIT 1',
            [nisn]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NISN tersebut tidak ditemukan.' });
        }

        const student = studentRows[0];

        if (student.parent_id && student.parent_id !== parentId) {
            return res.status(409).json({ message: 'Siswa ini sudah terhubung dengan akun orang tua lain.' });
        }
        
        if (student.parent_id === parentId) {
             return res.status(200).json({ 
                message: 'Akun Anda sudah terhubung dengan siswa ini.',
                student: { id: student.id, fullName: student.full_name, class: student.class }
            });
        }

        await db.execute(
            'UPDATE users SET parent_id = ? WHERE id = ?',
            [parentId, student.id]
        );

        res.status(200).json({
            message: 'Akun berhasil ditautkan dengan siswa.',
            student: {
                id: student.id,
                fullName: student.full_name,
                class: student.class
            }
        });

    } catch (error) {
        console.error('Error linking student:', error);
        res.status(500).json({ message: 'Kesalahan server saat mencoba menautkan siswa.' });
    }
};
