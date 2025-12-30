import { Request, Response, NextFunction } from 'express';

/**
 * Middleware Error Handler untuk menangani semua error yang terjadi di aplikasi Express.
 * Middleware ini harus ditempatkan setelah semua rute API.
 */
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Terkadang, error bisa datang tanpa status code yang spesifik.
    // Jika status code masih 200 (OK), kita ubah menjadi 500 (Internal Server Error) sebagai default.
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode);

    // Kirim respons error dalam format JSON yang konsisten
    res.json({
        message: err.message,
        // Tampilkan stack trace hanya jika kita tidak berada di lingkungan produksi.
        // Ini adalah praktik keamanan yang baik untuk tidak membocorkan detail implementasi di produksi.
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
};

export { errorHandler };
