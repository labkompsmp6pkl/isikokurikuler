import { Response } from 'express';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// 1. Ambil Data Kelas & Siswa (Untuk Dropdown)
export const getContributorData = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const [classes]: any = await pool.query('SELECT DISTINCT class FROM users WHERE role = "student" AND class IS NOT NULL ORDER BY class ASC');
        const [students]: any = await pool.query('SELECT id, full_name, class FROM users WHERE role = "student" ORDER BY class ASC, full_name ASC');
        
        res.json({ 
            classes: classes.map((c:any) => c.class),
            students 
        });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: 'Gagal memuat data.' });
    }
};

// 2. Simpan Nilai Sikap
export const submitBehaviorScore = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    const { studentId, role, category, score, notes, date } = req.body;

    if (!studentId || !score) {
        return res.status(400).json({ message: 'Data tidak lengkap.' });
    }

    try {
        await pool.query(
            `INSERT INTO behavior_records (student_id, contributor_id, contributor_role, behavior_category, score, notes, record_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, contributorId, role, category, score, notes || '', date]
        );
        res.json({ message: 'Nilai sikap berhasil disimpan.' });
    } catch (error) {
        console.error("Error saving score:", error);
        res.status(500).json({ message: 'Gagal menyimpan nilai.' });
    }
};

// 3. Assign Misi (Tantangan)
export const assignMission = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    const { studentId, targetClass, habit, title, dueDate } = req.body;

    if (!title || !dueDate) {
        return res.status(400).json({ message: 'Judul dan Tanggal wajib diisi.' });
    }

    try {
        if (studentId) {
            // A. Assign ke 1 Siswa
            await pool.query(
                `INSERT INTO missions (contributor_id, student_id, habit_category, title, due_date) VALUES (?, ?, ?, ?, ?)`,
                [contributorId, studentId, habit, title, dueDate]
            );
        } else if (targetClass) {
            // B. Assign ke 1 Kelas (Broadcast)
            const [students]: any = await pool.query('SELECT id FROM users WHERE class = ? AND role = "student"', [targetClass]);
            
            if (students.length === 0) return res.status(404).json({ message: 'Tidak ada siswa di kelas tersebut.' });

            // Loop insert agar setiap siswa punya record misi sendiri (untuk tracking is_completed individual)
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

// 4. Riwayat Aktivitas Kontributor
export const getHistory = async (req: AuthenticatedRequest, res: Response) => {
    const contributorId = req.user?.id;
    const { filterClass, filterStudent } = req.query;

    try {
        let query = `
            SELECT br.id, br.record_date, br.behavior_category as category, br.score, 
                   u.full_name as student_name, u.class, 'Sikap' as type
            FROM behavior_records br
            JOIN users u ON br.student_id = u.id
            WHERE br.contributor_id = ?
        `;
        
        const params: any[] = [contributorId];

        if (filterClass && filterClass !== 'Semua Kelas') {
            query += ` AND u.class = ?`;
            params.push(filterClass);
        }
        
        if (filterStudent) {
            query += ` AND u.full_name LIKE ?`;
            params.push(`%${filterStudent}%`);
        }

        query += ` ORDER BY br.record_date DESC LIMIT 50`;

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error("Error history:", error);
        res.status(500).json({ message: 'Gagal memuat riwayat.' });
    }
};