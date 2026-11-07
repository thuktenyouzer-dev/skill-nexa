
BEGIN;

-- Create a second Job Seeker
INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES (
    'Job Seeker Test B',
    'seeker.b@skillnexa.test',
    '$2b$12$xVK0MW1iKwBzPGApw2IinuoLIx86SNfNzz2lO15n7Kxb3FXZmhgiO',
    'job_seeker',
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'job_seeker',
    is_verified = TRUE;

-- Create an application for Company B's vacancy
INSERT INTO applications (
    job_id,
    applicant_id,
    applicant_name,
    applicant_email,
    status
)
SELECT
    j.id,
    u.id,
    u.name,
    u.email,
    'submitted'
FROM users u
JOIN jobs j ON j.title = 'Lab 9 Test Vacancy B'
WHERE u.email = 'seeker.b@skillnexa.test'
AND NOT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.job_id = j.id
    AND a.applicant_id = u.id
);

-- Synchronise application counters
UPDATE jobs j
SET applications_count = (
    SELECT COUNT(*)::integer
    FROM applications a
    WHERE a.job_id = j.id
)
WHERE j.title LIKE 'Lab 9 Test Vacancy%';

COMMIT;

-- Display test applications
SELECT
    a.id,
    a.applicant_email,
    j.title AS vacancy,
    c.name AS company
FROM applications a
JOIN jobs j ON j.id = a.job_id
JOIN companies c ON c.id = j.company_id
WHERE a.applicant_email IN (
    'seeker@skillnexa.test',
    'seeker.b@skillnexa.test'
)
ORDER BY a.id;
