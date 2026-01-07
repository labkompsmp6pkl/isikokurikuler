import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 6, role, class_id, search, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT u.*, 
            CASE 
                WHEN u.role = 'teacher' THEN c_teach.name 
                ELSE c.name 
            END as class_name,
            
            CASE 
                WHEN u.role = 'teacher' THEN c_teach.id 
                ELSE c.id 
            END as real_class_id,

            (SELECT GROUP_CONCAT(s.full_name SEPARATOR ', ') FROM users s WHERE s.parent_id = u.id) as children_names,
            
            (u.password IS NOT NULL AND u.password != '') as is_active
            
            FROM users u 
            LEFT JOIN classes c ON u.class_id = c.id
            LEFT JOIN classes c_teach ON c_teach.teacher_id = u.id
            WHERE 1=1
        `;
        
        const params: any[] = [];

        if (role && role !== 'all') {
            query += ` AND u.role = ?`;
            params.push(role);
        }

        if (class_id && class_id !== 'all') {
            if (class_id === 'none') {
                query += ` AND (u.class_id IS NULL OR u.class_id = 0)`;
            } else {
                query += ` AND u.class_id = ?`;
                params.push(class_id);
            }
        }

        // [MODIFIKASI] Filter Status (HANYA BERLAKU UNTUK SISWA)
        if (status && status !== 'all') {
            // Otomatis tambahkan filter role='student' agar lingkupnya terjaga
            query += ` AND u.role = 'student'`;
            
            if (status === 'active') {
                query += ` AND (u.password IS NOT NULL AND u.password != '')`;
            } else if (status === 'inactive') {
                query += ` AND (u.password IS NULL OR u.password = '')`;
            }
        }

        if (search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [users]: any = await pool.query(query, params);

        // --- Query Total Data (Count) ---
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM users u 
            LEFT JOIN classes c_teach ON c_teach.teacher_id = u.id
            WHERE 1=1
        `;
        const countParams: any[] = [];
        
        if (role && role !== 'all') { countQuery += ` AND u.role = ?`; countParams.push(role); }
        
        if (class_id && class_id !== 'all') { 
            if (class_id === 'none') {
                countQuery += ` AND (u.class_id IS NULL OR u.class_id = 0)`;
            } else {
                countQuery += ` AND (u.class_id = ? OR c_teach.id = ?)`; 
                countParams.push(class_id, class_id); 
            }
        }

        // [MODIFIKASI] Filter Status di Count (SAMA SEPERTI DIATAS)
        if (status && status !== 'all') {
            countQuery += ` AND u.role = 'student'`;
            if (status === 'active') {
                countQuery += ` AND (u.password IS NOT NULL AND u.password != '')`;
            } else if (status === 'inactive') {
                countQuery += ` AND (u.password IS NULL OR u.password = '')`;
            }
        }
        
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
    const { full_name, email, password, role, nisn, nip, class_id, whatsapp_number } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 1. Insert User Baru
        const [result]: any = await pool.query(
            `INSERT INTO users (full_name, email, password, role, nisn, nip, class_id, whatsapp_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [full_name, email, hashedPassword, role, nisn || null, nip || null, class_id || null, whatsapp_number || null]
        );

        const newUserId = result.insertId;

        // 2. AUTO SYNC: Jika Guru dipilih jadi Wali Kelas
        if (role === 'teacher' && class_id) {
            // A. Copot jabatan guru lain yang mungkin memegang kelas ini sebelumnya
            await pool.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND role = 'teacher' AND id != ?", [class_id, newUserId]);
            
            // B. Update tabel classes agar menunjuk ke guru baru ini
            await pool.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [newUserId, class_id]);
        }

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

        // AUTO SYNC: Logika Jabatan Guru
        if (role === 'teacher') {
            if (class_id) {
                // Jika ditugaskan ke kelas baru:
                // 1. Copot guru lain dari kelas tersebut
                await pool.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND role = 'teacher' AND id != ?", [class_id, id]);
                // 2. Set tabel classes ke guru ini
                await pool.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [id, class_id]);
            } else {
                // Jika jabatan dicopot (class_id kosong):
                // Hapus nama dia dari tabel classes
                await pool.query("UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?", [id]);
            }
        }

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
        // Clean up classes table if a teacher is deleted
        await pool.query("UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?", [id]);
        res.json({ message: "User berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus user" });
    }
};

export const getClasses = async (req: Request, res: Response) => {
    try {
        // Query ini mengambil data kelas beserta jumlah siswa yang sudah mendaftar (role='student')
        const query = `
            SELECT 
                c.id, 
                c.name, 
                c.teacher_id, 
                c.kapasitas, 
                (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id AND u.role = 'student') as student_count,
                u.full_name as teacher_name
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            ORDER BY c.name ASC
        `;
        
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data kelas' });
    }
};

export const setupClassDatabase = async (req: Request, res: Response) => {
    try {
        // A. Pastikan Tabel Ada
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

        // B. Migrasi Nama Kelas dari string 'class' di users ke tabel classes (jika belum ada)
        await pool.query(`
            INSERT IGNORE INTO classes (name)
            SELECT DISTINCT class FROM users 
            WHERE class IS NOT NULL AND class != ''
        `);

        // C. [SYNC SISWA] Update class_id siswa berdasarkan nama kelas (text) jika class_id masih kosong
        await pool.query(`
            UPDATE users u
            JOIN classes c ON u.class = c.name
            SET u.class_id = c.id
            WHERE u.class_id IS NULL OR u.class_id = 0
        `);

        // D. [SYNC GURU 1] Update tabel 'classes' -> isi teacher_id dari data 'users'
        // (Jika di tabel user dia tersetting sebagai guru kelas X, maka tabel kelas X harus mencatat dia gurunya)
        await pool.query(`
            UPDATE classes c
            JOIN users u ON u.class_id = c.id
            SET c.teacher_id = u.id
            WHERE u.role = 'teacher'
        `);

        // E. [SYNC GURU 2] Update tabel 'users' -> isi class_id dari data 'classes'
        // (Jika di tabel kelas tercatat Pak Budi gurunya, maka profil Pak Budi harus tersetting class_id tersebut)
        await pool.query(`
            UPDATE users u
            JOIN classes c ON c.teacher_id = u.id
            SET u.class_id = c.id
            WHERE u.role = 'teacher' AND (u.class_id IS NULL OR u.class_id = 0)
        `);

        res.json({ message: "Database berhasil diperbaiki & disinkronkan!" });
    } catch (error) {
        console.error("Setup Error:", error);
        res.status(500).json({ message: "Gagal melakukan setup database." });
    }
};

export const createClass = async (req: Request, res: Response) => {
    const { name, teacher_id, kapasitas } = req.body; // Ambil kapasitas dari body
    try {
        // Gunakan kapasitas dari input, atau default 40 jika kosong/invalid
        const limit = kapasitas ? parseInt(kapasitas) : 40;

        const [result]: any = await pool.query(
            "INSERT INTO classes (name, teacher_id, kapasitas) VALUES (?, ?, ?)", 
            [name, teacher_id || null, limit]
        );
        
        if (teacher_id) {
            const newClassId = result.insertId;
            await pool.query("UPDATE users SET class_id = ? WHERE id = ?", [newClassId, teacher_id]);
        }

        res.status(201).json({ message: "Kelas berhasil dibuat" });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Nama kelas sudah ada" });
        console.error(error);
        res.status(500).json({ message: "Gagal membuat kelas" });
    }
};

export const generateClasses = async (req: Request, res: Response) => {
    const { grade, startLetter, endLetter, kapasitas } = req.body; // Ambil kapasitas
    
    if (!grade || !startLetter || !endLetter) return res.status(400).json({ message: "Parameter tidak lengkap" });
    
    const startCode = startLetter.toUpperCase().charCodeAt(0);
    const endCode = endLetter.toUpperCase().charCodeAt(0);
    const limit = kapasitas ? parseInt(kapasitas) : 40; // Default 40

    let createdCount = 0;
    try {
        for (let i = startCode; i <= endCode; i++) {
            const className = `${grade}${String.fromCharCode(i)}`;
            // Masukkan kapasitas ke query insert
            const [result]: any = await pool.query(
                "INSERT IGNORE INTO classes (name, kapasitas) VALUES (?, ?)", 
                [className, limit]
            );
            if (result.affectedRows > 0) createdCount++;
        }
        res.json({ message: `Berhasil membuat ${createdCount} kelas baru dengan kuota ${limit}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal generate kelas" });
    }
};

