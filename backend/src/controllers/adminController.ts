import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 6, role, class: userClass, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT u.*, 
            (SELECT GROUP_CONCAT(s.full_name SEPARATOR ', ') FROM users s WHERE s.parent_id = u.id) as children_names
            FROM users u 
            WHERE 1=1
        `;
        const params: any[] = [];

        // Dynamic Filtering
        if (role && role !== 'all') {
            query += ` AND u.role = ?`;
            params.push(role);
        }
        if (userClass && userClass !== 'all') {
            query += ` AND u.class = ?`;
            params.push(userClass);
        }
        if (search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        // Pagination
        query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [users]: any = await pool.query(query, params);

        // Hitung Total untuk Pagination
        let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
        const countParams: any[] = [];
        
        if (role && role !== 'all') { countQuery += ` AND u.role = ?`; countParams.push(role); }
        if (userClass && userClass !== 'all') { countQuery += ` AND u.class = ?`; countParams.push(userClass); }
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
        const [rows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { full_name, email, password, role, nisn, nip, class: userClass, whatsapp_number } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO users (full_name, email, password, role, nisn, nip, class, whatsapp_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, hashedPassword, role, nisn || null, nip || null, userClass || null, whatsapp_number || null]
        );
        res.status(201).json({ message: "User berhasil dibuat" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal membuat user" });
    }
};

// 4. UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { full_name, email, role, nisn, nip, class: userClass, whatsapp_number, password } = req.body;
    
    try {
        let query = `UPDATE users SET full_name=?, email=?, role=?, nisn=?, nip=?, class=?, whatsapp_number=?`;
        const params = [full_name, email, role, nisn || null, nip || null, userClass || null, whatsapp_number || null];

        if (password && password.trim() !== "") {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password=?`;
            params.push(hashedPassword);
        }

        query += ` WHERE id=?`;
        params.push(id);

        await pool.query(query, params);
        res.json({ message: "User berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "Gagal update user" });
    }
};

// 5. DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus user" });
    }
};

