<?php
// Letakkan file ini di folder root aplikasi backend di cPanel
$zip_file = 'backend_update.zip';
$target_dir = __DIR__; // Folder saat ini

echo "<h1>Status Deployment</h1>";
echo "Target Folder: " . $target_dir . "<br>";

if (file_exists($zip_file)) {
    $zip = new ZipArchive;
    if ($zip->open($zip_file) === TRUE) {
        // Ekstrak semua file
        $zip->extractTo($target_dir);
        $zip->close();
        
        // Hapus file ZIP biar bersih
        unlink($zip_file);
        
        echo "✅ <b>SUKSES:</b> File berhasil diekstrak!<br>";
        echo "Silakan cek folder 'dist' Anda.";
    } else {
        echo "❌ <b>GAGAL:</b> Tidak bisa membuka file ZIP.<br>";
    }
} else {
    echo "⚠️ <b>SKIP:</b> File '$zip_file' tidak ditemukan. Mungkin belum terupload.<br>";
}
?>