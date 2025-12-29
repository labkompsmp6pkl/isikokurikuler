import { Request, Response } from 'express';
import pool from '../config/db';

// Interface untuk memperkuat tipe data dari request body
interface CharacterLogBody {
    id?: number; // ID bisa jadi tidak ada saat pembuatan
    log_date: string;
    wake_up_time?: string;
    sleep_time?: string;
    worship_activities?: string[];
    worship_notes?: string;
    exercise_type?: string;
    exercise_details?: string;
    healthy_food_notes?: string;
    learning_subject?: string;
    learning_details?: string;
    social_activity_notes?: string;
}

// Mendapatkan log hari ini untuk siswa yang login
export const getTodayLog = async (req: Request, res: Response) => {
    const student_id = (req as any).user.id;
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM character_logs WHERE student_id = ? AND log_date = ?',
            [student_id, today]
        );

        if (rows.length > 0) {
            // Jika log sudah ada, kembalikan datanya
            const log = rows[0];
            if (log.worship_activities && typeof log.worship_activities === 'string') {
                log.worship_activities = JSON.parse(log.worship_activities);
            } else if (!log.worship_activities) {
                log.worship_activities = [];
            }
            res.json(log);
        } else {
            // Jika log belum ada, beri tahu frontend. Ini adalah kondisi normal.
            res.status(404).json({ message: 'Log untuk hari ini belum ada.' });
        }
    } catch (error) {
        console.error('Error in getTodayLog:', error);
        res.status(500).json({ message: 'Kesalahan Server Internal', error: (error as Error).message });
    }
};

// Menyimpan atau memperbarui log karakter
export const saveCharacterLog = async (req: Request, res: Response) => {
    const student_id = (req as any).user.id;
    const { id, log_date, ...data }: CharacterLogBody = req.body;

    // Salin data untuk payload UPDATE
    const updatePayload: any = { ...data };
    
    // Konversi array `worship_activities` menjadi string JSON jika ada
    if (updatePayload.worship_activities && Array.isArray(updatePayload.worship_activities)) {
        updatePayload.worship_activities = JSON.stringify(updatePayload.worship_activities);
    }

    // Payload untuk klausa INSERT (termasuk student_id dan log_date)
    const insertPayload = { ...updatePayload, student_id, log_date };

    try {
        // `UPSERT` akan membuat baris baru jika tidak ada, atau memperbarui jika sudah ada
        // Ini cocok untuk logika "simpan" kita
        await pool.query(
            'INSERT INTO character_logs SET ? ON DUPLICATE KEY UPDATE ?',
            [insertPayload, updatePayload]
        );

        res.status(200).json({ message: 'Progress berhasil disimpan!' });
    } catch (error) {
        console.error('Error in saveCharacterLog:', error);
        res.status(500).json({ message: 'Gagal menyimpan progress', error: (error as Error).message });
    }
};


// Mendapatkan riwayat log untuk tampilan kalender
export const getLogHistory = async (req: Request, res: Response) => {
    const student_id = (req as any).user.id;
    const { month, year } = req.query;

    if (month === undefined || year === undefined) {
        return res.status(400).json({ message: 'Parameter bulan dan tahun diperlukan.' });
    }

    try {
        // Ambil data untuk bulan yang diminta (month di query adalah 0-11, di SQL adalah 1-12)
        const [rows]: any = await pool.query(
            'SELECT log_date, status FROM character_logs WHERE student_id = ? AND MONTH(log_date) = ? AND YEAR(log_date) = ?',
            [student_id, parseInt(month as string) + 1, parseInt(year as string)]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error in getLogHistory:', error);
        res.status(500).json({ message: 'Gagal mengambil riwayat', error: (error as Error).message });
    }
};

// Mendapatkan detail log berdasarkan tanggal
export const getLogByDate = async (req: Request, res: Response) => {
    const student_id = (req as any).user.id;
    const { date } = req.params; // Ambil tanggal dari URL, format: YYYY-MM-DD

    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM character_logs WHERE student_id = ? AND log_date = ?',
            [student_id, date]
        );

        if (rows.length > 0) {
            const log = rows[0];
            // Pastikan worship_activities di-parse dari JSON string menjadi array
            if (log.worship_activities && typeof log.worship_activities === 'string') {
                log.worship_activities = JSON.parse(log.worship_activities);
            } else if (!log.worship_activities) {
                log.worship_activities = [];
            }
            res.json(log);
        } else {
            // Jika tidak ada log ditemukan untuk tanggal tersebut
            res.status(404).json({ message: 'Log tidak ditemukan untuk tanggal ini.' });
        }
    } catch (error) {
        console.error('Error in getLogByDate:', error);
        res.status(500).json({ message: 'Kesalahan Server Internal', error: (error as Error).message });
    }
};
