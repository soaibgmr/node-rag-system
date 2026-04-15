const state = {
  accessToken: '',
  refreshToken: '',
  chatbotId: '',
  publicKey: '',
  sourceId: '',
  latestJobId: '',
  conversationId: '',
};

const el = (id) => document.getElementById(id);

function now() {
  return new Date().toISOString();
}

function writeLog(message, level = 'ok') {
  const log = el('log');
  const line = `[${now()}] ${message}`;
  const div = document.createElement('div');
  div.textContent = line;
  if (level === 'err') div.className = 'err';
  if (level === 'warn') div.className = 'warnText';
  if (level === 'ok') div.className = 'ok';
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function renderState() {
  const shallow = {
    accessToken: state.accessToken ? state.accessToken.slice(0, 20) + '...' : '',
    refreshToken: state.refreshToken ? state.refreshToken.slice(0, 20) + '...' : '',
    chatbotId: state.chatbotId,
    publicKey: state.publicKey,
    sourceId: state.sourceId,
    latestJobId: state.latestJobId,
    conversationId: state.conversationId,
  };
  el('state').textContent = JSON.stringify(shallow, null, 2);
}

function getBaseUrl() {
  return el('baseUrl').value.trim().replace(/\/$/, '');
}

async function request(method, path, body, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && state.accessToken) {
    headers.Authorization = `Bearer ${state.accessToken}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_) {
    json = null;
  }

  if (!res.ok) {
    const details = json ? JSON.stringify(json) : res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${details}`);
  }

  return json;
}

async function login() {
  writeLog('Logging in...');
  const username = el('username').value.trim();
  const password = el('password').value;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const resp = await request('POST', '/auth/login', { username, password });
  state.accessToken = resp?.data?.tokens?.accessToken || '';
  state.refreshToken = resp?.data?.tokens?.refreshToken || '';

  if (!state.accessToken) {
    throw new Error('Login succeeded but access token not found in response');
  }

  renderState();
  writeLog('Login successful. Access token captured.');
  return resp;
}

async function createChatbot() {
  writeLog('Creating chatbot...');
  const payload = {
    name: el('chatbotName').value.trim() || 'RAG Test Bot',
    description: 'Created from rag-test.html',
  };
  const resp = await request('POST', '/chatbots', payload, true);
  state.chatbotId = resp?.data?.id || '';
  state.publicKey = resp?.data?.publicKey || '';

  if (!state.chatbotId || !state.publicKey) {
    throw new Error('Chatbot created but chatbotId/publicKey missing');
  }

  renderState();
  writeLog(`Chatbot created. chatbotId=${state.chatbotId}`);
  return resp;
}

async function addSource() {
  writeLog('Adding TEXT source...');
  if (!state.chatbotId) {
    throw new Error('chatbotId is missing. Create chatbot first.');
  }

  const payload = {
    type: 'TEXT',
    title: el('sourceTitle').value.trim() || 'Test Knowledge',
    textBody: el('sourceText').value,
  };

  const resp = await request('POST', `/chatbots/${state.chatbotId}/sources`, payload, true);
  state.sourceId = resp?.data?.id || '';

  if (!state.sourceId) {
    throw new Error('Source created but sourceId missing');
  }

  renderState();
  writeLog(`Source created. sourceId=${state.sourceId}`);
  return resp;
}

async function startIngestion() {
  writeLog('Starting ingestion...');
  if (!state.chatbotId || !state.sourceId) {
    throw new Error('chatbotId/sourceId required.');
  }

  const resp = await request('POST', `/chatbots/${state.chatbotId}/sources/${state.sourceId}/ingest`, null, true);
  state.latestJobId = resp?.data?.id || '';
  renderState();
  writeLog(`Ingestion job queued. jobId=${state.latestJobId || 'unknown'}`);
  return resp;
}

async function checkLatestJob() {
  writeLog('Checking ingestion jobs...');
  if (!state.chatbotId) {
    throw new Error('chatbotId is missing.');
  }

  const resp = await request('GET', `/chatbots/${state.chatbotId}/jobs`, null, true);
  const jobs = resp?.data || [];
  if (!Array.isArray(jobs) || jobs.length === 0) {
    writeLog('No jobs found yet.', 'warn');
    return null;
  }

  const latest = jobs[0];
  state.latestJobId = latest.id || state.latestJobId;
  renderState();
  writeLog(`Latest job status: ${latest.status}`);
  return latest;
}

async function bootstrap() {
  writeLog('Calling public bootstrap...');
  if (!state.publicKey) {
    throw new Error('publicKey is missing.');
  }

  const origin = encodeURIComponent(el('origin').value.trim());
  const resp = await request('GET', `/public/chatbots/${state.publicKey}/bootstrap?origin=${origin}`);
  writeLog('Bootstrap successful. Public chatbot is reachable.');
  return resp;
}

async function chat() {
  writeLog('Sending public chat message...');
  if (!state.publicKey) {
    throw new Error('publicKey is missing.');
  }

  const payload = {
    publicKey: state.publicKey,
    message: el('question').value,
    conversationId: state.conversationId || undefined,
    origin: el('origin').value.trim() || undefined,
    visitorId: el('visitorId').value.trim() || undefined,
  };

  const resp = await request('POST', '/public/chat', payload);
  state.conversationId = resp?.data?.conversationId || state.conversationId;
  renderState();

  const answer = resp?.data?.answer || '(empty answer)';
  writeLog(`Chat answer: ${answer}`);
  return resp;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runFullFlow() {
  writeLog('Running full flow...', 'warn');
  await login();
  await createChatbot();
  await addSource();
  await startIngestion();

  let completed = false;
  for (let i = 0; i < 25; i += 1) {
    const latest = await checkLatestJob();
    if (latest && latest.status === 'COMPLETED') {
      completed = true;
      break;
    }
    if (latest && latest.status === 'FAILED') {
      throw new Error(`Ingestion failed: ${latest.failureReason || 'unknown reason'}`);
    }
    await sleep(2000);
  }

  if (!completed) {
    throw new Error('Ingestion did not complete within timeout window');
  }

  await bootstrap();
  await chat();
  writeLog('Full flow completed successfully.', 'ok');
}

function wireEvents() {
  el('loginBtn').addEventListener('click', async () => {
    try {
      await login();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('createBotBtn').addEventListener('click', async () => {
    try {
      await createChatbot();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('addSourceBtn').addEventListener('click', async () => {
    try {
      await addSource();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('startIngestBtn').addEventListener('click', async () => {
    try {
      await startIngestion();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('checkJobBtn').addEventListener('click', async () => {
    try {
      await checkLatestJob();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('bootstrapBtn').addEventListener('click', async () => {
    try {
      await bootstrap();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('chatBtn').addEventListener('click', async () => {
    try {
      await chat();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('runAllBtn').addEventListener('click', async () => {
    try {
      await runFullFlow();
    } catch (e) {
      writeLog(e.message, 'err');
    }
  });

  el('clearLogBtn').addEventListener('click', () => {
    el('log').textContent = '';
  });
}

wireEvents();
renderState();
writeLog('Ready. Fill credentials and click Run Full Flow.');
