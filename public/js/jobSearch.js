document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('[data-api-search]');
  const results = document.querySelector('[data-search-results]');
  if (!form || !results) return;
 
  function makeNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
 
  function formatSalary(job) {
    if (!job.salary_min && !job.salary_max) return 'Salary not listed';
    const currency = job.salary_currency || 'BTN';
    const min = job.salary_min ? Number(job.salary_min).toLocaleString() : '—';
    const max = job.salary_max ? Number(job.salary_max).toLocaleString() : '—';
    return `${currency} ${min} - ${max}`;
  }
 
  function renderJobs(payload) {
    results.replaceChildren();
    const heading = makeNode('div', 'dynamic-results-heading');
    heading.append(makeNode('h2', '', 'Search results'));
    heading.append(makeNode('p', '', `${payload.count} matching ${payload.count === 1 ? 'opportunity' : 'opportunities'}`));
    results.append(heading);
 
    if (!payload.jobs.length) {
      const empty = makeNode('div', 'empty-state');
      empty.append(makeNode('h3', '', 'No matching vacancies found'));
      empty.append(makeNode('p', '', 'Try another keyword or location, or browse all vacancies.'));
      const link = makeNode('a', 'button button-outline', 'Browse all jobs');
      link.href = '/jobs';
      empty.append(link);
      results.append(empty);
      return;
    }
 
    const grid = makeNode('div', 'job-grid');
    payload.jobs.forEach((job) => {
      const card = makeNode('article', 'job-card');
      const top = makeNode('div', 'job-card-top');
      top.append(makeNode('span', 'company-avatar', (job.company_name || 'S').slice(0, 1).toUpperCase()));
      top.append(makeNode('span', 'job-type', job.job_type));
      card.append(top);
      const title = makeNode('h3');
      const titleLink = makeNode('a', '', job.title);
      titleLink.href = `/jobs/${encodeURIComponent(job.id)}`;
      title.append(titleLink);
      card.append(title);
      card.append(makeNode('p', 'company-name', job.company_name));
      const meta = makeNode('div', 'job-meta');
      meta.append(makeNode('span', '', `⌖ ${job.location}`));
      meta.append(makeNode('span', '', `▦ ${job.category}`));
      card.append(meta);
      const bottom = makeNode('div', 'job-card-bottom');
      bottom.append(makeNode('span', 'salary', formatSalary(job)));
      const details = makeNode('a', 'text-link', 'View details →');
      details.href = `/jobs/${encodeURIComponent(job.id)}`;
      bottom.append(details);
      card.append(bottom);
      grid.append(card);
    });
    results.append(grid);
  }
 
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (String(value).trim()) params.set(key, String(value).trim());
    }
    const button = form.querySelector('button[type="submit"]');
    const originalText = button ? button.textContent : '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Searching...';
    }
    results.replaceChildren(makeNode('p', 'search-loading', 'Searching live vacancies...'));
    try {
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Search request failed (${response.status}).`);
      const payload = await response.json();
      renderJobs(payload);
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      results.replaceChildren();
      const message = makeNode('div', 'alert alert-error', 'We could not load job results. Check your connection and try again.');
      results.append(message);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  });
});