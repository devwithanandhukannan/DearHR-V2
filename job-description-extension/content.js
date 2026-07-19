// content.js - Job Description extraction script
(() => {
  // 1. Prioritize active user selection (highlighted text)
  const selection = window.getSelection().toString().trim();
  if (selection) {
    let guessedTitle = '';
    const h1 = document.querySelector('h1');
    if (h1) guessedTitle = h1.innerText.trim();
    
    return {
      text: selection,
      title: document.title || '',
      url: window.location.href || '',
      customTitle: guessedTitle || undefined,
      customCompany: undefined
    };
  }

  // 2. Target specific platforms
  const url = window.location.href;
  let text = '';
  let customTitle = '';
  let customCompany = '';

  if (url.includes('linkedin.com')) {
    // LinkedIn Selectors
    const descEl = document.querySelector('.jobs-description__content') || 
                   document.querySelector('.jobs-box__html-content') || 
                   document.querySelector('#job-details') ||
                   document.querySelector('.show-more-less-html__markup');
    if (descEl) text = descEl.innerText || descEl.textContent || '';

    const titleEl = document.querySelector('.jobs-unified-top-card__job-title') || 
                    document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
                    document.querySelector('.jobs-search__job-details h1') ||
                    document.querySelector('h1');
    if (titleEl) customTitle = titleEl.innerText || titleEl.textContent || '';

    const compEl = document.querySelector('.jobs-unified-top-card__company-name') || 
                   document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
                   document.querySelector('.jobs-unified-top-card__primary-description a');
    if (compEl) customCompany = compEl.innerText || compEl.textContent || '';

  } else if (url.includes('indeed.com')) {
    // Indeed Selectors
    const descEl = document.getElementById('jobDescriptionText') || 
                   document.querySelector('.jobsearch-JobComponent-description') ||
                   document.querySelector('.jobsearch-JobComponent');
    if (descEl) text = descEl.innerText || descEl.textContent || '';

    const titleEl = document.querySelector('.jobsearch-JobInfoHeader-title') || 
                    document.querySelector('h1');
    if (titleEl) customTitle = titleEl.innerText || titleEl.textContent || '';

    const compEl = document.querySelector('[data-company-name="true"]') || 
                   document.querySelector('.jobsearch-CompanyReview--heading') ||
                   document.querySelector('.jobsearch-InlineCompanyRating div');
    if (compEl) customCompany = compEl.innerText || compEl.textContent || '';

  } else if (url.includes('naukri.com')) {
    // Naukri Selectors
    const descEl = document.querySelector('.job-desc') || 
                   document.getElementById('jobDescriptionId');
    if (descEl) text = descEl.innerText || descEl.textContent || '';

    const titleEl = document.querySelector('.jd-header-title') || 
                    document.querySelector('h1');
    if (titleEl) customTitle = titleEl.innerText || titleEl.textContent || '';

    const compEl = document.querySelector('.jd-header-comp-name') || 
                   document.querySelector('.jd-header-comp-name a');
    if (compEl) customCompany = compEl.innerText || compEl.textContent || '';
  }

  // Clean custom values
  if (customTitle) customTitle = customTitle.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (customCompany) customCompany = customCompany.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

  // 3. Fallback to full body text if no specific container matches
  if (!text) {
    const bodyClone = document.body.cloneNode(true);
    const selectors = 'script, style, noscript, iframe, nav, footer, header, svg, path';
    bodyClone.querySelectorAll(selectors).forEach(el => el.remove());
    text = bodyClone.innerText || bodyClone.textContent || '';
  }

  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  return {
    text: cleanText.substring(0, 15000), // Cap at 15k characters
    title: document.title || '',
    url: window.location.href || '',
    customTitle: customTitle || undefined,
    customCompany: customCompany || undefined
  };
})();
