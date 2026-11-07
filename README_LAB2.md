> **Updated project status:** This README describes the earlier Lab 2 checkpoint. Lab 3 Part G has since replaced the temporary in-memory job data with PostgreSQL-backed models and controllers. Follow `README_LAB3_PARTG.md` and `APPLY_LAB3_PARTG.txt` for the current project setup and verification steps.

# Skill Nexa — Lab 2 checkpoint

This folder contains the Skill Nexa project corrected through Lab 2 (MVC scaffolding and EJS pages).

## Run locally

1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. Install packages:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` (or create `.env` containing `PORT=3000`).
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open <http://localhost:3000>.

## Lab 2 routes

- `/` — EJS homepage
- `/jobs` — sample job listings; supports `?q=` search by title, company, or location
- `/jobs/1` — first sample job detail
- `/jobs/2` — second sample job detail
- `/jobs/999` — renders a 404 Job Not Found page

## Lab 2 notes

- Job records are temporary in-memory examples in `controllers/homeController.js`. This is intentional at Lab 2; Lab 3 will replace them with PostgreSQL records.
- `views/partials/header.ejs` opens the shared `<main>` container and `footer.ejs` closes it.
- Static assets are served from `public/`; the stylesheet is `public/css/styles.css`.
- The old `public/index.html` was removed because Express serves it before the EJS route for `/`, which prevented `views/index.ejs` from appearing.
- The duplicate old static stylesheet/script and outdated standalone `server.js` were removed to avoid two competing implementations.
- `nodemon.json` no longer specifies `exec`, because the npm `dev` script already supplies `nodemon app.js`.

## Environment

Create a local `.env` file:

```env
PORT=3000
```

Do not commit `.env`. The `.gitignore` excludes it.
