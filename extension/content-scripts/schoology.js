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

  // Detect Google Doc links on the page
  function detectGoogleDocs() {
    // Find all links that point to Google Docs
    const allLinks = document.querySelectorAll('a[href*="docs.google.com/document"]');
    const googleDocLinks = Array.from(allLinks).filter(link =>
      link.href.includes('docs.google.com/document')
    );

    // Also check for iframes with Google Docs
    const googleDocIframes = document.querySelectorAll('iframe[src*="docs.google.com/document"]');

    return {
      links: googleDocLinks,
      iframes: Array.from(googleDocIframes),
      hasGoogleDoc: googleDocLinks.length > 0 || googleDocIframes.length > 0
    };
  }

  // Show Google Doc helper panel
  function showGoogleDocHelper() {
    const pageInfo = getPageInfo();
    if (!pageInfo.isSubmissionPage && !pageInfo.isGradingPage) return;

    // Check if panel already exists
    if (document.getElementById('google-doc-helper')) return;

    const googleDocs = detectGoogleDocs();
    if (!googleDocs.hasGoogleDoc) return;

    // Get the first Google Doc URL
    let docUrl = '';
    if (googleDocs.links.length > 0) {
      docUrl = googleDocs.links[0].href;
    } else if (googleDocs.iframes.length > 0) {
      docUrl = googleDocs.iframes[0].src;
    }

    const panel = document.createElement('div');
    panel.id = 'google-doc-helper';
    panel.innerHTML = `
      <div class="gdoc-helper-panel">
        <div class="gdoc-helper-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>Google Doc Detected</span>
          <button class="gdoc-close-btn" title="Close">&times;</button>
        </div>
        <div class="gdoc-helper-body">
          <p><strong>To grade this essay:</strong></p>
          <ol>
            <li>Click the button below to open the Google Doc</li>
            <li>Select all text (<kbd>Ctrl</kbd>+<kbd>A</kbd> or <kbd>Cmd</kbd>+<kbd>A</kbd>)</li>
            <li>Copy the text (<kbd>Ctrl</kbd>+<kbd>C</kbd> or <kbd>Cmd</kbd>+<kbd>C</kbd>)</li>
            <li>Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>G</kbd> to open the grader</li>
            <li>Paste and grade!</li>
          </ol>
          ${docUrl ? `<a href="${docUrl}" target="_blank" class="gdoc-open-btn">Open Google Doc in New Tab</a>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Add close button functionality
    panel.querySelector('.gdoc-close-btn').addEventListener('click', () => {
      panel.remove();
    });
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
      <div class="eg-indicator" title="Essay Grader Pro - Press Ctrl+Shift+G to grade">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
      </div>
    `;
    document.body.appendChild(indicator);

    // Also check for Google Docs
    showGoogleDocHelper();
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
