// popup.js - Chrome Extension script

const API_BASE = 'http://localhost:8000/api';
const APP_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  const authScreen = document.getElementById('auth-screen');
  const mainScreen = document.getElementById('main-screen');
  const tokenInput = document.getElementById('token-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const companyInput = document.getElementById('company-input');
  const titleInput = document.getElementById('title-input');
  const jdTextarea = document.getElementById('jd-textarea');
  const extractBtn = document.getElementById('extract-btn');
  const sendBtn = document.getElementById('send-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const statusMessage = document.getElementById('status-message');
  const autoExtractToggle = document.getElementById('auto-extract-toggle');
  const autoExtractLabel = document.getElementById('auto-extract-label');
  const addCartBtn = document.getElementById('add-cart-btn');

  // 1. Initial State Check
  const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
  const { auto_extract_on_open } = await chrome.storage.local.get('auto_extract_on_open');

  const isAutoExtractOn = auto_extract_on_open !== false;
  autoExtractToggle.checked = isAutoExtractOn;

  if (dearhr_token) {
    showMainScreen();
    // Auto-extract on open if toggled on
    if (isAutoExtractOn) {
      await runExtraction();
    } else {
      showStatus('Ready. Click Auto-Extract or paste content manually.', 'info');
    }
  } else {
    showAuthScreen();
  }

  // 2. Event Listeners
  addCartBtn.addEventListener('click', async () => {
    const company = companyInput.value.trim();
    const title = titleInput.value.trim();
    const descriptionText = jdTextarea.value.trim();

    if (!descriptionText) {
      showStatus('Job description text is required.', 'error');
      return;
    }

    showStatus('Saving to cart...', 'info');
    addCartBtn.disabled = true;

    try {
      const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
      if (!dearhr_token) {
        showStatus('Connect extension in popup first.', 'error');
        return;
      }

      const response = await fetch(`${API_BASE}/jobseeker/job-descriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dearhr_token}`
        },
        body: JSON.stringify({
          company,
          title,
          descriptionText
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        showStatus('Saved to cart successfully!', 'success');
      } else {
        throw new Error(resData.error || resData.message || 'Failed to save job description.');
      }
    } catch (err) {
      showStatus(err.message || 'Network error occurred.', 'error');
    } finally {
      addCartBtn.disabled = false;
    }
  });

  autoExtractToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ auto_extract_on_open: autoExtractToggle.checked });
  });

  autoExtractLabel.addEventListener('click', () => {
    autoExtractToggle.checked = !autoExtractToggle.checked;
    autoExtractToggle.dispatchEvent(new Event('change'));
  });

  saveTokenBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      showStatus('Please enter a valid token.', 'error');
      return;
    }
    await chrome.storage.local.set({ dearhr_token: token });
    tokenInput.value = '';
    showMainScreen();
    if (autoExtractToggle.checked) {
      await runExtraction();
    }
  });

  extractBtn.addEventListener('click', async () => {
    await runExtraction();
  });

  sendBtn.addEventListener('click', async () => {
    const company = companyInput.value.trim();
    const title = titleInput.value.trim();
    const descriptionText = jdTextarea.value.trim();

    if (!descriptionText) {
      showStatus('Job description text is required.', 'error');
      return;
    }

    showStatus('Sending job description...', 'info');
    sendBtn.disabled = true;

    try {
      const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
      const response = await fetch(`${API_BASE}/jobseeker/job-descriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dearhr_token}`
        },
        body: JSON.stringify({
          company,
          title,
          descriptionText
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        const jdId = resData.data.id;
        showStatus('Saved successfully! Redirecting...', 'success');
        
        // Open web app with JD ID query param
        chrome.tabs.create({ url: `${APP_URL}/dashboard/resumes?jd_id=${jdId}` });
      } else {
        throw new Error(resData.error || resData.message || 'Failed to save job description.');
      }
    } catch (err) {
      showStatus(err.message || 'Network error occurred.', 'error');
    } finally {
      sendBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('dearhr_token');
    showAuthScreen();
  });

  // Helper Functions
  function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    statusMessage.classList.add('hidden');
  }

  function showMainScreen() {
    authScreen.classList.add('hidden');
    mainScreen.classList.remove('hidden');
    statusMessage.classList.add('hidden');
  }

  function showStatus(msg, type) {
    statusMessage.innerText = msg;
    statusMessage.className = `status-text status-${type}`;
    statusMessage.classList.remove('hidden');
  }

  async function runExtraction() {
    showStatus('Extracting content...', 'info');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active browser tab found.');
      }

      // Execute extraction content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (results && results[0] && results[0].result) {
        const { text, title, customTitle, customCompany } = results[0].result;
        jdTextarea.value = text || '';
        
        if (customTitle || customCompany) {
          companyInput.value = customCompany || '';
          titleInput.value = customTitle || '';
        } else {
          // Parse Title & Company heuristics
          const details = parseJobDetails(title || tab.title || '');
          companyInput.value = details.company;
          titleInput.value = details.jobTitle;
        }
        
        showStatus('Extracted successfully!', 'success');
      } else {
        throw new Error('Failed to parse active webpage content.');
      }
    } catch (err) {
      showStatus(err.message || 'Extraction failed.', 'error');
    }
  }

  function parseJobDetails(title) {
    let company = '';
    let jobTitle = title;

    // Standard separators
    const separators = [' at ', ' | ', ' - ', ' – '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        jobTitle = parts[0].trim();
        company = parts[1].split('|')[0].split('-')[0].trim();
        break;
      }
    }

    // Clean site suffix branding (e.g., "Jobs", "Careers", site names)
    company = company
      .replace(/(LinkedIn|Indeed|Glassdoor|Naukri|Jobs|Careers)/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();

    jobTitle = jobTitle
      .replace(/(Job Description|Job Listing|Apply Now)/gi, '')
      .trim();

    return { company, jobTitle };
  }
});
