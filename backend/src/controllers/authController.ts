import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. LOGIN MANUAL
export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

  try {
    let user = null;

    // --- LOGIC PRIORITAS PARENT ---
    // Cek apakah input hanya angka dan panjangnya minimal 10 digit (asumsi No WA/HP)
    // Regex: ^\d{10,}$ artinya start sampai end isinya digit, minimal 10 karakter
    const isPhoneNumber = /^\d{10,}$/.test(loginIdentifier);

    if (isPhoneNumber) {
        // Jika terlihat seperti No HP, Coba cari PARENT terlebih dahulu secara spesifik
        const parentQuery = `SELECT * FROM users WHERE whatsapp_number = ? AND role = 'parent' LIMIT 1`;
        const [parentRows]: any[] = await pool.query(parentQuery, [loginIdentifier]);
        
        if (parentRows.length > 0) {
            user = parentRows[0];
        }
    }

    // Jika user belum ditemukan (bukan parent atau input bukan nomor hp), lakukan pencarian umum
    if (!user) {
        const query = `
          SELECT * FROM users 
          WHERE email = ? OR nisn = ? OR nip = ? OR whatsapp_number = ?
          LIMIT 1
        `;
        const params = [loginIdentifier, loginIdentifier, loginIdentifier, loginIdentifier];
        const [rows]: any[] = await pool.query(query, params);
        user = rows[0];
    }
    // -----------------------------

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Cek Password
    // Handle format hash lama ($2y$) jika ada, ubah ke $2a$ agar kompatibel dengan bcryptjs
    const userPasswordHash = user.password.replace('$2y$', '$2a$');
    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Buat Token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role, // Role ini yang menentukan redirect di frontend
        class: user.class,
        nip: user.nip
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. REGISTRASI MANUAL
export const register = async (req: Request, res: Response) => {
  const { fullName, password, role, nisn, nip, class: userClass, whatsappNumber } = req.body;

  if (!fullName || !password || !role) {
    return res.status(400).json({ message: 'Mohon lengkapi data wajib.' });
  }

  let dbEmail: string;

  try {
    // Cek duplikasi data
    let conflictCheckQuery: string = '';
    let conflictCheckParams: any[] = [];

    switch(role) {
      case 'student':
        if (!nisn) return res.status(400).json({ message: 'NISN diperlukan untuk siswa.' });
        dbEmail = `${nisn}@student.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE nisn = ?';
        conflictCheckParams = [nisn];
        break;
      case 'teacher':
      case 'contributor':
        if (!nip) return res.status(400).json({ message: 'NIP diperlukan.' });
        dbEmail = `${nip}@teacher.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE nip = ?';
        conflictCheckParams = [nip];
        break;
      case 'parent':
        if (!whatsappNumber) return res.status(400).json({ message: 'Nomor WhatsApp diperlukan.' });
        dbEmail = `${whatsappNumber}@parent.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE whatsapp_number = ?';
        conflictCheckParams = [whatsappNumber];
        break;
      default:
        return res.status(400).json({ message: 'Peran tidak valid.' });
    }

    if (conflictCheckQuery) {
      const [existingUsers]: any[] = await pool.query(conflictCheckQuery, conflictCheckParams);
      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'User dengan data tersebut sudah terdaftar.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (full_name, email, password, role, nisn, nip, class, whatsapp_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertParams = [
      fullName, 
      dbEmail, 
      hashedPassword, 
      role, 
      nisn || null, 
      nip || null, 
      userClass || null, 
      whatsappNumber || null
    ];
    
    const [result]: any[] = await pool.query(insertQuery, insertParams);

    res.status(201).json({ message: 'Registrasi berhasil', userId: result.insertId });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Gagal mendaftarkan pengguna.', error });
  }
};