# Skill Nexa - Lab 7: Authentication and Authorization

This folder continues the existing Skill Nexa work from Labs 1-6. Lab 7 adds user registration, email verification, sign-in sessions, password recovery, Job Seeker / Employer / Superadmin access, and server-side company ownership checks.

## 1. Install the packages

Open a terminal in this `skill-nexa` folder and run:

```bash
npm install
```

The Lab 7 packages are already listed in `package.json`: `bcrypt`, `express-session`, and `nodemailer`.

## 2. Configure your environment

Copy `.env.example` to `.env` and enter your own PostgreSQL password and a long random `SESSION_SECRET`.

For Gmail email delivery:

1. Enable 2-Step Verification on your Gmail account.
2. Create a Google App Password.
3. Set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `MAIL_FROM` in `.env`.

When Gmail is not configured in development, Skill Nexa prints the verification and password-reset link in the terminal. Open that local link in your browser to continue testing.

Do not upload `.env` or commit it to GitHub. It contains private credentials.

## 3. Apply the Lab 7 database migration

Before changing your database, make a backup in pgAdmin.

Open pgAdmin, select the existing `skill_nexa_db` database, open **Tools > Query Tool**, and run the complete file:

```text
db/labs/lab7.sql
```

This migration creates the `users` table, adds the company owner relationship, links registered applicants to users, and creates the role and duplicate-application indexes. It assumes the Lab 3 `companies` table and Lab 4 `applications` table already exist.

## 4. Start the website

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The public navigation now includes **Log in** and **Create account**. Public registrations always create a `job_seeker` account. A user must verify the email address before sign-in.

## 5. Create the first Superadmin

First, register a normal account on the website and verify its email address. Then, from the terminal, set that verified account's email and run the script.

Git Bash:

```bash
export SUPERADMIN_EMAIL="verified-admin@example.com"
npm run create-superadmin
```

Windows PowerShell:

```powershell
$env:SUPERADMIN_EMAIL="verified-admin@example.com"
npm run create-superadmin
```

Sign in again after promotion. The account will be directed to `/superadmin`.

The script only promotes an existing verified account. There is no public Superadmin registration form.

## 6. Complete the role workflow

1. Register and verify a Job Seeker account. Sign in and open `/dashboard`.
2. As Superadmin, create a company profile.
3. From the user list, promote a verified Job Seeker and assign an unassigned company.
4. Sign in again as that Employer. Open `/employer` and post a vacancy.
5. Sign in as a Job Seeker and apply for the vacancy. Check the application in the Job Seeker dashboard.
6. As the Employer, review the application and update its status.
7. Try opening another role's dashboard. The server should return an access-denied page.

## 7. Important security checks

- Passwords are stored as bcrypt hashes, not plain text.
- Email verification and password-reset tokens are generated randomly; only their SHA-256 hashes are stored in PostgreSQL.
- Reset links expire after 30 minutes and are cleared after use.
- Sessions are regenerated at login and destroyed at logout.
- Public registration does not accept a role field.
- Employer controllers resolve the company from the signed-in session. A submitted company ID is never trusted for vacancy edits or application status changes.
- Apply actions use the signed-in user's ID, name, and email rather than values sent by the browser.

## 8. Common setup checks

- If the terminal reports a PostgreSQL connection error, check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASS` in your local `.env` file.
- If registration works but no email arrives, check the terminal for the development email preview or verify the Gmail App Password settings.
- If an account cannot sign in, follow its verification link first.
- If `/superadmin` returns access denied, run the first-admin script for a verified account and sign in again.
- If the migration reports that `applications` is missing, complete Lab 4 before running Lab 7.


### Resend a verification email

If an account was created but the verification email was not received, open `http://localhost:3000/resend-verification`, enter the same email address, and submit the form. This route creates a fresh verification token for an unverified account. When Gmail is not configured in development, copy the verification URL from the terminal running `npm run dev`.

To send a real email, create a local `.env` file beside `app.js` (do not commit it) and set `APP_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `MAIL_FROM`. Use a Google App Password, not your normal Gmail password. Restart the server after changing `.env`. The provided `.env.example` contains blank Gmail settings by design.