export const updateClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, teacher_id, kapasitas } = req.body; // Tambahkan kapasitas

    try {
        await pool.query(
            'UPDATE classes SET name = ?, teacher_id = ?, kapasitas = ? WHERE id = ?',
            [name, teacher_id || null, kapasitas || 40, id]
        );
        res.json({ message: 'Kelas berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update kelas' });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM classes WHERE id=?", [id]);
        await pool.query("UPDATE users SET class_id = NULL WHERE class_id = ?", [id]);
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

        // PERBAIKAN 1: Pertegas Prompt agar hanya memberikan JSON
        const prompt = `
            Anda adalah API JSON. Tugas Anda menganalisis data karakter siswa.
            Data: ${JSON.stringify(dataSummary)}
            
            Instruksi:
            1. Analisis kekuatan (strengths), area perlu intervensi (interventions), dan rekomendasi program sekolah (recommendations).
            2. Gunakan Bahasa Indonesia yang formal dan akademis.
            3. HANYA KEMBALIKAN JSON RAW. JANGAN gunakan markdown formatting (seperti \`\`\`json). JANGAN ada kata pengantar.
            
            Format Output JSON Wajib:
            {
                "strengths": ["poin 1", "poin 2"],
                "interventions": ["poin 1", "poin 2"],
                "recommendations": ["poin 1", "poin 2"]
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // PERBAIKAN 2: Logika Ekstraksi JSON yang Lebih Kuat
        // Mencari kurung kurawal pertama '{' dan terakhir '}' untuk membuang teks sampah
        const firstJsonChar = responseText.indexOf('{');
        const lastJsonChar = responseText.lastIndexOf('}');

        if (firstJsonChar !== -1 && lastJsonChar !== -1) {
            const cleanJson = responseText.substring(firstJsonChar, lastJsonChar + 1);
            res.json(JSON.parse(cleanJson));
        } else {
            // Fallback jika AI benar-benar gagal memberikan JSON
            console.error("AI Response invalid:", responseText);
            res.status(500).json({ 
                message: 'Gagal memparsing respon AI.', 
                raw: responseText 
            });
        }

    } catch (error) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ message: 'Gagal melakukan analisis AI.' });
    }
};

export const addStudentsToClass = async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { studentIds } = req.body; // Array ID Siswa: [1, 2, 5]

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Tidak ada siswa yang dipilih." });
    }

    try {
        // Update massal class_id user
        const placeholders = studentIds.map(() => '?').join(',');
        await pool.query(
            `UPDATE users SET class_id = ? WHERE id IN (${placeholders})`,
            [classId, ...studentIds]
        );
        res.json({ message: `${studentIds.length} siswa berhasil ditambahkan.` });
    } catch (error) {
        console.error("Add Students Error:", error);
        res.status(500).json({ message: "Gagal menambahkan siswa." });
    }
};

export const removeStudentsFromClass = async (req: Request, res: Response) => {
    const { classId } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Tidak ada siswa yang dipilih." });
    }

    try {
        const placeholders = studentIds.map(() => '?').join(',');
        // Set class_id jadi NULL
        await pool.query(
            `UPDATE users SET class_id = NULL WHERE class_id = ? AND id IN (${placeholders})`,
            [classId, ...studentIds]
        );
        res.json({ message: `${studentIds.length} siswa berhasil dikeluarkan.` });
    } catch (error) {
        console.error("Remove Students Error:", error);
        res.status(500).json({ message: "Gagal mengeluarkan siswa." });
    }
};

export const getUserDetail = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const queryUser = `
        SELECT 
          u.id, u.full_name, u.email, u.role, u.nisn, u.nip, u.whatsapp_number, u.google_id, u.created_at,
          c.name as class_name,
          (u.password IS NOT NULL AND u.password != '') as is_active
        FROM users u
        LEFT JOIN classes c ON u.class_id = c.id
        WHERE u.id = ?
      `;
      const [rows]: any[] = await pool.query(queryUser, [id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "User tidak ditemukan" });
      }
  
      const user = rows[0];
      let familyData: any[] = [];
  
      if (user.role === 'student') {
        const queryParents = `
          SELECT p.id, p.full_name, p.whatsapp_number, fr.relationship 
          FROM family_relations fr
          JOIN users p ON fr.parent_id = p.id
          WHERE fr.student_id = ?
        `;
        const [parentRows]: any[] = await pool.query(queryParents, [id]);
        familyData = parentRows;
  
      } else if (user.role === 'parent') {
        const queryChildren = `
          SELECT s.id, s.full_name, s.nisn, c.name as class_name, fr.relationship 
          FROM family_relations fr
          JOIN users s ON fr.student_id = s.id
          LEFT JOIN classes c ON s.class_id = c.id
          WHERE fr.parent_id = ?
        `;
        const [childRows]: any[] = await pool.query(queryChildren, [id]);
        familyData = childRows;
      }
  
      res.json({ ...user, family_data: familyData });
  
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan server" });
    }
  };

  export const searchParents = async (req: Request, res: Response) => {
    const { q } = req.query;
    try {
        const query = `
            SELECT u.id, u.full_name, u.email, u.whatsapp_number 
            FROM users u
            LEFT JOIN family_relations fr ON u.id = fr.parent_id
            WHERE u.role = 'parent' 
            AND (u.full_name LIKE ? OR u.email LIKE ? OR u.whatsapp_number LIKE ?)
            AND fr.id IS NULL  -- [FILTER] Hanya yang belum ada di tabel relasi
            LIMIT 10
        `;
        const searchTerm = `%${q}%`;
        const [parents]: any = await pool.query(query, [searchTerm, searchTerm, searchTerm]);
        res.json(parents);
    } catch (error) {
        res.status(500).json({ message: "Gagal mencari orang tua" });
    }
};

// [BARU] Tambah Relasi Keluarga (Admin menghubungkan ortu ke siswa)
export const addFamilyRelation = async (req: Request, res: Response) => {
    const { studentId, parentId, relationship } = req.body;

    if (!studentId || !parentId || !relationship) {
        return res.status(400).json({ message: "Data tidak lengkap" });
    }

    try {
        // Cek apakah sudah ada relasi
        const [existing]: any = await pool.query(
            "SELECT id FROM family_relations WHERE student_id = ? AND parent_id = ?",
            [studentId, parentId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Orang tua ini sudah terhubung dengan siswa tersebut." });
        }

        // Insert Relasi
        await pool.query(
            "INSERT INTO family_relations (student_id, parent_id, relationship) VALUES (?, ?, ?)",
            [studentId, parentId, relationship]
        );

        res.json({ message: "Berhasil menghubungkan orang tua." });
    } catch (error) {
        console.error("Add Relation Error:", error);
        res.status(500).json({ message: "Gagal menghubungkan orang tua." });
    }
};

export const removeFamilyRelation = async (req: Request, res: Response) => {
    const { studentId, parentId } = req.body;

    try {
        // 1. Hapus hubungan spesifik ini dulu
        await pool.query(
            "DELETE FROM family_relations WHERE student_id = ? AND parent_id = ?",
            [studentId, parentId]
        );

        // 2. Cek apakah masih ada orang tua/wali LAIN yang terhubung dengan siswa ini?
        const [remaining]: any[] = await pool.query(
            "SELECT COUNT(*) as count FROM family_relations WHERE student_id = ?",
            [studentId]
        );

        const sisaOrangTua = remaining[0].count;

        // 3. Logika Reset
        if (sisaOrangTua === 0) {
            // JIKA KOSONG (0): Artinya ini adalah orang tua terakhir yang dihapus.
            // Reset akun siswa (hapus password) agar kembali ke status "Belum Aktivasi"
            await pool.query(
                "UPDATE users SET password = NULL WHERE id = ?",
                [studentId]
            );
            
            return res.json({ 
                message: "Hubungan dilepas. Akun siswa di-reset (Password dihapus) karena tidak ada wali lain yang terhubung." 
            });
        } else {
            // JIKA > 0: Masih ada orang tua lain (misal Ibu masih ada).
            // Password siswa JANGAN dihapus.
            return res.json({ 
                message: "Hubungan dilepas. Password siswa tetap aktif karena masih ada wali lain yang terhubung." 
            });
        }

    } catch (error) {
        console.error("Remove Relation Error:", error);
        res.status(500).json({ message: "Gagal menghapus hubungan." });
    }
};