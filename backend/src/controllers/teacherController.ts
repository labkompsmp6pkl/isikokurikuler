import { Request, Response } from 'express';
import pool from '../config/db';
import axios from 'axios';

// --- 1. DASHBOARD & VALIDASI ---

export const getTeacherDashboard = async (req: Request, res: Response) => {
    // Menggunakan optional chaining untuk keamanan data user dari middleware
    const teacherId = (req as any).user?.id;

    try {
        // 1. Ambil Tahun Ajaran Aktif dari Pengaturan Aplikasi
        const [settings]: any = await pool.query(
            "SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'"
        );
        // Default ke 2025/2026 jika setting tidak ditemukan
        const activeYear = settings[0]?.setting_value || '2025/2026';

        // 2. Ambil Data Guru
        const [teacherRows]: any[] = await pool.query(
            `SELECT full_name FROM users WHERE id = ? AND role = 'teacher'`,
            [teacherId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({ message: 'Akun guru tidak ditemukan.' });
        }
        const teacherName = teacherRows[0].full_name;

        // 3. Cari Kelas yang diampu guru ini (Wali Kelas)
        // PERBAIKAN: Menghapus filter tahun ajaran yang terlalu ketat agar data tetap muncul jika ada ketidaksinkronan
        const [actualClass]: any = await pool.query(
            `SELECT id, name, academic_year FROM classes 
             WHERE teacher_id = ? 
             ORDER BY academic_year DESC LIMIT 1`, 
            [teacherId]
        );
        
        let teacherClassId = null;
        let teacherClassName = null;
        let classAcademicYear = activeYear;

        if (actualClass.length > 0) {
             teacherClassId = actualClass[0].id;
             teacherClassName = actualClass[0].name;
             classAcademicYear = actualClass[0].academic_year;
        }

        // [PERBAIKAN KRUSIAL]: Jangan kirim 400 (Bad Request) jika belum ada kelas.
        // Kirim response sukses dengan data kosong agar frontend tidak crash/blank.
        if (!teacherClassId) {
            return res.json({ 
                teacherClass: null, 
                teacherClassId: null, 
                teacherName, 
                activeYear, 
                students: [], 
                logs: [],
                message: `Anda belum ditugaskan sebagai wali kelas.`
            });
        }

        // 4. Ambil Daftar Siswa di Kelas Tersebut
        const [students]: any[] = await pool.query(
            `SELECT 
                s.id, s.full_name, s.nisn, 
                p.full_name AS parent_name,
                c.name as class_name,
                t.full_name as teacher_name,
                CASE 
                    WHEN (s.password IS NOT NULL AND s.password != '') THEN 1
                    WHEN (SELECT COUNT(*) FROM family_relations fr WHERE fr.student_id = s.id) > 0 THEN 1
                    ELSE 0 
                END as is_active
             FROM users s
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN users t ON c.teacher_id = t.id
             LEFT JOIN users p ON s.parent_id = p.id
             WHERE s.class_id = ? AND s.role = 'student' 
             ORDER BY s.full_name ASC`,
            [teacherClassId]
        );

        // 5. Ambil Log Karakter yang perlu divalidasi atau sudah disetujui
        const [logs]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as student_name 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE u.class_id = ? AND cl.status IN ('Tersimpan', 'Disetujui', 'Disahkan')
             ORDER BY cl.log_date DESC LIMIT 100`,
            [teacherClassId]
        );

        res.json({ 
            teacherClass: teacherClassName, 
            teacherClassId, 
            teacherName, 
            activeYear: classAcademicYear, 
            students, 
            logs 
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
    }
};

export const validateLog = async (req: Request, res: Response) => {
    const { logId } = req.params;
    
    try {
        const [currentLog]: any[] = await pool.query('SELECT status FROM character_logs WHERE id = ?', [logId]);
        if (currentLog.length === 0) return res.status(404).json({ message: 'Log tidak ditemukan' });
        
        // Logika: Guru hanya bisa mengesahkan (Disahkan) setelah Orang Tua menyetujui (Disetujui)
        if (currentLog[0].status === 'Tersimpan') {
            return res.status(400).json({ message: 'Log belum disetujui oleh Orang Tua.' });
        }

        await pool.query("UPDATE character_logs SET status = 'Disahkan' WHERE id = ?", [logId]);
        
        const [updated]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as student_name 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE cl.id = ?`, 
            [logId]
        );
        res.json(updated[0]);
    } catch (error) {
        console.error("Validation Error:", error);
        res.status(500).json({ message: 'Gagal mengesahkan jurnal.' });
    }
};

