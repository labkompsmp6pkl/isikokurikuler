import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 1. Perbarui Interface: Buat 'id' menjadi opsional (?) 
// agar tidak error saat menangani token 'new_user' yang memang belum punya ID DB.
export interface UserPayload {
  id?: number; // Pakai tanda tanya karena new_user belum punya ID
  role: string;
  name?: string;
  email?: string;
  googleId?: string; // Tambahkan ini agar aman saat diakses di controller
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
    
    // Logika Validasi Struktur:
    // Token dianggap valid jika (punya ID) ATAU (role-nya adalah new_user)
    const isValidUser = decoded.id !== undefined;
    const isGoogleNewUser = decoded.role === 'new_user';

    if (!isValidUser && !isGoogleNewUser) {
       res.status(403).json({ message: 'Token tidak valid (Struktur data tidak dikenali).' });
       return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verify Error:", error);
    res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa.' });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Role 'new_user' biasanya tidak ada di daftar allowedRoles dashboard (admin/student/dll)
    // Jadi dia akan otomatis tertahan di sini jika mencoba akses dashboard sebelum submit form.
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Akses terlarang. Silakan lengkapi pendaftaran atau gunakan akun dengan peran yang sesuai.' });
      return;
    }
    next();
  };
};