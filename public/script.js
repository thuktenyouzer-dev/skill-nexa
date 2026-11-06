document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#demo-search');
  const keyword = document.querySelector('#keyword');
  const message = document.querySelector('#search-message');
 
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = keyword.value.trim();
    if (!value) {
      message.textContent = 'Enter a job title or keyword first.';
      keyword.focus();
      return;
    }
    message.textContent = `Demo search received: ${value}. Live database search is added in Lab 6.`;
  });
});