export const getClassHistory = async (req: Request, res: Response) => {
    const teacherId = (req as any).user?.id;
    const { studentId } = req.query;

    try {
        const [teacherRows]: any[] = await pool.query(
            'SELECT id FROM classes WHERE teacher_id = ?', 
            [teacherId]
        );
        
        if (teacherRows.length === 0) {
            return res.status(403).json({ message: 'Anda tidak memiliki otoritas wali kelas.' });
        }
        
        const teacherClassId = teacherRows[0].id;

        let query = `
            SELECT cl.*, u.full_name as student_name
            FROM character_logs cl
            JOIN users u ON cl.student_id = u.id
            WHERE u.class_id = ?
        `;
        const params: any[] = [teacherClassId];

        if (studentId) {
            query += ' AND cl.student_id = ?';
            params.push(studentId);
        }

        query += ' ORDER BY cl.log_date DESC LIMIT 200';

        const [history]: any[] = await pool.query(query, params);
        res.json(history);
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ message: 'Gagal memuat riwayat kelas.' });
    }
};

export const getStudentParents = async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
        const query = `
            SELECT 
                u.id, 
                u.full_name, 
                u.whatsapp_number,
                fr.relationship 
            FROM family_relations fr
            JOIN users u ON fr.parent_id = u.id
            WHERE fr.student_id = ?
        `;
        const [parents]: any = await pool.query(query, [studentId]);
        res.json(parents);
    } catch (error) {
        console.error("Error fetching parents:", error);
        res.status(500).json({ message: "Gagal memuat data orang tua." });
    }
};

// --- FITUR INPUT RAPOR MANUAL ---

export const saveReportData = async (req: Request, res: Response) => {
    const { studentId, classId, academicYear, semester, extracurricular, attendance, teacherNotes } = req.body;
    
    try {
        await pool.query(`
            INSERT INTO student_report_data 
            (student_id, class_id, academic_year, semester, extracurricular, attendance_sakit, attendance_izin, attendance_alpha, teacher_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            extracurricular = VALUES(extracurricular),
            attendance_sakit = VALUES(attendance_sakit),
            attendance_izin = VALUES(attendance_izin),
            attendance_alpha = VALUES(attendance_alpha),
            teacher_notes = VALUES(teacher_notes)
        `, [
            studentId, classId, academicYear, semester, 
            JSON.stringify(extracurricular), 
            attendance.sakit, attendance.izin, attendance.alpha, 
            teacherNotes
        ]);
        
        res.json({ message: "Data rapor berhasil disimpan." });
    } catch (error) {
        console.error("Save Report Error:", error);
        res.status(500).json({ message: "Gagal menyimpan data rapor." });
    }
};

export const getStudentReportData = async (req: Request, res: Response) => {
    const { studentId, academicYear, semester } = req.query;
    try {
        const [rows]: any = await pool.query(`
            SELECT * FROM student_report_data 
            WHERE student_id = ? AND academic_year = ? AND semester = ?
        `, [studentId, academicYear, semester]);
        
        if (rows.length > 0) {
            const reportData = rows[0];
            try {
                reportData.extracurricular = JSON.parse(reportData.extracurricular || '[]');
            } catch (e) {
                reportData.extracurricular = [];
            }
            res.json(reportData);
        } else {
            res.json(null);
        }
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data rapor." });
    }
};

