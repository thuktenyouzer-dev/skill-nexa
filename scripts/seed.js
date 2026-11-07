require('dotenv').config();
const db = require('../config/db');

const sampleCompanies = [
  {
    name: 'Druk Digital Solutions',
    industry: 'Information Technology',
    location: 'Thimphu, Bhutan',
    description: 'A growing technology company delivering software, data and digital services.',
    website: 'https://example.com'
  },
  {
    name: 'Himalayan Learning Centre',
    industry: 'Education',
    location: 'Trashigang, Bhutan',
    description: 'An education organisation focused on learning and training programmes.',
    website: 'https://example.com'
  },
  {
    name: 'Mountain Finance Group',
    industry: 'Finance',
    location: 'Phuentsholing, Bhutan',
    description: 'A financial services organisation supporting customers and businesses.',
    website: 'https://example.com'
  }
];

const sampleJobs = [
  {
    company: 'Druk Digital Solutions',
    title: 'Junior Web Developer',
    description: 'Build responsive web pages using HTML, CSS and JavaScript.',
    category: 'Information Technology',
    location: 'Thimphu, Bhutan',
    job_type: 'Full-time',
    experience_level: 'Entry level',
    salary_min: 18000,
    salary_max: 28000
  },
  {
    company: 'Druk Digital Solutions',
    title: 'UI/UX Design Intern',
    description: 'Support user research, wireframing and interface prototyping.',
    category: 'Information Technology',
    location: 'Thimphu, Bhutan',
    job_type: 'Internship',
    experience_level: 'Student / Graduate',
    salary_min: 8000,
    salary_max: 12000
  },
  {
    company: 'Himalayan Learning Centre',
    title: 'Programme Assistant',
    description: 'Coordinate training schedules and prepare learning materials.',
    category: 'Education',
    location: 'Trashigang, Bhutan',
    job_type: 'Full-time',
    experience_level: 'Entry level',
    salary_min: 16000,
    salary_max: 22000
  },
  {
    company: 'Mountain Finance Group',
    title: 'Customer Service Officer',
    description: 'Assist customers with enquiries and maintain accurate records.',
    category: 'Finance',
    location: 'Phuentsholing, Bhutan',
    job_type: 'Full-time',
    experience_level: '1-2 years',
    salary_min: 20000,
    salary_max: 30000
  }
];

async function seed() {
  try {
    // Insert sample companies
    for (const company of sampleCompanies) {
      await db.none(
        `INSERT INTO companies
         (name, industry, location, description, website)
         SELECT $1, $2, $3, $4, $5
         WHERE NOT EXISTS (
           SELECT 1 FROM companies WHERE name = $1
         )`,
        [
          company.name,
          company.industry,
          company.location,
          company.description,
          company.website
        ]
      );
    }

    // Insert sample jobs
    for (const job of sampleJobs) {
      await db.none(
        `INSERT INTO jobs
         (company_id, title, description, category, location,
          job_type, experience_level, salary_min, salary_max,
          salary_currency)
         SELECT c.id, $2, $3, $4, $5, $6, $7, $8, $9, 'BTN'
         FROM companies c
         WHERE c.name = $1
         AND NOT EXISTS (
           SELECT 1 FROM jobs j
           WHERE j.company_id = c.id AND j.title = $2
         )`,
        [
          job.company,
          job.title,
          job.description,
          job.category,
          job.location,
          job.job_type,
          job.experience_level,
          job.salary_min,
          job.salary_max
        ]
      );
    }

    console.log('Sample companies and jobs inserted successfully!');

  } catch (error) {
    console.error('\nSeeding failed! Full error details:');
    console.error(error);
    console.error(error.stack);

    process.exitCode = 1;

} finally {
    await db.$pool.end();
}
}

seed();