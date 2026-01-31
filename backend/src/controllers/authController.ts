import { Request, Response, RequestHandler } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, UserPayload } from '../middleware/authMiddleware';

export const getClasses: RequestHandler = async (req, res) => {
  try {
    // [FIX] Tambahkan c.academic_year dan fix nama kolom capacity
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.capacity as kapasitas, -- Alias agar sesuai dengan frontend
        c.academic_year,         -- Tambahan kolom Tahun Ajaran
        (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id AND u.role = 'student') as student_count,
        c.teacher_id, 
        u.full_name as teacher_name 
      FROM classes c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      ORDER BY c.academic_year DESC, c.name ASC
    `;
    const [rows] = await pool.query(query);
    
    res.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil data kelas:", error);
    res.status(500).json({ message: "Gagal mengambil data kelas" });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // [FIX] Ensure personal_email is selected (SELECT * covers it)
      const [rows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
      
      if (rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
      }

      const user = rows[0];
      delete user.password; 

      res.json(user); 
  } catch (error) {
      console.error("Get Me Error:", error);
      res.status(500).json({ message: "Server Error" });
  }
};

// --- 1. LOGIN (MANUAL & PHONE) ---
export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

  // Pesan Error Umum (Generic) untuk keamanan
  const LOGIN_FAIL_MSG = 'ID Pengguna atau Password salah.';

  try {
    let user = null;

    // Cek apakah input angka (potensi No HP Parent)
    const isPhoneNumber = /^\d{10,}$/.test(loginIdentifier);

    if (isPhoneNumber) {
      const parentQuery = `SELECT * FROM users WHERE whatsapp_number = ? AND role = 'parent' LIMIT 1`;
      const [parentRows]: any[] = await pool.query(parentQuery, [loginIdentifier]);
      if (parentRows.length > 0) user = parentRows[0];
    }

    if (!user) {
      const query = `
          SELECT * FROM users 
          WHERE email = ? OR nisn = ? OR nip = ? OR whatsapp_number = ?
          LIMIT 1
        `;
      const [rows]: any[] = await pool.query(query, [loginIdentifier, loginIdentifier, loginIdentifier, loginIdentifier]);
      user = rows[0];
    }

    if (!user) return res.status(401).json({ message: LOGIN_FAIL_MSG });

    // CEK APAKAH USER PUNYA PASSWORD
    // Siswa baru daftar (belum diaktivasi ortu) passwordnya NULL/Kosong
    if (!user.password) {
        if (user.role === 'student') {
            return res.status(401).json({ message: 'Akun siswa belum diaktivasi oleh Orang Tua. Silakan minta Orang Tua untuk menautkan akun.' });
        } else if (user.google_id) {
            return res.status(401).json({ message: 'Akun ini terdaftar via Google. Silakan login via Google.' });
        } else {
            return res.status(401).json({ message: 'Akun belum memiliki password.' });
        }
    }

    const userPasswordHash = user.password.replace('$2y$', '$2a$'); // Kompatibilitas hash PHP lama (jika ada)
    
    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);
    
    if (!isPasswordValid) return res.status(401).json({ message: LOGIN_FAIL_MSG });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        nip: user.nip,
        classId: user.class_id,
        personal_email: user.personal_email, // Added
        // Add start_period and end_period if available in DB schema
        start_period: user.start_period,
        end_period: user.end_period
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { 
      role, 
      fullName, 
      email, 
      password, 
      nisn, 
      nip, 
      whatsappNumber, 
      classId, 
      contributor_type, 
      agency_name, 
      personal_email 
  } = req.body;

  try {
      // 1. Tentukan Identifier Unik berdasarkan Role
      let identifier = null;
      let fieldName = '';
      if (role === 'student') { identifier = nisn; fieldName = 'NISN'; }
      else if (role === 'teacher' || role === 'contributor') { identifier = nip; fieldName = 'NIP / ID'; }
      else if (role === 'parent') { identifier = whatsappNumber; fieldName = 'Nomor WhatsApp'; }

      // 2. Cek apakah data (NIP/NISN/Email) sudah ada di database
      const [existingUsers]: any = await pool.query(
          `SELECT id, full_name, email, role, personal_email, password 
           FROM users 
           WHERE (email = ?) OR (nisn IS NOT NULL AND nisn = ?) OR (nip IS NOT NULL AND nip = ?)`,
          [email, nisn || '', nip || '']
      );

      if (existingUsers.length > 0) {
          const existing = existingUsers[0];

          // Jika user ditemukan tapi belum punya password (data import/draft) atau belum punya email pribadi
          // Kita arahkan frontend untuk "Lengkapi Data" bukan menolak
          return res.status(200).json({
              status: 'ALREADY_EXISTS',
              message: `Data dengan ${fieldName} tersebut sudah tersedia atas nama ${existing.full_name}.`,
              userId: existing.id,
              existingData: {
                  fullName: existing.full_name,
                  role: existing.role,
                  hasPassword: !!existing.password,
                  personalEmail: existing.personal_email
              }
          });
      }

      // 3. Hash Password untuk User Baru
      let hashedPassword = null;
      if (password) {
          const salt = await bcrypt.genSalt(10);
          hashedPassword = await bcrypt.hash(password, salt);
      }

      // 4. Insert User Baru (Entri Baru)
      const [result]: any = await pool.query(
          `INSERT INTO users (
              full_name, email, password, role, 
              nisn, nip, whatsapp_number, class_id, 
              contributor_type, agency_name, personal_email
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
              fullName, email, hashedPassword, role, 
              nisn || null, nip || null, whatsappNumber || null, classId || null,
              contributor_type || null, agency_name || null, personal_email || null
          ]
      );

      const newUserId = result.insertId;

      // 5. Update Relasi Wali Kelas jika diperlukan
      if (role === 'teacher' && classId) {
          await pool.query("UPDATE classes SET teacher_id = ? WHERE id = ? AND teacher_id IS NULL", [newUserId, classId]);
      }

      const [newUser]: any = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = ?", [newUserId]);

      res.status(201).json({
          status: 'SUCCESS',
          message: 'Registrasi berhasil',
          user: newUser[0]
      });

  } catch (error: any) {
      console.error("Register Error:", error);
      res.status(500).json({ message: 'Terjadi kesalahan server saat registrasi.' });
  }
};

