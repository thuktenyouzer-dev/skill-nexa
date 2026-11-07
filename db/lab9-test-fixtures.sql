
BEGIN;

-- 1. Create four test accounts
INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES
('Employer Test A', 'employer.a@skillnexa.test',
 '$2b$12$xVK0MW1iKwBzPGApw2IinuoLIx86SNfNzz2lO15n7Kxb3FXZmhgiO',
 'employer', TRUE),

('Employer Test B', 'employer.b@skillnexa.test',
 '$2b$12$xVK0MW1iKwBzPGApw2IinuoLIx86SNfNzz2lO15n7Kxb3FXZmhgiO',
 'employer', TRUE),

('Job Seeker Test', 'seeker@skillnexa.test',
 '$2b$12$xVK0MW1iKwBzPGApw2IinuoLIx86SNfNzz2lO15n7Kxb3FXZmhgiO',
 'job_seeker', TRUE),

('Superadmin Test', 'admin@skillnexa.test',
 '$2b$12$xVK0MW1iKwBzPGApw2IinuoLIx86SNfNzz2lO15n7Kxb3FXZmhgiO',
 'superadmin', TRUE)

ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_verified = TRUE;


-- 2. Create two companies and assign their employers
INSERT INTO companies
    (name, description, industry, location, website, owner_id)
SELECT
    'Lab 9 Test Company A',
    'First company for testing employer ownership.',
    'Information Technology',
    'Thimphu, Bhutan',
    'https://example.com',
    u.id
FROM users u
WHERE u.email = 'employer.a@skillnexa.test'
ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


INSERT INTO companies
    (name, description, industry, location, website, owner_id)
SELECT
    'Lab 9 Test Company B',
    'Second company for testing employer ownership.',
    'Education',
    'Paro, Bhutan',
    'https://example.org',
    u.id
FROM users u
WHERE u.email = 'employer.b@skillnexa.test'
ON CONFLICT (owner_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;


-- 3. Create one vacancy for each company
INSERT INTO jobs
    (company_id, title, description, category, location, job_type)
SELECT
    c.id,
    'Lab 9 Test Vacancy A',
    'Test vacancy belonging to Company A.',
    'Information Technology',
    'Thimphu, Bhutan',
    'Full-time'
FROM companies c
JOIN users u ON u.id = c.owner_id
WHERE u.email = 'employer.a@skillnexa.test'
AND NOT EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.company_id = c.id
    AND j.title = 'Lab 9 Test Vacancy A'
);


INSERT INTO jobs
    (company_id, title, description, category, location, job_type)
SELECT
    c.id,
    'Lab 9 Test Vacancy B',
    'Test vacancy belonging to Company B.',
    'Education',
    'Paro, Bhutan',
    'Full-time'
FROM companies c
JOIN users u ON u.id = c.owner_id
WHERE u.email = 'employer.b@skillnexa.test'
AND NOT EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.company_id = c.id
    AND j.title = 'Lab 9 Test Vacancy B'
);


-- 4. Create one application from the Job Seeker
INSERT INTO applications
    (job_id, applicant_id, applicant_name, applicant_email, status)
SELECT
    j.id,
    u.id,
    u.name,
    u.email,
    'submitted'
FROM users u
JOIN jobs j ON j.title = 'Lab 9 Test Vacancy A'
JOIN companies c ON c.id = j.company_id
WHERE u.email = 'seeker@skillnexa.test'
AND c.name = 'Lab 9 Test Company A'
AND NOT EXISTS (
    SELECT 1 FROM applications a
    WHERE a.job_id = j.id
    AND a.applicant_id = u.id
);

COMMIT;


-- 5. Display the created test accounts
SELECT id, name, email, role, is_verified
FROM users
WHERE email IN (
    'employer.a@skillnexa.test',
    'employer.b@skillnexa.test',
    'seeker@skillnexa.test',
    'admin@skillnexa.test'
)
ORDER BY role, email;


-- 6. Display test companies
SELECT id, name, owner_id
FROM companies
WHERE name LIKE 'Lab 9 Test Company%'
ORDER BY name;


-- 7. Display test vacancies
SELECT id, company_id, title
FROM jobs
WHERE title LIKE 'Lab 9 Test Vacancy%'
ORDER BY title;
