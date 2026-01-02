import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../middleware/authMiddleware';

// --- 1. LOGIN (MANUAL & PHONE) ---
export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

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

    if (!user) return res.status(401).json({ message: 'Akun tidak ditemukan.' });

    // Cek Password (Handle Bcrypt dari PHP/Laravel format $2y$ ke $2a$)
    const userPasswordHash = user.password ? user.password.replace('$2y$', '$2a$') : '';
    if (!userPasswordHash) return res.status(401).json({ message: 'Akun ini terdaftar via Google. Silakan login via Google.' });

    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);
    if (!isPasswordValid) return res.status(401).json({ message: 'Password salah.' });

    // Buat Token
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
        classId: user.class_id, // Menggunakan class_id sesuai struktur DB terbaru
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 2. REGISTRASI MANUAL ---
export const register = async (req: Request, res: Response) => {
  const { role, fullName, email, password, nisn, classId, nip, whatsappNumber } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Validasi Dasar
    if (!email || !password || !fullName || !role) {
      throw new Error("Data pendaftaran tidak lengkap.");
    }

    // 2. Cek email duplikat
    const [existing]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error("Email sudah digunakan.");

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert User Dasar
    const [result]: any = await connection.query(
      `INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
      [fullName.trim(), email, hashedPassword, role]
    );
    const newUserId = result.insertId;

    // 5. Update Data Spesifik per Role
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

    // 6. Langsung berikan token agar bisa auto-login
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