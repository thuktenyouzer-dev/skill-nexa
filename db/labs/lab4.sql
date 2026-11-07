-- LAB 4: JOB APPLICATIONS, CRUD AND TRANSACTIONS

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    applicant_id INTEGER,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_email VARCHAR(254) NOT NULL,
    resume_url VARCHAR(500),
    cover_letter TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'submitted', 'reviewing', 'shortlisted',
            'accepted', 'rejected', 'withdrawn'
        )),
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS applications_job_idx
ON applications (job_id);

CREATE INDEX IF NOT EXISTS applications_applied_idx
ON applications (applied_at DESC);
