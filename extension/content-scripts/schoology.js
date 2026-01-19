// Schoology Content Script
// Extracts essay content from Schoology submission pages
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
      sendResponse({ alive: true, platform: 'schoology' });
    }

    return true;
  });

  // Extract essay content from the current page
  function extractEssayContent() {
    const pageInfo = getPageInfo();

    // Try multiple selectors for different Schoology page types
    let essayText = '';
    let studentName = '';

    // Submission view page
    const submissionContent = document.querySelector('.submission-content, .submitted-content, .assignment-submission-content');
    if (submissionContent) {
      essayText = submissionContent.innerText.trim();
    }

    // Inline text submission
    const inlineText = document.querySelector('.inline-submission, textarea.submission-text, .text-submission');
    if (!essayText && inlineText) {
      essayText = inlineText.value || inlineText.innerText;
    }

    // Google Docs embed or link
    const googleDocFrame = document.querySelector('iframe[src*="docs.google.com"]');
    if (!essayText && googleDocFrame) {
      essayText = '[Google Doc detected - please copy text manually]';
    }

    // Attached file info
    const attachedFiles = document.querySelectorAll('.attachments-file, .attachment-link, .submission-attachment');
    const fileInfo = Array.from(attachedFiles).map(f => f.innerText || f.href).join(', ');

    // Try to get student name
    const studentNameEl = document.querySelector('.submission-student-name, .student-name, .submitter-name, .user-name');
    if (studentNameEl) {
      studentName = studentNameEl.innerText.trim();
    }

    // Fallback: try to get from breadcrumb or header
    if (!studentName) {
      const header = document.querySelector('h1, .page-title, .submission-header');
      if (header) {
        const match = header.innerText.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
        if (match) studentName = match[1];
      }
    }

    // Get assignment info if available
    const assignmentTitle = document.querySelector('.assignment-title, .material-title, h1.page-title');

    return {
      platform: 'schoology',
      essayText: essayText || '',
      studentName: studentName || '',
      assignmentTitle: assignmentTitle?.innerText?.trim() || '',
      attachedFiles: fileInfo,
      url: window.location.href,
      extractedAt: new Date().toISOString()
    };
  }

  // Get basic page information
  function getPageInfo() {
    const isSubmissionPage =
      window.location.href.includes('/submissions') ||
      window.location.href.includes('/assignment') ||
      document.querySelector('.submission-content, .assignment-submission');

    const isGradingPage =
      window.location.href.includes('/grade') ||
      document.querySelector('.grading-area, .grade-submission');

    return {
      platform: 'schoology',
      isSubmissionPage,
      isGradingPage,
      url: window.location.href,
      title: document.title
    };
  }

  // Add visual indicator that extension is active (subtle)
  function addStatusIndicator() {
    // Only on relevant pages
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
    addStatusIndicator();
  }

  // Re-check on navigation (Schoology uses SPA patterns)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(addStatusIndicator, 500);
    }
  }).observe(document.body, { subtree: true, childList: true });

})();
