import { Response } from 'express';
import db from '../config/db';
// [PERBAIKAN] Impor 'AuthenticatedRequest' dari file middleware yang benar
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Tipe untuk data log yang masuk dari body request
interface CharacterLogData {
    log_date: string;
    wake_up_time: string;
    worship_activities: string[];
    healthy_food_notes: string;
    exercise_type: string;
    exercise_details: string;
    learning_subject: string;
    learning_details: string;
    social_activity_notes: string;
    sleep_time: string;
}

// Fungsi untuk membuat atau memperbarui log karakter
export const createOrUpdateCharacterLog = async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user?.id;
    const { 
        log_date,
        wake_up_time,
        worship_activities,
        healthy_food_notes,
        exercise_type,
        exercise_details,
        learning_subject,
        learning_details,
        social_activity_notes,
        sleep_time 
    }: CharacterLogData = req.body;

    // Validasi dasar
    if (!log_date) {
        return res.status(400).json({ message: 'Tanggal log wajib diisi.' });
    }

    try {
        // Cek apakah sudah ada log untuk siswa pada tanggal tersebut
        const [existingLogs]: any = await db.execute(
            'SELECT * FROM character_logs WHERE student_id = ? AND log_date = ?',
            [studentId, log_date]
        );

        const worshipActivitiesJson = JSON.stringify(worship_activities || []);

        if (existingLogs.length > 0) {
            // Jika ada, perbarui log yang ada
            const logId = existingLogs[0].id;
            await db.execute(
                `UPDATE character_logs SET 
                    wake_up_time = ?, 
                    worship_activities = ?, 
                    healthy_food_notes = ?, 
                    exercise_type = ?, 
                    exercise_details = ?, 
                    learning_subject = ?, 
                    learning_details = ?, 
                    social_activity_notes = ?, 
                    sleep_time = ?, 
                    status = 'Tersimpan' 
                WHERE id = ?`,
                [
                    wake_up_time, 
                    worshipActivitiesJson,
                    healthy_food_notes,
                    exercise_type, 
                    exercise_details,
                    learning_subject, 
                    learning_details, 
                    social_activity_notes, 
                    sleep_time,
                    logId
                ]
            );
            res.status(200).json({ message: 'Catatan harian berhasil diperbarui.' });
        } else {
            // Jika tidak ada, buat log baru
            await db.execute(
                `INSERT INTO character_logs (student_id, log_date, wake_up_time, worship_activities, healthy_food_notes, exercise_type, exercise_details, learning_subject, learning_details, social_activity_notes, sleep_time, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tersimpan')`,
                [
                    studentId, 
                    log_date, 
                    wake_up_time, 
                    worshipActivitiesJson,
                    healthy_food_notes,
                    exercise_type,
                    exercise_details,
                    learning_subject,
                    learning_details, 
                    social_activity_notes, 
                    sleep_time
                ]
            );
            res.status(201).json({ message: 'Catatan harian berhasil disimpan.' });
        }
    } catch (error) {
        console.error('Database error in createOrUpdateCharacterLog:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat menyimpan catatan.' });
    }
};
