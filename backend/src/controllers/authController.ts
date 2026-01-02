import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserPayload } from '../middleware/authMiddleware';

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
    
    // --- UBAH BAGIAN INI ---
    // Kita kirim pesan error asli ke URL agar bisa dibaca di browser
    const errorMessage = error instanceof Error ? error.message : 'Unknown Error';
    const errorString = encodeURIComponent(errorMessage); // Supaya aman di URL
    
    // Pastikan variabel frontendBaseUrl sudah didefinisikan di atas (ambil dari process.env)
    const frontendBaseUrl = process.env.FRONTEND_URL || '';
    
    return res.redirect(`${frontendBaseUrl}/login?error=${errorString}`);
  }
};

export const completeGoogleRegistration = async (req: Request, res: Response) => {
  // 1. Ambil data dari body
  const { role, fullName, nisn, classId, nip, phoneNumber } = req.body;
  
  // 2. Gunakan tipe data dari middleware
  const userToken = (req as any).user as UserPayload;

  if (!userToken || !userToken.email || !userToken.googleId) {
      return res.status(401).json({ message: "Sesi Google tidak valid, silakan coba login ulang." });
  }

  const { email, googleId } = userToken;
  const connection = await pool.getConnection();

  try {
      await connection.beginTransaction();

      // 3. Cek apakah email sudah terdaftar (double check)
      const [checkUser]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
      if (checkUser.length > 0) {
           throw new Error("Email ini sudah digunakan oleh akun lain.");
      }

      // 4. Insert User Dasar (Gunakan NULL untuk password karena login via Google)
      const [result]: any = await connection.query(
          `INSERT INTO users (full_name, email, role, google_id, password) 
           VALUES (?, ?, ?, ?, NULL)`,
          [fullName.trim(), email, role, googleId]
      );
      const newUserId = result.insertId;

      // 5. Update Data Spesifik Berdasarkan Role
      if (role === 'student') {
          if (!nisn || !classId) throw new Error("NISN dan Kelas wajib diisi untuk Siswa.");
          
          // Cek Duplikat NISN
          const [checkNisn]: any = await connection.query('SELECT id FROM users WHERE nisn = ?', [nisn]);
          if (checkNisn.length > 0) throw new Error("NISN sudah terdaftar pada siswa lain.");

          await connection.query(
              'UPDATE users SET nisn = ?, class_id = ? WHERE id = ?',
              [nisn.trim(), classId, newUserId]
          );

      } else if (role === 'teacher') {
          if (!nip) throw new Error("NIP/NIS wajib diisi untuk Guru.");
          
          await connection.query(
              'UPDATE users SET nip = ?, class_id = ? WHERE id = ?',
              [nip.trim(), classId || null, newUserId]
          );

      } else if (role === 'parent') {
          if (!phoneNumber) throw new Error("Nomor WhatsApp wajib diisi untuk Orang Tua.");
          
          // Opsional: Bersihkan karakter non-angka dari nomor telepon
          const cleanPhone = phoneNumber.replace(/\D/g, '');

          await connection.query(
              'UPDATE users SET whatsapp_number = ? WHERE id = ?',
              [cleanPhone, newUserId]
          );

      } else if (role === 'contributor') {
           if (!nip) throw new Error("Identitas Pegawai (NIP/NIS) wajib diisi untuk Kontributor.");
           await connection.query(
              'UPDATE users SET nip = ? WHERE id = ?',
              [nip.trim(), newUserId]
          );
      }

      // 6. Selesaikan Transaksi
      await connection.commit();

      // 7. Generate Token Permanen (Sekarang membawa ID asli dari database)
      const finalToken = jwt.sign(
          { id: newUserId, role, name: fullName },
          process.env.JWT_SECRET as string,
          { expiresIn: '1d' }
      );

      res.status(201).json({ 
          message: 'Registrasi berhasil diselesaikan', 
          token: finalToken,
          user: { 
              id: newUserId, 
              role, 
              fullName,
              email 
          } 
      });

  } catch (error: any) {
      // Batalkan semua perubahan jika ada satu pun yang gagal
      await connection.rollback();
      console.error("Critical Register Error:", error);
      res.status(400).json({ message: error.message || 'Gagal menyimpan data akun.' });
  } finally {
      // Sangat penting di hosting: kembalikan koneksi ke pool agar tidak terjadi "Too many connections"
      connection.release();
  }
};