// content.js - Job Description & JARVIS Platform Intel Extraction
(() => {
  const url = window.location.href;
  const domain = window.location.hostname;
  const selection = window.getSelection().toString().trim();
  
  let text = '';
  let customTitle = '';
  let customCompany = '';
  let postedBy = '';
  let location = '';
  let salary = '';

  const clean = (str) => (str || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

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

    const posterEl = document.querySelector('.jobs-poster__name') ||
                     document.querySelector('.hiring-team__name') ||
                     document.querySelector('.jobs-unified-top-card__posted-by');
    if (posterEl) postedBy = posterEl.innerText || posterEl.textContent || '';

    const locEl = document.querySelector('.jobs-unified-top-card__bullet') ||
                  document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
    if (locEl) location = locEl.innerText || locEl.textContent || '';

    const salEl = document.querySelector('.jobs-unified-top-card__salary-info') ||
                  document.querySelector('.salary-compensation-text');
    if (salEl) salary = salEl.innerText || salEl.textContent || '';

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

    const locEl = document.querySelector('[data-testid="job-location"]') ||
                  document.querySelector('.jobsearch-JobInfoHeader-subtitle');
    if (locEl) location = locEl.innerText || locEl.textContent || '';

    const salEl = document.querySelector('#salaryInfoAndJobType') ||
                  document.querySelector('.jobsearch-JobMetadataHeader-item');
    if (salEl) salary = salEl.innerText || salEl.textContent || '';

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

    const locEl = document.querySelector('.loc') || document.querySelector('.location');
    if (locEl) location = locEl.innerText || locEl.textContent || '';

    const salEl = document.querySelector('.salary');
    if (salEl) salary = salEl.innerText || salEl.textContent || '';
  }

  if (selection) {
    text = selection;
  }

  // Fallback to full body text if no specific container matches
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
    text: cleanText.substring(0, 15000),
    title: document.title || '',
    url: window.location.href || '',
    domain: domain || '',
    customTitle: clean(customTitle) || undefined,
    customCompany: clean(customCompany) || undefined,
    postedBy: clean(postedBy) || undefined,
    location: clean(location) || undefined,
    salary: clean(salary) || undefined
  };
})();

