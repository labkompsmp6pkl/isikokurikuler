
import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// [FUNGSI BARU] Mengambil semua log untuk siswa yang login
export const getCharacterLogs = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;

    try {
        const [logs]: any = await pool.execute(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC',
            [studentId]
        );

        // Proses JSON string untuk worship_activities menjadi array
        const processedLogs = logs.map((log: any) => {
            if (log.worship_activities && typeof log.worship_activities === 'string') {
                try {
                    log.worship_activities = JSON.parse(log.worship_activities);
                } catch (e) {
                    log.worship_activities = []; // Default ke array kosong jika parse gagal
                }
            }
            return log;
        });

        res.status(200).json(processedLogs);
    } catch (error) {
        console.error('Database error in getCharacterLogs:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengambil data.' });
    }
};

interface CharacterLogData {
    log_date: string;
    wake_up_time: string;
    worship_activities: string[];
    healthy_food_notes: string;
    exercise_type: string;
    exercise_details: string;
    learning_subject: string;
    learning_details: string;
    social_activity_notes: string;
    sleep_time: string;
}

// [NAMA BARU] Mengganti nama fungsi menjadi lebih ringkas: upsert (update/insert)
export const upsertCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const { 
        log_date,
        wake_up_time,
        worship_activities,
        healthy_food_notes,
        exercise_type,
        exercise_details,
        learning_subject,
        learning_details,
        social_activity_notes,
        sleep_time 
    }: CharacterLogData = req.body;

    if (!log_date) {
        return res.status(400).json({ message: 'Tanggal log wajib diisi.' });
    }

    try {
        const [existingLogs]: any = await pool.execute(
            'SELECT id FROM character_logs WHERE student_id = ? AND log_date = ?',
            [studentId, log_date]
        );

        const worshipActivitiesJson = JSON.stringify(worship_activities || []);

        if (existingLogs.length > 0) {
            const logId = existingLogs[0].id;
            await pool.execute(
                `UPDATE character_logs SET 
                    wake_up_time = ?, worship_activities = ?, healthy_food_notes = ?, 
                    exercise_type = ?, exercise_details = ?, learning_subject = ?, 
                    learning_details = ?, social_activity_notes = ?, sleep_time = ?, 
                    status = 'Tersimpan' 
                WHERE id = ?`,
                [wake_up_time, worshipActivitiesJson, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time, logId]
            );
            res.status(200).json({ message: 'Catatan harian berhasil diperbarui.' });
        } else {
            await pool.execute(
                `INSERT INTO character_logs (student_id, log_date, wake_up_time, worship_activities, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tersimpan')`,
                [studentId, log_date, wake_up_time, worshipActivitiesJson, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time]
            );
            res.status(201).json({ message: 'Catatan harian berhasil disimpan.' });
        }
    } catch (error) {
        console.error('Database error in upsertCharacterLog:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat menyimpan catatan.' });
    }
};

export const getStudentDashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;

    try {
        // 1. Data Siswa
        const [userRows]: any = await pool.query('SELECT full_name, nisn, class FROM users WHERE id = ?', [studentId]);
        const user = userRows[0];

        // 2. Statistik Jurnal
        const [logStats]: any = await pool.query(
            `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Disahkan' THEN 1 ELSE 0 END) as approved FROM character_logs WHERE student_id = ?`,
            [studentId]
        );

        // 3. [FITUR KONTRIBUTOR] Ambil Total Poin Sikap
        const [scoreData]: any = await pool.query(
            `SELECT SUM(score) as total_score FROM behavior_records WHERE student_id = ?`,
            [studentId]
        );
        const behaviorScore = scoreData[0].total_score || 0;

        // 4. [FITUR KONTRIBUTOR] Ambil Misi Aktif
        const [missions]: any = await pool.query(
            `SELECT m.*, u.full_name as contributor_name 
             FROM missions m
             JOIN users u ON m.contributor_id = u.id
             WHERE m.student_id = ? AND m.is_completed = 0
             ORDER BY m.due_date ASC`,
            [studentId]
        );

        res.json({
            student: user,
            stats: {
                journalTotal: logStats[0].total,
                journalApproved: logStats[0].approved,
                behaviorScore: behaviorScore // Poin dari kontributor
            },
            missions: missions // List misi
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memuat dashboard.' });
    }
};

// [BARU] Selesaikan Misi
export const completeMission = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const { missionId } = req.body;

    try {
        await pool.query(
            'UPDATE missions SET is_completed = 1 WHERE id = ? AND student_id = ?',
            [missionId, studentId]
        );
        res.json({ message: 'Misi selesai!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update misi.' });
    }
};