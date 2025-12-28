import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi model Generative AI dengan kunci API yang benar dari environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export const getAIFeedback = async (req: Request, res: Response) => {
  const { journalText } = req.body;

  if (!journalText) {
    return res.status(400).json({ message: 'Journal text is required' });
  }

  try {
    // Dapatkan model generatif
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

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