export const getClasses = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT c.*, 
            u.full_name as teacher_name,
            (SELECT COUNT(*) FROM users s WHERE s.class = c.name AND s.role = 'student') as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.name ASC
        `;
        const [classes]: any = await pool.query(query);
        res.json(classes);
    } catch (error: any) {
        // Jika tabel belum ada, kirim kode khusus agar frontend tahu
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ code: 'NO_TABLE', message: "Tabel kelas belum dibuat." });
        }
        console.error(error);
        res.status(500).json({ message: "Gagal memuat data kelas" });
    }
};

// [BARU] 2. SETUP DATABASE KELAS (MIGRASI OTOMATIS)
export const setupClassDatabase = async (req: Request, res: Response) => {
    try {
        // A. Buat Tabel Classes
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

        // B. Migrasi Data: Ambil semua nama kelas unik dari user (Siswa & Guru) yang sudah ada
        await pool.query(`
            INSERT IGNORE INTO classes (name)
            SELECT DISTINCT class FROM users 
            WHERE class IS NOT NULL AND class != ''
        `);

        // C. Migrasi Wali Kelas: Link-kan Guru ke Kelas berdasarkan inputan lama
        await pool.query(`
            UPDATE classes c
            JOIN users u ON u.class = c.name
            SET c.teacher_id = u.id
            WHERE u.role = 'teacher'
        `);

        res.json({ message: "Database kelas berhasil dibuat & data lama berhasil dimigrasi!" });
    } catch (error) {
        console.error("Setup Error:", error);
        res.status(500).json({ message: "Gagal melakukan setup database." });
    }
};

// 3. CREATE CLASS
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

// 4. GENERATE CLASSES (Bulk)
export const generateClasses = async (req: Request, res: Response) => {
    const { grade, startLetter, endLetter } = req.body;
    
    if (!grade || !startLetter || !endLetter) {
        return res.status(400).json({ message: "Parameter tidak lengkap" });
    }

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
        console.error(error);
        res.status(500).json({ message: "Gagal generate kelas" });
    }
};

// 5. UPDATE CLASS
export const updateClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, teacher_id } = req.body;
    try {
        await pool.query("UPDATE classes SET name=?, teacher_id=? WHERE id=?", [name, teacher_id || null, id]);
        
        // Sinkronisasi ke tabel user: Jika guru ditugaskan, update kolom class di tabel user guru tsb
        if (teacher_id) {
            await pool.query("UPDATE users SET class=? WHERE id=?", [name, teacher_id]);
        }

        res.json({ message: "Kelas berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: "Gagal update kelas" });
    }
};

// 6. DELETE CLASS
export const deleteClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM classes WHERE id=?", [id]);
        res.json({ message: "Kelas dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus kelas" });
    }
};

// 7. GET CLASS DETAIL
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

        const [students]: any = await pool.query(`
            SELECT id, full_name, nisn, email 
            FROM users 
            WHERE class = ? AND role = 'student' 
            ORDER BY full_name ASC`, [classData.name]);

        res.json({ ...classData, students });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 8. GET TEACHERS LIST
export const getTeachersList = async (req: Request, res: Response) => {
    try {
        const [teachers]: any = await pool.query("SELECT id, full_name FROM users WHERE role = 'teacher' ORDER BY full_name ASC");
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: "Gagal memuat guru" });
    }
};

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Hitung Total Log Seluruh Siswa
        const [totalRows]: any = await pool.query("SELECT COUNT(*) as total FROM character_logs");
        const totalLogs = totalRows[0].total || 1; // Default 1 untuk menghindari pembagian dengan 0

        // 2. Hitung Keterisian (Indikator Partisipasi)
        // [PERBAIKAN] Menggunakan nama kolom yang benar sesuai file smpnpeka_isokul (11).sql
        const [statsRows]: any = await pool.query(`
            SELECT 
                COUNT(CASE WHEN wake_up_time IS NOT NULL AND wake_up_time != '' THEN 1 END) as bangun_pagi,
                
                COUNT(CASE WHEN worship_activities IS NOT NULL AND worship_activities != '[]' AND worship_activities != '' THEN 1 END) as beribadah,
                
                -- Sebelumnya exercise_type (salah) -> sport_activities (benar)
                COUNT(CASE WHEN sport_activities IS NOT NULL AND sport_activities != '' THEN 1 END) as olahraga,
                
                -- Sebelumnya healthy_food_notes (salah) -> meal_text (benar)
                COUNT(CASE WHEN meal_text IS NOT NULL AND meal_text != '' THEN 1 END) as makan_sehat,
                
                -- Sebelumnya learning_subject (salah) -> study_activities (benar)
                COUNT(CASE WHEN study_activities IS NOT NULL AND study_activities != '[]' AND study_activities != '' THEN 1 END) as belajar,
                
                -- Sebelumnya social_activity_notes (salah) -> social_activities (benar)
                COUNT(CASE WHEN social_activities IS NOT NULL AND social_activities != '[]' AND social_activities != '' THEN 1 END) as sosial,
                
                COUNT(CASE WHEN sleep_time IS NOT NULL AND sleep_time != '' THEN 1 END) as tidur_cepat
            FROM character_logs
        `);

        const stats = statsRows[0];

        // Helper hitung persen
        const calc = (val: number) => Math.round((val / totalLogs) * 100);

        // 3. Mapping ke 7 Kebiasaan
        const habits = {
            bangunPagi: calc(stats.bangun_pagi),
            beribadah: calc(stats.beribadah),
            berolahraga: calc(stats.olahraga),
            makanSehat: calc(stats.makan_sehat),
            gemarBelajar: calc(stats.belajar),
            bermasyarakat: calc(stats.sosial),
            tidurCepat: calc(stats.tidur_cepat)
        };

        // 4. Mapping ke Profil Lulusan (Logika Agregasi)
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

        res.json({
            totalLogs: totalRows[0].total, // Total data untuk ditampilkan
            habits,
            profile
        });

    } catch (error) {
        console.error("Error admin stats:", error);
        res.status(500).json({ message: 'Gagal memuat statistik admin.' });
    }
};

export const generateNationalAnalysis = async (req: Request, res: Response) => {
    try {
        // 1. AMBIL DATA AGREGAT (Sama seperti dashboard stats)
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

        // Data yang akan dikirim ke AI
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

        // 2. PROMPT ENGINEERING (Sesuai permintaan Anda)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Bertindaklah sebagai Konsultan Pendidikan Nasional & Psikolog Karakter. 
            Analisis data agregat karakter siswa sekolah menengah berikut ini:
            ${JSON.stringify(dataSummary)}

            Tugas Anda adalah menghasilkan laporan "Sintesis Intelijen AI" dalam format JSON murni (tanpa markdown code block) dengan struktur persis seperti ini:
            {
                "strengths": "Kalimat analisis tentang kekuatan kolektif (misal: kesadaran kesehatan fisik).",
                "interventions": "Kalimat analisis tentang area yang kurang/nol (misal: kompetensi abad 21, kolaborasi, dll).",
                "recommendations": "Satu kalimat rekomendasi kebijakan konkret (misal: implementasi PBL)."
            }

            Gunakan bahasa Indonesia yang akademis, tajam, dan solutif. Jangan berikan pengantar, langsung JSON object.
        `;

        // 3. JALANKAN AI
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Bersihkan output jika ada markdown formatting ```json ... ```
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const analysisResult = JSON.parse(cleanJson);

        res.json(analysisResult);

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: 'Gagal melakukan analisis AI.' });
    }
};