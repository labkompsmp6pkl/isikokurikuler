import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ------------------------------------------------------------------
// [REVISI] Mengambil Data Dashboard Siswa
// Perbaikan: Menambahkan kolom 'graduation_year' dan 'last_class_name'
// ------------------------------------------------------------------
export const getStudentDashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;

    try {
        // [PASTIKAN QUERY SELECT MENGAMBIL graduation_year]
        const [userRows]: any = await pool.query(
            'SELECT full_name, nisn, class, role, graduation_year, last_class_name FROM users WHERE id = ?', 
            [studentId]
        );
        
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Siswa tidak ditemukan' });
        }
        
        const user = userRows[0];

        // 2. Statistik Jurnal
        const [logStats]: any = await pool.query(
            `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Disahkan' THEN 1 ELSE 0 END) as approved FROM character_logs WHERE student_id = ?`,
            [studentId]
        );

        // 3. Total Poin Sikap
        const [scoreData]: any = await pool.query(
            `SELECT SUM(score) as total_score FROM behavior_records WHERE student_id = ?`,
            [studentId]
        );
        const behaviorScore = scoreData[0].total_score || 0;

        // 4. Misi Individu Aktif
        // Alumni boleh melihat data ini (Read Only), jadi tidak ada blokir 403
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
                behaviorScore: behaviorScore
            },
            missions: missions
        });

    } catch (error) {
        console.error("Error dashboard:", error);
        res.status(500).json({ message: 'Gagal memuat dashboard.' });
    }
};

// ------------------------------------------------------------------
// [REVISI] Mengambil Daftar Misi Harian
// Perbaikan: Jika Alumni, return kosong (200 OK), JANGAN 403.
// ------------------------------------------------------------------
export const getStudentMissions = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const userRole = req.user?.role;
    
    // [FIX 403 ERROR]
    // Jika alumni, cukup berikan array kosong agar frontend tidak crash/error.
    // Jangan kirim 403 Forbidden untuk request GET (Read).
    if (userRole === 'alumni') {
        return res.status(200).json([]); 
    }

    try {
        // Ambil class_id siswa
        const [userRows]: any = await pool.query('SELECT class_id FROM users WHERE id = ?', [studentId]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const classId = userRows[0].class_id;
        
        // Jika classId null (misal transisi data), return kosong
        if (!classId) return res.status(200).json([]);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[new Date().getDay()];

        const query = `
            SELECT 
                ms.*, 
                u.full_name as contributor_name,
                (SELECT COUNT(*) FROM mission_completions mc 
                 WHERE mc.mission_schedule_id = ms.id 
                 AND mc.student_id = ? 
                 AND DATE(mc.completed_at) = CURDATE()) as is_completed
            FROM mission_schedules ms
            JOIN users u ON ms.contributor_id = u.id
            WHERE (ms.target_class = ? OR ms.target_class IS NULL)
            AND (ms.frequency = 'daily' OR ms.day_of_week = ?)
            ORDER BY is_completed ASC, ms.id DESC
        `;

        const [missions] = await pool.query(query, [studentId, classId, todayName]);
        res.json(missions);

    } catch (error) {
        console.error("Error get missions:", error);
        res.status(500).json({ message: 'Gagal memuat misi.' });
    }
};

// ------------------------------------------------------------------
// FUNGSI LAIN (TETAP SAMA - Write Access tetap diblokir untuk Alumni)
// ------------------------------------------------------------------

export const getCharacterLogs = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    try {
        const [logs]: any = await pool.execute(
            'SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC',
            [studentId]
        );
        const processedLogs = logs.map((log: any) => {
            if (log.worship_activities && typeof log.worship_activities === 'string') {
                try { log.worship_activities = JSON.parse(log.worship_activities); } catch (e) { log.worship_activities = []; }
            }
            return log;
        });
        res.status(200).json(processedLogs);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

export const upsertCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const userRole = req.user?.role;

    // [TETAP] Write Access diblokir
    if (userRole === 'alumni') {
        return res.status(403).json({ message: 'Status Alumni: Data terkunci.' });
    }

    const { log_date, wake_up_time, worship_activities, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time }: any = req.body;
    if (!log_date) return res.status(400).json({ message: 'Tanggal wajib diisi.' });

    try {
        const [existingLogs]: any = await pool.execute('SELECT id FROM character_logs WHERE student_id = ? AND log_date = ?', [studentId, log_date]);
        const worshipJson = JSON.stringify(worship_activities || []);

        if (existingLogs.length > 0) {
            const logId = existingLogs[0].id;
            await pool.execute(
                `UPDATE character_logs SET wake_up_time=?, worship_activities=?, healthy_food_notes=?, exercise_type=?, exercise_details=?, learning_subject=?, learning_details=?, social_activity_notes=?, sleep_time=?, status='Tersimpan' WHERE id=?`,
                [wake_up_time, worshipJson, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time, logId]
            );
            res.status(200).json({ message: 'Diperbarui.' });
        } else {
            await pool.execute(
                `INSERT INTO character_logs (student_id, log_date, wake_up_time, worship_activities, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tersimpan')`,
                [studentId, log_date, wake_up_time, worshipJson, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time]
            );
            res.status(201).json({ message: 'Disimpan.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan.' });
    }
};

export const completeMission = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const userRole = req.user?.role;
    const { scheduleId } = req.body;

    // [TETAP] Write Access diblokir
    if (userRole === 'alumni') {
        return res.status(403).json({ message: 'Akun Alumni tidak dapat menyelesaikan misi.' });
    }

    try {
        const [check]: any = await pool.query(`SELECT id FROM mission_completions WHERE mission_schedule_id = ? AND student_id = ? AND DATE(completed_at) = CURDATE()`, [scheduleId, studentId]);
        if (check.length > 0) return res.status(400).json({ message: 'Misi sudah selesai.' });

        await pool.query(`INSERT INTO mission_completions (mission_schedule_id, student_id) VALUES (?, ?)`, [scheduleId, studentId]);
        res.json({ message: 'Misi selesai!' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menyelesaikan misi.' });
    }
};