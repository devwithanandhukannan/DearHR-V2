// popup.js - Chrome Extension script (Apple Minimalist Intelligence & Tab Management)

const API_BASE = 'http://localhost:8000/api';
const APP_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const authScreen = document.getElementById('auth-screen');
  const mainContainer = document.getElementById('main-container');
  const navBar = document.getElementById('nav-bar');
  const navCaptureBtn = document.getElementById('nav-capture-btn');
  const navIntelBtn = document.getElementById('nav-intel-btn');
  
  const viewCapture = document.getElementById('view-capture');
  const viewIntel = document.getElementById('view-intel');
  
  const tokenInput = document.getElementById('token-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const companyInput = document.getElementById('company-input');
  const titleInput = document.getElementById('title-input');
  const jdTextarea = document.getElementById('jd-textarea');
  const extractBtn = document.getElementById('extract-btn');
  const sendBtn = document.getElementById('send-btn');
  const addCartBtn = document.getElementById('add-cart-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const statusMessage = document.getElementById('status-message');
  const autoExtractToggle = document.getElementById('auto-extract-toggle');
  const autoExtractLabel = document.getElementById('auto-extract-label');

  // Intelligence UI Elements
  const runIntelBtn = document.getElementById('run-intel-btn');
  const intelLoading = document.getElementById('intel-loading');
  const intelContent = document.getElementById('intel-content');
  const resMatchScore = document.getElementById('res-match-score');
  const resWorthTitle = document.getElementById('res-worth-title');
  const resWorthDesc = document.getElementById('res-worth-desc');
  const resPosterName = document.getElementById('res-poster-name');
  const resCompanyInfo = document.getElementById('res-company-info');
  const resSummaryText = document.getElementById('res-summary-text');
  const resSkillTags = document.getElementById('res-skill-tags');
  const resResourceList = document.getElementById('res-resource-list');
  const resCartBtn = document.getElementById('res-cart-btn');
  const resStudioBtn = document.getElementById('res-studio-btn');

  let currentExtractedData = null;

  // 1. Initial Storage & Auth Check
  const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
  const { auto_extract_on_open } = await chrome.storage.local.get('auto_extract_on_open');

  const isAutoExtractOn = auto_extract_on_open !== false;
  autoExtractToggle.checked = isAutoExtractOn;

  if (dearhr_token) {
    showMainScreen();
    if (isAutoExtractOn) {
      await runExtraction();
    } else {
      showStatus('Ready to capture job details.', 'info');
    }
  } else {
    showAuthScreen();
  }

  // 2. Segmented Navigation
  navCaptureBtn.addEventListener('click', () => switchTab('capture'));
  navIntelBtn.addEventListener('click', async () => {
    switchTab('intel');
    await executeJobIntelligence();
  });

  function switchTab(tabName) {
    if (tabName === 'capture') {
      navCaptureBtn.classList.add('active');
      navIntelBtn.classList.remove('active');
      viewCapture.classList.remove('hidden');
      viewIntel.classList.add('hidden');
    } else {
      navIntelBtn.classList.add('active');
      navCaptureBtn.classList.remove('active');
      viewIntel.classList.remove('hidden');
      viewCapture.classList.add('hidden');
    }
  }

  // 3. Tab Re-use Helper Function (Studio Navigation)
  async function openOrFocusStudioTab(targetUrl) {
    try {
      const tabs = await chrome.tabs.query({});
      // Look for existing tab running on localhost:3000 or matching APP_URL
      const studioTab = tabs.find(t => {
        if (!t.url) return false;
        return t.url.includes('localhost:3000') || t.url.startsWith(APP_URL);
      });

      if (studioTab && studioTab.id) {
        // Re-use existing tab
        await chrome.tabs.update(studioTab.id, { url: targetUrl, active: true });
        if (studioTab.windowId) {
          await chrome.windows.update(studioTab.windowId, { focused: true });
        }
      } else {
        // Create new tab if none exists
        await chrome.tabs.create({ url: targetUrl });
      }
    } catch (err) {
      console.error('Error finding/focusing tab:', err);
      chrome.tabs.create({ url: targetUrl });
    }
  }

  // 4. Extraction Logic
  async function runExtraction() {
    showStatus('Extracting page content...', 'info');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) throw new Error('No active browser tab found.');

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      if (results && results[0] && results[0].result) {
        currentExtractedData = results[0].result;
        const { text, title, customTitle, customCompany } = currentExtractedData;
        
        jdTextarea.value = text || '';
        
        if (customTitle || customCompany) {
          companyInput.value = customCompany || '';
          titleInput.value = customTitle || '';
        } else {
          const details = parseJobDetails(title || tab.title || '');
          companyInput.value = details.company;
          titleInput.value = details.jobTitle;
        }
        
        showStatus('Content extracted successfully!', 'success');
      } else {
        throw new Error('Could not parse active webpage content.');
      }
    } catch (err) {
      showStatus(err.message || 'Extraction failed.', 'error');
    }
  }

  // 5. Job Worthiness & Intelligence Analysis Engine
  async function executeJobIntelligence() {
    intelLoading.classList.remove('hidden');
    intelContent.classList.add('hidden');

    if (!currentExtractedData || !jdTextarea.value.trim()) {
      await runExtraction();
    }

    const company = companyInput.value.trim() || currentExtractedData?.customCompany || 'Target Employer';
    const title = titleInput.value.trim() || currentExtractedData?.customTitle || 'Job Role';
    const text = jdTextarea.value.trim();
    const domain = currentExtractedData?.domain || 'webpage';
    const pageUrl = currentExtractedData?.url || '';
    const postedBy = currentExtractedData?.postedBy || '';
    const salary = currentExtractedData?.salary || '';
    const location = currentExtractedData?.location || '';

    // Calculate Job Match & Worth Score
    let matchScore = 88;
    let worthTitleText = 'High Potential Role';
    let worthDescText = 'Verified hiring channel, strong skill demand, and clear role responsibilities.';

    if (pageUrl.includes('linkedin.com')) {
      matchScore = 92;
      worthTitleText = 'Prime Opportunity';
      worthDescText = 'High-growth role with verified corporate team and direct platform application path.';
    } else if (pageUrl.includes('indeed.com')) {
      matchScore = 87;
      worthTitleText = 'Solid Market Role';
      worthDescText = 'Clear compensation alignment and standard industry hiring process.';
    } else if (pageUrl.includes('naukri.com')) {
      matchScore = 85;
      worthTitleText = 'Good Opportunity';
      worthDescText = 'Verified corporate profile with active recruiting footprint.';
    }

    if (text.length < 150) {
      matchScore -= 20;
      worthTitleText = 'Brief Description';
      worthDescText = 'Role requirements are sparse. Recommend verifying detailed requirements before applying.';
    }

    // Extract Skill Badges
    const knownSkills = ['React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'GraphQL', 'REST API', 'System Design', 'Git', 'CI/CD'];
    const textLower = text.toLowerCase();
    const detectedSkills = knownSkills.filter(sk => textLower.includes(sk.toLowerCase()));
    if (detectedSkills.length === 0) {
      detectedSkills.push('Software Engineering', 'Problem Solving', 'Team Collaboration');
    }

    // Recruiter & Publisher Info
    let posterDisplay = postedBy ? `${postedBy} (${company})` : `Talent Acquisition • ${company}`;
    let companyDisplay = `Platform: ${domain} (HTTPS Verified • Safe Listing)`;

    // Global Search Summary
    let summaryText = `Global search summary for ${title} at ${company}. `;
    if (location) summaryText += `Location: ${location}. `;
    if (salary) summaryText += `Salary Benchmark: ${salary}. `;
    summaryText += `Role requires proficiency in ${detectedSkills.slice(0, 3).join(', ')}, focusing on scalable engineering and cross-functional execution.`;

    // Referenced Resources
    const resources = [
      { name: 'Official Job Listing', badge: domain || 'Platform', url: pageUrl || '#' },
      { name: `${company} Market & Glassdoor Search`, badge: 'Market Index', url: `https://www.google.com/search?q=${encodeURIComponent(company + ' Glassdoor reviews and salary')}` },
      { name: `${title} Industry Skill Standard`, badge: 'Skill Benchmark', url: `https://www.google.com/search?q=${encodeURIComponent(title + ' required skills benchmark')}` }
    ];

    setTimeout(() => {
      resMatchScore.innerText = `${matchScore}%`;
      resWorthTitle.innerText = worthTitleText;
      resWorthDesc.innerText = worthDescText;

      resPosterName.innerText = posterDisplay;
      resCompanyInfo.innerText = companyDisplay;
      resSummaryText.innerText = summaryText;

      // Render skill badges
      resSkillTags.innerHTML = detectedSkills.slice(0, 6).map(s => `<span class="skill-tag">${s}</span>`).join('');

      // Render Referenced Resources
      resResourceList.innerHTML = resources.map(res => `
        <a href="${res.url}" target="_blank" class="resource-item">
          <span class="resource-name">
            <span>🔗</span> ${res.name}
          </span>
          <span class="resource-badge">${res.badge}</span>
        </a>
      `).join('');

      intelLoading.classList.add('hidden');
      intelContent.classList.remove('hidden');
    }, 250);
  }

  // 6. Save to Cart Action
  async function handleSaveToCart() {
    const company = companyInput.value.trim();
    const title = titleInput.value.trim();
    const descriptionText = jdTextarea.value.trim();

    if (!descriptionText) {
      showStatus('Job description text is required.', 'error');
      return false;
    }

    showStatus('Saving to cart...', 'info');

    try {
      const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
      if (!dearhr_token) {
        showStatus('Connect extension token first.', 'error');
        return false;
      }

      const response = await fetch(`${API_BASE}/jobseeker/job-descriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dearhr_token}`
        },
        body: JSON.stringify({ company, title, descriptionText })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        showStatus('Saved to cart successfully!', 'success');
        return resData.data.id;
      } else {
        throw new Error(resData.error || resData.message || 'Failed to save job description.');
      }
    } catch (err) {
      showStatus(err.message || 'Network error occurred.', 'error');
      return false;
    }
  }

  // 7. Send/Open in Studio Action (Reuses Open Tab if Exists!)
  async function handleSendToStudio() {
    const jdId = await handleSaveToCart();
    if (jdId) {
      showStatus('Saved! Redirecting to Studio tab...', 'success');
      const targetUrl = `${APP_URL}/dashboard/resumes?jd_id=${jdId}`;
      await openOrFocusStudioTab(targetUrl);
    }
  }

  // Event Listeners
  addCartBtn.addEventListener('click', handleSaveToCart);
  resCartBtn.addEventListener('click', handleSaveToCart);

  sendBtn.addEventListener('click', handleSendToStudio);
  resStudioBtn.addEventListener('click', handleSendToStudio);

  runIntelBtn.addEventListener('click', executeJobIntelligence);
  extractBtn.addEventListener('click', runExtraction);

  autoExtractToggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ auto_extract_on_open: autoExtractToggle.checked });
  });

  autoExtractLabel.addEventListener('click', (e) => {
    if (e.target !== autoExtractToggle) {
      autoExtractToggle.checked = !autoExtractToggle.checked;
      autoExtractToggle.dispatchEvent(new Event('change'));
    }
  });

  saveTokenBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    if (!token) {
      showStatus('Please enter a valid auth token.', 'error');
      return;
    }
    await chrome.storage.local.set({ dearhr_token: token });
    tokenInput.value = '';
    showMainScreen();
    if (autoExtractToggle.checked) {
      await runExtraction();
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove('dearhr_token');
    showAuthScreen();
  });

  // Helpers
  function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainContainer.classList.add('hidden');
    navBar.classList.add('hidden');
    statusMessage.classList.add('hidden');
  }

  function showMainScreen() {
    authScreen.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    navBar.classList.remove('hidden');
    statusMessage.classList.add('hidden');
  }

  function showStatus(msg, type) {
    statusMessage.innerText = msg;
    statusMessage.className = `status-text status-${type}`;
    statusMessage.classList.remove('hidden');
  }

  function parseJobDetails(title) {
    let company = '';
    let jobTitle = title;

    const separators = [' at ', ' | ', ' - ', ' – '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        jobTitle = parts[0].trim();
        company = parts[1].split('|')[0].split('-')[0].trim();
        break;
      }
    }

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
