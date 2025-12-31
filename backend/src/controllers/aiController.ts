import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Pastikan API Key ada
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// --- 1. Fitur Feedback Jurnal (Untuk Siswa) ---
export const getAIFeedback = async (req: Request, res: Response) => {
  const { journalText } = req.body;

  if (!journalText) {
    return res.status(400).json({ message: 'Journal text is required' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    
    // Safety check jika tidak ada studentIds
    if (studentIds.length === 0) {
        return res.status(404).json({ message: "Tidak ada data siswa." });
    }

    const placeholders = studentIds.map(() => '?').join(',');

    // 3. Ambil Log
    const queryLogs = `
      SELECT * FROM character_logs 
      WHERE student_id IN (${placeholders}) 
      AND log_date BETWEEN ? AND ?
    `;

    // Pastikan urutan parameter benar: [id1, id2, ..., startDate, endDate]
    const [logs]: any = await db.execute(queryLogs, [...studentIds, startDate, endDate]);

    // 4. Agregasi Statistik
    const stats = {
      className: targetClass,
      totalStudents: studentIds.length,
      activeStudents: 0,
      totalLogs: logs.length,
      worship: {} as Record<string, number>,
      social_samples: [] as string[],
      learning_subjects: {} as Record<string, number>,
      exercises: {} as Record<string, number>,
    };

    if (logs.length > 0) {
      // Hitung Active Students (Unique ID)
      const uniqueActive = new Set(logs.map((l: any) => l.student_id));
      stats.activeStudents = uniqueActive.size;

      logs.forEach((log: any) => {
          // Parsing Ibadah
          try {
              let acts = log.worship_activities;
              if (typeof acts === 'string') {
                  acts = JSON.parse(acts);
              }
              if (Array.isArray(acts)) {
                  acts.forEach(a => {
                      stats.worship[a] = (stats.worship[a] || 0) + 1;
                  });
              }
          } catch(e) {
              // Ignore parse error
          }
          
          // Sampling Sosial (Maks 20 agar prompt tidak kepanjangan)
          if (log.social_activity_notes && stats.social_samples.length < 20) {
              stats.social_samples.push(log.social_activity_notes);
          }

          // Mapel
          if (log.learning_subject) {
              stats.learning_subjects[log.learning_subject] = (stats.learning_subjects[log.learning_subject] || 0) + 1;
          }

          // Olahraga
          if (log.exercise_type) {
              stats.exercises[log.exercise_type] = (stats.exercises[log.exercise_type] || 0) + 1;
          }
      });
    } else {
        // Jika tidak ada log sama sekali, tidak perlu tanya AI, langsung return kosong
        return res.json({ 
            success: true, 
            analysis: {
                keimanan: "Belum ada data jurnal.",
                kewargaan: "Belum ada data jurnal.",
                penalaranKritis: "Belum ada data jurnal.",
                kreativitas: "Belum ada data jurnal.",
                kolaborasi: "Belum ada data jurnal.",
                kemandirian: "Belum ada data jurnal.",
                kesehatan: "Belum ada data jurnal.",
                komunikasi: "Belum ada data jurnal."
            }, 
            stats 
        });
    }

    // 5. Generate AI
    // GUNAKAN MODEL 1.5-FLASH DAN HAPUS responseMimeType UNTUK MENGHINDARI ERROR SDK LAMA
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
          temperature: 0.7,
      } 
    });

    const prompt = `
      Anda adalah asisten analisis pendidikan.
      Analisis Data Kelas: ${stats.className}. Periode: ${startDate} s/d ${endDate}.
      Statistik Aktivitas: ${JSON.stringify(stats)}
      
      TUGAS: Buat laporan "8 Profil Karakter Lulusan" untuk satu kelas ini secara kolektif.
      Gunakan bahasa Indonesia yang formal dan pedagogis.
      
      PENTING:
      Keluarkan HANYA format JSON valid tanpa format Markdown (jangan pakai \`\`\`json).
      Struktur JSON harus persis seperti ini:
      {
        "keimanan": "Narasi analisis tentang aktivitas ibadah...",
        "kewargaan": "Narasi analisis tentang aktivitas sosial...",
        "penalaranKritis": "Narasi analisis pola mata pelajaran...", 
        "kreativitas": "Narasi umum tentang kreativitas siswa...",
        "kolaborasi": "Narasi tentang gotong royong...",
        "kemandirian": "Narasi tentang kemandirian pengisian jurnal...",
        "kesehatan": "Narasi tentang pola olahraga...",
        "komunikasi": "Narasi tentang cara penyampaian jurnal..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // 6. Pembersihan Output AI (PENTING untuk menghindari error parsing)
    // Hapus markdown code blocks jika AI bandel menambahkannya
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let analysisResult;
    try {
        analysisResult = JSON.parse(text);
    } catch (parseError) {
        console.error("Gagal parse JSON dari AI:", text);
        // Fallback jika JSON rusak
        analysisResult = {
            keimanan: "Gagal menganalisis data (Format Invalid).",
            kewargaan: "-",
            penalaranKritis: "-",
            kreativitas: "-",
            kolaborasi: "-",
            kemandirian: "-",
            kesehatan: "-",
            komunikasi: "-"
        };
    }

    res.json({ success: true, analysis: analysisResult, stats });

  } catch (error: any) {
    console.error("Error generating class recap:", error);
    if (error.message?.includes('403') || error.message?.includes('API key')) {
        res.status(403).json({ message: 'Kunci API AI bermasalah atau kuota habis.' });
    } else {
        res.status(500).json({ message: 'Gagal memproses analisis kelas.' });
    }
  }
};