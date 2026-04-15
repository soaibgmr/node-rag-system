(function () {
  const params = new URLSearchParams(window.location.search);

  const chatbotIdInput = document.getElementById('chatbotId');
  const apiBaseInput = document.getElementById('apiBase');
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  const loadWidgetBtn = document.getElementById('loadWidgetBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const log = document.getElementById('log');

  function write(message, isError) {
    log.style.color = isError ? '#b91c1c' : '#64748b';
    log.textContent = message;
  }

  chatbotIdInput.value = params.get('chatbotId') || '';
  apiBaseInput.value = params.get('apiBase') || `${window.location.origin}/api`;
  titleInput.value = params.get('title') || 'HealthCare DMS';
  subtitleInput.value = params.get('subtitle') || 'AI Assistant';

  window.addEventListener('error', function (event) {
    write(`Widget runtime error: ${event.message}`, true);
  });

  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
    write(`Widget promise error: ${reason}`, true);
  });

  function appendWidgetScript() {
    const chatbotId = chatbotIdInput.value.trim();
    const apiBase = apiBaseInput.value.trim();
    const title = titleInput.value.trim();
    const subtitle = subtitleInput.value.trim();

    if (!chatbotId) {
      write('Chatbot UUID is required.', true);
      return;
    }

    const existingMount = document.getElementById('ov-chatbot-widget-mount');
    if (existingMount) {
      existingMount.remove();
    }

    const existingScript = document.getElementById('ov-chatbot-script');
    if (existingScript) {
      existingScript.remove();
    }

    delete window.__ovWidgetInitialized;

    const randomId = Date.now();
    const script = document.createElement('script');
    script.id = 'ov-chatbot-script';
    script.src = `${window.location.origin}/chatbot.js?id=${randomId}`;
    script.setAttribute('data-chatbot-id', chatbotId);
    script.setAttribute('data-api-base', apiBase);
    script.setAttribute('data-title', title);
    script.setAttribute('data-subtitle', subtitle);
    script.setAttribute('data-start-open', 'true');
    script.async = true;

    script.onload = function () {
      write('Widget loaded successfully. If it is minimized, use the launcher at bottom-right.', false);
    };

    script.onerror = function () {
      write('Failed to load chatbot.js. Verify public/chatbot.js exists.', true);
    };

    document.head.appendChild(script);
  }

  loadWidgetBtn.addEventListener('click', appendWidgetScript);
  reloadBtn.addEventListener('click', function () {
    window.location.reload();
  });

  if (chatbotIdInput.value.trim()) {
    appendWidgetScript();
  } else {
    write('Enter chatbot UUID and click Load Widget.', false);
  }
})();
