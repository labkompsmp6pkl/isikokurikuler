import { Request, Response } from 'express';
import pool from '../config/db';
import fs from 'fs';

// ============================================================================
// 1. [FIX GLOBAL] Polyfill DOMMatrix
// Wajib ada karena pdf-parse bergantung pada pdfjs-dist yang butuh API browser
// ============================================================================
if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
        a: number; b: number; c: number; d: number; e: number; f: number;
        m11: number; m12: number; m21: number; m22: number; m41: number; m42: number;

        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
            this.m11 = 1; this.m12 = 0; this.m21 = 0; this.m22 = 1; this.m41 = 0; this.m42 = 0;
        }
        translate() { return this; }
        scale() { return this; }
        rotate() { return this; }
        multiply() { return this; }
        inverse() { return this; }
        setMatrixValue() { return this; }
    };
}

// --- TIPE DATA ---
interface ScheduleEntry {
    class_id: number;
    day_of_week: string;
    subject_name: string;
    teacher_name?: string;
    start_time?: string;
    end_time?: string;
}

// --- 1. UPLOAD & PARSING PDF JADWAL ---
export const uploadSchedulePDF = async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ message: "File PDF wajib diupload." });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // -----------------------------------------------------------
        // [FIX UTAMA] Deteksi Library PDF-Parse yang lebih Fleksibel
        // -----------------------------------------------------------
        let pdfParse: any;
        const lib = require('pdf-parse');

        // Cek 1: Apakah lib itu sendiri adalah fungsi? (Standard)
        if (typeof lib === 'function') {
            pdfParse = lib;
        } 
        // Cek 2: Apakah ada property .default? (ESM Interop)
        else if (lib.default && typeof lib.default === 'function') {
            pdfParse = lib.default;
        } 
        // Cek 3: Apakah ada property .PDFParse? (Kasus error Anda)
        else if (lib.PDFParse) {
            pdfParse = lib.PDFParse;
        } 
        else {
            console.error("Struktur Library Tidak Dikenali:", lib);
            throw new Error("Gagal menemukan fungsi PDFParse di dalam library.");
        }

        console.log("Membaca buffer file...");
        const dataBuffer = fs.readFileSync(req.file.path);
        
        console.log("Memproses PDF..."); 
        
        // [FIX CALL] Handle jika pdfParse adalah Class vs Function
        let data: any;
        try {
            // Coba panggil sebagai fungsi biasa
            data = await pdfParse(dataBuffer);
        } catch (err: any) {
            // Jika error "Class constructor", coba panggil dengan 'new'
            if (err.message && err.message.includes("Class constructor")) {
                console.log("Mencoba dengan 'new PDFParse'...");
                // @ts-ignore
                data = await new pdfParse(dataBuffer);
            } else {
                throw err;
            }
        }

        const text = data.text; 

        console.log("--- DEBUG TEXT PDF START ---");
        // Log 500 karakter pertama
        console.log(text ? text.substring(0, 500) : "TEXT KOSONG"); 
        console.log("--- DEBUG TEXT PDF END ---");

        if (!text || text.trim() === "") {
            throw new Error("PDF berhasil diparse tapi tidak menghasilkan teks. Mungkin PDF berisi gambar/scan?");
        }

        const lines = text.split('\n');
        let processedCount = 0;
        
        // Cache data kelas
        const [allClasses]: any = await connection.query("SELECT id, name FROM classes");
        const classMap = new Map(allClasses.map((c: any) => [c.name.toUpperCase(), c.id]));

        // --- LOGIKA PARSING (REGEX) ---
        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            // Regex Hari (Case Insensitive)
            const dayMatch = cleanLine.match(/(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)/i);
            
            // Regex Kelas (Format: 7A, 8B, 9C)
            const classMatch = cleanLine.match(/\b([789][A-Z])\b/i);

            if (dayMatch && classMatch) {
                const day = dayMatch[0]; // Contoh: "Senin"
                const className = classMatch[0].toUpperCase(); // Contoh: "7A"
                const classId = classMap.get(className);

                if (classId) {
                    // Ambil Mapel: Hapus teks Hari, Kelas, dan Jam
                    let subject = cleanLine
                        .replace(day, '')
                        .replace(className, '')
                        .replace(/\d{1,2}:\d{2}\s?-\s?\d{1,2}:\d{2}/g, '') // Hapus jam (misal 07:00-08:00)
                        .replace(/[^a-zA-Z0-9\s\(\)\-\.,]/g, ' ') // Hapus karakter aneh
                        .trim();

                    // Validasi panjang mapel
                    if (subject.length > 2) { 
                        await connection.query(`
                            INSERT INTO class_schedules (class_id, day_of_week, subject_name)
                            VALUES (?, ?, ?)
                        `, [classId, day, subject]);
                        processedCount++;
                    }
                }
            }
        }

        // Hapus file fisik
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        await connection.commit();
        
        res.json({ 
            message: `Berhasil memproses jadwal. ${processedCount} jadwal pelajaran tersimpan.`,
            debug_info: processedCount === 0 ? "Data 0. Pastikan format PDF berisi teks Hari (Senin..) dan Kelas (7A..)" : ""
        });

    } catch (error: any) {
        await connection.rollback();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        
        console.error("PDF Parse Error:", error);
        res.status(500).json({ 
            message: "Gagal memproses file PDF.", 
            error: String(error.message || error) 
        });
    } finally {
        connection.release();
    }
};

// --- 2. GET AUTO-FILL UNTUK JURNAL SISWA ---
export const getStudentDailyAutoFill = async (req: Request, res: Response) => {
    // @ts-ignore
    const studentId = req.user?.id;
    
    try {
        const [student]: any = await pool.query("SELECT class_id FROM users WHERE id = ?", [studentId]);
        
        if (!student.length || !student[0].class_id) {
            return res.json({ autoFillText: "", message: "Siswa belum masuk kelas." });
        }

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const now = new Date();
        const todayName = days[now.getDay()];

        const [schedules]: any = await pool.query(`
            SELECT subject_name 
            FROM class_schedules 
            WHERE class_id = ? AND day_of_week = ?
            ORDER BY id ASC
        `, [student[0].class_id, todayName]);

        if (schedules.length === 0) {
            return res.json({ autoFillText: "", subjects: [] });
        }

        const uniqueSubjects = [...new Set(schedules.map((s: any) => s.subject_name))];
        const subjectList = uniqueSubjects.join(', ');
        const autoFillText = `Mempelajari ${subjectList} di kelas sesuai jadwal hari ${todayName}.`;

        res.json({ autoFillText, subjects: schedules, day: todayName });

    } catch (error) {
        console.error("Auto Fill Error:", error);
        res.status(500).json({ message: "Gagal mengambil data jadwal otomatis." });
    }
};

// --- 3. LIHAT DATA JADWAL (Untuk Admin/Guru) ---
export const getSchedulesByClass = async (req: Request, res: Response) => {
    const { classId } = req.params;
    try {
        const [rows]: any = await pool.query(`
            SELECT * FROM class_schedules 
            WHERE class_id = ? 
            ORDER BY FIELD(day_of_week, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')
        `, [classId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil jadwal." });
    }
};