-- update_schema.sql
-- Skrip ini memperbarui skema database isokul_smpn6 yang ada.

-- PENTING: Harap buat cadangan database Anda sebelum menjalankan skrip ini.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Perubahan sebelumnya untuk tabel users
ALTER TABLE `users`
  ADD COLUMN `nisn` VARCHAR(20) DEFAULT NULL COMMENT 'Nomor Induk Siswa Nasional, untuk peran siswa' AFTER `whatsapp_number`,
  ADD COLUMN `nip` VARCHAR(30) DEFAULT NULL COMMENT 'Nomor Induk Pegawai, untuk peran guru/kontributor' AFTER `nisn`,
  ADD COLUMN `class` VARCHAR(10) DEFAULT NULL COMMENT 'Kelas yang diikuti siswa atau dikelola guru' AFTER `nip`;

--
-- Perubahan Baru: Menambahkan tabel 'character_logs' untuk fitur pencatatan karakter siswa.
-- Tabel ini akan menyimpan semua data harian yang diinput oleh siswa.
--
CREATE TABLE `character_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `log_date` DATE NOT NULL,
  `wake_up_time` TIME NULL,
  `sleep_time` TIME NULL,
  `worship_activities` JSON NULL COMMENT 'Array JSON dari aktivitas ibadah, e.g., ["Shubuh", "Dhuha"]',
  `worship_notes` TEXT NULL,
  `exercise_type` VARCHAR(255) NULL,
  `exercise_details` TEXT NULL,
  `healthy_food_notes` TEXT NULL,
  `learning_subject` VARCHAR(255) NULL,
  `learning_details` TEXT NULL,
  `social_activity_notes` TEXT NULL,
  `status` ENUM('Tersimpan', 'Disetujui', 'Disahkan') NOT NULL DEFAULT 'Tersimpan',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `student_log_date_unique` (`student_id`, `log_date`)
) COMMENT='Pencatatan karakter harian oleh siswa';

-- Perubahan untuk Fitur Google SSO/OAuth
ALTER TABLE `users`
  ADD COLUMN `google_id` VARCHAR(255) UNIQUE DEFAULT NULL AFTER `class`,
  ADD COLUMN `provider` VARCHAR(50) NOT NULL DEFAULT 'local' AFTER `google_id`;

ALTER TABLE `users`
  MODIFY COLUMN `password` VARCHAR(255) DEFAULT NULL;

COMMIT;
