import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorMiddleware'

// [PERBAIKAN] Impor SEMUA rute yang diperlukan untuk aplikasi
import studentRoutes from './routes/studentRoutes';
import parentRoutes from './routes/parentRoutes';
import characterRoutes from './routes/characterRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Konfigurasi CORS (tidak berubah) ---
let corsOptions: CorsOptions;
if (process.env.NODE_ENV === 'production') {
  // Konfigurasi produksi
  const productionOrigins = ['https://kokurikuler.smpn6pekalongan.org', 'https://www.kokurikuler.smpn6pekalongan.org', 'https://isikokurikuler.vercel.app'];
  corsOptions = {
      origin: (origin, callback) => {
        if (!origin || productionOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true, 
    };
} else {
  // Konfigurasi development
  corsOptions = {
      origin: (origin, callback) => { callback(null, true); },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true, 
    };
}

// --- Middleware --- //
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Rute API --- //
app.get('/', (req, res) => {
  res.send('API is running...');
});

// [PERBAIKAN] Daftarkan SEMUA rute yang sudah diimpor ke Express
app.use('/api/student', studentRoutes); // Rute terkait siswa
app.use('/api/character', characterRoutes); // Untuk progres karakter harian
app.use('/api/parent', parentRoutes); // Untuk dasbor, persetujuan, dan penautan orang tua

// [PENTING] Middleware untuk Error Handling harus diletakkan paling akhir
app.use(errorHandler);

// --- Server Start --- //
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
