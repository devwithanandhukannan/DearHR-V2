// content.js - Job Description extraction script
(() => {
  // Clone body to manipulate without breaking active page
  const bodyClone = document.body.cloneNode(true);
  
  // Strip non-essential content tags
  const selectors = 'script, style, noscript, iframe, nav, footer, header, svg, path';
  bodyClone.querySelectorAll(selectors).forEach(el => el.remove());
  
  // Extract and normalize page text content
  const text = bodyClone.innerText || bodyClone.textContent || '';
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();

  return {
    text: cleanText.substring(0, 15000), // Cap at 15k characters
    title: document.title || '',
    url: window.location.href || ''
  };
})();
