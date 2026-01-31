import { Request, Response } from 'express';
import pool from '../config/db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search = '', role = 'all', class_id = 'all', status = 'all', academic_year = 'active' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = `
            SELECT 
                u.id, u.full_name, u.email, u.role, 
                CASE WHEN u.password IS NOT NULL AND u.password != '' THEN 1 ELSE 0 END as is_active,
                u.nisn, u.nip, u.whatsapp_number, u.class_id, u.contributor_type, u.agency_name,
                c.name as class_name,
                c.academic_year as class_academic_year, 
                c.academic_year as active_academic_year,
                (SELECT COUNT(*) FROM family_relations fr WHERE fr.parent_id = u.id) as children_count
            FROM users u
            LEFT JOIN classes c ON u.class_id = c.id
            WHERE u.deleted_at IS NULL
        `;
        
        const params: any[] = [];

        // Filter Role
        if (role !== 'all') { query += ` AND u.role = ?`; params.push(role); }
        
        // Filter Kelas
        if (class_id !== 'all') {
            if (class_id === 'none') { query += ` AND u.class_id IS NULL`; } 
            else { query += ` AND u.class_id = ?`; params.push(class_id); }
        }

        // Di dalam export const getUsers
     if (academic_year !== 'all') {
    if (academic_year === 'active') {
        // [Cek Collation] Pastikan setting_value disamakan collation-nya dengan c.academic_year
        query += ` AND (c.academic_year COLLATE utf8mb4_unicode_ci = (SELECT setting_value COLLATE utf8mb4_unicode_ci FROM app_settings WHERE setting_key = 'current_academic_year') OR u.class_id IS NULL)`;
    } else {
        query += ` AND c.academic_year = ?`;
        params.push(academic_year);
    }
}

        // Filter Status
        if (status !== 'all') {
            if (status === 'active') query += ` AND u.password IS NOT NULL AND u.password != ''`;
            else query += ` AND (u.password IS NULL OR u.password = '')`;
        }
        
        // Search
        if (search) {
            query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows]: any = await pool.query(query, params);

        // [PERBAIKAN JUGA UNTUK COUNT QUERY]
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM users u 
            LEFT JOIN classes c ON u.class_id = c.id 
            WHERE u.deleted_at IS NULL
        `;
        const countParams: any[] = [];

        if (role !== 'all') { countQuery += ` AND u.role = ?`; countParams.push(role); }
        if (class_id !== 'all') {
            if (class_id === 'none') countQuery += ` AND u.class_id IS NULL`;
            else { countQuery += ` AND u.class_id = ?`; countParams.push(class_id); }
        }
        if (academic_year !== 'all') {
            if (academic_year === 'active') {
                // Tambahkan COLLATE juga di sini
                countQuery += ` AND (c.academic_year COLLATE utf8mb4_unicode_ci = (SELECT setting_value COLLATE utf8mb4_unicode_ci FROM app_settings WHERE setting_key = 'current_academic_year') OR u.class_id IS NULL)`;
            } else {
                countQuery += ` AND c.academic_year = ?`;
                countParams.push(academic_year);
            }
        }
        if (status !== 'all') {
             if (status === 'active') countQuery += ` AND u.password IS NOT NULL AND u.password != ''`;
             else countQuery += ` AND (u.password IS NULL OR u.password = '')`;
        }
        if (search) {
            countQuery += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.nisn LIKE ? OR u.nip LIKE ?)`;
            const s = `%${search}%`;
            countParams.push(s, s, s, s);
        }

        const [countResult]: any = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            data: rows,
            meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
        });

    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ message: 'Gagal mengambil data user.' });
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
    const { 
        full_name, email, password, role, nisn, nip, 
        class_id, whatsapp_number,
        contributor_type, agency_name,
        // [BARU] Tambah Parameter
        start_period, end_period 
    } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const hashedPassword = await bcrypt.hash(password, 10);
        let finalAgencyName = agency_name;
        if (role === 'contributor' && !finalAgencyName && contributor_type !== 'Lainnya') {
            finalAgencyName = contributor_type;
        }

        // 1. Insert User
        const [result]: any = await connection.query(
            `INSERT INTO users (
                full_name, email, password, role, nisn, nip, 
                class_id, whatsapp_number, contributor_type, agency_name,
                start_period, end_period 
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                full_name, email, hashedPassword, role, 
                nisn || null, nip || null, class_id || null, whatsapp_number || null,
                role === 'contributor' ? (contributor_type || null) : null,
                role === 'contributor' ? (agency_name || null) : null,
                start_period || null, end_period || null // [BARU]
            ]
        );

        const newUserId = result.insertId;

        // 2. [SYNC WAJIB] Jika Role Teacher & Punya Kelas
        if (role === 'teacher' && class_id) {
            // A. Copot guru lama dari kelas tersebut (agar tidak ada 2 guru di 1 kelas)
            await connection.query("UPDATE classes SET teacher_id = NULL WHERE id = ?", [class_id]);
            
            // B. Masukkan guru baru ke kelas tersebut
            await connection.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [newUserId, class_id]);

            // C. Pastikan users.class_id sudah terset (sudah di insert query diatas)
        }

        await connection.commit();
        res.status(201).json({ message: "User berhasil dibuat" });
    } catch (error) {
        await connection.rollback();
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Gagal membuat user" });
    } finally {
        connection.release();
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { 
        full_name, email, role, nisn, nip, 
        class_id, whatsapp_number, password,
        contributor_type, agency_name,
        // [BARU] Tambah Parameter
        start_period, end_period, personal_email 
    } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ambil data lama
        const [oldUserRows]: any = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
        if (oldUserRows.length === 0) {
            connection.release();
            return res.status(404).json({ message: "User tidak ditemukan" });
        }
        const oldUser = oldUserRows[0];

        // 2. Logika Alumni (Copy logic existing)
        let lastClassName = oldUser.last_class_name;
        let gradYear = oldUser.graduation_year;
        let finalClassId = class_id;

        if (role === 'alumni' && oldUser.role !== 'alumni') {
            if (oldUser.class_id) {
                const [cls]: any = await connection.query("SELECT name FROM classes WHERE id = ?", [oldUser.class_id]);
                if (cls.length > 0) lastClassName = cls[0].name;
            }
            gradYear = new Date().getFullYear().toString();
            finalClassId = null; 
        } else if (role === 'student' && oldUser.role === 'alumni') {
            lastClassName = null;
            gradYear = null;
        }

        // 3. Logika Contributor (Copy logic existing)
        let finalContribType = null;
        let finalAgencyName = null;
        if (role === 'contributor') {
            finalContribType = contributor_type || null;
            if (!agency_name && contributor_type !== 'Lainnya') {
                finalAgencyName = contributor_type;
            } else {
                finalAgencyName = agency_name || null;
            }
        }

        // 4. Update Tabel Users Utama
        let query = `
        UPDATE users 
        SET full_name=?, email=?, role=?, nisn=?, nip=?, 
            class_id=?, whatsapp_number=?, last_class_name=?, graduation_year=?,
            contributor_type=?, agency_name=?,
            start_period=?, end_period=?, personal_email=? -- [BARU]
    `;
    const params = [
        full_name, email, role, nisn || null, nip || null, 
        class_id || null, whatsapp_number || null, null, null, // (sesuaikan var lama)
        contributor_type || null, agency_name || null,
        start_period || null, end_period || null, personal_email || null // [BARU]
    ];

        if (password) {
            query += `, password=?`;
            params.push(await bcrypt.hash(password, 10));
        }
        query += ` WHERE id=?`;
        params.push(id);
        
        await connection.query(query, params);

        // 5. [SYNC WAJIB] PENGELOLAAN WALI KELAS (TEACHER)
        if (role === 'teacher') {
            // Skenario A: Guru dipindah/diassign ke kelas baru (class_id ada isinya)
            if (finalClassId) {
                // 1. Bersihkan kelas LAMA guru ini (jika dulu dia mengajar kelas lain)
                // Hapus teacher_id di tabel classes dimanapun guru ini tercatat
                await connection.query("UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?", [id]);

                // 2. Bersihkan kelas BARU dari guru lama (jika kelas target punya guru lain sebelumnya)
                await connection.query("UPDATE classes SET teacher_id = NULL WHERE id = ?", [finalClassId]);
                // Dan update user guru lama tersebut agar class_id nya jadi NULL (opsional, tapi bagus utk konsistensi)
                await connection.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND role = 'teacher' AND id != ?", [finalClassId, id]);

                // 3. Assign Guru Ini ke Kelas Baru
                await connection.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [id, finalClassId]);
            } 
            // Skenario B: Guru dicopot jabatannya (class_id dikirim null/kosong)
            else {
                // Hapus nama dia dari tabel classes manapun
                await connection.query("UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?", [id]);
            }
        }

        // 6. [SYNC TAMBAHAN] Jika User BUKAN Teacher (misal jadi Admin/Siswa), pastikan dia tidak nyangkut di tabel classes
        if (role !== 'teacher') {
            await connection.query("UPDATE classes SET teacher_id = NULL WHERE teacher_id = ?", [id]);
        }

        await connection.commit();
        res.json({ message: 'User updated successfully' });

    } catch (error) {
        await connection.rollback();
        console.error("Update User Error:", error);
        res.status(500).json({ message: 'Error updating user' });
    } finally {
        connection.release();
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // GUNAKAN DELETE (Bukan Update)
        // Karena di database sudah ada 'ON DELETE CASCADE' atau 'SET NULL', 
        // data di tabel lain (nilai, jurnal, dll) akan otomatis bersih/aman.
        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        res.json({ message: 'User berhasil dihapus secara permanen dari database.' });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ message: 'Gagal menghapus user.' });
    }
};

