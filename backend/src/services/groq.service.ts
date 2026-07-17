import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const normalizeScores = (scores: any) => {
  if (!scores || typeof scores !== 'object') return {};
  const normalized: any = {};
  for (const [key, val] of Object.entries(scores)) {
    if (typeof val === 'number') {
      normalized[key] = val <= 10 ? Math.round(val * 10) : val;
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
};

export const aggregateSalaryBenchmarks = async (
  title: string,
  location: string,
  experienceRequired: string,
  offeredSalaryStr?: string
) => {
  const currentYear = 2026;
  const targetOfferContext = offeredSalaryStr 
    ? `An offer is currently on the table for this role: "${offeredSalaryStr}". Calculate the exact matching currency baseline percentile and market range orientation mapping.` 
    : `No specific offer structure provided yet. Provide general benchmark parameters.`;

  const prompt = `You are a principal total compensation analyst and human resources economics engine operating in the current year context: ${currentYear}.
Analyze the target parameters to calculate highly accurate local market salary statistics.

Target Market Context:
- Role Title: ${title}
- Target Hub/Location: ${location}
- Experience Bracket: ${experienceRequired}
${targetOfferContext}

Rules for Data Calculations:
1. Cross-reference localized base-pay indexes for structural metrics. If the explicit currency context cannot be explicitly inferred from the inputs (like USD, INR, etc.), default metrics to local standard market baselines matching the geo-economic landscape.
2. Formulate realistic Minimum, Median, and Maximum data boundaries based on operational tier ranges.
3. Determine if the compensation falls into "Below Market", "Market Rate", or "Above Market".
4. Provide actionable insights regarding negotiating parameters for this specific market configuration.

Return ONLY valid JSON string mapped to this structural interface:
{
  "currency": "USD" or "INR" etc,
  "metrics": {
    "minimum": 0,
    "median": 0,
    "maximum": 0
  },
  "marketRating": "Below Market" | "Market Rate" | "Above Market",
  "percentileIndicator": 0,
  "analysisNotes": "A structured market explanation detailing localized structural pay variables.",
  "negotiationTips": [
    "Tip 1 regarding experience framing",
    "Tip 2 regarding allowances or benefits matching location variables"
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: 'You are a precise data analysis engine that returns strict structured JSON schemas without markdown formatting text blocks.' 
      },
      { role: 'user', content: prompt }
    ],
    model: MODEL,
    temperature: 0.1, // Keep variance low for consistent data ranges
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const generateFreshCV = async (
  profile: any,
  customPrompt?: string,
  jobDescription?: string,
) => {
  const styleInstructions = customPrompt
    ? `\nStyle/Goal Instructions from user: "${customPrompt}"\n`
    : '';
  const jdSection = jobDescription
    ? `\nOptimize for this Job Description:\n"""\n${jobDescription}\n"""\n`
    : '';

  const prompt = `You are an expert resume writer for software engineers and IT professionals.
Analyze the user's profile data and optimize it into an exceptionally polished, ATS-friendly resume layout.

${styleInstructions}${jdSection}

User Profile Data:
- Full Name: ${profile.fullName}
- Email: ${profile.email}
- Phone: ${profile.phone}
- Location: ${profile.location}
- Links: LinkedIn: ${profile.linkedin}, GitHub: ${profile.github}, Portfolio: ${profile.portfolio}
- Professional Summary/Bio: ${profile.bio}
- Core Skills: ${JSON.stringify(profile.skills)}
- Work Experience: ${JSON.stringify(profile.experience)}
- Key Projects: ${JSON.stringify(profile.projects)}
- Education History: ${JSON.stringify(profile.education)}
- Certifications: ${JSON.stringify(profile.certifications)}
- Languages: ${JSON.stringify(profile.languages)}
- Achievements: ${JSON.stringify(profile.achievements)}

Return ONLY valid JSON with this exact schema structure:
{
  "resumeData": {
    "fullName": "",
    "contact": { "email": "", "phone": "", "location": "", "links": [""] },
    "summary": "A highly tailored, professional summary leveraging strong action verbs.",
    "skills": [""],
    "experience": [
      { "company": "", "role": "", "location": "", "duration": "", "bullets": [""] }
    ],
    "projects": [
      { "name": "", "description": "", "technologies": [""] }
    ],
    "education": [
      { "institution": "", "degree": "", "field": "", "location": "", "duration": "", "details": "" }
    ],
    "certifications": [""],
    "languages": [""],
    "achievements": [""]
  },
  "scores": { "ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0 },
  "atsBreakdown": { "contactInfo":0,"summary":0,"skills":0,"experience":0,"education":0,"formatting":0 },
  "strengths": [""],
  "improvements": {},
  "missingSections": [""],
  "keywordGaps": [""],
  "brutalRoast": ""
}

Rules:
- All score values: integers 0-100.
- brutalRoast: A savage, hilarious, sarcastic tech recruiter roast of this generated resume. Make it funny and brutal. Must be in markdown/plain text format.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};
export const optimizeForJD = async (htmlContent: string, jobDescription: string) => {
  const prompt = `You are an expert ATS optimization assistant.
Analyze the following resume HTML and the target job description. Optimize the resume to match the job description.
Tailor the professional summary, highlight relevant skills, and optimize the accomplishment bullet points to showcase experiences aligning with the job requirements.
Keep the overall layout, styling, and design tags intact, modifying only the copy/text inside elements to align with the JD.

Ensure the returned output is a valid JSON object matching the schema below.

JSON Schema:
{
  "htmlContent": "optimized HTML string here",
  "scores": {
    "ats": 85,
    "formatting": 80,
    "keywords": 85,
    "grammar": 90,
    "readability": 85,
    "impact": 80
  },
  "notes": "Brief explanation of changes made to optimize the resume",
  "keywordsInserted": ["keyword1", "keyword2"]
}

Resume HTML:
"""
${htmlContent}
"""

Job Description:
"""
${jobDescription}
"""`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const suggestKeywords = async (htmlContent: string) => {
  const prompt = `Analyze this resume and return ATS keyword suggestions.
Return ONLY valid JSON.

Resume HTML:
"""
${htmlContent}
"""

{
  "missingKeywords": ["keyword1"],
  "suggestedBySection": {
    "skills": ["keyword"],
    "experience": ["keyword"],
    "summary": ["keyword"]
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const convertToHTML = async (parsedData: any) => {
  const prompt = `Convert this structured resume data into a clean, professional HTML resume.
The layout should closely match the user's original CV style.
Return ONLY valid JSON — no markdown.

Parsed Data:
${JSON.stringify(parsedData, null, 2)}

Same HTML rules: inline styles only, no wrapper tags, Georgia/serif font.
Name as <h1>, section headings as <h2> with border-bottom dividers.
Return: { "htmlContent": "<html>" }`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  return result.htmlContent ?? '';
};

export const generateJobDescription = async (
  roughDescription: string,
  title?: string,
  department?: string,
  locationType?: string,
  experienceRequired?: string,
  skills?: string[],
  salaryRange?: string
) => {
  const skillsList = skills && skills.length > 0 ? skills.join(', ') : 'Not specified';
  const currentYear = 2026;
  
  const prompt = `You are an expert technical recruiter and senior copywriter handling roles for the current year context: ${currentYear}. 
Optimize and expand this rough job description into a highly engaging, professional markdown job posting.

Target Job Context:
- Job Title: ${title || 'Software Engineer'}
- Department: ${department || 'Engineering'}
- Location Model: ${locationType || 'Remote'}
- Experience Needed: ${experienceRequired || 'Not explicit'}
- Target Skills: ${skillsList}
- Comp Range: ${salaryRange || 'Competitive'}

Rough Notes/Description Input: 
"""
${roughDescription}
"""

Create a comprehensive job description with exactly these sections structured in Markdown:
1. **Role Overview** - Compelling 2-3 sentence summary relevant to the role demands of ${currentYear}.
2. **Key Responsibilities** - 5-7 specific, action-oriented bullet points
3. **Required Qualifications** - Must-have skills and experience levels matching the parameters
4. **Preferred Qualifications** - Nice-to-have specialized skills
5. **What We Offer** - Benefits and perks (synthesized nicely, especially handling the structural setup: ${locationType})

Guidelines:
- Use strong action verbs (lead, architect, drive, implement, etc.)
- Quantify context where possible (team collaboration scale, target outputs)
- Make it highly ATS-friendly using the listed tech stack and skills
- Keep tone professional but forward-looking
- Output ONLY the formatted job description markdown block without text wrappers or meta comments`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2000,
  });

  return completion.choices[0]?.message?.content || roughDescription;
};

export const rankCandidates = async (
  jobDescription: string,
  requiredSkills: any,           // Json field from JobPosting (array stored as Prisma Json)
  candidates: Array<{
    applicationId: string;
    candidateName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
    resumeContent: any;
  }>,
  topN: number,
  customPrompt?: string,          // ─── ADDED: ACCEPT THE CUSTOM USER PROMPT ───
) => {
  const skillsList = Array.isArray(requiredSkills)
    ? requiredSkills.join(', ')
    : JSON.stringify(requiredSkills);

  // Format custom constraints block if user entered custom filtering requirements
  const userConstraintsBlock = customPrompt && customPrompt.trim()
    ? `\nCRITICAL USER FILTERING CONSTRAINTS:\n"""\n${customPrompt.trim()}\n"""\nYou MUST heavily weigh and prioritize candidates based on the custom instruction above.\n`
    : '';

  const prompt = `You are a senior technical recruiter and talent acquisition specialist.
Evaluate the following job applicants against the job description and rank them.

Job Description:
"""
${jobDescription}
"""

Required Skills: ${skillsList}
${userConstraintsBlock}
Applicants (${candidates.length} total):
${JSON.stringify(candidates, null, 2)}

Instructions:
- Rank ALL ${candidates.length} candidates by fit for this role
- Return the TOP ${topN} candidates only in the "rankings" array
- Score each candidate 0-100 based on skill match, experience relevance, and overall fit ${customPrompt ? 'as well as the provided custom filtering constraints' : ''}
- Be specific — reference actual skills, companies, and projects from their profiles

Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview of the applicant pool quality",
  "rankings": [
    {
      "rank": 1,
      "applicationId": "<exact applicationId from input>",
      "score": 92,
      "matchReason": "Concise explanation of why this candidate is a strong fit",
      "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
      "gaps": ["missing skill or experience 1", "missing skill 2"],
      "recommendation": "Strongly recommend" | "Recommend" | "Consider" | "Do not recommend"
    }
  ]
}

Rules:
- applicationId must match EXACTLY from the input — do not alter it
- rank starts from 1 (best) to ${topN}
- strengths: 2-4 specific points referencing their actual profile
- gaps: honest assessment of what they lack for this role (empty array if none)
- recommendation must be one of the four exact strings above`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{"rankings":[],"summary":""}');
};

export const rankCandidatesAgainstQuery = async (
  queryDescription: string,
  requiredSkills: string[],
  candidates: Array<{
    id: string;
    fullName: string;
    skills: string[];
    experience: any[];
    education: any[];
    projects: any[];
    certifications: string[];
    atsScore: number | null;
  }>,
  topN: number,
) => {
  const skillsStr = requiredSkills.join(', ');
  const prompt = `You are a technical recruiter. Rank the following candidates for the role described below.

Role Description:
"""
${queryDescription}
"""

Required Skills: ${skillsStr}

Candidates:
${JSON.stringify(candidates, null, 2)}

Return ONLY valid JSON:
{
  "summary": "brief overview of the candidate pool",
  "rankings": [
    {
      "rank": 1,
      "candidateId": "exact id from input",
      "score": 92,
      "matchReason": "why this candidate fits",
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1"],
      "recommendation": "Strongly recommend"
    }
  ]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{"rankings":[],"summary":""}');
};

export const generateOfferLetterTemplate = async (
  templateName: string,
  description?: string,
  companyName?: string
) => {
  const descriptionSection = description
    ? `\nAdditional Context/Requirements:\n${description}\n`
    : '';

  const companySection = companyName
    ? `Company Name: ${companyName}\n`
    : '';

  const prompt = `You are an expert legal document writer and HR professional specializing in employment offer letters.

Generate a professional, legally sound offer letter template based on the following:

Template Name: ${templateName}
${companySection}${descriptionSection}

Requirements:
- Create a complete, formal offer letter template
- Use placeholder variables in {{variableName}} format for dynamic content
- Include these REQUIRED placeholders:
  * {{candidateName}} - Recipient's full name
  * {{position}} - Job title
  * {{department}} - Department name
  * {{salary}} - Annual salary with currency
  * {{startDate}} - Employment start date
  * {{location}} - Work location
  * {{companyName}} - Company name
  * {{date}} - Letter date

- Structure:
  1. Professional greeting
  2. Congratulatory opening paragraph
  3. Position details (title, department, reporting structure)
  4. Compensation and benefits overview
  5. Employment terms (full-time/contract, probation period if applicable)
  6. Start date and location
  7. Next steps (acceptance deadline, required documents)
  8. Closing statement with excitement
  9. Professional sign-off

- Tone: Professional, warm, welcoming
- Length: 300-500 words
- Legal considerations: Include standard employment-at-will statement (if applicable)
- Make it ATS-friendly and easy to read

Return ONLY valid JSON:
{
  "content": {
    "greeting": "Dear {{candidateName}},",
    "opening": "We are delighted to...",
    "positionDetails": "You will be joining us as...",
    "compensation": "Your annual salary will be...",
    "benefits": "In addition to your salary...",
    "terms": "This is a {{employmentType}} position...",
    "startDetails": "Your anticipated start date is...",
    "nextSteps": "To accept this offer...",
    "closing": "We are excited to welcome you...",
    "signOff": "Sincerely,"
  },
  "requiredPlaceholders": ["{{candidateName}}", "{{position}}", ...],
  "optionalPlaceholders": ["{{benefits}}", "{{probationPeriod}}", ...],
  "previewText": "Full assembled letter preview with sample values",
  "legalNotes": "Brief notes on customization or legal review needs",
  "industryBestPractices": ["tip1", "tip2", "tip3"]
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const scoreResumeContent = async (htmlContent: string) => {
  const prompt = `You are an expert ATS engine. Analyze this resume HTML content and return a comprehensive score breakdown.
No job description provided — score based purely on content quality, completeness, and ATS best practices.

Resume HTML:
"""
${htmlContent}
"""

Return ONLY valid JSON:
{
  "scores": {
    "ats": 0,
    "formatting": 0,
    "keywords": 0,
    "grammar": 0,
    "readability": 0,
    "impact": 0
  },
  "atsBreakdown": {
    "contactInfo": 0,
    "summary": 0,
    "skills": 0,
    "experience": 0,
    "education": 0,
    "formatting": 0
  },
  "strengths": [""],
  "improvements": {},
  "missingSections": [""],
  "keywordGaps": [""]
}

Rules: all scores integers 0-100. Be accurate and strict.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.1,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};

export const generateInlineSuggestions = async (htmlContent: string) => {
  const prompt = `You are a senior resume coach. Analyze this resume HTML and return specific inline improvement suggestions for individual sections.
Each suggestion should target a specific piece of text that can be improved.

Resume HTML:
"""
${htmlContent}
"""

Return ONLY valid JSON:
{
  "suggestions": [
    {
      "id": "unique_id_1",
      "section": "experience | skills | summary | education | projects",
      "type": "strengthen | quantify | keyword | grammar | impact",
      "originalSnippet": "exact short text from the resume (max 60 chars)",
      "suggestion": "Specific actionable improvement",
      "replacement": "The improved version of just that snippet",
      "priority": "high | medium | low"
    }
  ]
}

Rules:
- Max 8 suggestions
- originalSnippet must be exact text found in the HTML (strip tags)
- Focus on high-impact changes: quantify achievements, add power verbs, fix weak phrasing
- replacement should be a direct drop-in improvement`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0]?.message?.content ?? '{ "suggestions": [] }');
};

export const processTextSelection = async (
  selectedText: string,
  action: 'grammar' | 'rewrite' | 'custom',
  customPrompt?: string,
  context?: string
) => {
  const actionInstructions = {
    grammar: 'Fix all grammar, spelling, and punctuation errors. Keep the same meaning and length.',
    rewrite: 'Rewrite this to be more impactful, professional, and ATS-friendly. Use strong action verbs.',
    custom: `Apply this transformation: "${customPrompt}". Keep it professional and resume-appropriate.`,
  };

  const prompt = `You are an expert resume editor.

Task: ${actionInstructions[action]}

${context ? `Context (surrounding text for tone reference): "${context}"` : ''}

Selected text to improve:
"""
${selectedText}
"""

Return ONLY valid JSON:
{
  "result": "The improved text here",
  "changes": "One sentence explaining what was changed and why"
}

Rules:
- result must be a direct replacement for the selected text
- If the instruction requires structural changes (like adding bullet points or lists), output the appropriate HTML tags (e.g., <ul><li>...</li></ul>).
- Otherwise, preserve any existing HTML tags if present in the input
- Do NOT wrap the improved text in additional quotes inside the JSON string`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content ?? '{}';
    
    // Safely try to parse the output
    return JSON.parse(rawContent);
  } catch (parseError) {
    console.error("Groq JSON parsing or generation failure fallback triggered:", parseError);
    
    // Fail gracefully back to the controller instead of crashing the process
    return {
      result: selectedText, // Return original text so the user doesn't lose data
      changes: "Failed to process text due to a structural formatting issue."
    };
  }
};

export const generateRegionalResumeTemplate = async (
  profile: any,
  country: string,
  style: 'modern' | 'classic' | 'minimal' | 'executive',
  jobDescription?: string
) => {
  const regionalRules: Record<string, string> = {
    germany: `GERMAN RESUME (Lebenslauf) RULES:
- Start with full personal details: Name, Address, Phone, Email, Date of Birth, Nationality, Marital Status, Photo placeholder
- Strict reverse-chronological order
- Include a professional photo section placeholder
- Add "Persönliche Daten" (Personal Data) section first
- Use formal German business structure: Lebenslauf header
- Include hobbies/interests section (Hobbys & Interessen)
- Add language proficiencies with CEFR levels
- Date format: DD.MM.YYYY
- No buzzwords — precise factual statements only
- Signature line at the bottom with city, date, signature placeholder`,
    
    france: `FRENCH RESUME (CV) RULES:
- Include personal info: Name, Address, DOB, Nationality
- Photo is common — include placeholder
- 1-2 pages maximum, very concise
- Include "Compétences" skills section with categorization
- Add "Centres d'intérêt" (Interests) section
- Professional objective/profile at top ("Profil Professionnel")
- Education listed BEFORE experience (French convention)
- Include "Langues" section with proficiency levels`,

    uk: `UK CV RULES:
- NO photo, NO DOB, NO nationality (discrimination laws)
- Start with Personal Statement (3-4 lines professional summary)
- Education after experience for experienced candidates
- Include references section: "References available on request"
- Use British English spelling
- Focus on achievements with UK-relevant metrics
- Include LinkedIn URL
- Keep to 2 pages maximum`,

    usa: `US RESUME RULES:
- NO photo, NO DOB, NO marital status
- Strong summary statement at top
- Achievement-focused bullet points with metrics
- Skills section with technical and soft skills
- ATS-optimized with keywords throughout
- 1 page for <10 years experience, 2 pages for senior
- Include LinkedIn and GitHub if relevant`,

    canada: `CANADIAN RESUME RULES:
- Similar to US but bilingual context if applicable
- Include both English and French proficiency if in Quebec
- CHRP/professional designations prominent
- Canadian English spelling
- Include work authorization if relevant
- References: "Available upon request"`,

    australia: `AUSTRALIAN RESUME RULES:
- Called "Resume" not CV
- Include Australian phone format
- Add Australian work rights/visa status if applicable
- Casual yet professional tone
- Include referees (2-3 with contact details) at the end
- Skills summary prominent
- Australian English spelling`,

    india: `INDIAN RESUME RULES:
- Include complete personal details: DOB, gender, marital status, nationality
- Career Objective at the top
- Academic achievements and CGPA scores important
- Include hobbies and extracurricular activities
- List all certifications and online courses
- Include languages known
- Technical skills very prominently featured
- Project descriptions are critical`,

    japan: `JAPANESE RESUME (履歴書 Rirekisho) RULES:
- Strict formal format
- Include photo (professional headshot)
- Personal seal (印鑑) reference
- Education and career in chronological order (not reverse)
- Include special skills, certificates, desired conditions
- Formal humble language tone
- Include commute time to office if relevant
- Handwritten feel — precise and systematic`,
  };

  const countryKey = country.toLowerCase().replace(/\s+/g, '');
  const rules = regionalRules[countryKey] || `RESUME RULES FOR ${country.toUpperCase()}: Follow professional standards for ${country}. Use local date formats, conventions, and language style appropriate for the ${country} job market.`;

  const styleGuide = {
    modern: 'Clean sans-serif typography, accent colors (#2563EB blue), icon-style section dividers, skill tags/pills, two-column layout for header',
    classic: 'Traditional serif typography, black and white, formal structure, Times New Roman feel, clean horizontal rules',
    minimal: 'Maximally clean, lots of whitespace, subtle gray dividers, understated elegance, single accent line only',
    executive: 'Premium feel, dark navy accent (#1e3a5f), gold highlights (#b8960c), sophisticated serif headings, gravitas and authority',
  };

  const prompt = `You are a world-class resume designer and career coach specializing in international resumes.

Create a COMPLETE, PROFESSIONAL resume for this profile following the EXACT regional and style specifications.

REGIONAL REQUIREMENTS:
${rules}

STYLE: ${styleGuide[style]}

PROFILE DATA:
- Full Name: ${profile.fullName}
- Email: ${profile.email}
- Phone: ${profile.phone}  
- Location: ${profile.location}
- Links: LinkedIn: ${profile.linkedin}, GitHub: ${profile.github}, Portfolio: ${profile.portfolio}
- Summary/Bio: ${profile.bio}
- Skills: ${JSON.stringify(profile.skills)}
- Experience: ${JSON.stringify(profile.experience)}
- Projects: ${JSON.stringify(profile.projects)}
- Education: ${JSON.stringify(profile.education)}
- Certifications: ${JSON.stringify(profile.certifications)}
- Languages: ${JSON.stringify(profile.languages)}
- Achievements: ${JSON.stringify(profile.achievements)}

${jobDescription ? `Target Job Description:\n"""\n${jobDescription}\n"""` : ''}

Generate a COMPLETE HTML resume with:
1. ALL inline styles (no external CSS)
2. Proper regional structure and conventions
3. ${style} visual design with the specified color palette
4. Every section properly formatted for ${country} standards
5. Professional typography using system fonts matching the style

Return ONLY valid JSON:
{
  "htmlContent": "<complete self-contained HTML with all inline styles>",
  "templateName": "Descriptive template name",
  "sections": ["list", "of", "sections", "included"],
  "culturalNotes": "Brief note on regional conventions applied",
  "scores": { "ats": 0, "formatting": 0, "keywords": 0, "grammar": 0, "readability": 0, "impact": 0 }
}

Rules:
- All score values: integers 0-100.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.3,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });
  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }
  return result;
};

export const analyzeResume = async (rawText: string, jobDescription?: string) => {
  const jdSection = jobDescription
    ? `\nTarget Job Description:\n"""\n${jobDescription}\n"""\n`
    : '';

  const prompt = `You are an ATS resume parser. Return ONLY valid JSON. No markdown.
${jdSection}
Resume:
"""
${rawText}
"""

JSON schema:
{
  "parsedData": {
    "name":"","email":"","phone":"","location":"",
    "linkedin":"","github":"","portfolio":"","summary":"",
    "skills":[""],
    "experience":[{"company":"","role":"","location":"","startDate":"","endDate":"","current":false,"description":"","achievements":[""]}],
    "education":[{"institution":"","degree":"","field":"","location":"","startYear":"","endYear":"","cgpa":""}],
    "projects":[{"name":"","description":"","technologies":[""],"githubLink":"","liveLink":""}],
    "certifications":[{"name":"","organization":"","issueDate":"","credentialUrl":""}],
    "languages":[{"language":"","proficiency":""}],
    "achievements":[""]
  },
  "scores":{"ats":0,"formatting":0,"keywords":0,"grammar":0,"readability":0,"impact":0},
  "atsBreakdown":{"contactInfo":0,"summary":0,"skills":0,"experience":0,"education":0,"formatting":0},
  "strengths":[""],
  "improvements":{"summary":"","skills":"","experience":"","education":"","formatting":""},
  "missingSections":[""],
  "keywordGaps":[""],
  "autoCorrectedText":"",
  "jdOptimizationNotes":"",
  "brutalRoast":""
}

Rules:
- All score values: integers 0-100.
- strengths: 3-5 items.
- keywordGaps: missing IT keywords.
- brutalRoast: A savage, hilarious, sarcastic tech recruiter roast pointing out formatting issues, excessive buzzwords, gaps, or lack of quantitative impact on this resume. Make it funny and brutal, using emojis. Must be in markdown/plain text format.
- CRITICAL URL RULE: Every URL field (linkedin, github, portfolio, githubLink, liveLink, credentialUrl) MUST start with https://. Examples: "linkedin.com/in/john" → "https://linkedin.com/in/john", "github.com/user" → "https://github.com/user", "mysite.com" → "https://mysite.com". Never return a URL without https://.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  if (result.scores) {
    result.scores = normalizeScores(result.scores);
  }

  // Hard sanitizer — runs regardless of what AI returns
  const ensureHttps = (url: string): string => {
    if (!url || url.trim() === '') return '';
    const t = url.trim();
    if (t.startsWith('https://') || t.startsWith('http://')) return t;
    return `https://${t}`;
  };

  if (result.parsedData) {
    const p = result.parsedData;
    p.linkedin  = ensureHttps(p.linkedin  || '');
    p.github    = ensureHttps(p.github    || '');
    p.portfolio = ensureHttps(p.portfolio || '');

    if (Array.isArray(p.projects)) {
      p.projects = p.projects.map((proj: any) => ({
        ...proj,
        githubLink: ensureHttps(proj.githubLink || ''),
        liveLink:   ensureHttps(proj.liveLink   || ''),
      }));
    }

    if (Array.isArray(p.certifications)) {
      p.certifications = p.certifications.map((cert: any) => ({
        ...cert,
        credentialUrl: ensureHttps(cert.credentialUrl || ''),
      }));
    }
  }

  return result;
};

