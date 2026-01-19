// Google Classroom Content Script
// Extracts essay content from Google Classroom submission pages
// No data is stored or transmitted except via the grading API call

(function() {
  'use strict';

  // Track if we've already initialized
  if (window.essayGraderInitialized) return;
  window.essayGraderInitialized = true;

  // Listen for messages from background script or sidebar
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractEssay') {
      const result = extractEssayContent();
      sendResponse(result);
    }

    if (request.action === 'getPageInfo') {
      sendResponse(getPageInfo());
    }

    if (request.action === 'ping') {
      sendResponse({ alive: true, platform: 'classroom' });
    }

    return true;
  });

  // Extract essay content from the current page
  function extractEssayContent() {
    let essayText = '';
    let studentName = '';
    let assignmentTitle = '';

    // Google Classroom uses dynamic class names, so we need multiple strategies

    // Strategy 1: Look for embedded Google Doc viewer
    const docFrame = document.querySelector('iframe[src*="docs.google.com/document"]');
    if (docFrame) {
      essayText = '[Google Doc detected - content requires manual copy]';
    }

    // Strategy 2: Look for text submission content
    // Classroom often shows submissions in a panel or overlay
    const submissionPanels = document.querySelectorAll('[role="dialog"], [role="main"]');
    submissionPanels.forEach(panel => {
      // Look for text content areas
      const textAreas = panel.querySelectorAll('div[contenteditable], textarea, .submission-text');
      textAreas.forEach(ta => {
        const text = ta.value || ta.innerText;
        if (text && text.length > essayText.length) {
          essayText = text.trim();
        }
      });
    });

    // Strategy 3: Look for student name in the grading interface
    // Student names typically appear in headers or student cards
    const possibleNameElements = document.querySelectorAll(
      '[data-student-name], .student-name, [aria-label*="student"], h2, h3'
    );
    possibleNameElements.forEach(el => {
      const text = el.innerText || el.getAttribute('data-student-name') || el.getAttribute('aria-label');
      if (text && /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(text.trim())) {
        studentName = text.trim();
      }
    });

    // Strategy 4: Get assignment title from page header
    const headerElements = document.querySelectorAll('h1, [role="heading"]');
    headerElements.forEach(el => {
      const text = el.innerText?.trim();
      if (text && text.length > 3 && text.length < 200 && !assignmentTitle) {
        assignmentTitle = text;
      }
    });

    // Strategy 5: Look for attached files
    const attachments = [];
    const attachmentLinks = document.querySelectorAll('a[href*="drive.google.com"], a[href*="docs.google.com"]');
    attachmentLinks.forEach(link => {
      attachments.push({
        name: link.innerText || 'Attached file',
        url: link.href
      });
    });

    return {
      platform: 'classroom',
      essayText: essayText || '',
      studentName: studentName || '',
      assignmentTitle: assignmentTitle || document.title.replace(' - Google Classroom', ''),
      attachments: attachments,
      url: window.location.href,
      extractedAt: new Date().toISOString(),
      note: essayText ? null : 'Could not auto-extract text. If the submission is a Google Doc, please copy the text manually.'
    };
  }

  // Get basic page information
  function getPageInfo() {
    const url = window.location.href;

    // Detect page type from URL patterns
    const isSubmissionPage =
      url.includes('/a/') ||  // Assignment page
      url.includes('/sa/') || // Student assignment
      url.includes('/submissions');

    const isGradingPage =
      url.includes('/g/') ||  // Grading interface
      url.includes('/all') ||
      document.querySelector('[aria-label*="grade"], [data-grade]');

    const isClassPage =
      url.includes('/c/') &&
      !isSubmissionPage &&
      !isGradingPage;

    return {
      platform: 'classroom',
      isSubmissionPage,
      isGradingPage,
      isClassPage,
      url: url,
      title: document.title
    };
  }

  // Add visual indicator that extension is active (subtle)
  function addStatusIndicator() {
    const pageInfo = getPageInfo();
    if (!pageInfo.isSubmissionPage && !pageInfo.isGradingPage) return;

    // Check if indicator already exists
    if (document.getElementById('essay-grader-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'essay-grader-indicator';
    indicator.innerHTML = `
      <div class="eg-indicator" title="Writing Assistant Pro - Press Ctrl+Shift+G to grade">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      </div>
    `;
    document.body.appendChild(indicator);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addStatusIndicator);
  } else {
    setTimeout(addStatusIndicator, 1000); // Classroom loads dynamically
  }

  // Re-check on navigation (Classroom is an SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(addStatusIndicator, 1000);
    }
  }).observe(document.body, { subtree: true, childList: true });

})();
