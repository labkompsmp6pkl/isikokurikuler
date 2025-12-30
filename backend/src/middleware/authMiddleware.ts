
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// [PERBAIKAN] Interface sekarang diekspor dan diganti namanya agar konsisten
export interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

// [PERBAIKAN] Nama fungsi diubah menjadi 'authMiddleware'
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Otentikasi diperlukan. Silakan login kembali.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
      return res.status(401).json({ message: 'Format token tidak valid.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number; role: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
};

// [PERBAIKAN] Nama fungsi diubah menjadi 'roleMiddleware'
export const roleMiddleware = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin untuk sumber daya ini.' });
    }
    next();
  };
};
