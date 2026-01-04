import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 1. DASHBOARD & VALIDASI ---
export const getTeacherDashboard = async (req: Request, res: Response) => {
    // Ambil ID dari token
    const teacherId = (req as any).user?.id;

    try {
        // 1. Ambil Data Guru & Kelasnya menggunakan JOIN ke tabel classes
        const [teacherRows]: any[] = await pool.query(
            `SELECT u.full_name, u.class_id, c.name as class_name 
             FROM users u 
             LEFT JOIN classes c ON u.class_id = c.id 
             WHERE u.id = ? AND u.role = 'teacher'`,
            [teacherId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({ message: 'Akun guru tidak ditemukan.' });
        }

        const teacherData = teacherRows[0];
        const teacherClassId = teacherData.class_id;
        const teacherClassName = teacherData.class_name; // Ini untuk tampilan seperti "7A"
        const teacherName = teacherData.full_name;

        // Cek apakah kolom class_id masih kosong
        if (!teacherClassId) {
            return res.status(400).json({ 
                message: 'Anda belum terdaftar sebagai wali kelas. Silakan hubungi Administrator.' 
            });
        }

        // 2. Ambil semua siswa di kelas ini (berdasarkan class_id)
        const [students]: any[] = await pool.query(
            `SELECT 
                s.id, 
                s.full_name, 
                s.nisn, 
                p.full_name AS parent_name,
                c.name as class_name,
                t.full_name as teacher_name
             FROM users s
             LEFT JOIN classes c ON s.class_id = c.id
             LEFT JOIN users t ON c.teacher_id = t.id
             LEFT JOIN users p ON s.parent_id = p.id
             WHERE s.class_id = ? AND s.role = 'student' 
             ORDER BY s.full_name ASC`,
            [teacherClassId]
        );

        // 3. Ambil logs yang butuh perhatian (Status Tersimpan atau Disetujui)
        const [logs]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as student_name 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE u.class_id = ? AND cl.status IN ('Tersimpan', 'Disetujui')
             ORDER BY cl.log_date DESC`,
            [teacherClassId]
        );

        // Kirim response dengan nama kelas yang sudah di-join
        res.json({ 
            teacherClass: teacherClassName, 
            teacherClassId, 
            teacherName, 
            students, 
            logs 
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: 'Gagal memuat dashboard guru.' });
    }
};

export const validateLog = async (req: Request, res: Response) => {
    const { logId } = req.params;
    
    try {
        const [currentLog]: any[] = await pool.query('SELECT status FROM character_logs WHERE id = ?', [logId]);
        
        if (currentLog.length === 0) return res.status(404).json({ message: 'Log tidak ditemukan' });
        
        if (currentLog[0].status === 'Tersimpan') {
            return res.status(400).json({ message: 'Log belum disetujui Orang Tua.' });
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
        res.status(500).json({ message: 'Gagal memvalidasi log.' });
    }
};

export const getClassHistory = async (req: Request, res: Response) => {
    const teacherId = (req as any).user?.id;
    const { studentId } = req.query;

    try {
        // 1. Ambil ID kelas guru dari database
        const [teacherRows]: any[] = await pool.query(
            'SELECT class_id FROM users WHERE id = ?', 
            [teacherId]
        );
        
        const teacherClassId = teacherRows[0]?.class_id;

        // --- INI PENYEBAB ERROR 403 ---
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
        
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const analysis = JSON.parse(text);
        res.json(analysis);

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: 'Gagal menghasilkan analisis AI.' });
    }
};