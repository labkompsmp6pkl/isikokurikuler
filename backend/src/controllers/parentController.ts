import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Helper: Parse JSON
const parseJSON = (data: any) => {
    if (!data) return [];
    try {
        if (typeof data === 'object') return data;
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
};

// --- [UPDATED] SEARCH STUDENTS (STRICT & SECURE) ---
export const searchStudents = async (req: AuthenticatedRequest, res: Response) => {
    // Kita abaikan pagination karena hasil pasti cuma 1 (atau 0) untuk keamanan
    const q = (req.query.q as string) || ''; // q adalah NISN
    const parentId = req.user?.id; 

    // [KEAMANAN] Jika input kosong, kembalikan kosong
    if (!q || q.trim() === '') {
        return res.json({ data: [] });
    }

    try {
        // 1. Query: HANYA cari berdasarkan NISN yang SAMA PERSIS (=)
        // Hapus pencarian nama dan LIKE.
        const query = `
            SELECT 
                u.id, 
                u.full_name, 
                u.nisn, 
                u.password, 
                c.name as class_name,
                (SELECT COUNT(*) FROM family_relations fr WHERE fr.student_id = u.id AND fr.parent_id = ?) as is_linked
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE u.role = 'student' AND u.nisn = ? 
            LIMIT 1
        `;

        // Params: [parentId, nisn]
        const [rows]: any = await pool.query(query, [parentId, q.trim()]);

        // 2. Format Data
        const data = rows.map((row: any) => ({
            id: row.id,
            full_name: row.full_name,
            nisn: row.nisn,
            class_name: row.class_name || 'Belum Masuk Kelas',
            class_level: row.class_name ? row.class_name.charAt(0) : '-',
            is_active: !!row.password, // True jika password tidak NULL/Empty
            is_linked_to_me: row.is_linked > 0 
        }));

        res.json({ data });

    } catch (error) {
        console.error("Secure Search Error:", error);
        res.status(500).json({ message: 'Gagal memuat data.' });
    }
};

export const linkStudent = async (req: AuthenticatedRequest, res: Response) => {
    const { nisn, studentPassword, relationship } = req.body;
    const parentId = req.user?.id;

    if (!nisn) return res.status(400).json({ message: 'NISN siswa diperlukan.' });

    try {
        // 1. Ambil data siswa
        const [studentRows]: any[] = await pool.query(
            "SELECT id, password, full_name FROM users WHERE nisn = ? AND role = 'student'", 
            [nisn]
        );
        
        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Siswa dengan NISN ini tidak ditemukan.' });
        }
        
        const student = studentRows[0];
        const isStudentAlreadyActive = student.password && student.password !== '';

        // 2. Cek apakah orang tua INI sudah terhubung?
        const [existingLink]: any[] = await pool.query(
            "SELECT id FROM family_relations WHERE parent_id = ? AND student_id = ?",
            [parentId, student.id]
        );

        const isLinked = existingLink.length > 0;

        // 3. LOGIKA AKTIVASI / LINKING
        
        // Skenario A: Sudah terhubung (oleh Admin), tapi Siswa Belum Aktif (Password Kosong)
        if (isLinked && !isStudentAlreadyActive) {
            if (!studentPassword || studentPassword.length < 6) {
                return res.status(400).json({ message: 'Akun belum aktif. Masukkan password minimal 6 karakter.' });
            }
            // Update password siswa
            const hashedPassword = await bcrypt.hash(studentPassword, 10);
            await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, student.id]);
            
            return res.status(200).json({ 
                message: 'Akun siswa berhasil diaktifkan!',
                studentName: student.full_name
            });
        }

        // Skenario B: Sudah terhubung dan Sudah Aktif
        if (isLinked) {
            return res.status(400).json({ message: 'Anda sudah terhubung dengan siswa ini.' });
        }

        // Skenario C: Belum terhubung (Baru Link)
        
        // Cek/Set Password jika belum ada
        if (!isStudentAlreadyActive) {
            if (!studentPassword || studentPassword.length < 6) {
                return res.status(400).json({ message: 'Akun siswa belum aktif. Harap buatkan password (min 6 karakter).' });
            }
            const hashedPassword = await bcrypt.hash(studentPassword, 10);
            await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, student.id]);
        }

        // Buat Hubungan Keluarga
        await pool.query(
            "INSERT INTO family_relations (parent_id, student_id, relationship) VALUES (?, ?, ?)",
            [parentId, student.id, relationship]
        );

        res.status(200).json({ 
            message: 'Berhasil menghubungkan akun!',
            studentName: student.full_name
        });

    } catch (error) {
        console.error("Error linking student:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;

    try {
        // Ambil Data Siswa (Limit 1)
        // [MODIFIKASI] Tambahkan logika cek password untuk field is_active
        const [studentRows]: any[] = await pool.query(
            `SELECT 
                u.id, 
                u.full_name, 
                u.class_id, 
                u.nisn, 
                c.name as class, 
                fr.relationship,
                (u.password IS NOT NULL AND u.password != '') as is_active 
             FROM users u 
             JOIN family_relations fr ON u.id = fr.student_id
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE fr.parent_id = ? AND u.role = 'student' 
             LIMIT 1`,
            [parentId]
        );

        if (studentRows.length === 0) {
            return res.json({ student: null, logs: [] });
        }
        
        const student = studentRows[0]; 

        // Query Logs (Sama seperti sebelumnya)
        const [logRows]: any[] = await pool.query(
            `SELECT cl.*, approver.full_name as approver_name
             FROM character_logs cl 
             LEFT JOIN users approver ON cl.approver_id = approver.id
             WHERE cl.student_id = ? 
             ORDER BY cl.log_date DESC LIMIT 50`,
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
        console.error("Error fetching dashboard:", error);
        res.status(500).json({ message: 'Gagal memuat data dasbor.' });
    }
};

// --- APPROVE LOG ---
export const approveCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const { logId } = req.params;
    const parentId = req.user?.id;

    try {
        // 1. Cek Validasi & Ambil Role Hubungan (Ayah/Ibu/Wali)
        const [rows]: any[] = await pool.query(
            `SELECT fr.relationship 
             FROM family_relations fr
             JOIN character_logs cl ON fr.student_id = cl.student_id
             WHERE cl.id = ? AND fr.parent_id = ?`,
            [logId, parentId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak terhubung dengan siswa ini.' });
        }

        const approverRole = rows[0].relationship || 'Orang Tua';

        // 2. Update Status Jurnal, Approved By, dan Approver ID
        await pool.query(
            "UPDATE character_logs SET status = 'Disetujui', approved_by = ?, approver_id = ? WHERE id = ?", 
            [approverRole, parentId, logId]
        );

        // 3. Kembalikan Data Terupdate
        const [updated]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as approver_name 
             FROM character_logs cl
             LEFT JOIN users u ON cl.approver_id = u.id
             WHERE cl.id = ?`, 
            [logId]
        );
        res.json(updated[0]);

    } catch (error) {
        console.error("Error approving log:", error);
        res.status(500).json({ message: 'Gagal memvalidasi jurnal.' });
    }
};

export const getLogHistory = async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user?.id;
    try {
        const [relationRows]: any[] = await pool.query('SELECT student_id FROM family_relations WHERE parent_id = ? LIMIT 1', [parentId]);
        if (relationRows.length === 0) return res.status(404).json({ message: 'Belum ada siswa terhubung.' });
        
        // [UPDATE] Tambahkan LEFT JOIN ke users untuk ambil nama approver
        const [historyRows]: any[] = await pool.query(
            `SELECT cl.*, approver.full_name as approver_name
             FROM character_logs cl 
             LEFT JOIN users approver ON cl.approver_id = approver.id
             WHERE cl.student_id = ? 
             ORDER BY cl.log_date DESC`, 
            [relationRows[0].student_id]
        );
        
        // Parse JSON agar frontend menerimanya sebagai array/object
        const processedHistory = historyRows.map((log: any) => ({
            ...log,
            worship_activities: parseJSON(log.worship_activities),
            study_activities: parseJSON(log.study_activities),
            social_activities: parseJSON(log.social_activities),
            plan_worship_activities: parseJSON(log.plan_worship_activities),
            plan_study_activities: parseJSON(log.plan_study_activities),
            plan_social_activities: parseJSON(log.plan_social_activities),
        }));

        res.json(processedHistory);
    } catch (error) {
        console.error("Error history:", error);
        res.status(500).json({ message: 'Error fetching history.' });
    }
};

// Preview Student by NISN (Deprecated)
export const previewStudentByNisn = async (req: Request, res: Response) => {
    res.json({ message: "Deprecated, use search instead" });
};