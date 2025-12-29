import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Login gagal: Password tidak cocok.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    // Mengirim data pengguna dalam objek 'user' agar konsisten dengan frontend
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Terjadi kesalahan saat login:', error);
    res.status(500).json({ message: 'Kesalahan saat login', error });
  }
};

export const register = async (req: Request, res: Response) => {
  const {
    fullName,
    email,
    password,
    role,
    nisn,
    nip,
    class: userClass, // Menggunakan alias karena 'class' adalah kata kunci yang dilindungi
    whatsappNumber
  } = req.body;

  // Validasi dasar
  if (!fullName || !password || !role) {
    return res.status(400).json({ message: 'Bidang yang diperlukan tidak lengkap' });
  }
  
  // Untuk orang tua, gunakan nomor WhatsApp sebagai pengenal login
  const loginIdentifier = role === 'parent' ? whatsappNumber : email;

  if (!loginIdentifier) {
      return res.status(400).json({ message: 'Pengenal login (email atau nomor WhatsApp) diperlukan.' });
  }

  try {
    // Periksa apakah pengguna sudah ada
    const [existingUser]: any[] = await pool.query('SELECT id FROM users WHERE email = ?', [loginIdentifier]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'Pengguna dengan email atau nomor ini sudah ada.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (full_name, email, password, role, nisn, nip, class, whatsapp_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Siapkan parameter, gunakan null untuk nilai opsional yang tidak disediakan
    const params = [
      fullName,
      loginIdentifier,
      hashedPassword,
      role,
      nisn || null,
      nip || null,
      userClass || null,
      whatsappNumber || null
    ];

    const [result]: any[] = await pool.query(query, params);

    res.status(201).json({ message: 'Pengguna berhasil dibuat', userId: result.insertId });

  } catch (error) {
    console.error('Terjadi kesalahan saat pendaftaran:', error);
    // Memberikan pesan kesalahan yang lebih spesifik jika terjadi duplikat
    if ((error as any).code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email atau pengenal sudah ada.' });
    }
    res.status(500).json({ message: 'Kesalahan saat mendaftarkan pengguna', error });
  }
};
