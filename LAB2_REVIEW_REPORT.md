# Lab 2 Code Review — Skill Nexa

## Review outcome

The uploaded project was close to the intended Lab 2 MVC scaffold, but the homepage was being intercepted by an old static HTML file. A few other layout and development-configuration issues were also corrected.

## Problems found and fixes applied

| File | Finding | Fix |
|---|---|---|
| `public/index.html` | Express static middleware served this file for `/` before the EJS route could run. Its Jobs link pointed to `#jobs`, which scrolled to Career areas. | Remove this obsolete Lab 1 static homepage so `routes/index.js` renders `views/index.ejs`. |
| `views/partials/header.ejs` | The shared `<main>` element opened and immediately closed, leaving page content outside the container. | Keep `<main class="container">` open in the header; the footer partial closes it. |
| `nodemon.json` | `exec: "node app.js"` duplicated the `nodemon app.js` command in `package.json`. | Remove `exec`. Nodemon now starts `node app.js` once. |
| `controllers/homeController.js` and `views/jobs.ejs` | The search form submitted a query but the controller ignored it. | Add case-insensitive search over sample job title, company and location, plus an empty-results message. |
| `views/index.ejs` | The home page did not provide a clear call to action to browse listings. | Add a visible Browse All Available Jobs button and a View All Jobs link. |
| `server.js` | This was a separate outdated static-only server and did not load the MVC routes. | Remove it at this Lab 2 stage. The application is started through `app.js`. |
| `public/styles.css`, `public/script.js` | These were leftovers from the static Lab 1 page and were not used by the EJS pages. | Remove them to avoid duplicate frontend files. Use `public/css/styles.css`. |

## Verification performed

The corrected code was started locally using the dependencies present in the uploaded project.

| Request | Result |
|---|---:|
| `GET /` | 200 OK |
| `GET /jobs` | 200 OK |
| `GET /jobs/1` | 200 OK |
| `GET /jobs/999` | 404 Not Found |
| `GET /jobs?q=Trashigang` | 200 OK; matching job shown |
| `GET /jobs?q=unmatched` | 200 OK; no-results message shown |
| `GET /css/styles.css` | 200 OK |

The core application JavaScript files also passed `node --check`. Nodemon was confirmed to start `node app.js` once.

## Important: what is intentionally not implemented yet

The job data in `controllers/homeController.js` is still an in-memory sample array. This is appropriate for the Lab 2 stage. In Lab 3, the sample data should be replaced by PostgreSQL queries and the Company/Job models.

This review does not claim that later features such as database CRUD, authentication, applications or APIs are complete.

## Applying these fixes to the existing Git repository

This ZIP intentionally does not include `.git`, `.env` or `node_modules`.

1. Back up the current `skill-nexa` folder.
2. Extract the ZIP and copy the contents of its `skill-nexa` folder into your existing project folder, allowing corrected files to replace the old ones.
3. Delete the obsolete files listed in `REMOVE_OLD_FILES.txt`.
4. Keep your existing `.git` folder and `.env` file.
5. Run `npm run dev` and refresh the browser with `Ctrl + F5`.

The `.env.example` file is supplied as a safe reference. It contains only `PORT=3000`.