export const getClasses = async (req: Request, res: Response) => {
    try {
        const { academic_year } = req.query;

        // Ambil tahun aktif untuk prioritas sorting
        const [settings]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'");
        const activeYear = settings[0]?.setting_value || '';

        let query = `
            SELECT 
                c.id, 
                c.name, 
                c.teacher_id, 
                c.capacity as kapasitas,
                c.academic_year,
                u.full_name as teacher_name,
                (SELECT COUNT(*) FROM users s WHERE s.class_id = c.id AND s.role = 'student') as student_count
            FROM classes c
            LEFT JOIN users u ON c.teacher_id = u.id
            WHERE 1=1
        `;
        
        const params: any[] = [];

        // Filter Tahun
        if (academic_year && academic_year !== 'all') {
            query += ` AND c.academic_year = ?`;
            params.push(academic_year);
        }

        // [LOGIC SORTING BARU] 
        // 1. Tahun Aktif paling atas
        // 2. Sisanya urut tahun terbaru
        // 3. Urut nama kelas (7A, 7B...)
        query += ` 
            ORDER BY 
            CASE WHEN c.academic_year = '${activeYear}' THEN 0 ELSE 1 END ASC, 
            c.academic_year DESC, 
            c.name ASC
        `;
        
        const [rows] = await pool.query(query, params);
        res.json({ data: rows }); 
    } catch (error) {
        console.error("Get Classes Error:", error);
        res.status(500).json({ message: 'Gagal mengambil data kelas.' });
    }
};

