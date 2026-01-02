import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- 1. LOGIN MANUAL (Tetap) ---
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

    // Cek Password
    const userPasswordHash = user.password.replace('$2y$', '$2a$'); 
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
        classId: user.class_id,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 2. REGISTRASI MANUAL (Tetap) ---
export const register = async (req: Request, res: Response) => {
    res.status(501).json({ message: "Gunakan fitur Google Login." });
};

// --- 3. GOOGLE CALLBACK HANDLER (UPDATED FRONTEND URL) ---
export const googleCallbackHandler = async (req: Request, res: Response) => {
  // Ambil URL Frontend dari ENV
  // Jika tidak ada di .env, default ke localhost (untuk development)
  const frontendBaseUrl = process.env.FRONTEND_URL || '';

  try {
    const userProfile = req.user as any;
    const email = userProfile.emails[0].value;
    const googleId = userProfile.id;
    const displayName = userProfile.displayName;

    // Cek User di DB
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];

    // SKENARIO A: USER SUDAH TERDAFTAR
    if (existingUser) {
      if (!existingUser.google_id) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, existingUser.id]);
      }

      const token = jwt.sign(
        { id: existingUser.id, role: existingUser.role, name: existingUser.full_name },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );

      // Redirect menggunakan variable URL
      return res.redirect(`${frontendBaseUrl}/google-register-complete?token=${token}`);
    }

    // SKENARIO B: USER BARU
    const tempToken = jwt.sign(
        { 
            email: email, 
            googleId: googleId, 
            fullName: displayName,
            role: 'new_user',
            isNewUser: true 
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' } 
    );

    // Redirect menggunakan variable URL
    return res.redirect(`${frontendBaseUrl}/google-register-complete?token=${tempToken}`);

  } catch (error: any) {
    console.error("Google Auth Error:", error);
    // TAMPILKAN ERROR DI URL AGAR KITA TAHU PENYEBABNYA
    return res.redirect(`${frontendBaseUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
};

// --- 4. SUBMIT PENDAFTARAN LENGKAP (Tetap) ---
export const completeGoogleRegistration = async (req: Request, res: Response) => {
    const { role, fullName, nisn, classId, nip, phoneNumber } = req.body;
    
    const userToken = (req as any).user; 

    if (!userToken || !userToken.email || !userToken.googleId) {
        return res.status(401).json({ message: "Token tidak valid atau sesi habis." });
    }

    const { email, googleId } = userToken;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [checkUser]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (checkUser.length > 0) {
             throw new Error("Email ini sudah terdaftar sebelumnya.");
        }

        // 1. Insert User Dasar
        const [result]: any = await connection.query(
            `INSERT INTO users (full_name, email, role, google_id, password) 
             VALUES (?, ?, ?, ?, NULL)`,
            [fullName, email, role, googleId]
        );
        const newUserId = result.insertId;

        // 2. Update Data Spesifik Berdasarkan Role
        if (role === 'student') {
            if (!nisn || !classId) throw new Error("NISN dan Kelas wajib diisi.");
            
            const [checkNisn]: any = await connection.query('SELECT id FROM users WHERE nisn = ?', [nisn]);
            if (checkNisn.length > 0) throw new Error("NISN sudah digunakan siswa lain.");

            await connection.query(
                'UPDATE users SET nisn = ?, class_id = ? WHERE id = ?',
                [nisn, classId, newUserId]
            );

        } else if (role === 'teacher') {
            if (!nip) throw new Error("NIP/NIS wajib diisi.");
            
            await connection.query(
                'UPDATE users SET nip = ?, class_id = ? WHERE id = ?',
                [nip, classId || null, newUserId]
            );

        } else if (role === 'parent') {
            if (!phoneNumber) throw new Error("Nomor Telepon wajib diisi.");
            
            await connection.query(
                'UPDATE users SET whatsapp_number = ? WHERE id = ?',
                [phoneNumber, newUserId]
            );

        } else if (role === 'contributor') {
             if (!nip) throw new Error("NIP/NIS wajib diisi.");
             await connection.query(
                'UPDATE users SET nip = ? WHERE id = ?',
                [nip, newUserId]
            );
        }

        await connection.commit();

        // 3. Generate Token Login Permanen
        const finalToken = jwt.sign(
            { id: newUserId, role, name: fullName },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.status(201).json({ 
            message: 'Registrasi berhasil', 
            token: finalToken,
            user: { id: newUserId, role, fullName } 
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Register Complete Error:", error);
        res.status(400).json({ message: error.message || 'Gagal menyimpan data.' });
    } finally {
        connection.release();
    }
};