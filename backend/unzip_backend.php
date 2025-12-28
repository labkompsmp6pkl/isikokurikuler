<?php
// Script Unzip V2 - Dengan fitur Cleanup & Logging
$zip_file = 'backend_update.zip';
$target_dir = __DIR__; 

echo "<h1>Log Deployment Backend</h1>";
echo "Lokasi Server: " . $target_dir . "<br><hr>";

if (file_exists($zip_file)) {
    $zip = new ZipArchive;
    if ($zip->open($zip_file) === TRUE) {
        
        // 1. HAPUS FOLDER DIST LAMA (Agar bersih)
        $dist_folder = $target_dir . '/dist';
        if (is_dir($dist_folder)) {
            echo "🧹 Membersihkan folder 'dist' lama...<br>";
            // Fungsi rekursif hapus folder
            $files = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($dist_folder, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::CHILD_FIRST
            );
            foreach ($files as $fileinfo) {
                $todo = ($fileinfo->isDir() ? 'rmdir' : 'unlink');
                $todo($fileinfo->getRealPath());
            }
            rmdir($dist_folder);
        }

        // 2. EKSTRAK FILE BARU
        echo "📦 Mengekstrak file ZIP baru...<br>";
        $zip->extractTo($target_dir);
        
        // 3. TAMPILKAN APA SAJA YANG DIEKSTRAK (Untuk Debugging)
        echo "<ul>";
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);
            // Hanya tampilkan folder utama agar tidak terlalu panjang
            if (strpos($filename, '/') === false || substr_count($filename, '/') == 1) {
                 echo "<li>📄 " . $filename . "</li>";
            }
        }
        echo "</ul>";
        
        $zip->close();
        
        // 4. HAPUS FILE ZIP
        unlink($zip_file);
        
        echo "<hr>✅ <b>SUKSES FULL:</b> Backend telah diperbarui!<br>";
    } else {
        echo "❌ <b>GAGAL:</b> File ZIP rusak atau tidak bisa dibuka.<br>";
    }
} else {
    echo "⚠️ <b>SKIP:</b> Tidak ada file '$zip_file'. (Mungkin upload gagal?)<br>";
}
?>