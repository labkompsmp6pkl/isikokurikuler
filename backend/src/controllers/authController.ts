import { Request, Response, RequestHandler } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../middleware/authMiddleware';

// ================================================
// Fungsi Baru: Mengambil Daftar Kelas dengan Kapasitas
// ================================================
export const getClasses: RequestHandler = async (req, res) => {
  try {
    const query = 'SELECT id, name, kapasitas, terisi FROM classes ORDER BY name ASC';
    const [rows] = await pool.query(query);
    res.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil data kelas:", error);
    res.status(500).json({ message: "Gagal mengambil data kelas" });
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

    const userPasswordHash = user.password ? user.password.replace('$2y$', '$2a$') : '';
    
    if (!userPasswordHash) return res.status(401).json({ message: 'Akun ini terdaftar via Google. Silakan login via Google.' });

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
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

// --- 2. REGISTRASI MANUAL ---
export const register = async (req: Request, res: Response) => {
  const { role, fullName, email, password, nisn, classId, nip, whatsappNumber } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (!email || !password || !fullName || !role) {
      throw new Error("Data pendaftaran tidak lengkap.");
    }

    const [existing]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error("Email sudah digunakan.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result]: any = await connection.query(
      `INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
      [fullName.trim(), email, hashedPassword, role]
    );
    const newUserId = result.insertId;

    if (role === 'student') {
      if (!nisn || !classId) throw new Error("NISN dan Kelas wajib diisi.");
      const [checkNisn]: any = await connection.query('SELECT id FROM users WHERE nisn = ?', [nisn]);
      if (checkNisn.length > 0) throw new Error("NISN sudah terdaftar.");
      await connection.query('UPDATE users SET nisn = ?, class_id = ? WHERE id = ?', [nisn, classId, newUserId]);

    } else if (role === 'teacher') {
      if (!nip) throw new Error("NIP wajib diisi.");
      await connection.query('UPDATE users SET nip = ?, class_id = ? WHERE id = ?', [nip, classId || null, newUserId]);

    } else if (role === 'parent') {
      if (!whatsappNumber) throw new Error("Nomor WhatsApp wajib diisi.");
      await connection.query('UPDATE users SET whatsapp_number = ? WHERE id = ?', [whatsappNumber, newUserId]);

    } else if (role === 'contributor') {
      if (!nip) throw new Error("NIP/Identitas wajib diisi.");
      await connection.query('UPDATE users SET nip = ? WHERE id = ?', [nip, newUserId]);
    }

    await connection.commit();

    const token = jwt.sign(
      { id: newUserId, role, name: fullName },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      token,
      user: { id: newUserId, role, fullName, email }
    });

  } catch (error: any) {
    await connection.rollback();
    console.error("Manual Register Error:", error);
    res.status(400).json({ message: error.message });
  } finally {
    connection.release();
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
    } else if (role === 'parent') {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
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