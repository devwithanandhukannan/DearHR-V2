// content.js - Complete Page HTML & Intelligence Extraction
(() => {
  const url = window.location.href;
  const domain = window.location.hostname;
  
  // 1. Capture the complete loaded page HTML DOM
  let completeHtml = '';
  try {
    completeHtml = document.documentElement ? document.documentElement.outerHTML : document.body.outerHTML;
  } catch (e) {
    completeHtml = document.body ? document.body.innerHTML : '';
  }

  // 2. Extract clean inner text
  const bodyClone = document.body.cloneNode(true);
  const selectors = 'script, style, noscript, iframe, nav, footer, svg, path';
  bodyClone.querySelectorAll(selectors).forEach(el => el.remove());
  const text = (bodyClone.innerText || bodyClone.textContent || '')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  // 3. Metadata Hints
  const clean = (str) => (str || '').replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();

  let customTitle = '';
  let customCompany = '';
  let postedBy = '';

  const h1 = document.querySelector('h1')?.innerText;
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  customTitle = clean(h1 || ogTitle || document.title);

  const compEl = document.querySelector('.jobs-unified-top-card__company-name, [data-company-name="true"], .jd-header-comp-name');
  const ogSite = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
  customCompany = clean(compEl ? compEl.innerText : ogSite);

  const posterEl = document.querySelector('.jobs-poster__name, .hiring-team__name, .jobs-unified-top-card__posted-by');
  if (posterEl) postedBy = clean(posterEl.innerText);

  return {
    completeHtml: completeHtml.substring(0, 40000), // Cap HTML at 40k chars for fast transmission
    text: text.substring(0, 15000),
    title: document.title || '',
    url: url,
    domain: domain,
    customTitle: customTitle || undefined,
    customCompany: customCompany || undefined,
    postedBy: postedBy || undefined
  };
})();
