# EdLearn – Backend Development Guide (Laravel + MySQL)

This repo already contains a complete **Laravel 12** API backend under `backend/` and a **Vite + React** frontend at the repo root.

The frontend is configured to call the API at:

- `http://127.0.0.1:8010`

So the key rule for local development is: **run Laravel on port `8010`**.

---

## 1) Tech Stack (What You’re Actually Running)

- **Backend:** Laravel 12 (PHP 8.2), API-only JSON
- **Database:** MySQL/MariaDB (XAMPP recommended on Windows)
- **Auth:** Custom **HS256 JWT** (no external JWT packages)
- **Authorization:** Role middleware (`admin`, `teacher`, `student`)
- **Frontend:** Vite + React (separate process)

Why custom JWT? Composer package downloads were unreliable in this environment, so JWT was implemented in-repo.

---

## 2) Prerequisites (Windows)

Install / ensure you have:

- **XAMPP** (for MySQL/MariaDB)
- **PHP 8.2+** available in PATH (or use the PHP shipped with XAMPP)
- **Composer** (for Laravel dependencies)
- **Node.js 18+** (for the React frontend)

---

## 3) Database Setup (MySQL/MariaDB)

1. Start **MySQL** in the XAMPP Control Panel.
2. Create the database (optional if it already exists):

```powershell
& "C:\xampp\mysql\bin\mysql.exe" -uroot -e "CREATE DATABASE IF NOT EXISTS edlearn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

3. Confirm `backend/.env` matches your MySQL settings:

- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=edlearn`
- `DB_USERNAME=root`
- `DB_PASSWORD=`

---

## 4) Backend Setup (First Run)

From the repo root:

```powershell
cd backend

# install PHP dependencies
composer install

# create .env if missing
Copy-Item .env.example .env -ErrorAction SilentlyContinue

# generate APP_KEY if needed
php artisan key:generate

# run schema + seed demo data
php artisan migrate --force
php artisan db:seed --force
```

Notes:
- If `composer install` fails in your network environment, this repo may already include `backend/vendor/`. If it’s present, you can often proceed without reinstalling.

---

## 5) Run the API Server (Port 8010)

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8010
```

Optional (recommended): set `APP_URL` in `backend/.env` to match:

- `APP_URL=http://127.0.0.1:8010`

---

## 6) Smoke Test the API (Login → Protected Route)

Seeded demo credentials (from the DB seeder):

- Admin: `admin@edlearn.com` / `demo`
- Teacher: `teacher@edlearn.com` / `demo`
- Student: `student@edlearn.com` / `demo`

PowerShell test:

```powershell
$base = 'http://127.0.0.1:8010'

$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body (
  @{ email='admin@edlearn.com'; password='demo' } | ConvertTo-Json
)

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Method Get -Uri "$base/api/me" -Headers $headers
Invoke-RestMethod -Method Get -Uri "$base/api/courses" -Headers $headers
```

---

## 7) Run the Frontend

From the repo root:

```powershell
npm install
npm run dev
```

The frontend defaults to the API base URL `http://127.0.0.1:8010` (see `src/app/lib/api.ts`).

If you need to override the API URL, create a root `.env.local`:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8010
```

---

## 8) API Routes Overview

All routes are under `backend/routes/api.php`.

Auth:
- `POST /api/auth/login`
- `GET /api/me` (JWT required)

Courses (JWT required):
- `GET /api/courses`
- `POST /api/courses` (admin/teacher)
- `GET /api/courses/{course}`
- `PATCH /api/courses/{course}` (admin/teacher)
- `DELETE /api/courses/{course}` (admin/teacher)

Nested resources (JWT required):
- Enrollments: `/api/courses/{course}/enrollments`
- Sessions: `/api/courses/{course}/sessions`
- Assignments: `/api/courses/{course}/assignments`
- Announcements: `/api/courses/{course}/announcements`

Submissions (JWT required):
- `GET /api/assignments/{assignment}/submissions`
- `POST /api/assignments/{assignment}/submissions` (student)
- `PATCH /api/submissions/{submission}/grade` (admin/teacher)

Analytics (JWT required):
- `GET /api/analytics/admin` (admin)
- `GET /api/analytics/teacher` (teacher)
- `GET /api/analytics/student` (student)

Users (JWT required):
- `GET /api/users` (admin)

---

## 9) Auth Internals (JWT)

- Token issued by `POST /api/auth/login`.
- Token verification is handled by the `jwt` middleware (custom implementation).
- Role checks use the `role:` middleware.

---

## 10) Common Problems

- **Port mismatch:** If the UI loads but shows no data, confirm Laravel is running on `8010`.
- **CORS errors:** Update allowed origins in `backend/config/cors.php` to include your Vite dev URL.
- **MySQL won’t start:** XAMPP/MySQL system tables can get corrupted; fix MySQL first before running migrations.

---

## 11) Where To Add New Backend Features

- Routes: `backend/routes/api.php`
- Controllers: `backend/app/Http/Controllers/Api/*`
- Models: `backend/app/Models/*`
- Migrations: `backend/database/migrations/*`
- Seed data: `backend/database/seeders/DatabaseSeeder.php`
