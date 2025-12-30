import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// --- Konfigurasi Klien Google OAuth ---
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// --- Daftar URL Frontend yang Diizinkan ---
const ALLOWED_ORIGINS = [
  'https://isikokurikuler.vercel.app',
  'https://kokurikuler.smpn6pekalongan.org',
  "https://5173-firebase-isikokurikuler-1766918315867.cluster-bqwaigqtxbeautecnatk4o6ynk.cloudworkstations.dev",
].filter(Boolean); // Hapus nilai undefined/null

// 1. MENGALIHKAN PENGGUNA KE HALAMAN PERSETUJUAN GOOGLE
export const googleLogin = (req: Request, res: Response) => {
  const { origin } = req.query;

  // Validasi origin yang dikirim dari frontend
  // 'state' akan digunakan untuk menyimpan origin selama proses OAuth
  let state: string;
  if (origin && ALLOWED_ORIGINS.includes(origin as string)) {
    state = origin as string;
  } else {
    // Jika origin tidak valid atau tidak ada, gunakan URL default dari .env
    state = process.env.FRONTEND_URL as string;
  }

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile', 
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: state, // Kita simpan URL Frontend asal di state
    prompt: 'consent' // Memaksa user memilih akun agar refresh token bisa didapat (opsional)
  });

  res.redirect(url);
};

// 2. MENANGANI CALLBACK SETELAH AUTENTIKASI GOOGLE
export const googleCallback = async (req: Request, res: Response) => {
  const { code, state } = req.query; // Dapatkan 'state' yang berisi URL origin

  // Tentukan URL dasar untuk pengalihan. Gunakan state jika valid, jika tidak, fallback ke env.
  const redirectBaseUrl = (state && ALLOWED_ORIGINS.includes(state as string)) 
    ? state as string 
    : (process.env.FRONTEND_URL as string);

  try {
    const { tokens } = await client.getToken(code as string);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Gagal mendapatkan informasi pengguna dari Google.');

    const { sub: google_id, email, name: full_name } = payload;
    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE google_id = ?', [google_id]);
    const user = rows[0];

    if (user) {
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
      res.redirect(`${redirectBaseUrl}/login/success?token=${token}`);
    } else {
      const queryParams = new URLSearchParams({ google_id, email: email!, full_name: full_name! }).toString();
      res.redirect(`${redirectBaseUrl}/register/google?${queryParams}`);
    }

  } catch (error) {
    console.error('Error during Google OAuth callback:', error);
    res.redirect(`${redirectBaseUrl}/login?error=google-auth-failed`);
  }
};


// 3. LOGIN MANUAL (DENGAN USERNAME/PASSWORD)
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

// 4. REGISTRASI (MANUAL DAN LANJUTAN DARI GOOGLE)
export const register = async (req: Request, res: Response) => {
  const { fullName, password, role, nisn, nip, class: userClass, whatsappNumber, google_id, email, provider } = req.body;

  // A. Registrasi lanjutan via Google
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

  // B. Registrasi manual
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
