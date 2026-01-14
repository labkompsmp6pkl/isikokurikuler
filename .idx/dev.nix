{
  pkgs, ...
}: {
  # Daftar paket yang akan diinstal dari Nix
  # Cari paket di: https://search.nixos.org/packages
  packages = [
    pkgs.nodejs_20
    pkgs.mysql
    pkgs.nodePackages.npm
  ];

  # Konfigurasi untuk Firebase Studio
  idx = {
    # Ekstensi VS Code yang akan diinstal
    # Cari ekstensi di: https://open-vsx.org/
    extensions = [
      "dbaeumer.vscode-eslint"
    ];

    # Konfigurasi siklus hidup workspace
    workspace = {
      # Dijalankan saat workspace pertama kali dibuat
      onCreate = {
        # Instal dependensi untuk backend dan frontend
        install-deps = "npm --prefix backend install && npm --prefix frontend install";
        
        # Inisialisasi MySQL, jalankan server, buat database, dan impor skema
        init-db = ''
          mysqld --initialize-insecure --user=mysql
          mysqld_safe --nowatch --user=mysql &
          sleep 5 # Tunggu server siap
          mysql -u root -e "CREATE DATABASE IF NOT EXISTS isokul;"
          mysql -u root isokul < backend/schema.sql
          # Jalankan skrip update jika ada
          mysql -u root isokul < backend/update_schema.sql
        '';
      };
      
      # Dijalankan setiap kali workspace dimulai ulang
      onStart = {
        # Jalankan server backend
        backend = "npm --prefix backend run dev";
        # Jalankan server frontend
        frontend = "npm --prefix frontend run dev";
      };
    };

    previews = {
      enable = true;
      previews = {
        web = {
          # Gunakan --host agar bisa diakses dari luar container (Cloud Workstations)
          # Gunakan variabel $PORT yang disediakan oleh IDX
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          manager = "web";
          cwd = "frontend"; 
        };
      };
    };
  };
}
