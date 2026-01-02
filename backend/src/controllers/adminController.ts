import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- 1. USER MANAGEMENT ---

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 6, role, class_id, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // MODIFIKASI: Melakukan JOIN ke tabel classes untuk mendapatkan class_name
        let query = `
            SELECT u.*, 
            c.name as class_name,
            (SELECT GROUP_CONCAT(s.full_name SEPARATOR ', ') FROM users s WHERE s.parent_id = u.id) as children_names
            FROM users u 
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (role && role !== 'all') {
            query += ` AND u.role = ?`;
            params.push(role);
        }
        // MODIFIKASI: Filter berdasarkan class_id (Relasi)
        if (class_id && class_id !== 'all') {
            query += ` AND u.class_id = ?`;
            params.push(class_id);
        }
        if (search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [users]: any = await pool.query(query, params);

        let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
        const countParams: any[] = [];
        
        if (role && role !== 'all') { countQuery += ` AND u.role = ?`; countParams.push(role); }
        if (class_id && class_id !== 'all') { countQuery += ` AND u.class_id = ?`; countParams.push(class_id); }
        if (search) { 
            countQuery += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const searchParam = `%${search}%`;
            countParams.push(searchParam, searchParam, searchParam, searchParam);
        }

        const [totalRows]: any = await pool.query(countQuery, countParams);
        const total = totalRows[0].total;

        res.json({
            data: users,
            meta: {
                total,
                page: Number(page),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Gagal memuat data pengguna.' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // MODIFIKASI: Mengambil class_id untuk form detail
        const [rows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { full_name, email, password, role, nisn, nip, class_id, whatsapp_number } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // MODIFIKASI: Simpan ke kolom class_id
        await pool.query(
            `INSERT INTO users (full_name, email, password, role, nisn, nip, class_id, whatsapp_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, hashedPassword, role, nisn || null, nip || null, class_id || null, whatsapp_number || null]
        );
        res.status(201).json({ message: "User berhasil dibuat" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal membuat user" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { full_name, email, role, nisn, nip, class_id, whatsapp_number, password } = req.body;

    try {
        // MODIFIKASI: Update kolom class_id
        let query = `
            UPDATE users 
            SET full_name = ?, email = ?, role = ?, nisn = ?, nip = ?, 
                class_id = ?, whatsapp_number = ? 
        `;
        const params = [full_name, email, role, nisn || null, nip || null, class_id || null, whatsapp_number || null];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = ?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id = ?`;
        params.push(id);

        await pool.query(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus user" });
    }
};

// --- 2. CLASS MANAGEMENT ---

export const getClasses = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT c.*, 
            u.full_name as teacher_name,
            (SELECT COUNT(*) FROM users s WHERE s.class_id = c.id AND s.role = 'student') as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.name ASC
        `;
        const [classes]: any = await pool.query(query);
        res.json(classes);
    } catch (error: any) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ code: 'NO_TABLE', message: "Tabel kelas belum dibuat." });
        }
        res.status(500).json({ message: "Gagal memuat data kelas" });
    }
};

export const setupClassDatabase = async (req: Request, res: Response) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id int(11) NOT NULL AUTO_INCREMENT,
                name varchar(10) NOT NULL UNIQUE,
                teacher_id int(11) DEFAULT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                KEY teacher_id (teacher_id),
                CONSTRAINT classes_ibfk_1 FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Migrasi Nama Kelas
        await pool.query(`
            INSERT IGNORE INTO classes (name)
            SELECT DISTINCT class FROM users 
            WHERE class IS NOT NULL AND class != ''
        `);

        // Sinkronisasi class_id di tabel users berdasarkan teks kelas lama
        await pool.query(`
            UPDATE users u
            JOIN classes c ON u.class = c.name
            SET u.class_id = c.id
        `);

        // Set Wali Kelas
        await pool.query(`
            UPDATE classes c
            JOIN users u ON u.class = c.name
            SET c.teacher_id = u.id
            WHERE u.role = 'teacher'
        `);

        res.json({ message: "Database kelas berhasil disinkronkan!" });
    } catch (error) {
        console.error("Setup Error:", error);
        res.status(500).json({ message: "Gagal melakukan setup database." });
    }
};

