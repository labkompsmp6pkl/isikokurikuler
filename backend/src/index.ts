import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import { errorHandler } from './middleware/errorMiddleware';

// Impor rute
import studentRoutes from './routes/studentRoutes';
import parentRoutes from './routes/parentRoutes';
import characterRoutes from './routes/characterRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Konfigurasi CORS ---

// 1. Daftar Origin yang Diizinkan di Production
const productionOrigins = [
  'https://kokurikuler.smpn6pekalongan.org',
  'https://www.kokurikuler.smpn6pekalongan.org',
  'https://isikokurikuler.vercel.app'
];

let corsOptions: CorsOptions;

// 2. Logika Pemilihan Mode (Production vs Development)
if (process.env.NODE_ENV === 'production') {
  console.log('Running in PRODUCTION mode');
  corsOptions = {
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti dari Postman/Mobile App) atau jika origin ada di daftar
      if (!origin || productionOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
} else {
  console.log('Running in DEVELOPMENT mode');
  // Di development, izinkan semua origin agar tidak ribet saat ganti port localhost
  corsOptions = {
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Rute API ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Tetap gunakan prefix /api agar konsisten dengan frontend
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/parent', parentRoutes);

// Middleware Error
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});