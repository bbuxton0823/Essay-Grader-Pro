// Sidebar Script - Main grading interface
// No data persists after closing - zero footprint

let currentResult = null;
let currentEssayText = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  const studentNameInput = document.getElementById('studentName');
  const gradeLevelSelect = document.getElementById('gradeLevel');
  const essayTextArea = document.getElementById('essayText');
  const extractBtn = document.getElementById('extractBtn');
  const clearBtn = document.getElementById('clearBtn');
  const gradeBtn = document.getElementById('gradeBtn');
  const loadingState = document.getElementById('loadingState');
  const errorMessage = document.getElementById('errorMessage');
  const inputSection = document.getElementById('inputSection');
  const resultsSection = document.getElementById('resultsSection');
  const newGradeBtn = document.getElementById('newGradeBtn');
  const copyGradeBtn = document.getElementById('copyGradeBtn');
  const generatePracticeBtn = document.getElementById('generatePracticeBtn');
  const platformInfo = document.getElementById('platformInfo');

  // Check current tab and update UI
  checkCurrentTab();

  // Extract button - get essay from current page
  extractBtn.addEventListener('click', async () => {
    extractBtn.disabled = true;
    extractBtn.textContent = 'Extracting...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractEssay' });

      if (response) {
        if (response.studentName) {
          studentNameInput.value = response.studentName;
        }
        if (response.essayText) {
          essayTextArea.value = response.essayText;
        } else if (response.note) {
          essayTextArea.placeholder = response.note;
        }

        // Update platform info
        platformInfo.textContent = `Extracted from ${response.platform === 'schoology' ? 'Schoology' : 'Google Classroom'}`;
      }
    } catch (error) {
      showError('Could not extract from page. Make sure you\'re on a submission page.');
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = '📋 Extract from Page';
    }
  });

  // Clear button
  clearBtn.addEventListener('click', () => {
    studentNameInput.value = '';
    essayTextArea.value = '';
    hideError();
  });

  // Grade button
  gradeBtn.addEventListener('click', async () => {
    const essayText = essayTextArea.value.trim();

    if (!essayText) {
      showError('Please enter or extract essay text first.');
      return;
    }

    if (essayText.length < 100) {
      showError('Essay seems too short. Please check the text.');
      return;
    }

    // Show loading
    inputSection.style.display = 'none';
    resultsSection.classList.remove('show');
    loadingState.classList.add('show');
    hideError();

    currentEssayText = essayText;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'gradeEssay',
        data: {
          essayText: essayText,
          studentName: studentNameInput.value.trim() || 'Unknown Student',
          gradeLevel: gradeLevelSelect.value
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      currentResult = response.result;
      displayResults(response.result, studentNameInput.value.trim(), essayText);

    } catch (error) {
      showError(error.message);
      inputSection.style.display = 'block';
    } finally {
      loadingState.classList.remove('show');
    }
  });

  // New grade button
  newGradeBtn.addEventListener('click', () => {
    resultsSection.classList.remove('show');
    inputSection.style.display = 'block';
    currentResult = null;
    currentEssayText = '';
  });

  // Copy grade button
  copyGradeBtn.addEventListener('click', () => {
    if (!currentResult) return;

    const overall = Math.round(
      (currentResult.grammar.score + currentResult.spelling.score + currentResult.originality.score) / 3
    );

    const gradeText = `${overall}`;

    navigator.clipboard.writeText(gradeText).then(() => {
      copyGradeBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyGradeBtn.textContent = '📋 Copy Grade';
      }, 2000);
    });
  });

  // Generate practice button
  generatePracticeBtn.addEventListener('click', async () => {
    if (!currentResult || !currentResult.skillGaps) {
      showError('No skill gaps detected to create practice for.');
      return;
    }

    const practiceStatus = document.getElementById('practiceStatus');
    generatePracticeBtn.disabled = true;
    generatePracticeBtn.textContent = 'Generating...';
    practiceStatus.style.display = 'block';
    practiceStatus.textContent = 'Creating personalized practice worksheet...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generatePractice',
        data: {
          studentName: studentNameInput.value.trim() || 'Student',
          skillGaps: currentResult.skillGaps,
          gradeLevel: currentResult.detectedGradeLevel?.level || gradeLevelSelect.value
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Download the practice worksheet
      downloadPractice(response.html, studentNameInput.value.trim());

      practiceStatus.textContent = '✓ Practice worksheet downloaded!';
      practiceStatus.style.background = '#dcfce7';
      practiceStatus.style.color = '#166534';

    } catch (error) {
      practiceStatus.textContent = '✗ ' + error.message;
      practiceStatus.style.background = '#fee2e2';
      practiceStatus.style.color = '#991b1b';
    } finally {
      generatePracticeBtn.disabled = false;
      generatePracticeBtn.textContent = '📝 Generate Practice';
    }
  });

  // Collapsible sections
  document.querySelectorAll('.collapsible').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('collapsed');
    });
  });

  // Helper functions
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url.includes('schoology.com')) {
        platformInfo.textContent = 'Connected to Schoology';
      } else if (tab.url.includes('classroom.google.com')) {
        platformInfo.textContent = 'Connected to Google Classroom';
      } else {
        platformInfo.textContent = 'Open Schoology or Classroom to extract essays';
      }
    } catch (e) {
      // Ignore errors
    }
  }

  function displayResults(result, studentName, essayText) {
    // Student info
    document.getElementById('resultStudentName').textContent = studentName || 'Student';
    document.getElementById('resultGradeLevel').textContent = result.detectedGradeLevel?.level || 'Unknown';
    document.getElementById('resultEssayType').textContent = result.detectedEssayType || 'Essay';
    document.getElementById('resultWordCount').textContent = `${essayText.split(/\s+/).length} words`;

    // Scores
    setScoreValue('grammarScore', result.grammar.score);
    setScoreValue('spellingScore', result.spelling.score);
    setScoreValue('originalityScore', result.originality.score);

    const overall = Math.round(
      (result.grammar.score + result.spelling.score + result.originality.score) / 3
    );
    setScoreValue('overallScore', overall);

    // AI Detection
    const aiLikelihood = document.getElementById('aiLikelihood');
    aiLikelihood.textContent = result.aiDetection.likelihood;
    aiLikelihood.className = 'ai-badge ' + result.aiDetection.likelihood.toLowerCase();

    const aiRedFlags = document.getElementById('aiRedFlags');
    if (result.aiDetection.redFlags && result.aiDetection.redFlags.length > 0) {
      aiRedFlags.innerHTML = '<strong>Red flags:</strong> ' + result.aiDetection.redFlags.join(', ');
    } else {
      aiRedFlags.innerHTML = 'No significant AI indicators detected.';
    }

    // Skill Gaps
    const prioritySkills = document.getElementById('prioritySkills');
    const skillGapsList = document.getElementById('skillGapsList');

    if (result.skillGaps?.priority && result.skillGaps.priority.length > 0) {
      prioritySkills.innerHTML = `
        <strong style="font-size: 11px; color: #92400e;">PRIORITY FOCUS:</strong>
        <ol style="margin: 4px 0 12px 16px; font-size: 12px;">
          ${result.skillGaps.priority.map(p => `<li>${p}</li>`).join('')}
        </ol>
      `;
    } else {
      prioritySkills.innerHTML = '';
    }

    // Collect all skill gaps
    const allGaps = [];
    ['grammar', 'mechanics', 'organization', 'development', 'vocabulary'].forEach(category => {
      if (result.skillGaps?.[category]) {
        result.skillGaps[category].forEach(gap => {
          allGaps.push(`${gap.skill} (${category})`);
        });
      }
    });

    skillGapsList.innerHTML = allGaps.slice(0, 8).map(g =>
      `<span class="skill-tag">${g}</span>`
    ).join('');

    // Feedback
    document.getElementById('overallFeedback').textContent = result.overallFeedback || '';

    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = (result.strengths || []).map(s =>
      `<li>${s}</li>`
    ).join('') || '<li>No specific strengths identified</li>';

    const improvementsList = document.getElementById('improvementsList');
    improvementsList.innerHTML = (result.improvements || []).map(i =>
      `<li>${i}</li>`
    ).join('') || '<li>No specific improvements identified</li>';

    // Show results
    resultsSection.classList.add('show');
  }

  function setScoreValue(elementId, score) {
    const el = document.getElementById(elementId);
    el.textContent = score;

    el.classList.remove('high', 'medium', 'low');
    if (score >= 80) {
      el.classList.add('high');
    } else if (score >= 60) {
      el.classList.add('medium');
    } else {
      el.classList.add('low');
    }
  }

  function downloadPractice(html, studentName) {
    const safeName = (studentName || 'student').replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const filename = `Practice_${safeName}_${date}.html`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }
});