export const createClass = async (req: Request, res: Response) => {
    const { name, teacher_id } = req.body;
    try {
        await pool.query("INSERT INTO classes (name, teacher_id) VALUES (?, ?)", [name, teacher_id || null]);
        res.status(201).json({ message: "Kelas berhasil dibuat" });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Nama kelas sudah ada" });
        res.status(500).json({ message: "Gagal membuat kelas" });
    }
};

export const generateClasses = async (req: Request, res: Response) => {
    const { grade, startLetter, endLetter } = req.body;
    if (!grade || !startLetter || !endLetter) return res.status(400).json({ message: "Parameter tidak lengkap" });
    const startCode = startLetter.toUpperCase().charCodeAt(0);
    const endCode = endLetter.toUpperCase().charCodeAt(0);
    let createdCount = 0;
    try {
        for (let i = startCode; i <= endCode; i++) {
            const className = `${grade}${String.fromCharCode(i)}`;
            const [result]: any = await pool.query("INSERT IGNORE INTO classes (name) VALUES (?)", [className]);
            if (result.affectedRows > 0) createdCount++;
        }
        res.json({ message: `Berhasil membuat ${createdCount} kelas baru.` });
    } catch (error) {
        res.status(500).json({ message: "Gagal generate kelas" });
    }
};

export const updateClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, teacher_id } = req.body;
    try {
        await pool.query("UPDATE classes SET name=?, teacher_id=? WHERE id=?", [name, teacher_id || null, id]);
        if (teacher_id) {
            // MODIFIKASI: Pastikan class_id guru terupdate saat ditugaskan
            await pool.query("UPDATE users SET class_id=? WHERE id=?", [id, teacher_id]);
        }
        res.json({ message: "Kelas berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "Gagal update kelas" });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM classes WHERE id=?", [id]);
        res.json({ message: "Kelas dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kelas" });
    }
};

export const getClassDetail = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const [classRows]: any = await pool.query(`
            SELECT c.*, u.full_name as teacher_name 
            FROM classes c 
            LEFT JOIN users u ON c.teacher_id = u.id 
            WHERE c.id = ?`, [id]);
            
        if (classRows.length === 0) return res.status(404).json({ message: "Kelas tidak ditemukan" });

        const classData = classRows[0];

        // MODIFIKASI: Ambil siswa berdasarkan class_id (FK)
        const [students]: any = await pool.query(`
            SELECT id, full_name, nisn, email 
            FROM users 
            WHERE class_id = ? AND role = 'student' 
            ORDER BY full_name ASC`, [id]);

        res.json({ ...classData, students });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getTeachersList = async (req: Request, res: Response) => {
    try {
        const [teachers]: any = await pool.query("SELECT id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC");
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat guru" });
    }
};

