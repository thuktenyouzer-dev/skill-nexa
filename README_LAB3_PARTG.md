# Skill Nexa — Lab 3 Part G applied

This update replaces the temporary Lab 2 in-memory job array with PostgreSQL-backed model calls.

## Files added or updated

- `controllers/homeController.js` — homepage data comes from `Job` and `Company` models.
- `controllers/jobController.js` — new database-backed job listing and details controller.
- `routes/index.js` — `/` uses `homeController.index`; `/jobs` and `/jobs/:id` use `jobController`.
- `views/index.ejs` — displays featured, latest and popular jobs, database categories and companies.
- `views/jobs.ejs` — displays database job records and supports keyword, location, category and job-type filters.
- `views/job-details.ejs` — displays job and company details retrieved from PostgreSQL.
- `views/error.ejs` — displays a simple server error page.
- `app.js` — verifies the PostgreSQL connection and logs the Part H confirmation.
- `.env.example` — documents the local database settings; it does not contain a real password.
- `.gitignore` — ensures `.env`, test secrets, dependencies and coverage are excluded from Git.

## Before running

1. Keep your existing local `.env` file. This ZIP deliberately does not include it because it contains your PostgreSQL password.
2. Confirm `.env` contains the correct local values. On the supplied computer, pgAdmin uses port `1793`, so set `DB_PORT=1793`.
3. Confirm the database `skill_nexa_db` exists and you have executed `db/labs/lab3.sql` in that database.
4. Install packages if needed:

   ```bash
   npm install
   ```

5. Seed the sample company and job records if you have not already:

   ```bash
   npm run seed
   ```

6. Start the application:

   ```bash
   npm run dev
   ```

## Verification

The terminal should report both:

```text
Skill Nexa running at http://localhost:3000
PostgreSQL connection verified.
```

Then test:

- `http://localhost:3000/` — homepage data from PostgreSQL.
- `http://localhost:3000/jobs` — job records from PostgreSQL.
- `http://localhost:3000/jobs?q=developer` — keyword filtering.
- `http://localhost:3000/jobs?location=Thimphu` — location filtering.
- `http://localhost:3000/jobs/1` — details for database job ID 1, if it exists and is active.
- `http://localhost:3000/jobs/999` — a proper HTTP 404 page if no active job has ID 999.

To verify that the site reads live database data, insert a company and a linked job in pgAdmin, then refresh `/jobs`. The new vacancy should appear without editing JavaScript arrays.

## Important

This archive does not include `.env`, `.git`, or `node_modules`. Copy the updated project files over your existing project, but keep your own `.env`, `.git`, and `node_modules` folders. This preserves your local database password and GitHub remote configuration.

The ZIP was checked for JavaScript syntax. A live database query could not be run from this packaging environment; verify it on your computer with your local PostgreSQL service and credentials.
