import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import aiRoutes from './routes/aiRoutes';
import characterRoutes from './routes/characterRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// --- KONFIGURASI CORS BERBASIS LINGKUNGAN ---

let corsOptions: cors.CorsOptions;

if (process.env.NODE_ENV === 'production') {
  // UNTUK PRODUCTION: Daftar origin yang di-hardcode sesuai permintaan
  const productionOrigins = [
    'https://isikokurikuler.vercel.app',
    'https://kokurikuler.smpn6pekalongan.org'
  ];
  console.log('CORS running in PRODUCTION mode. Allowed origins:', productionOrigins);

  corsOptions = {
    origin: (origin, callback) => {
      if (!origin || productionOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`Origin ditolak oleh CORS: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // WAJIB untuk login
  };

} else {
  // UNTUK DEVELOPMENT: Izinkan semua origin dengan memantulkan origin yang masuk
  // Ini adalah cara yang benar untuk mengizinkan semua origin saat credentials: true
  console.log('CORS running in DEVELOPMENT mode. Allowing all origins.');
  
  corsOptions = {
    origin: (origin, callback) => {
      // Selalu izinkan origin yang masuk saat dalam mode development
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // WAJIB untuk login
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