export const deleteClassesByYear = async (req: Request, res: Response) => {
    const { academic_year } = req.body;

    if (!academic_year) {
        return res.status(400).json({ message: "Tahun ajaran wajib dipilih." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Cek jumlah kelas
        const [check]: any = await connection.query("SELECT COUNT(*) as count FROM classes WHERE academic_year = ?", [academic_year]);
        const count = check[0].count;

        if (count === 0) {
            connection.release();
            return res.status(404).json({ message: "Tidak ada kelas di tahun ajaran tersebut." });
        }

        // 2. Reset Class ID Siswa di tahun tsb (Jadi 'Tanpa Kelas')
        await connection.query(`
            UPDATE users u 
            JOIN classes c ON u.class_id = c.id 
            SET u.class_id = NULL 
            WHERE c.academic_year = ? AND u.role = 'student'
        `, [academic_year]);

        // 3. Reset Class ID Guru (Opsional, jika guru terikat di tabel users)
        await connection.query(`
            UPDATE users u 
            JOIN classes c ON u.class_id = c.id 
            SET u.class_id = NULL 
            WHERE c.academic_year = ? AND u.role = 'teacher'
        `, [academic_year]);

        // 4. Hapus Kelas
        await connection.query("DELETE FROM classes WHERE academic_year = ?", [academic_year]);

        await connection.commit();
        res.json({ message: `Berhasil menghapus ${count} kelas di Tahun Ajaran ${academic_year}.` });

    } catch (error) {
        await connection.rollback();
        console.error("Delete Batch Error:", error);
        res.status(500).json({ message: "Gagal menghapus kelas massal." });
    } finally {
        connection.release();
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
            WHERE u.role = 'teacher'
        `);

        res.json({ message: "Database berhasil diperbaiki & disinkronkan!" });
    } catch (error) {
        console.error("Setup Error:", error);
        res.status(500).json({ message: "Gagal melakukan setup database." });
    }
};

export const createClass = async (req: Request, res: Response) => {
    const { name, teacher_id, kapasitas, academic_year } = req.body;

    try {
        const limit = kapasitas ? parseInt(kapasitas) : 40;
        const year = academic_year || '2025/2026';

        const [result]: any = await pool.query(
            "INSERT INTO classes (name, teacher_id, capacity, academic_year) VALUES (?, ?, ?, ?)", 
            [name, teacher_id || null, limit, year]
        );
        
        // [SYNC] Jika saat buat kelas langsung pilih guru
        if (teacher_id) {
            const newClassId = result.insertId;
            // Update User Guru agar class_id nya menunjuk ke kelas baru ini
            await pool.query("UPDATE users SET class_id = ? WHERE id = ?", [newClassId, teacher_id]);
        }

        res.status(201).json({ message: "Kelas berhasil dibuat" });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Nama kelas sudah ada di tahun ini." });
        console.error(error);
        res.status(500).json({ message: "Gagal membuat kelas" });
    }
};

export const generateClasses = async (req: Request, res: Response) => {
    const { grade, startLetter, endLetter, kapasitas, academic_year } = req.body;
    
    if (!grade || !startLetter || !endLetter) return res.status(400).json({ message: "Parameter tidak lengkap" });
    
    const startCode = startLetter.toUpperCase().charCodeAt(0);
    const endCode = endLetter.toUpperCase().charCodeAt(0);
    const limit = kapasitas ? parseInt(kapasitas) : 40;
    const year = academic_year || '2025/2026';

    let createdCount = 0;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        for (let i = startCode; i <= endCode; i++) {
            const className = `${grade}${String.fromCharCode(i)}`;
            
            // Cek duplikasi manual agar tidak error
            const [existing]: any = await connection.query(
                "SELECT id FROM classes WHERE name = ? AND academic_year = ?", 
                [className, year]
            );

            if (existing.length === 0) {
                await connection.query(
                    "INSERT INTO classes (name, capacity, academic_year) VALUES (?, ?, ?)", 
                    [className, limit, year]
                );
                createdCount++;
            }
        }
        await connection.commit();
        res.json({ message: `Berhasil membuat ${createdCount} kelas baru (${year}) dengan kuota ${limit}.` });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Gagal generate kelas" });
    } finally {
        connection.release();
    }
};

export const updateClass = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, teacher_id, kapasitas, academic_year } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const limit = kapasitas ? parseInt(kapasitas) : 40;

        // 1. Update Tabel Classes
        await connection.query(
            'UPDATE classes SET name = ?, teacher_id = ?, capacity = ?, academic_year = ? WHERE id = ?',
            [name, teacher_id || null, limit, academic_year, id]
        );

        // 2. [SYNC] Jika Guru Diubah
        if (teacher_id) {
            // A. Copot guru ini dari kelas lamanya (jika ada)
            await connection.query("UPDATE users SET class_id = NULL WHERE id = ?", [teacher_id]); 
            // (Note: Sebenarnya update users saja cukup, tapi karena ini updateClass, kita fokus set user ke kelas ini)
            
            // B. Set guru ini ke kelas ini
            await connection.query("UPDATE users SET class_id = ? WHERE id = ?", [id, teacher_id]);

            // C. Jika kelas ini sebelumnya punya guru lain (misal Pak Budi diganti Pak Joko)
            // Pak Budi harus dicopot class_id nya
            await connection.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND id != ? AND role = 'teacher'", [id, teacher_id]);
        } else {
            // Jika teacher_id diset NULL (Dikosongkan)
            // Maka semua guru yang terhubung ke kelas ini harus dicopot
            await connection.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND role = 'teacher'", [id]);
        }

        await connection.commit();
        res.json({ message: 'Kelas berhasil diperbarui' });
    } catch (error) {
        await connection.rollback();
        console.error("Update Error:", error);
        res.status(500).json({ message: 'Gagal update kelas' });
    } finally {
        connection.release();
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
            SELECT c.*, c.capacity as kapasitas, u.full_name as teacher_name 
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

export const getAdminDashboardStats = async (req: Request, res: Response) => {
    try {
        const { period } = req.query; // 'all' or 'active'

        // 1. Get Active Academic Year settings
        const [settings]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'");
        const activeYear = settings[0]?.setting_value || '';

        // 2. Build Filter Clause
        let whereClause = "";
        const queryParams: any[] = [];

        if (period === 'active' && activeYear) {
            // Filter logs only from students currently in classes of the active academic year
            whereClause = `
                WHERE student_id IN (
                    SELECT u.id FROM users u
                    JOIN classes c ON u.class_id = c.id
                    WHERE c.academic_year = ?
                )
            `;
            queryParams.push(activeYear);
        }

        // 3. Count Total Logs (Filtered)
        const [totalRows]: any = await pool.query(`SELECT COUNT(*) as total FROM character_logs ${whereClause}`, queryParams);
        const totalLogs = totalRows[0].total || 1; // Avoid division by zero

        // 4. Calculate Stats (Filtered)
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
            ${whereClause}
        `, queryParams);

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

        // 5. Get General School Stats (Independent of period filter usually, or modify if needed)
        // Note: Total students is usually "Current Active Students", so filtering by period might not apply to headcount unless specified.
        // We'll keep general counts as global.
        const [studentCountRes]: any = await pool.query("SELECT COUNT(*) as total FROM users WHERE role = 'student' AND deleted_at IS NULL");
        const [classCountRes]: any = await pool.query("SELECT COUNT(*) as total FROM classes");
        const [noTeacherRes]: any = await pool.query("SELECT COUNT(*) as total FROM classes WHERE teacher_id IS NULL");

        res.json({ 
            totalStudents: studentCountRes[0].total,
            totalClasses: classCountRes[0].total,
            classesNoTeacher: noTeacherRes[0].total,
            totalLogs: totalRows[0].total, 
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

        // --- OPENROUTER IMPLEMENTATION ---
        
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

        // Panggil OpenRouter API menggunakan fetch
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                // Opsional: Untuk identifikasi aplikasi di dashboard OpenRouter
                "HTTP-Referer": `${process.env.BACKEND_URL}`, 
                "X-Title": "IsiKokurikuler Analysis", 
            },
            body: JSON.stringify({
                "model": "google/gemini-3-flash-preview", // Bisa diganti model lain (misal: "openai/gpt-4o-mini")
                "messages": [
                    { "role": "system", "content": "You are a helpful assistant that outputs raw JSON without markdown." },
                    { "role": "user", "content": prompt }
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        // Ambil text dari response OpenRouter (struktur mirip OpenAI)
        const responseText = data.choices?.[0]?.message?.content || "";

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

    } catch (error: any) {
        console.error("AI Analysis Error:", error);
        res.status(500).json({ 
            message: 'Gagal melakukan analisis AI.', 
            error: error.message 
        });
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
          u.*,
          c.name as class_name,
          (u.password IS NOT NULL AND u.password != '') as is_active
        FROM users u
        LEFT JOIN classes c ON u.class_id = c.id
        WHERE u.id = ?
      `;
      const [rows]: any[] = await pool.query(queryUser, [id]);
  
      if (rows.length === 0) return res.status(404).json({ message: "User tidak ditemukan" });
  
      const user = rows[0];
      let familyData: any[] = [];
  
      // [FIX] Pastikan logika ini mencakup 'student' DAN 'alumni'
      if (user.role === 'student' || user.role === 'alumni') {
        const queryParents = `
          SELECT p.id, p.full_name, p.whatsapp_number, p.email, fr.relationship 
          FROM family_relations fr
          JOIN users p ON fr.parent_id = p.id
          WHERE fr.student_id = ?
        `;
        const [parentRows]: any[] = await pool.query(queryParents, [id]);
        familyData = parentRows;
  
      } else if (user.role === 'parent') {
        // ... (logika parent tetap sama)
        const queryChildren = `
          SELECT s.id, s.full_name, s.nisn, s.role, s.class_id, c.name as class_name, fr.relationship 
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
      console.error(error);
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

export const promoteClass = async (req: Request, res: Response) => {
    const { fromClassId, toClassId, isGraduation } = req.body;

    // Validasi input
    if (!fromClassId) {
        return res.status(400).json({ message: "Kelas asal harus dipilih." });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (isGraduation) {
            // SKENARIO 1: LULUS (Kelas 9 -> Alumni)
            // Ubah role jadi 'alumni' dan kosongkan class_id
            await connection.query(
                `UPDATE users 
                 SET role = 'alumni', class_id = NULL 
                 WHERE class_id = ? AND role = 'student'`,
                [fromClassId]
            );
            
            // Opsional: Nonaktifkan password agar tidak bisa login (jika diinginkan), 
            // TAPI request client bilang "bisa hubungi admin", jadi lebih baik biarkan aktif tapi terbatas.
            
            await connection.commit();
            res.json({ message: "Siswa berhasil diluluskan menjadi Alumni." });

        } else {
            // SKENARIO 2: NAIK KELAS (7A -> 8A)
            if (!toClassId) {
                throw new Error("Kelas tujuan harus dipilih untuk kenaikan kelas.");
            }

            // Pindahkan semua siswa ke kelas baru
            await connection.query(
                `UPDATE users SET class_id = ? WHERE class_id = ? AND role = 'student'`,
                [toClassId, fromClassId]
            );

            await connection.commit();
            res.json({ message: "Siswa berhasil dinaikkan ke kelas tujuan." });
        }

    } catch (error: any) {
        await connection.rollback();
        console.error("Promotion Error:", error);
        res.status(500).json({ message: "Gagal memproses kenaikan kelas." });
    } finally {
        connection.release();
    }
};

export const moveStudents = async (req: Request, res: Response) => {
    const { studentIds, targetClassId, isAlumni } = req.body;
    const currentYear = new Date().getFullYear();

    if (!studentIds?.length) return res.status(400).json({ message: "Pilih siswa." });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const placeholders = studentIds.map(() => '?').join(',');

        if (isAlumni) {
            // Untuk alumni, kita perlu ambil nama kelas mereka saat ini satu per satu (agak berat)
            // ATAU kita update menggunakan JOIN jika database support (MySQL support)
            
            // Query Update dengan JOIN untuk menyimpan nama kelas terakhir
            await connection.query(`
                UPDATE users u
                LEFT JOIN classes c ON u.class_id = c.id
                SET 
                    u.role = 'alumni',
                    u.last_class_name = c.name,
                    u.graduation_year = ?,
                    u.class_id = NULL
                WHERE u.id IN (${placeholders})
            `, [currentYear, ...studentIds]);

        } else {
            // Pindah Biasa
            await connection.query(
                `UPDATE users SET class_id = ?, role = 'student', last_class_name = NULL, graduation_year = NULL WHERE id IN (${placeholders})`,
                [targetClassId, ...studentIds]
            );
        }
        await connection.commit();
        res.json({ message: "Data siswa berhasil diperbarui." });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Gagal memindahkan siswa." });
    } finally {
        connection.release();
    }
};

export const resetAllStudentClasses = async (req: Request, res: Response) => {
    try {
        await pool.query("UPDATE users SET class_id = NULL WHERE role = 'student'");
        res.json({ message: "Semua siswa telah dikeluarkan dari kelas (Kelas Kosong)." });
    } catch (error) {
        res.status(500).json({ message: "Gagal mereset kelas siswa." });
    }
};

export const promoteMassBatch = async (req: Request, res: Response) => {
    const { mappings } = req.body; 
    
    // Ambil tahun sekarang untuk graduation_year
    const currentYear = new Date().getFullYear(); 

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        for (const map of mappings) {
            if (map.fromClassId && map.toClassId) {
                // Kenaikan Biasa (7A -> 8A)
                await connection.query(
                    "UPDATE users SET class_id = ? WHERE class_id = ? AND role = 'student'",
                    [map.toClassId, map.fromClassId]
                );
            } else if (map.fromClassId && map.isAlumni) {
                 // LULUS JADI ALUMNI (Simpan nama kelas dulu!)
                 
                 // Ambil nama kelas lama
                 const [cls]: any = await connection.query("SELECT name FROM classes WHERE id = ?", [map.fromClassId]);
                 const className = cls.length > 0 ? cls[0].name : '';

                 // Update user: Set Alumni, Simpan Last Class, Set Tahun Lulus, Kosongkan Class ID
                 await connection.query(
                    `UPDATE users SET 
                        role = 'alumni', 
                        class_id = NULL, 
                        last_class_name = ?, 
                        graduation_year = ? 
                    WHERE class_id = ? AND role = 'student'`,
                    [className, currentYear, map.fromClassId]
                );
            }
        }

        await connection.commit();
        res.json({ message: "Kenaikan kelas massal berhasil diproses." });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Gagal memproses kenaikan kelas." });
    } finally {
        connection.release();
    }
};

export const updateGlobalAcademicYear = async (req: Request, res: Response) => {
    // Support parameter dari frontend (biasanya academic_year/semester) atau newYear/newSemester
    const { academic_year, semester, newYear: reqYear, newSemester: reqSemester } = req.body;
    
    // Normalisasi variabel
    const newYear = academic_year || reqYear;
    const newSemester = semester || reqSemester;

    if (!newYear || !newSemester) {
        return res.status(400).json({ message: "Tahun ajaran dan semester wajib diisi." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Ambil Tahun Ajaran LAMA (yang sedang aktif sekarang)
        const [currentSettings]: any = await connection.query(
            "SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'"
        );
        const oldYear = currentSettings.length > 0 ? currentSettings[0].setting_value : '';

        // 2. DETEKSI: Apakah Tahun Ajaran Berubah?
        const isYearChanged = oldYear !== newYear;
        let createdCount = 0;
        let message = '';

        if (isYearChanged) {
            // ==========================================
            // SKENARIO 1: GANTI TAHUN (Generate Kelas)
            // ==========================================
            
            // Cek apakah kelas untuk Tahun Ajaran BARU sudah ada?
            const [existingClasses]: any = await connection.query(
                "SELECT COUNT(*) as count FROM classes WHERE academic_year = ?",
                [newYear]
            );

            // Jika belum ada kelas, duplikasi dari tahun lama
            if (existingClasses[0].count === 0) {
                const [oldClasses]: any = await connection.query(
                    "SELECT name, capacity FROM classes WHERE academic_year = ?",
                    [oldYear]
                );

                if (oldClasses.length > 0) {
                    const insertQuery = "INSERT INTO classes (name, capacity, academic_year, teacher_id) VALUES ?";
                    const insertValues = oldClasses.map((cls: any) => [
                        cls.name, 
                        cls.capacity, 
                        newYear, 
                        null // Reset Wali Kelas jadi NULL
                    ]);

                    await connection.query(insertQuery, [insertValues]);
                    createdCount = insertValues.length;
                }
            }
            message = `Berhasil ganti tahun ke ${newYear}. ${createdCount} kelas baru telah dibuat.`;

        } else {
            // ==========================================
            // SKENARIO 2: HANYA GANTI SEMESTER
            // ==========================================
            // Tidak perlu buat kelas baru, hanya update label semester
            message = `Berhasil update semester menjadi ${newSemester}. Data kelas tidak berubah.`;
        }

        // 3. Update Global Settings (Tahun & Semester Aktif)
        // Gunakan ON DUPLICATE KEY UPDATE agar aman
        const upsertQuery = "INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)";
        
        await connection.query(upsertQuery, ['current_academic_year', newYear]);
        await connection.query(upsertQuery, ['current_semester', newSemester]);

        await connection.commit();

        res.json({ 
            message: message,
            details: isYearChanged 
                ? (createdCount > 0 ? `${createdCount} kelas disalin dari tahun lalu.` : `Tahun ajaran baru aktif.`)
                : `Semester diperbarui.`
        });

    } catch (error) {
        await connection.rollback();
        console.error("Update Academic Year Error:", error);
        res.status(500).json({ message: "Gagal memproses pergantian tahun ajaran." });
    } finally {
        connection.release();
    }
};

export const getAppSettings = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query("SELECT * FROM app_settings WHERE setting_key IN ('current_academic_year', 'current_semester')");
        
        // Convert array rows to object
        const settings: any = {};
        rows.forEach((row: any) => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json({ 
            current_academic_year: settings.current_academic_year || '2025/2026',
            current_semester: settings.current_semester || 'Ganjil' // Default Ganjil
        });
    } catch (error) {
        console.error("Get Settings Error:", error);
        res.status(500).json({ message: "Gagal mengambil pengaturan." });
    }
};