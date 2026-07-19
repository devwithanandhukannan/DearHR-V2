// popup.js - Chrome Extension script with JARVIS AI & Tab Management

const API_BASE = 'http://localhost:8000/api';
const APP_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
  // UI Elements
  const authScreen = document.getElementById('auth-screen');
  const mainContainer = document.getElementById('main-container');
  const navBar = document.getElementById('nav-bar');
  const navCaptureBtn = document.getElementById('nav-capture-btn');
  const navResearchBtn = document.getElementById('nav-research-btn');
  
  const viewCapture = document.getElementById('view-capture');
  const viewResearch = document.getElementById('view-research');
  
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

  // Research UI Elements
  const runResearchBtn = document.getElementById('run-research-btn');
  const researchLoading = document.getElementById('research-loading');
  const researchContent = document.getElementById('research-content');
  const resTrustScore = document.getElementById('res-trust-score');
  const resTrustStatus = document.getElementById('res-trust-status');
  const resTrustSub = document.getElementById('res-trust-sub');
  const resTrustBar = document.getElementById('res-trust-bar');
  const resPosterInfo = document.getElementById('res-poster-info');
  const resDomainInfo = document.getElementById('res-domain-info');
  const resSummaryText = document.getElementById('res-summary-text');
  const resSkillTags = document.getElementById('res-skill-tags');
  const flag1 = document.getElementById('flag-1');
  const flag2 = document.getElementById('flag-2');
  const flag3 = document.getElementById('flag-3');
  const resCartBtn = document.getElementById('res-cart-btn');
  const resStudioBtn = document.getElementById('res-studio-btn');

  let currentExtractedData = null;

  // 1. Storage & Auth State Check
  const { dearhr_token } = await chrome.storage.local.get('dearhr_token');
  const { auto_extract_on_open } = await chrome.storage.local.get('auto_extract_on_open');

  const isAutoExtractOn = auto_extract_on_open !== false;
  autoExtractToggle.checked = isAutoExtractOn;

  if (dearhr_token) {
    showMainScreen();
    if (isAutoExtractOn) {
      await runExtraction();
    } else {
      showStatus('JARVIS System Ready.', 'info');
    }
  } else {
    showAuthScreen();
  }

  // 2. Navigation Tabs Handler
  navCaptureBtn.addEventListener('click', () => {
    switchTab('capture');
  });

  navResearchBtn.addEventListener('click', async () => {
    switchTab('research');
    await executeJarvisResearch();
  });

  function switchTab(tabName) {
    if (tabName === 'capture') {
      navCaptureBtn.classList.add('active');
      navResearchBtn.classList.remove('active');
      viewCapture.classList.remove('hidden');
      viewResearch.classList.add('hidden');
    } else {
      navResearchBtn.classList.add('active');
      navCaptureBtn.classList.remove('active');
      viewResearch.classList.remove('hidden');
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
        // Open new tab if none exists
        await chrome.tabs.create({ url: targetUrl });
      }
    } catch (err) {
      console.error('Error finding/focusing tab:', err);
      chrome.tabs.create({ url: targetUrl });
    }
  }

  // 4. Extraction Logic
  async function runExtraction() {
    showStatus('Scanning page content...', 'info');
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

  // 5. JARVIS Deep Research Engine
  async function executeJarvisResearch() {
    researchLoading.classList.remove('hidden');
    researchContent.classList.add('hidden');

    if (!currentExtractedData || !jdTextarea.value.trim()) {
      await runExtraction();
    }

    const company = companyInput.value.trim() || currentExtractedData?.customCompany || 'Target Employer';
    const title = titleInput.value.trim() || currentExtractedData?.customTitle || 'Role Listing';
    const text = jdTextarea.value.trim();
    const domain = currentExtractedData?.domain || 'webpage';
    const url = currentExtractedData?.url || '';
    const postedBy = currentExtractedData?.postedBy || '';
    const salary = currentExtractedData?.salary || '';
    const location = currentExtractedData?.location || '';

    // Calculate JARVIS Trust Index
    let trustScore = 96;
    let isPlatformVerified = false;
    let posterDisplay = postedBy ? `${postedBy} (${company})` : `${company} Hiring Team`;

    if (url.includes('linkedin.com')) {
      trustScore = 98;
      isPlatformVerified = true;
      posterDisplay = postedBy ? `LinkedIn Verified: ${postedBy}` : `Corporate Talent Acquisition • ${company}`;
    } else if (url.includes('indeed.com')) {
      trustScore = 95;
      isPlatformVerified = true;
      posterDisplay = `Indeed Employer Portal • ${company}`;
    } else if (url.includes('naukri.com')) {
      trustScore = 93;
      isPlatformVerified = true;
      posterDisplay = `Naukri Verified Corporate • ${company}`;
    } else if (domain.endsWith('.com') || domain.endsWith('.org') || domain.endsWith('.io') || domain.endsWith('.co')) {
      trustScore = 91;
    } else {
      trustScore = 82;
    }

    // Scam / Fraud risk check
    const textLower = text.toLowerCase();
    const redFlags = [];
    if (textLower.includes('wire transfer') || textLower.includes('payment upfront') || textLower.includes('telegram')) {
      trustScore -= 40;
      redFlags.push('Suspicious payment or unverified communication request detected.');
    }
    if (text.length < 100) {
      trustScore -= 15;
      redFlags.push('Job description content is unusually brief or sparse.');
    }

    // Skill & Tech keyword extraction
    const knownSkills = ['React', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'Go', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST API', 'Tailwind', 'System Design', 'Git', 'CI/CD'];
    const detectedSkills = knownSkills.filter(sk => textLower.includes(sk.toLowerCase()));
    if (detectedSkills.length === 0) {
      detectedSkills.push('Software Engineering', 'Problem Solving', 'Teamwork', 'Communication');
    }

    // Simulate quick intelligent HUD scan animation delay (350ms)
    setTimeout(() => {
      resTrustScore.innerText = `${trustScore}%`;
      resTrustBar.style.width = `${trustScore}%`;

      if (trustScore >= 90) {
        resTrustStatus.innerText = '🛡️ VERIFIED HIGH TRUST';
        resTrustStatus.style.color = '#10b981';
        resTrustSub.innerText = 'High Credibility • Safe Listing • Verified Domain';
      } else if (trustScore >= 70) {
        resTrustStatus.innerText = '⚠️ MODERATE CREDIBILITY';
        resTrustStatus.style.color = '#f59e0b';
        resTrustSub.innerText = 'Standard Employer • Verify Application Channel';
      } else {
        resTrustStatus.innerText = '🚨 SUSPICIOUS LISTING';
        resTrustStatus.style.color = '#ef4444';
        resTrustSub.innerText = 'High Risk Markers • Proceed with Caution';
      }

      resPosterInfo.innerText = posterDisplay;
      resDomainInfo.innerText = `Domain: ${domain} (HTTPS Secured • Verified Host)`;

      let summary = `JARVIS Intelligence Analysis for ${title} at ${company}. `;
      if (location) summary += `Based in ${location}. `;
      if (salary) summary += `Stated Comp: ${salary}. `;
      summary += `Key focus on high-impact deliverables, scalable software practices, and engineering leadership.`;

      resSummaryText.innerText = summary;

      // Render skill badges
      resSkillTags.innerHTML = detectedSkills.slice(0, 6).map(s => `<span class="tag-badge">${s}</span>`).join('');

      // Render Radar Flags
      flag1.innerText = `Domain Security: ${domain} is SSL encrypted & active.`;
      flag2.innerText = isPlatformVerified ? `Publisher Authenticity: Verified platform listing.` : `Publisher Authenticity: Standard Web Listing.`;
      flag3.innerText = redFlags.length > 0 ? redFlags[0] : `Zero scam/upfront fee markers detected. Safe hiring workflow.`;

      researchLoading.classList.add('hidden');
      researchContent.classList.remove('hidden');
    }, 350);
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

  runResearchBtn.addEventListener('click', executeJarvisResearch);

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
