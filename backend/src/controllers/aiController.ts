import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// --- 1. Fitur Feedback Jurnal (Untuk Siswa) ---
export const getAIFeedback = async (req: Request, res: Response) => {
  const { journalText } = req.body;

  if (!journalText) {
    return res.status(400).json({ message: 'Journal text is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Berikan umpan balik yang membangun dan positif untuk entri jurnal siswa berikut. Fokus pada dorongan, identifikasi kekuatan, dan berikan saran halus untuk perbaikan atau refleksi lebih lanjut. Jaga agar nada tetap mendukung dan ramah. Jurnal: "${journalText}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();

    res.json({ feedback });
  } catch (error) {
    console.error("Error getting AI feedback:", error);
    res.status(500).json({ message: 'Error getting AI feedback' });
  }
};

// --- 2. Fitur Rekapitulasi Kelas (Untuk Wali Kelas) ---
export const generateClassRecap = async (req: AuthenticatedRequest, res: Response) => {
  const teacherId = req.user?.id;
  const { startDate, endDate } = req.body;

  if (!teacherId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // 1. Cek Kelas Binaan Guru
    const [teacherRows]: any = await db.execute(
      'SELECT class FROM users WHERE id = ? AND role = ?', 
      [teacherId, 'teacher']
    );

    if (teacherRows.length === 0 || !teacherRows[0].class) {
      return res.status(400).json({ message: 'Anda belum terdaftar sebagai Wali Kelas untuk kelas manapun.' });
    }

    const targetClass = teacherRows[0].class;

    // 2. Ambil Data Siswa
    const [students]: any = await db.execute(
      'SELECT id, full_name FROM users WHERE class = ? AND role = "student"',
      [targetClass]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: `Tidak ditemukan siswa di kelas ${targetClass}.` });
    }

    const studentIds = students.map((s: any) => s.id);
    const placeholders = studentIds.map(() => '?').join(',');

    // 3. Ambil Log
    const queryLogs = `
      SELECT * FROM character_logs 
      WHERE student_id IN (${placeholders}) 
      AND log_date BETWEEN ? AND ?
    `;

    const [logs]: any = await db.execute(queryLogs, [...studentIds, startDate, endDate]);

    // 4. Agregasi Statistik
    const stats = {
      className: targetClass,
      totalStudents: studentIds.length,
      activeStudents: new Set(logs.map((l: any) => l.student_id)).size,
      totalLogs: logs.length,
      worship: {} as Record<string, number>,
      social_samples: [] as string[],
      learning_subjects: {} as Record<string, number>,
      exercises: {} as Record<string, number>,
    };

    if (logs.length > 0) {
      logs.forEach((log: any) => {
          try {
              const acts = typeof log.worship_activities === 'string' ? JSON.parse(log.worship_activities) : log.worship_activities;
              if (Array.isArray(acts)) acts.forEach(a => stats.worship[a] = (stats.worship[a] || 0) + 1);
          } catch(e) {}
          
          if (log.social_activity_notes && stats.social_samples.length < 15) stats.social_samples.push(log.social_activity_notes);
          if (log.learning_subject) stats.learning_subjects[log.learning_subject] = (stats.learning_subjects[log.learning_subject] || 0) + 1;
          if (log.exercise_type) stats.exercises[log.exercise_type] = (stats.exercises[log.exercise_type] || 0) + 1;
      });
    }

    // 5. Generate AI
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" } as any
    });

    const prompt = `
      Analisis Data Kelas: ${stats.className}. Periode: ${startDate} s/d ${endDate}.
      Statistik Aktivitas: ${JSON.stringify(stats)}
      
      TUGAS: Buat laporan "8 Profil Karakter Lulusan" untuk satu kelas ini.
      Untuk "Penalaran Kritis", analisis pola mata pelajaran (sains/eksak) dan pemecahan masalah.
      
      PENTING: Output HARUS JSON valid dengan semua kunci berikut terisi string narasi panjang (min 2 kalimat):
      {
        "keimanan": "...",
        "kewargaan": "...",
        "penalaranKritis": "...", 
        "kreativitas": "...",
        "kolaborasi": "...",
        "kemandirian": "...",
        "kesehatan": "...",
        "komunikasi": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const analysisResult = JSON.parse(text);

    res.json({ success: true, analysis: analysisResult, stats });

  } catch (error: any) {
    console.error("Error generating class recap:", error);
    if (error.message?.includes('403')) {
        res.status(403).json({ message: 'Kunci API AI bermasalah (Leaked/Expired).' });
    } else {
        res.status(500).json({ message: 'Gagal memproses analisis kelas.' });
    }
  }
};