export const requestProfileSync = async (req: Request, res: Response) => {
  const { userId, newPersonalEmail, newFullName } = req.body;

  try {
      // Simpan permintaan ke dalam kolom pending_data_update agar admin bisa verifikasi
      const pendingData = JSON.stringify({ personal_email: newPersonalEmail, full_name: newFullName });
      
      await pool.query(
          "UPDATE users SET is_sync_pending = 1, pending_data_update = ? WHERE id = ?",
          [pendingData, userId]
      );

      res.json({ message: "Permintaan sinkronisasi telah dikirim. Menunggu konfirmasi admin." });
  } catch (error) {
      res.status(500).json({ message: "Gagal mengirim permintaan sinkronisasi." });
  }
};

export const getPublicSettings = async (req: Request, res: Response) => {
  try {
      const [rows]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'current_academic_year'");
      const currentYear = rows.length > 0 ? rows[0].setting_value : '2025/2026';
      
      // Ambil semester juga jika perlu
      const [semRows]: any = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'current_semester'");
      const currentSemester = semRows.length > 0 ? semRows[0].setting_value : 'Ganjil';

      res.json({ 
          current_academic_year: currentYear,
          current_semester: currentSemester
      });
  } catch (error) {
      console.error("Public Settings Error:", error);
      res.status(500).json({ message: 'Gagal mengambil pengaturan publik.' });
  }
};

export const updatePersonalEmail = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { personal_email } = req.body;

  if (!personal_email || !personal_email.includes('@')) {
      return res.status(400).json({ message: "Email tidak valid." });
  }

  try {
      await pool.query("UPDATE users SET personal_email = ? WHERE id = ?", [personal_email, userId]);
      res.json({ message: "Email pribadi berhasil disimpan." });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal menyimpan email." });
  }
};

