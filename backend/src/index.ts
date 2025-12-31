import express from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorMiddleware';

// Impor rute
import studentRoutes from './routes/studentRoutes';
import parentRoutes from './routes/parentRoutes';
import characterRoutes from './routes/characterRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Konfigurasi CORS ---

const productionOrigins = [
  'https://kokurikuler.smpn6pekalongan.org',
  'https://isikokurikuler.vercel.app'
];

let corsOptions: CorsOptions;

// Cek apakah kita berada di lingkungan Cloud Workstation (biasanya domain berakhiran cloudworkstations.dev)
const isCloudEnvironment = (origin: string | undefined) => {
  return origin && (origin.includes('cloudworkstations.dev') || origin.includes('idx.google.com'));
};

if (process.env.NODE_ENV === 'production') {
  console.log('Running in PRODUCTION mode');
  corsOptions = {
    origin: (origin, callback) => {
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
  corsOptions = {
    origin: (origin, callback) => {
      callback(null, true); 
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true, // Penting agar cookie auth cloud bisa lewat jika diperlukan
  };
}

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// --- Rute API ---
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/character', characterRoutes);
app.use('/api/parent', parentRoutes);

// Middleware Error
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});