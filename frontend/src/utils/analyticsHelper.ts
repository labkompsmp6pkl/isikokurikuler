import { CharacterLog } from "../services/parentService";
import { startOfWeek, subWeeks, isWithinInterval } from 'date-fns';

// --- Tipe Data untuk Hasil Analisis --- //
export interface WeeklyAnalyticsData {
    weekLabel: string; // Contoh: "Minggu Ini", "1 Minggu Lalu"
    bangunPagi: number; // Jumlah hari bangun pagi <= 05:00
    tidurMalam: number; // Jumlah hari tidur malam <= 21:00
    olahraga: number; // Jumlah hari ada catatan olahraga
    belajar: number; // Jumlah hari ada catatan belajar
}

// --- Konstanta untuk Target Kebiasaan --- //
const TARGET_WAKE_UP_HOUR = 5;
const TARGET_SLEEP_HOUR = 21;

/**
 * Memproses riwayat log karakter menjadi data analisis mingguan.
 * @param logs - Array berisi semua log karakter siswa.
 * @param weeksToGoBack - Berapa minggu ke belakang yang ingin dianalisis (default: 4).
 * @returns Array data yang siap untuk ditampilkan di grafik.
 */
export const processLogsForWeeklyAnalysis = (logs: CharacterLog[], weeksToGoBack: number = 4): WeeklyAnalyticsData[] => {
    const results: WeeklyAnalyticsData[] = [];
    const today = new Date();

    for (let i = 0; i < weeksToGoBack; i++) {
        const endOfWeek = (i === 0) ? today : startOfWeek(subWeeks(today, i - 1));
        const startOfWeekDate = startOfWeek(subWeeks(today, i));

        // Filter logs yang termasuk dalam rentang minggu ini
        const weekLogs = logs.filter(log => {
            const logDate = new Date(log.log_date);
            return isWithinInterval(logDate, { start: startOfWeekDate, end: endOfWeek });
        });

        // Hitung konsistensi untuk setiap kebiasaan
        let wakeUpCount = 0;
        let sleepCount = 0;
        let exerciseCount = 0;
        let learningCount = 0;

        weekLogs.forEach(log => {
            // Cek Bangun Pagi
            try {
                const [hour] = log.wake_up_time.split(':').map(Number);
                if (hour <= TARGET_WAKE_UP_HOUR) {
                    wakeUpCount++;
                }
            } catch { /* abaikan jika format salah */ }

            // Cek Tidur Malam
            try {
                const [hour] = log.sleep_time.split(':').map(Number);
                if (hour <= TARGET_SLEEP_HOUR) {
                    sleepCount++;
                }
            } catch { /* abaikan jika format salah */ }
            
            // Cek Olahraga
            if (log.exercise_details && log.exercise_details.trim() !== '-' && log.exercise_details.trim() !== '') {
                exerciseCount++;
            }
            
            // Cek Belajar
            if (log.learning_details && log.learning_details.trim() !== '-' && log.learning_details.trim() !== '') {
                learningCount++;
            }
        });

        // Buat label untuk sumbu X grafik
        let weekLabel = "";
        if (i === 0) weekLabel = "Minggu Ini";
        else if (i === 1) weekLabel = "1 Mgg Lalu";
        else weekLabel = `${i} Mgg Lalu`;

        results.push({
            weekLabel: weekLabel,
            bangunPagi: wakeUpCount,
            tidurMalam: sleepCount,
            olahraga: exerciseCount,
            belajar: learningCount,
        });
    }

    // Balik array agar urutan dari minggu terlama ke terbaru
    return results.reverse();
};
