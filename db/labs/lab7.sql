-- Lab 7: Authentication and authorization
-- Run this against skill_nexa_db AFTER Labs 3 and 4.
-- Back up the database before running this migration.

BEGIN;

-- Lab 7 introduces user accounts. New public registrations are Job Seekers.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'job_seeker'
        CHECK (role IN ('job_seeker', 'employer', 'superadmin')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(64),
    reset_token VARCHAR(64),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- A company can be assigned to one Employer account.
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS owner_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'companies_owner_id_fkey'
          AND conrelid = 'companies'::regclass
    ) THEN
        ALTER TABLE companies
            ADD CONSTRAINT companies_owner_id_fkey
            FOREIGN KEY (owner_id) REFERENCES users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'companies_owner_unique'
          AND conrelid = 'companies'::regclass
    ) THEN
        ALTER TABLE companies
            ADD CONSTRAINT companies_owner_unique UNIQUE (owner_id);
    END IF;
END $$;

-- Lab 4 applications are connected to the registered account in this lab.
DO $$
BEGIN
    IF to_regclass('public.applications') IS NULL THEN
        RAISE EXCEPTION 'The applications table is missing. Complete Lab 4 before running Lab 7.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'applications_applicant_fk'
          AND conrelid = 'applications'::regclass
    ) THEN
        ALTER TABLE applications
            ADD CONSTRAINT applications_applicant_fk
            FOREIGN KEY (applicant_id) REFERENCES users(id);
    END IF;
END $$;

-- Existing Lab 4 rows with applicant_id NULL remain valid.
CREATE UNIQUE INDEX IF NOT EXISTS applications_one_per_user_job
    ON applications (job_id, applicant_id)
    WHERE applicant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

COMMIT;
