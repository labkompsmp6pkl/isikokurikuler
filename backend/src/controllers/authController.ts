import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

export const googleLogin = (req: Request, res: Response) => {
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
  });
  res.redirect(url);
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
        throw new Error('Gagal mendapatkan informasi pengguna dari Google.');
    }

    const { sub: google_id, email, name: full_name } = payload;

    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE google_id = ?', [google_id]);
    let user = rows[0];

    if (user) {
      // Jika pengguna ada, buat token dan kirim
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      // Redirect ke halaman login sukses di frontend dengan token
      res.redirect(`http://localhost:5173/login/success?token=${token}`);
    } else {
      // Jika pengguna tidak ada, redirect ke halaman registrasi lanjutan
      const queryParams = new URLSearchParams({
          google_id,
          email: email!,
          full_name: full_name!
      }).toString();
      res.redirect(`http://localhost:5173/register/google?${queryParams}`);
    }
  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    res.status(500).redirect('/login?error=google-auth-failed');
  }
};

export const login = async (req: Request, res: Response) => {
  const { loginIdentifier, password } = req.body;

  try {
    const query = `
      SELECT * FROM users 
      WHERE (email = ? OR nisn = ? OR nip = ? OR whatsapp_number = ?) AND provider = 'local'
    `;
    const params = [loginIdentifier, loginIdentifier, loginIdentifier, loginIdentifier];
    const [rows]: any[] = await pool.query(query, params);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const userPasswordHash = user.password.replace('$2y$', '$2a$');
    const isPasswordValid = await bcrypt.compare(password, userPasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

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
        role: user.role,
        class: user.class
      }
    });

  } catch (error) {
    console.error('Terjadi kesalahan fatal saat login:', error);
    res.status(500).json({ message: 'Server sedang down' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { fullName, password, role, nisn, nip, class: userClass, whatsappNumber, google_id, email, provider } = req.body;

  // Registrasi via Google
  if (provider === 'google' && google_id) {
    try {
      const [existingUsers]: any[] = await pool.query('SELECT id FROM users WHERE google_id = ?', [google_id]);
      if (existingUsers.length > 0) {
        return res.status(409).json({ message: 'Akun Google ini sudah terdaftar.' });
      }
      
      const insertQuery = `INSERT INTO users (full_name, email, role, nisn, nip, class, whatsapp_number, google_id, provider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'google')`;
      const insertParams = [fullName, email, role, nisn || null, nip || null, userClass || null, whatsappNumber || null, google_id];
      
      const [result]: any[] = await pool.query(insertQuery, insertParams);
      const userId = result.insertId;

      const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

      return res.status(201).json({ token, userId });

    } catch (error) {
        console.error('Kesalahan saat pendaftaran via Google:', error);
        return res.status(500).json({ message: 'Gagal mendaftarkan pengguna via Google.' });
    }
  }

  // Registrasi manual
  if (!fullName || !password || !role) {
    return res.status(400).json({ message: 'Bidang wajib tidak boleh kosong.' });
  }

  let dbEmail: string;

  try {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `INSERT INTO users (full_name, email, password, role, nisn, nip, class, whatsapp_number, provider) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'local')`;
    const insertParams = [fullName, dbEmail, hashedPassword, role, nisn || null, nip || null, userClass || null, whatsappNumber || null];
    
    const [result]: any[] = await pool.query(insertQuery, insertParams);

    res.status(201).json({ message: 'Pengguna berhasil dibuat', userId: result.insertId });

  } catch (error) {
    console.error('Terjadi kesalahan saat pendaftaran:', error);
    res.status(500).json({ message: 'Kesalahan saat mendaftarkan pengguna', error });
  }
};
