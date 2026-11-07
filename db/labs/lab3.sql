-- Lab 3: Initial relational schema. Run against skill_nexa_db.
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  industry VARCHAR(100) NOT NULL,
  location VARCHAR(150) NOT NULL,
  website VARCHAR(300),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id),
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  location VARCHAR(120) NOT NULL,
  job_type VARCHAR(30) NOT NULL,
  experience_level VARCHAR(80) NOT NULL DEFAULT 'Not specified',
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  salary_currency VARCHAR(8) NOT NULL DEFAULT 'BTN',
  deadline DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  applications_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (salary_min IS NULL OR salary_min >= 0),
  CHECK (salary_max IS NULL OR salary_max >= 0),
  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min)
);

CREATE INDEX jobs_active_created_idx ON jobs (is_active, status, created_at DESC);
CREATE INDEX jobs_category_idx ON jobs (category);
