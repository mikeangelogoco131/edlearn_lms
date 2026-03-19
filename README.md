
  # Design EdLearn LMS

  This is a code bundle for Design EdLearn LMS. The original project is available at https://www.figma.com/design/Px1oHBQu8pQ2TkXbm0V2UK/Design-EdLearn-LMS.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Backend (Laravel API)

  This repo includes a Laravel backend in `backend/`.

  The frontend calls the API at `http://127.0.0.1:8010` by default, so run Laravel on port `8010`.

  ### Setup + Run

  Start MySQL/MariaDB (XAMPP on Windows is fine) and ensure a database named `edlearn` exists.

  ```powershell
  cd backend
  composer install
  Copy-Item .env.example .env -ErrorAction SilentlyContinue
  php artisan key:generate
  php artisan migrate --force
  php artisan db:seed --force
  php artisan serve --host=127.0.0.1 --port=8010
  ```

  Demo credentials:

  - `admin@edlearn.com` / `demo`
  - `teacher@edlearn.com` / `demo`
  - `student@edlearn.com` / `demo`

  Full backend guide: `guidelines/BackendDevelopmentGuide.md`
  