import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// 1. Definisikan bentuk data User yang ada di dalam Token
export interface UserPayload {
  id: number;
  role: string;
  name?: string;
  email?: string;
  // Tambahkan properti lain jika perlu
}

// 2. Extend Request bawaan Express
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
    return;
  }

  const token = authHeader.split(' ')[1]; // Format: "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
    
    // Pastikan decoded memiliki id dan role
    if (!decoded.id || !decoded.role) {
       res.status(403).json({ message: 'Token tidak valid (Struktur data salah).' });
       return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token tidak valid atau kadaluwarsa.' });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Akses terlarang. Peran Anda tidak diizinkan.' });
      return;
    }
    next();
  };
};