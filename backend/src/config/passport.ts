import passport from 'passport'; // Import library
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../config/db'; // Sesuaikan path DB Anda
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true // PENTING: Fix untuk Cloud Workstations
    },
    async (accessToken, refreshToken, profile, done) => {
      // Kita kembalikan profile apa adanya, nanti controller yang olah
      return done(null, profile);
    }
  )
);

// Serialize & Deserialize (Wajib ada biar gak error session)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});