export const generateOutreachEmail = async (resumeText: string, jobDescription: string) => {
  const prompt = `You are a career advisor. Write a professional, highly engaging outreach email from a candidate to a recruiter or hiring manager based on the candidate's resume and target job description.
  
  Resume:
  """
  ${resumeText}
  """
  
  Job Description:
  """
  ${jobDescription}
  """
  
  Return ONLY valid JSON with this schema:
  {
    "subject": "Email subject line here",
    "body": "Hi [Hiring Manager Name],\\n\\nI am writing to...\\n\\nBest regards,\\n[Candidate Name]"
  }`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
};

export const generateCoverLetter = async (
  resumeText: string,
  jobDescription: string,
  tone: 'formal' | 'concise',
  company?: string,
  jobTitle?: string
) => {
  const prompt = `You are a professional resume writer. Generate a tailored, high-converting Cover Letter for a candidate applying to a position.

Candidate Resume / Profile Details:
"""
${resumeText}
"""

Target Job Description:
"""
${jobDescription}
"""

Role/Job Title: ${jobTitle || 'N/A'}
Company: ${company || 'N/A'}
Desired Tone: ${tone}

Please generate a professional, polished Cover Letter. Make sure it highlights matching skills, achievements, and experiences of the candidate that align with the job description. Do not use generic placeholders where information is already provided.
Return ONLY valid JSON with this schema:
{
  "subject": "Cover Letter Subject Line",
  "body": "Dear Hiring Team,\\n\\n..."
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: MODEL,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}') as { subject?: string; body: string };
};