
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


-- [FITUR BARU] Penambahan kolom untuk menautkan orang tua dan siswa
-- Menambahkan kolom `parent_id` ke tabel `users`.
ALTER TABLE `users`
  ADD COLUMN `parent_id` INT(10) UNSIGNED DEFAULT NULL COMMENT 'ID pengguna orang tua yang tertaut dengan siswa ini' AFTER `class`,
  ADD CONSTRAINT `fk_users_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;

