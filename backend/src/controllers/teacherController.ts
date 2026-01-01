import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- 1. DASHBOARD & VALIDASI ---
export const getTeacherDashboard = async (req: Request, res: Response) => {
    // Ambil ID dari token (Token hanya perlu bawa ID, sisanya kita cek di DB)
    const teacherId = (req as any).user?.id;

    try {
        // [PERBAIKAN UTAMA] 
        // Query langsung ke DB untuk memastikan data 'class' terbaru terbaca
        const [teacherRows]: any[] = await pool.query(
            'SELECT class, full_name FROM users WHERE id = ? AND role = \'teacher\'',
            [teacherId]
        );

        if (teacherRows.length === 0) {
            return res.status(404).json({ message: 'Akun guru tidak ditemukan.' });
        }

        const teacherData = teacherRows[0];
        const teacherClass = teacherData.class;
        const teacherName = teacherData.full_name;

        // Cek apakah kolom class masih kosong di database
        if (!teacherClass) {
            return res.status(400).json({ message: 'Anda belum terdaftar sebagai wali kelas. Silakan hubungi Administrator.' });
        }

        // 2. Ambil semua siswa di kelas ini
        const [students]: any[] = await pool.query(
            'SELECT id, full_name, nisn FROM users WHERE class = ? AND role = \'student\' ORDER BY full_name ASC',
            [teacherClass]
        );

        // 3. Ambil logs yang butuh perhatian (Status Tersimpan atau Disetujui)
        const [logs]: any[] = await pool.query(
            `SELECT cl.*, u.full_name as student_name 
             FROM character_logs cl
             JOIN users u ON cl.student_id = u.id
             WHERE u.class = ? AND cl.status IN ('Tersimpan', 'Disetujui')
             ORDER BY cl.log_date DESC`,
            [teacherClass]
        );

        res.json({ teacherClass, teacherName, students, logs });

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

// --- 2. RIWAYAT & KALENDER ---
export const getClassHistory = async (req: Request, res: Response) => {
    const teacherId = (req as any).user?.id;
    const { studentId } = req.query;

    try {
        // Ambil kelas guru dari DB (Lagi-lagi, jangan dari token)
        const [teacherRows]: any[] = await pool.query('SELECT class FROM users WHERE id = ?', [teacherId]);
        if (teacherRows.length === 0 || !teacherRows[0].class) {
             return res.status(403).json({ message: 'Akses ditolak. Kelas tidak ditemukan.' });
        }
        
        const teacherClass = teacherRows[0].class;

        let query = `
            SELECT cl.*, u.full_name as student_name
            FROM character_logs cl
            JOIN users u ON cl.student_id = u.id
            WHERE u.class = ?
        `;
        const params: any[] = [teacherClass];

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