// --- 3. DASHBOARD STATS & ANALYSIS ---

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM character_logs");
        const totalLogs = totalRows[0].total || 1;

        const [statsRows]: any = await pool.query(`
            SELECT 
                COUNT(CASE WHEN wake_up_time IS NOT NULL AND wake_up_time != '' THEN 1 END) as bangun_pagi,
                COUNT(CASE WHEN worship_activities IS NOT NULL AND worship_activities != '[]' AND worship_activities != '' THEN 1 END) as beribadah,
                COUNT(CASE WHEN sport_activities IS NOT NULL AND sport_activities != '' THEN 1 END) as olahraga,
                COUNT(CASE WHEN meal_text IS NOT NULL AND meal_text != '' THEN 1 END) as makan_sehat,
                COUNT(CASE WHEN study_activities IS NOT NULL AND study_activities != '[]' AND study_activities != '' THEN 1 END) as belajar,
                COUNT(CASE WHEN social_activities IS NOT NULL AND social_activities != '[]' AND social_activities != '' THEN 1 END) as sosial,
                COUNT(CASE WHEN sleep_time IS NOT NULL AND sleep_time != '' THEN 1 END) as tidur_cepat
            FROM character_logs
        `);

        const stats = statsRows[0];
        const calc = (val: number) => Math.round((val / totalLogs) * 100);

        const habits = {
            bangunPagi: calc(stats.bangun_pagi),
            beribadah: calc(stats.beribadah),
            berolahraga: calc(stats.olahraga),
            makanSehat: calc(stats.makan_sehat),
            gemarBelajar: calc(stats.belajar),
            bermasyarakat: calc(stats.sosial),
            tidurCepat: calc(stats.tidur_cepat)
        };

        const profile = {
            keimanan: habits.beribadah, 
            kewargaan: habits.bermasyarakat,
            penalaranKritis: habits.gemarBelajar,
            kreativitas: Math.round((habits.gemarBelajar + habits.bermasyarakat) / 2),
            kolaborasi: habits.bermasyarakat,
            kemandirian: habits.bangunPagi,
            kesehatan: Math.round((habits.makanSehat + habits.berolahraga + habits.tidurCepat) / 3),
            komunikasi: Math.round((habits.bermasyarakat + habits.gemarBelajar) / 2)
        };

        res.json({ totalLogs: totalRows[0].total, habits, profile });

    } catch (error) {
        console.error("Error admin stats:", error);
        res.status(500).json({ message: 'Gagal memuat statistik admin.' });
    }
};

export const generateNationalAnalysis = async (req: Request, res: Response) => {
    try {
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM character_logs");
        const totalLogs = totalRows[0].total || 1;

        const [statsRows]: any = await pool.query(`
            SELECT 
                COUNT(CASE WHEN wake_up_time IS NOT NULL AND wake_up_time != '' THEN 1 END) as bangun_pagi,
                COUNT(CASE WHEN worship_activities IS NOT NULL AND worship_activities != '[]' AND worship_activities != '' THEN 1 END) as beribadah,
                COUNT(CASE WHEN sport_activities IS NOT NULL AND sport_activities != '' THEN 1 END) as olahraga,
                COUNT(CASE WHEN meal_text IS NOT NULL AND meal_text != '' THEN 1 END) as makan_sehat,
                COUNT(CASE WHEN study_activities IS NOT NULL AND study_activities != '[]' AND study_activities != '' THEN 1 END) as belajar,
                COUNT(CASE WHEN social_activities IS NOT NULL AND social_activities != '[]' AND social_activities != '' THEN 1 END) as sosial,
                COUNT(CASE WHEN sleep_time IS NOT NULL AND sleep_time != '' THEN 1 END) as tidur_cepat
            FROM character_logs
        `);

        const stats = statsRows[0];
        const calc = (val: number) => Math.round((val / totalLogs) * 100);

        const dataSummary = {
            total_siswa_aktif_mengisi: totalLogs,
            statistik_kebiasaan: {
                "Bangun Pagi": `${calc(stats.bangun_pagi)}%`,
                "Beribadah": `${calc(stats.beribadah)}%`,
                "Berolahraga": `${calc(stats.olahraga)}%`,
                "Makan Sehat": `${calc(stats.makan_sehat)}%`,
                "Gemar Belajar": `${calc(stats.belajar)}%`,
                "Bermasyarakat/Sosial": `${calc(stats.sosial)}%`,
                "Tidur Cepat": `${calc(stats.tidur_cepat)}%`
            }
        };

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Sebagai Konsultan Pendidikan, analisis data karakter siswa ini:
            ${JSON.stringify(dataSummary)}
            Berikan JSON dengan key: strengths, interventions, recommendations. Bahasa Indonesia akademis.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        res.json(JSON.parse(cleanJson));

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: 'Gagal melakukan analisis AI.' });
    }
};