// --- 3. GOOGLE CALLBACK HANDLER ---
export const googleCallbackHandler = async (req: Request, res: Response) => {
  const frontendBaseUrl = process.env.FRONTEND_URL || '';

  try {
    const userProfile = req.user as any;
    const email = userProfile.emails[0].value;
    const googleId = userProfile.id;
    const displayName = userProfile.displayName;

    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];

    if (existingUser) {
      if (!existingUser.google_id) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, existingUser.id]);
      }
      const token = jwt.sign(
        { id: existingUser.id, role: existingUser.role, name: existingUser.full_name },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );
      return res.redirect(`${frontendBaseUrl}/google-register-complete?token=${token}`);
    }

    const tempToken = jwt.sign(
      { email: email, googleId: googleId, fullName: displayName, role: 'new_user', isNewUser: true },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    return res.redirect(`${frontendBaseUrl}/google-register-complete?token=${tempToken}`);

  } catch (error: any) {
    console.error("Google Auth Error:", error);
    const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'Unknown Error');
    return res.redirect(`${frontendBaseUrl}/login?error=${errorMessage}`);
  }
};

// --- 4. COMPLETE GOOGLE REGISTRATION ---
export const completeGoogleRegistration = async (req: Request, res: Response) => {
  const { role, fullName, nisn, classId, nip, phoneNumber } = req.body;
  const userToken = (req as any).user as UserPayload;

  if (!userToken || !userToken.email || !userToken.googleId) {
    return res.status(401).json({ message: "Sesi Google tidak valid." });
  }

  const { email, googleId } = userToken;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [checkUser]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (checkUser.length > 0) throw new Error("Email ini sudah terdaftar.");

    // Insert user baru via Google (Password NULL)
    const [result]: any = await connection.query(
      `INSERT INTO users (full_name, email, role, google_id, password) VALUES (?, ?, ?, ?, NULL)`,
      [fullName.trim(), email, role, googleId]
    );
    const newUserId = result.insertId;

    if (role === 'student') {
      if (!nisn || !classId) throw new Error("NISN dan Kelas wajib diisi.");
      const [checkNisn]: any = await connection.query('SELECT id FROM users WHERE nisn = ?', [nisn]);
      if (checkNisn.length > 0) throw new Error("NISN sudah terdaftar.");
      await connection.query('UPDATE users SET nisn = ?, class_id = ? WHERE id = ?', [nisn.trim(), classId, newUserId]);
    
    } else if (role === 'teacher') {
      await connection.query('UPDATE users SET nip = ?, class_id = ? WHERE id = ?', [nip.trim(), classId || null, newUserId]);
      
      if (classId) {
         await connection.query("UPDATE users SET class_id = NULL WHERE class_id = ? AND role = 'teacher' AND id != ?", [classId, newUserId]);
         await connection.query("UPDATE classes SET teacher_id = ? WHERE id = ?", [newUserId, classId]);
      }

    } else if (role === 'parent') {
      const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : null;
      if (!cleanPhone) throw new Error("Nomor WhatsApp wajib diisi.");
      await connection.query('UPDATE users SET whatsapp_number = ? WHERE id = ?', [cleanPhone, newUserId]);
    } else if (role === 'contributor') {
      await connection.query('UPDATE users SET nip = ? WHERE id = ?', [nip.trim(), newUserId]);
    }

    await connection.commit();

    const finalToken = jwt.sign(
      { id: newUserId, role, name: fullName },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Registrasi berhasil',
      token: finalToken,
      user: { id: newUserId, role, fullName, email }
    });

  } catch (error: any) {
    await connection.rollback();
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// --- 5. GET STUDENTS LIST (ADMIN) ---
export const getStudentsList = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id, u.full_name, u.nisn, 
        c.name as class_name,
        t.full_name as teacher_name
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      LEFT JOIN users t ON c.teacher_id = t.id
      WHERE u.role = 'student'
      ORDER BY u.full_name ASC
    `;
    const [rows] = await pool.query(query);
    res.json({ data: rows });
  } catch (error) {
    console.error("Fetch Students Error:", error);
    res.status(500).json({ message: "Gagal mengambil data siswa" });
  }
};