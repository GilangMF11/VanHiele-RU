# Panduan Deployment dengan PM2

## Persiapan di Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Adapter Node (jika belum)
```bash
npm install -D @sveltejs/adapter-node
```

### 3. Setup Environment Variables
Pastikan file `.env` sudah dikonfigurasi dengan benar di server:
- `DATABASE_URL` atau konfigurasi database lainnya
- `JWT_SECRET`
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`

### 4. Build Aplikasi
```bash
npm run build
```

Setelah build, akan terbuat folder `build/` yang berisi file `index.js` sebagai entry point.

### 5. Jalankan Database Migrations (jika diperlukan)
```bash
npm run migrate:up
```

## Menjalankan dengan PM2

### Opsi 1: Menggunakan Ecosystem Config (Recommended)
```bash
# Start aplikasi
pm2 start ecosystem.config.js

# Atau dengan nama spesifik
pm2 start ecosystem.config.js --name soal-ump
```

### Opsi 2: Command Langsung
```bash
pm2 start build/index.js --name soal-ump --env production
```

### Opsi 3: Menggunakan npm start
```bash
pm2 start npm --name soal-ump -- start
```

## PM2 Commands yang Berguna

```bash
# Melihat status aplikasi
pm2 status

# Melihat logs
pm2 logs soal-ump

# Restart aplikasi
pm2 restart soal-ump

# Stop aplikasi
pm2 stop soal-ump

# Delete aplikasi dari PM2
pm2 delete soal-ump

# Monitor aplikasi
pm2 monit

# Save konfigurasi PM2 (agar auto-start saat server restart)
pm2 save
pm2 startup
```

## Konfigurasi Port

Default port adalah **3000**. Untuk mengubah port, edit file `ecosystem.config.js` atau set environment variable:

```bash
PORT=8080 pm2 start ecosystem.config.js
```

## Logs

Logs akan tersimpan di folder `logs/`:
- `logs/pm2-error.log` - Error logs
- `logs/pm2-out.log` - Output logs

Pastikan folder `logs/` sudah dibuat:
```bash
mkdir -p logs
```

## Update Aplikasi

Ketika ada update, lakukan:

```bash
# 1. Pull latest code
git pull

# 2. Install dependencies (jika ada perubahan)
npm install

# 3. Build ulang
npm run build

# 4. Restart PM2
pm2 restart soal-ump
```

## Troubleshooting

### Port sudah digunakan
```bash
# Cek port yang digunakan
lsof -i :3000

# Atau ubah port di ecosystem.config.js
```

### Aplikasi tidak start
```bash
# Cek logs
pm2 logs soal-ump --lines 50

# Cek apakah build berhasil
ls -la build/
```

### Environment variables tidak terbaca
Pastikan file `.env` ada di root project dan variabel sudah di-set dengan benar.

