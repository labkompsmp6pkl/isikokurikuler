import 'dotenv/config'; // Memuat variabel lingkungan dari .env
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi CORS untuk domain yang diizinkan
const corsOptions = {
  origin: [
    'https://isikokurikuler.vercel.app',
    'https://kokurikuler.smpn6pekalongan.org'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

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

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
