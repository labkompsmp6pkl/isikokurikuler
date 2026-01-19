import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// --- 1. DASHBOARD & VALIDASI ---

export const getTeacherDashboard = async (req: Request, res: Response) => {
    // Ambil ID dari token (via middleware auth)
    const teacherId = (req as any).user?.id;

    try {
        // [BARU] 1. Ambil Tahun Ajaran Aktif dari Settings
        // Ini wajib dilakukan agar guru tidak melihat kelas tahun lalu (History)
        const [settings]: any = await pool.query(
            "SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'"
        );
        const activeYear = settings[0]?.setting_value || '2025/2026'; // Fallback default

        // 2. Ambil Data Dasar Guru
        const [teacherRows]: any[] = await pool.query(
            `SELECT full_name FROM users WHERE id = ? AND role = 'teacher'`,
            [teacherId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({ message: 'Akun guru tidak ditemukan.' });
        }
        const teacherName = teacherRows[0].full_name;

        // [UPDATED] 3. Cari Kelas Guru berdasarkan Tahun Ajaran Aktif
        // Filter ditambah: AND academic_year = ?
        const [actualClass]: any = await pool.query(
            "SELECT id, name FROM classes WHERE teacher_id = ? AND academic_year = ? LIMIT 1", 
            [teacherId, activeYear]
        );
        
        let teacherClassId = null;
        let teacherClassName = null;

        if (actualClass.length > 0) {
             teacherClassId = actualClass[0].id;
             teacherClassName = actualClass[0].name;
        }

        // Cek apakah guru sudah punya kelas TAHUN INI
        if (!teacherClassId) {
            return res.status(400).json({ 
                message: `Anda belum terdaftar sebagai wali kelas untuk Tahun Ajaran ${activeYear}. Silakan hubungi Administrator.` 
            });
        }

        // 4. Ambil semua siswa di kelas ini
        const [students]: any[] = await pool.query(
            `SELECT 
                s.id, 
                s.full_name, 
                s.nisn, 
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

        // 5. Ambil logs (Tersimpan/Disetujui) khusus untuk kelas ini
        const [logs]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as student_name 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE u.class_id = ? AND cl.status IN ('Tersimpan', 'Disetujui')
             ORDER BY cl.log_date DESC`,
            [teacherClassId]
        );

        res.json({ 
            teacherClass: teacherClassName, 
            teacherClassId, 
            teacherName, 
            activeYear, // Opsional: kirim info tahun ke frontend
            students, 
            logs 
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Gagal memuat dashboard guru.' });
    }
};

// [UPDATE] Validasi Log oleh Guru
export const validateLog = async (req: Request, res: Response) => {
    const { logId } = req.params;
    
    try {
        // Cek status saat ini
        const [currentLog]: any[] = await pool.query('SELECT status FROM character_logs WHERE id = ?', [logId]);
        
        if (currentLog.length === 0) return res.status(404).json({ message: 'Log tidak ditemukan' });
        
        // Pastikan log sudah disetujui orang tua sebelum disahkan guru
        if (currentLog[0].status === 'Tersimpan') {
            return res.status(400).json({ message: 'Log belum disetujui Orang Tua.' });
        }

        // Update status menjadi 'Disahkan'
        await pool.query("UPDATE character_logs SET status = 'Disahkan' WHERE id = ?", [logId]);
        
        // Ambil data terbaru untuk dikembalikan ke frontend
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
        res.status(500).json({ message: 'Gagal memvalidasi log.' });
    }
};

// [BARU] Ambil daftar orang tua siswa untuk opsi tanda tangan
export const getStudentParents = async (req: Request, res: Response) => {
    const { studentId } = req.params;
    try {
        const query = `
            SELECT 
                u.id, 
                u.full_name, 
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

// [UPDATE] Mengambil Log yang Siap Divalidasi (Sudah Disetujui Ortu)
export const getValidationLogs = async (req: Request, res: Response) => {
    try {
        const teacherId = (req as any).user?.id;

        // 1. Cari kelas guru
        const [classData]: any = await pool.query("SELECT id FROM classes WHERE teacher_id = ?", [teacherId]);
        
        if (classData.length === 0) {
            return res.json([]); // Jika bukan wali kelas, kembalikan array kosong
        }

        const classId = classData[0].id;

        // 2. Query Data Jurnal + Info Validasi Orang Tua
        const query = `
            SELECT 
                cl.*,
                s.full_name as student_name,
                s.nisn,
                p.full_name as parent_name,       -- Nama Validator (Orang Tua)
                fr.relationship as parent_role    -- Peran Validator (Ayah/Ibu/Wali)
            FROM character_logs cl
            JOIN users s ON cl.student_id = s.id
            -- Join ke user untuk ambil nama orang tua dari kolom approver_id
            LEFT JOIN users p ON cl.approver_id = p.id
            -- Join ke family_relations untuk tau status hubungan
            LEFT JOIN family_relations fr ON (fr.parent_id = p.id AND fr.student_id = s.id)
            WHERE s.class_id = ? 
            AND cl.status = 'Disetujui'       -- Filter status: Sudah Disetujui Ortu, Belum Disahkan Guru
            ORDER BY cl.log_date ASC
        `;

        const [logs] = await pool.query(query, [classId]);
        res.json(logs);

    } catch (error) {
        console.error("Error fetching validation logs:", error);
        res.status(500).json({ message: "Gagal memuat data validasi" });
    }
};


// --- 2. HISTORY & DATA ---

export const getClassHistory = async (req: Request, res: Response) => {
    const teacherId = (req as any).user?.id;
    const { studentId } = req.query;

    try {
        // 1. Ambil ID kelas guru dari database (TABEL CLASSES)
        const [teacherRows]: any[] = await pool.query(
            'SELECT id FROM classes WHERE teacher_id = ?', 
            [teacherId]
        );
        
        const teacherClassId = teacherRows[0]?.id;

        if (!teacherClassId) {
            return res.status(403).json({ 
                message: 'Akses ditolak. Anda tidak terdaftar sebagai wali kelas.' 
            });
        }

        // 2. Ambil riwayat berdasarkan class_id
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

// --- 3. ANALISIS AI (REPORT) ---

export const generateStudentReport = async (req: Request, res: Response) => {
    const { studentId, startDate, endDate } = req.body;
    
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: 'API Key AI belum dikonfigurasi.' });
        }

        // Ambil data log
        const [logs]: any[] = await pool.query(
            `SELECT * FROM character_logs 
             WHERE student_id = ? 
             AND log_date BETWEEN ? AND ?
             ORDER BY log_date ASC`,
            [studentId, startDate, endDate]
        );

        const [studentData]: any[] = await pool.query('SELECT full_name FROM users WHERE id = ?', [studentId]);
        const studentName = studentData[0]?.full_name || 'Siswa';

        if (logs.length === 0) {
            return res.status(400).json({ message: 'Tidak ada data kegiatan pada periode ini.' });
        }

        // Format data untuk AI
        const logsString = JSON.stringify(logs.map((l:any) => ({
            tgl: l.log_date,
            bangun: l.wake_up_time,
            ibadah: l.worship_activities,
            olahraga: l.sport_activities,
            sosial: l.social_activities
        })));

        const prompt = `
            Bertindaklah sebagai Wali Kelas profesional. Analisis data kegiatan siswa "${studentName}" berikut:
            ${logsString}

            Berikan output JSON (raw) dengan key:
            - executive_summary (1 kalimat ringkas tentang kekuatan & kelemahan)
            - character_progress (2 kalimat tentang perkembangan sosial/spiritual/fisik)
            - report_narrative (Narasi rapor 3-4 kalimat yang personal, gunakan kata "Ananda", sebutkan contoh kegiatan spesifik, nada apresiatif namun memberi saran)
        `;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Bersihkan formatting markdown JSON jika ada
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const analysis = JSON.parse(text);
        res.json(analysis);

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: 'Gagal menghasilkan analisis AI.' });
    }
};

export const promoteStudents = async (req: Request, res: Response) => {
    const { studentIds, targetClassId, isAlumni } = req.body;
    // @ts-ignore
    const teacherId = req.user?.id; // ID Guru yang melakukan aksi

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Tidak ada siswa yang dipilih." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. AMBIL DATA KELAS ASAL (Sample dari siswa pertama untuk validasi level)
        const [students]: any = await connection.query(
            `SELECT u.full_name, c.name as class_name, c.id as source_class_id
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ?`, 
            [studentIds[0]]
        );

        if (students.length === 0) {
            throw new Error("Data siswa tidak ditemukan.");
        }

        const sourceClassName = students[0].class_name || "";
        // Ambil angka depan dari nama kelas (misal "8H" -> 8, "9A" -> 9)
        const sourceLevel = parseInt(sourceClassName.match(/^\d+/)?.[0] || "0");
        
        // 2. LOGIKA VALIDASI TUJUAN
        if (isAlumni) {
            // --- SKENARIO LULUS (JADI ALUMNI) ---
            
            // Validasi: Hanya kelas tingkat akhir (9 atau 12) yang bisa lulus
            if (sourceLevel !== 0 && sourceLevel !== 9 && sourceLevel !== 12) {
                throw new Error(`VALIDASI GAGAL: Siswa kelas ${sourceClassName} tidak bisa langsung diluluskan. Hanya kelas tingkat akhir (9/12) yang bisa menjadi Alumni.`);
            }

        } else {
            if (!targetClassId) {
                connection.release();
                return res.status(400).json({ message: "Kelas tujuan wajib dipilih untuk kenaikan kelas." });
            }

            // [VALIDASI BARU] Cek Apakah Kelas Tujuan Punya Wali Kelas?
            const [targetClass]: any = await connection.query(
                "SELECT name, teacher_id FROM classes WHERE id = ?", 
                [targetClassId]
            );

            if (targetClass.length === 0) {
                connection.release();
                return res.status(404).json({ message: "Kelas tujuan tidak ditemukan." });
            }

            if (!targetClass[0].teacher_id) {
                connection.release();
                return res.status(400).json({ 
                    message: `GAGAL: Kelas tujuan ${targetClass[0].name} belum memiliki Wali Kelas aktif. Hubungi Admin untuk menugaskan Wali Kelas terlebih dahulu.` 
                });
            }

            // Eksekusi Pindah
            const placeholders = studentIds.map(() => '?').join(',');
            await connection.query(
                `UPDATE users SET class_id = ? WHERE id IN (${placeholders})`,
                [targetClassId, ...studentIds]
            );
        }

        await connection.commit();
        
        // Respons sukses dengan detail
        res.json({ 
            message: "Proses berhasil.",
            detail: isAlumni ? "Siswa lulus menjadi Alumni." : "Siswa berhasil dipindahkan ke kelas baru yang memiliki Wali Kelas."
        });

    } catch (error) {
        await connection.rollback();
        console.error("Promote Error:", error);
        res.status(500).json({ message: "Gagal memproses data." });
    } finally {
        connection.release();
    }
};