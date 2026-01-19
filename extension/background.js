// Background Service Worker - Handles API calls securely
// No data is logged, stored externally, or transmitted except to the AI provider

// Open side panel when extension icon clicked on supported sites
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.includes('schoology.com') || tab.url.includes('classroom.google.com')) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'grade-essay') {
    await chrome.sidePanel.open({ tabId: tab.id });
    // Send message to content script to extract essay
    chrome.tabs.sendMessage(tab.id, { action: 'extractEssay' });
  }
});

// Message handler for content scripts and sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'gradeEssay') {
    gradeEssay(request.data).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (request.action === 'generatePractice') {
    generatePractice(request.data).then(sendResponse);
    return true;
  }

  if (request.action === 'getSettings') {
    chrome.storage.local.get(['apiKey', 'apiProvider', 'preferences'], sendResponse);
    return true;
  }

  if (request.action === 'saveSettings') {
    chrome.storage.local.set(request.data, () => sendResponse({ success: true }));
    return true;
  }
});

// Core grading function - calls AI API
async function gradeEssay(data) {
  const { essayText, studentName, gradeLevel } = data;

  // Get stored settings
  const settings = await chrome.storage.local.get(['apiKey', 'apiProvider', 'preferences']);

  if (!settings.apiKey) {
    return { error: 'API key not configured. Click the extension icon to set up.' };
  }

  const preferences = settings.preferences || getDefaultPreferences();

  const prompt = buildGradingPrompt(essayText, studentName, gradeLevel, preferences);

  try {
    let result;
    if (settings.apiProvider === 'openai') {
      result = await callOpenAI(settings.apiKey, prompt);
    } else {
      result = await callAnthropic(settings.apiKey, prompt);
    }
    return { success: true, result };
  } catch (error) {
    return { error: error.message };
  }
}

// Call Anthropic Claude API
async function callAnthropic(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Could not parse grading response');
}

// Call OpenAI API
async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'API request failed');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Could not parse grading response');
}

// Build the grading prompt
function buildGradingPrompt(essayText, studentName, gradeLevel, preferences) {
  return `You are an expert K-12 writing teacher assessing student essays using i-Ready Reading & Writing Assessment standards.

STUDENT: ${studentName || 'Unknown'}
EXPECTED GRADE LEVEL: ${gradeLevel || 'Auto-detect'}

ESSAY TEXT:
"""
${essayText}
"""

Analyze this essay and provide a comprehensive assessment. Return ONLY valid JSON with this exact structure:

{
  "detectedGradeLevel": {
    "level": "<grade level like '6th Grade'>",
    "confidence": "<high/medium/low>",
    "indicators": ["<specific evidence from essay>"]
  },
  "detectedEssayType": "<narrative/argumentative/expository/descriptive>",
  "grammar": {
    "score": <0-100>,
    "issues": [
      {"error": "<description>", "location": "<quote from essay>", "suggestion": "<fix>", "severity": "<minor/moderate/major>"}
    ]
  },
  "spelling": {
    "score": <0-100>,
    "errors": [
      {"word": "<misspelled>", "correction": "<correct>", "location": "<context>"}
    ]
  },
  "originality": {
    "score": <0-100>,
    "assessment": "<evaluation of voice and creativity>",
    "strengths": ["<specific examples>"],
    "suggestions": ["<how to improve>"]
  },
  "aiDetection": {
    "likelihood": "<Low/Medium/High>",
    "confidence": <0-100>,
    "redFlags": ["<specific concerns>"],
    "humanIndicators": ["<authentic elements>"]
  },
  "skillGaps": {
    "grammar": [{"skill": "<specific skill>", "severity": "<minor/moderate/significant>", "instances": <count>, "examples": ["<from essay>"]}],
    "mechanics": [{"skill": "<punctuation etc>", "severity": "<level>", "instances": <count>}],
    "organization": [{"skill": "<thesis/transitions etc>", "severity": "<level>", "description": "<what's weak>"}],
    "development": [{"skill": "<evidence/elaboration>", "severity": "<level>", "description": "<what's missing>"}],
    "vocabulary": [{"skill": "<word choice etc>", "severity": "<level>", "description": "<what's needed>"}],
    "priority": ["<top 3 skills to work on in order>"]
  },
  "strengths": ["<what student does well>"],
  "improvements": ["<specific areas to improve>"],
  "overallFeedback": "<2-3 sentence summary for student>",
  "teacherNotes": "<private notes for teacher>"
}

GRADING CRITERIA:
- Grammar: sentence structure, subject-verb agreement, tense consistency, fragments, run-ons
- Spelling: accuracy, age-appropriate expectations
- Originality: authentic voice, creative expression, not formulaic or AI-generated
- Organization: clear thesis, logical flow, transitions, paragraph unity
- Development: evidence, elaboration, analysis, examples

Be specific and cite examples from the essay. Scores should reflect grade-level expectations.`;
}

// Generate practice worksheet
async function generatePractice(data) {
  const { studentName, skillGaps, gradeLevel } = data;

  const settings = await chrome.storage.local.get(['apiKey', 'apiProvider']);

  if (!settings.apiKey) {
    return { error: 'API key not configured' };
  }

  const prompt = buildPracticePrompt(studentName, skillGaps, gradeLevel);

  try {
    let result;
    if (settings.apiProvider === 'openai') {
      result = await callOpenAIPractice(settings.apiKey, prompt);
    } else {
      result = await callAnthropicPractice(settings.apiKey, prompt);
    }
    return { success: true, html: result };
  } catch (error) {
    return { error: error.message };
  }
}

async function callAnthropicPractice(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) throw new Error('API request failed');
  const data = await response.json();
  return data.content[0].text;
}

async function callOpenAIPractice(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
  });

  if (!response.ok) throw new Error('API request failed');
  const data = await response.json();
  return data.choices[0].message.content;
}

function buildPracticePrompt(studentName, skillGaps, gradeLevel) {
  return `Create a personalized practice worksheet for ${studentName} (${gradeLevel}).

SKILL GAPS TO ADDRESS:
${JSON.stringify(skillGaps, null, 2)}

Generate a complete, self-contained HTML document that is a printable practice worksheet. Include:

1. Student name and date field at top
2. 3-5 focused exercises targeting the TOP PRIORITY skill gaps
3. Clear instructions for each exercise
4. Mix of:
   - Identification exercises (find the error)
   - Correction exercises (fix the sentence)
   - Application exercises (write your own)
5. Answer key section at the bottom (can be folded under)

Make it visually clean, appropriate for the grade level, and engaging.
Return ONLY the complete HTML document, no markdown.`;
}

function getDefaultPreferences() {
  return {
    grammarWeight: 30,
    spellingWeight: 25,
    originalityWeight: 25,
    organizationWeight: 20,
    minPassingScore: 70,
    strictAIDetection: true
  };
}
