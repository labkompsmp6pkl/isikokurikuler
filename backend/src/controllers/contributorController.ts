import { Request, Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// 1. Ambil Data Dropdown (Siswa & Kelas)
export const getContributorData = async (req: Request, res: Response) => {
    try {
        const [students]: any = await pool.query(`
            SELECT 
                u.id, 
                u.full_name, 
                u.nisn,
                c.name as class_name,
                t.full_name as teacher_name
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            LEFT JOIN users t ON c.teacher_id = t.id
            WHERE u.role = 'student'
            ORDER BY c.name ASC, u.full_name ASC
        `);

        const [classes]: any = await pool.query(`
            SELECT id, name FROM classes ORDER BY name ASC
        `);

        res.json({ students, classes });
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat data pendukung" });
    }
};

// 2. Simpan Nilai Sikap
export const submitBehaviorScore = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    
    const { 
        student_id, 
        contributor_role, 
        behavior_category, 
        score, 
        notes, 
        record_date 
    } = req.body;

    if (!student_id || !score || !contributor_role) {
        return res.status(400).json({ message: 'Data tidak lengkap. Pastikan Siswa, Peran, dan Skor terisi.' });
    }

    try {
        await pool.query(
            `INSERT INTO behavior_records (student_id, contributor_id, contributor_role, behavior_category, score, notes, record_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id, 
                contributorId, 
                contributor_role, 
                behavior_category, 
                score, 
                notes || '', 
                record_date
            ]
        );
        res.json({ message: 'Nilai sikap berhasil disimpan.' });
    } catch (error) {
        console.error("Error saving score:", error);
        res.status(500).json({ message: 'Gagal menyimpan nilai.' });
    }
};

// 3. Assign Misi (Manual - Deprecated/Optional, tapi tetap kita simpan jika ada sisa kode lama)
export const assignMission = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    const { studentId, targetClass, habit, title, dueDate } = req.body;

    if (!title || !dueDate) {
        return res.status(400).json({ message: 'Judul dan Tanggal wajib diisi.' });
    }

    try {
        if (studentId) {
            await pool.query(
                `INSERT INTO missions (contributor_id, student_id, habit_category, title, due_date) VALUES (?, ?, ?, ?, ?)`,
                [contributorId, studentId, habit, title, dueDate]
            );
        } else if (targetClass) {
            const [students]: any = await pool.query('SELECT id FROM users WHERE class = ? AND role = "student"', [targetClass]);
            
            if (students.length === 0) return res.status(404).json({ message: 'Tidak ada siswa di kelas tersebut.' });

            for (const s of students) {
                await pool.query(
                    `INSERT INTO missions (contributor_id, student_id, habit_category, title, due_date) VALUES (?, ?, ?, ?, ?)`,
                    [contributorId, s.id, habit, title, dueDate]
                );
            }
        }
        res.json({ message: 'Misi berhasil dijadwalkan.' });
    } catch (error) {
        console.error("Error assigning mission:", error);
        res.status(500).json({ message: 'Gagal membuat misi.' });
    }
};

// 4. Buat Jadwal Misi Berulang (Target Misi)
export const createMissionSchedule = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    const { title, habit_category, target_class, frequency, day_of_week, contributor_role } = req.body;

    if (!title || !habit_category || !target_class || !contributor_role) {
        return res.status(400).json({ message: 'Data misi tidak lengkap.' });
    }

    try {
        await pool.query(
            `INSERT INTO mission_schedules (contributor_id, contributor_role, title, habit_category, target_class, frequency, day_of_week) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [contributorId, contributor_role, title, habit_category, target_class, frequency, day_of_week]
        );

        res.json({ message: 'Target Misi berhasil dijadwalkan!' });
    } catch (error) {
        console.error("Error creating mission schedule:", error);
        res.status(500).json({ message: 'Gagal membuat jadwal misi.' });
    }
};

// 5. Riwayat Aktivitas (GABUNGAN MANUAL & MISI RUTIN)
export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;

    try {
        // Query 1: Penilaian Manual (Behavior Records)
        // Gunakan CAST(... AS CHAR) untuk menghindari error 'Illegal mix of collations'
        const manualQuery = `
            SELECT 
                br.id, 
                br.record_date, 
                br.score, 
                u.full_name as student_name, 
                c.name as class_name, 
                CAST('Manual' AS CHAR) as type, 
                CAST(br.notes AS CHAR) as notes, 
                CAST(br.contributor_role AS CHAR) as contributor_role
            FROM behavior_records br
            JOIN users u ON br.student_id = u.id
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE br.contributor_id = ?
        `;

        // Query 2: Misi Rutin yang Selesai (Mission Completions)
        const missionQuery = `
            SELECT 
                mc.id, 
                DATE(mc.completed_at) as record_date, 
                100 as score, 
                u.full_name as student_name, 
                c.name as class_name, 
                CAST('Misi Rutin' AS CHAR) as type, 
                CAST(ms.title AS CHAR) as notes, 
                CAST(ms.contributor_role AS CHAR) as contributor_role
            FROM mission_completions mc
            JOIN mission_schedules ms ON mc.mission_schedule_id = ms.id
            JOIN users u ON mc.student_id = u.id
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE ms.contributor_id = ?
        `;

        // Gabungkan kedua query
        const query = `
            SELECT * FROM (
                ${manualQuery}
                UNION ALL
                ${missionQuery}
            ) as combined_history
            ORDER BY record_date DESC, id DESC
            LIMIT 100
        `;

        const [rows] = await pool.query(query, [contributorId, contributorId]);
        res.json(rows);
    } catch (error) {
        console.error("Error history:", error);
        res.status(500).json({ message: 'Gagal memuat riwayat.' });
    }
};