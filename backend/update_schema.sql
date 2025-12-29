-- update_schema.sql
-- Skrip ini memperbarui skema database isokul_smpn6 yang ada.
-- Ini memodifikasi tabel `users` untuk menambahkan kolom yang diperlukan untuk sistem registrasi multi-peran yang baru.

-- PENTING: Harap buat cadangan database Anda sebelum menjalankan skrip ini.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Menambahkan kolom baru ke tabel `users` untuk data spesifik peran.
-- Kolom-kolom ini dibuat dapat-nol (nullable) karena tidak berlaku untuk semua peran pengguna.
ALTER TABLE `users`
  ADD COLUMN `nisn` VARCHAR(20) DEFAULT NULL COMMENT 'Nomor Induk Siswa Nasional, untuk peran siswa' AFTER `whatsapp_number`,
  ADD COLUMN `nip` VARCHAR(30) DEFAULT NULL COMMENT 'Nomor Induk Pegawai, untuk peran guru/kontributor' AFTER `nisn`,
  ADD COLUMN `class` VARCHAR(10) DEFAULT NULL COMMENT 'Kelas yang diikuti siswa atau dikelola guru' AFTER `nip`;

-- Catatan: Skema yang ada sudah mencakup `whatsapp_number` dan `parent_id`,
-- yang juga digunakan oleh sistem registrasi dan login yang baru. Tidak ada perubahan yang diperlukan untuk itu.

-- Tidak ada perubahan yang diperlukan untuk tabel `journals` atau `settings` untuk pembaruan fitur ini.

COMMIT;
