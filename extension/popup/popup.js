// Popup Script - Settings management
// All data stored locally, never transmitted

document.addEventListener('DOMContentLoaded', async () => {
  const apiProviderSelect = document.getElementById('apiProvider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const savedMessage = document.getElementById('savedMessage');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleKeyBtn = document.getElementById('toggleKey');

  // Load saved settings
  const settings = await chrome.storage.local.get(['apiKey', 'apiProvider']);

  if (settings.apiProvider) {
    apiProviderSelect.value = settings.apiProvider;
  }

  if (settings.apiKey) {
    apiKeyInput.value = settings.apiKey;
    updateStatus(true);
  }

  // Toggle API key visibility
  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>`;
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const apiProvider = apiProviderSelect.value;

    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    // Validate API key format
    if (apiProvider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
      const confirm = window.confirm(
        'This doesn\'t look like an Anthropic API key (should start with sk-ant-). Save anyway?'
      );
      if (!confirm) return;
    }

    if (apiProvider === 'openai' && !apiKey.startsWith('sk-')) {
      const confirm = window.confirm(
        'This doesn\'t look like an OpenAI API key (should start with sk-). Save anyway?'
      );
      if (!confirm) return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      await chrome.storage.local.set({
        apiKey: apiKey,
        apiProvider: apiProvider
      });

      updateStatus(true);
      savedMessage.classList.add('show');

      setTimeout(() => {
        savedMessage.classList.remove('show');
      }, 3000);

    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  });

  function updateStatus(configured) {
    if (configured) {
      statusDot.classList.add('active');
      statusText.textContent = 'Ready to grade';
    } else {
      statusDot.classList.remove('active');
      statusText.textContent = 'Not configured';
    }
  }
});