export const generateAIReport = async (req: Request, res: Response) => {
    const { studentId, semester, academicYear } = req.body;

    try {
        // 1. Ambil Data Penilaian (Records)
        const [assessments]: any = await pool.query(`
            SELECT behavior_category, score, notes, contributor_role, record_date
            FROM behavior_records 
            WHERE student_id = ? 
            ORDER BY record_date DESC LIMIT 50
        `, [studentId]);

        // 2. Ambil Jurnal Harian Siswa
        const [dailyLogs]: any = await pool.query(`
            SELECT log_date, wake_up_time, worship_activities, social_activities, study_activities
            FROM character_logs 
            WHERE student_id = ? AND status IN ('Disetujui', 'Disahkan')
            ORDER BY log_date DESC LIMIT 30
        `, [studentId]);

        // 3. Integrasi AI via OpenRouter
        const prompt = `
            Sebagai Konsultan Pendidikan Karakter, buatlah Narasi Rapor untuk siswa.
            
            DATA PENILAIAN: ${JSON.stringify(assessments)}
            DATA JURNAL HARIAN: ${JSON.stringify(dailyLogs)}

            TUGAS:
            1. Buat "kokurikuler_report" yang menggabungkan analisis perkembangan karakter dalam 3 paragraf profesional.
            2. Buat "teacher_notes_suggestion" sebagai saran motivasi wali kelas.
            
            FORMAT JSON (Tanpa Markdown):
            {
                "kokurikuler_report": "...",
                "teacher_notes_suggestion": "..."
            }
        `;

        const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model: "openai/gpt-3.5-turbo", 
            messages: [{ role: "user", content: prompt }]
        }, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        let aiResult = response.data.choices[0].message.content;
        aiResult = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            aiResult = JSON.parse(aiResult);
        } catch (e) {
            aiResult = { kokurikuler_report: aiResult, teacher_notes_suggestion: "Gagal memproses saran otomatis." };
        }

        res.json({ result: aiResult });

    } catch (error) {
        console.error("AI Gen Error:", error);
        res.status(500).json({ message: "Gagal generate analisis AI." });
    }
};

// --- PROMOSI SISWA ---

export const promoteStudents = async (req: Request, res: Response) => {
    const { studentIds, targetClassId, isAlumni } = req.body;
    const teacherId = (req as any).user?.id; 

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Tidak ada siswa yang dipilih." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [students]: any = await connection.query(
            `SELECT id, class_id FROM users WHERE id IN (?)`, 
            [studentIds]
        );

        if (students.length === 0) throw new Error("Data siswa tidak ditemukan.");

        const [settings]: any = await connection.query("SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'");
        const academicYear = settings[0]?.setting_value || '2025/2026';

        for (const student of students) {
            await connection.query(`
                INSERT INTO student_class_history 
                (student_id, old_class_id, new_class_id, academic_year, moved_by)
                VALUES (?, ?, ?, ?, ?)
            `, [
                student.id, 
                student.class_id, 
                isAlumni ? null : targetClassId,
                academicYear, 
                teacherId
            ]);
        }

        if (isAlumni) {
            await connection.query(
                `UPDATE users SET role = 'alumni', class_id = NULL, graduation_year = YEAR(CURRENT_DATE) WHERE id IN (?)`,
                [studentIds]
            );
        } else {
            if (!targetClassId) throw new Error("Kelas tujuan wajib dipilih.");
            await connection.query(
                `UPDATE users SET class_id = ? WHERE id IN (?)`,
                [targetClassId, studentIds]
            );
        }

        await connection.commit();
        res.json({ message: "Proses promosi/kelulusan berhasil." });

    } catch (error: any) {
        await connection.rollback();
        console.error("Promote Error:", error);
        res.status(500).json({ message: error.message || "Gagal memproses data promosi." });
    } finally {
        connection.release();
    }
};