# Plantify App

Plantify App adalah platform terpadu untuk membantu petani dan pecinta tanaman mendiagnosis penyakit tanaman, mencatat aktivitas perawatan, serta berbagi pengalaman melalui komunitas daring. Proyek ini terdiri dari aplikasi web Next.js di sisi frontend dan backend Django dengan Django Ninja API.

## Fitur Utama

- **Diagnosis Penyakit Tanaman**: Mengunggah hasil scan tanaman dan mendapatkan diagnosis berbantuan AI.
- **Logbook Perawatan**: Mencatat aktivitas perawatan serta pengingat dalam bentuk kalender (.ics).
- **Forum Komunitas**: Berbagi pengalaman, memberi like, dan berdiskusi melalui komentar bersarang.
- **Dashboard Analitik**: Statistik diagnosis dan feedback untuk memantau kondisi terkini.

## Prasyarat

- Node.js 20.x dan npm 10.x
- Python 3.12.x
- PostgreSQL 16.x
- Redis 7.x (untuk cache)
- Git

## Struktur Proyek

```
.
├── backend/              # Backend Django + Ninja API
├── frontend/             # Aplikasi Next.js
├── docker/               # Dockerfile & Compose untuk dev environment
├── ci/                   # Konfigurasi GitHub Actions
└── README.md
```

## Menjalankan secara Lokal (tanpa Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Sesuaikan kredensial database & secrets
python manage.py migrate
python manage.py runserver
```

Secara default backend berjalan di `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`.

## Menjalankan dengan Docker

Pastikan Docker dan Docker Compose sudah terpasang.

```bash
cd docker
docker compose up --build
```

Layanan yang tersedia:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- Postgres: localhost:5432
- Redis: localhost:6379

## Konfigurasi Lingkungan

Salin `backend/.env.example` menjadi `backend/.env` lalu isi variabel berikut (contoh):

```
SECRET_KEY=your-secret-key
DB_NAME=plantify
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
CACHE_URL=redis://redis:6379/0
```

Untuk frontend, konfigurasi tambahan dapat ditempatkan pada `.env.local` bila diperlukan (mis. URL API).

## Testing

- **Backend**: `python manage.py test`
- **Frontend**: 
  - Lint: `npm run lint`
  - Type check: `npx tsc --noEmit`

CI GitHub Actions otomatis menjalankan langkah di atas pada setiap push dan pull request.

## Troubleshooting

- **Database tidak tersambung**: Pastikan Postgres berjalan dan variabel DB benar.
- **Redis error**: Pastikan service Redis hidup; jika memakai Docker, cek service `redis` di compose.
- **File .ics tidak terunduh**: pastikan tanggal valid dan browser mengizinkan unduhan otomatis.
- **Masalah izin file gambar**: cek folder `backend/media/` memiliki izin tulis.

## Kontribusi

1. Fork repo kemudian buat branch fitur baru.
2. Lakukan perubahan dan sertakan test bila perlu.
3. Pastikan lint dan test lulus.
4. Buat pull request ke branch utama disertai deskripsi perubahan.

## Lisensi

Distribusi mengikuti kebijakan internal tim Plantify. Hubungi maintainer untuk detail lisensi dan penggunaan.
