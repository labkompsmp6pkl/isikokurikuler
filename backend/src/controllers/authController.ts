import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

  try {
    const query = `
      SELECT * FROM users 
      WHERE email = ? OR nisn = ? OR nip = ? OR whatsapp_number = ?
    `;
    const params = [loginIdentifier, loginIdentifier, loginIdentifier, loginIdentifier];
    const [rows]: any[] = await pool.query(query, params);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid. Pengguna tidak ditemukan.' });
    }

    const userPasswordHash = user.password.replace('$2y$', '$2a$');
    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Login gagal: Password tidak cocok.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // --- PERBAIKAN DI SINI ---
    // Menambahkan field `class` ke dalam objek user yang dikembalikan
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        class: user.class // <-- Tambahkan ini
      }
    });

  } catch (error) {
    console.error('Terjadi kesalahan fatal saat login:', error);
    res.status(500).json({ message: 'Kesalahan server saat login', error });
  }
};

export const register = async (req: Request, res: Response) => {
  const { fullName, password, role, nisn, nip, class: userClass, whatsappNumber } = req.body;

  if (!fullName || !password || !role) {
    return res.status(400).json({ message: 'Bidang wajib tidak boleh kosong.' });
  }

  let dbEmail: string;

  try {
    // --- PERBAIKAN DI SINI: Logika pengecekan duplikasi dibuat spesifik per peran ---
    let conflictCheckQuery: string;
    let conflictCheckParams: any[];

    switch(role) {
      case 'student':
        if (!nisn) return res.status(400).json({ message: 'NISN diperlukan untuk siswa.' });
        dbEmail = `${nisn}@student.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE nisn = ?';
        conflictCheckParams = [nisn];
        break;
      case 'teacher':
      case 'contributor':
        if (!nip) return res.status(400).json({ message: 'NIP diperlukan untuk guru/kontributor.' });
        dbEmail = `${nip}@teacher.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE nip = ?';
        conflictCheckParams = [nip];
        break;
      case 'parent':
        if (!whatsappNumber) return res.status(400).json({ message: 'Nomor WhatsApp diperlukan untuk orang tua.' });
        dbEmail = `${whatsappNumber}@parent.isokul`;
        conflictCheckQuery = 'SELECT id FROM users WHERE whatsapp_number = ?';
        conflictCheckParams = [whatsappNumber];
        break;
      default:
        return res.status(400).json({ message: 'Peran tidak valid.' });
    }

    const [existingUsers]: any[] = await pool.query(conflictCheckQuery, conflictCheckParams);

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Pengguna dengan pengenal tersebut sudah ada.' });
    }
    // --- AKHIR PERBAIKAN ---

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `INSERT INTO users (full_name, email, password, role, nisn, nip, class, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertParams = [fullName, dbEmail, hashedPassword, role, nisn || null, nip || null, userClass || null, whatsappNumber || null];
    
    const [result]: any[] = await pool.query(insertQuery, insertParams);

    res.status(201).json({ message: 'Pengguna berhasil dibuat', userId: result.insertId });

  } catch (error) {
    console.error('Terjadi kesalahan saat pendaftaran:', error);
    res.status(500).json({ message: 'Kesalahan saat mendaftarkan pengguna', error });
  }
};
