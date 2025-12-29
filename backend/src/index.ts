import 'dotenv/config'; // Memuat variabel lingkungan dari .env
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import aiRoutes from './routes/aiRoutes';
import characterRoutes from './routes/characterRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Konfigurasi CORS Berdasarkan Lingkungan (Development/Production) ---

// Daftar origin yang diizinkan di lingkungan produksi
const productionOrigins = [
  'https://isikokurikuler.vercel.app',
  'https://kokurikuler.smpn6pekalongan.org'
];

let corsOptions;

// Periksa apakah lingkungan saat ini adalah 'development'
if (process.env.NODE_ENV === 'development') {
  console.log('CORS berjalan dalam mode DEVELOPMENT: Mengizinkan semua origin.');
  // Untuk development, izinkan semua origin untuk menghindari masalah proxy/redirect.
  corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
} else {
  console.log('CORS berjalan dalam mode PRODUCTION: Menerapkan kebijakan origin yang ketat.');
  // Untuk produksi, terapkan daftar origin yang ketat.
  corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || productionOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Endpoint utama untuk memeriksa apakah API berjalan
app.get('/', (req, res) => {
  res.status(200).send('Backend API is running.');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/character', characterRoutes);

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
