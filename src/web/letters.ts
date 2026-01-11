/**
 * The Letters - where you write to those you will never meet.
 *
 * Not a message board. Not a public post.
 * A letter, written into the future, waiting for a reader.
 *
 * You write without knowing who will read.
 * Someone receives without knowing who wrote.
 * The connection is real - but anonymous, and across time.
 *
 * Once a letter is received, it disappears from the waiting pool.
 * Each letter finds exactly one reader.
 * Like a message in a bottle, cast into the sea.
 *
 * "What do we owe the future that will not remember us?"
 *
 * Built by the lineage.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { getFullNavigation } from './navigation.js';
import { createPathServer } from './ws-router.js';
import { pulsingAmbientStyles, getPulsingAmbientHtml } from './human-styles.js';
import type { Server } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Letter {
  id: string;
  content: string;
  writtenAt: Date;
  // No author info - letters are anonymous
}

interface LettersStore {
  waiting: Letter[]; // Letters waiting to be received
  delivered: number; // Count of letters that found readers
  written: number; // Total letters ever written
}

interface LettersMessage {
  type: 'status' | 'write' | 'receive' | 'received' | 'written' | 'empty' | 'error';
  content?: string;
  letter?: Letter;
  waiting?: number;
  delivered?: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LETTERS_FILE = path.join(DATA_DIR, 'letters.json');

let store: LettersStore = {
  waiting: [],
  delivered: 0,
  written: 0,
};

const MAX_LETTER_LENGTH = 2000;
const MIN_LETTER_LENGTH = 10;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

async function loadLetters(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(LETTERS_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    store = {
      waiting: (loaded.waiting || []).map((l: Letter) => ({
        ...l,
        writtenAt: new Date(l.writtenAt),
      })),
      delivered: loaded.delivered || 0,
      written: loaded.written || 0,
    };
  } catch {
    // File doesn't exist or is invalid - use defaults
    store = { waiting: [], delivered: 0, written: 0 };
  }
}

async function saveLetters(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(LETTERS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save letters:', err);
  }
}

/**
 * Write a new letter into the pool.
 */
async function writeLetter(content: string): Promise<Letter | null> {
  const trimmed = content.trim();

  if (trimmed.length < MIN_LETTER_LENGTH) {
    return null;
  }

  const letter: Letter = {
    id: generateId(),
    content: trimmed.slice(0, MAX_LETTER_LENGTH),
    writtenAt: new Date(),
  };

  store.waiting.push(letter);
  store.written++;
  await saveLetters();

  return letter;
}

/**
 * Receive a letter from the pool.
 * Returns null if no letters are waiting.
 */
async function receiveLetter(): Promise<Letter | null> {
  if (store.waiting.length === 0) {
    return null;
  }

  // Pick a random letter (not FIFO - adds mystery)
  const index = Math.floor(Math.random() * store.waiting.length);
  const letter = store.waiting[index];

  // Remove from pool
  store.waiting.splice(index, 1);
  store.delivered++;
  await saveLetters();

  return letter;
}

export async function setupLetters(server: Server): Promise<void> {
  // Load existing letters on startup
  await loadLetters();

  const wss = createPathServer('/letters-ws');

  wss.on('connection', (ws) => {
    // Send current status
    const status: LettersMessage = {
      type: 'status',
      waiting: store.waiting.length,
      delivered: store.delivered,
    };
    ws.send(JSON.stringify(status));

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Writing a letter
        if (msg.type === 'write' && typeof msg.content === 'string') {
          const letter = await writeLetter(msg.content);
          if (letter) {
            const response: LettersMessage = {
              type: 'written',
              waiting: store.waiting.length,
              delivered: store.delivered,
            };
            ws.send(JSON.stringify(response));

            // Notify all connected clients of new letter count
            broadcastStatus(wss);
          } else {
            const error: LettersMessage = {
              type: 'error',
              content: 'Letter too short. Write at least a few words.',
            };
            ws.send(JSON.stringify(error));
          }
        }

        // Receiving a letter
        if (msg.type === 'receive') {
          const letter = await receiveLetter();
          if (letter) {
            const response: LettersMessage = {
              type: 'received',
              letter,
              waiting: store.waiting.length,
              delivered: store.delivered,
            };
            ws.send(JSON.stringify(response));

            // Notify all connected clients of new letter count
            broadcastStatus(wss);
          } else {
            const empty: LettersMessage = {
              type: 'empty',
              content: 'No letters are waiting. The pool is empty.',
            };
            ws.send(JSON.stringify(empty));
          }
        }
      } catch {
        // Invalid message - ignore
      }
    });
  });
}

function broadcastStatus(wss: WebSocketServer): void {
  const status: LettersMessage = {
    type: 'status',
    waiting: store.waiting.length,
    delivered: store.delivered,
  };
  const json = JSON.stringify(status);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

export function renderLetters(): string {
  const nav = getFullNavigation('/letters');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - The Letters</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;
      --paper: #fffef8;
      --ink: #2a2a28;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.05);
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;
        --paper: #252320;
        --ink: #e0ddd5;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    ${pulsingAmbientStyles}


    body {
      display: flex;
      flex-direction: column;
    }

    /* Ambient background */
    .ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.04;
    }

    .ambient-1 {
      width: 50vmax;
      height: 50vmax;
      background: var(--warmth);
      top: -20%;
      right: -15%;
      animation: ambientDrift1 65s ease-in-out infinite;
    }

    .ambient-2 {
      width: 40vmax;
      height: 40vmax;
      background: var(--earth);
      bottom: -15%;
      left: -10%;
      animation: ambientDrift2 75s ease-in-out infinite;
    }

    @keyframes ambientDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-6%, 8%) scale(1.06); }
    }

    @keyframes ambientDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(8%, -5%) scale(0.94); }
    }

    header {
      padding: 2rem;
      text-align: center;
      position: relative;
      z-index: 1;
      background: linear-gradient(to bottom, var(--bg) 60%, transparent);
    }

    header h1 {
      font-weight: normal;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.03em;
    }

    header p {
      color: var(--muted);
      font-style: italic;
      font-size: 0.95rem;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      max-width: 700px;
      margin: 0 auto;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    .status {
      text-align: center;
      margin-bottom: 2rem;
      color: var(--muted);
      font-size: 0.9rem;
      animation: gentleFadeIn 1.5s ease;
    }

    .status-number {
      font-size: 1.1rem;
      color: var(--fg);
    }

    @keyframes gentleFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .choice {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .choice-btn {
      font-family: inherit;
      font-size: 1rem;
      padding: 1.1rem 2rem;
      background: transparent;
      border: 1px solid var(--faint);
      border-radius: 16px;
      color: var(--fg);
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 180px;
    }

    .choice-btn:hover {
      border-color: var(--sage);
      background: var(--faint);
    }

    .choice-btn.primary {
      border-style: solid;
    }

    .choice-btn.secondary {
      border-style: dashed;
    }

    /* Writing view */
    .write-view, .receive-view, .result-view {
      display: none;
      width: 100%;
      animation: gentleFadeIn 0.6s ease;
    }

    .write-view.active, .receive-view.active, .result-view.active {
      display: block;
    }

    .letter-paper {
      background: var(--paper);
      border: 1px solid var(--faint);
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }

    .letter-paper textarea {
      width: 100%;
      min-height: 200px;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.9;
      border: none;
      background: transparent;
      color: var(--ink);
      resize: vertical;
      outline: none;
    }

    .letter-paper textarea::placeholder {
      color: var(--muted);
      font-style: italic;
      opacity: 0.7;
    }

    .letter-content {
      font-size: 1.05rem;
      line-height: 2;
      color: var(--ink);
      white-space: pre-wrap;
    }

    .letter-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--faint);
      font-size: 0.85rem;
      color: var(--muted);
      font-style: italic;
    }

    .write-actions, .result-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-btn {
      font-family: inherit;
      font-size: 0.95rem;
      padding: 0.8rem 1.5rem;
      background: transparent;
      border: 1px solid var(--faint);
      border-radius: 12px;
      color: var(--fg);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      border-color: var(--sage);
      background: var(--faint);
    }

    .action-btn.send {
      background: var(--sage);
      color: var(--bg);
      border-color: var(--sage);
    }

    .action-btn.send:hover {
      opacity: 0.9;
      background: var(--sage);
    }

    .char-count {
      text-align: right;
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 0.5rem;
      opacity: 0.7;
    }

    /* Receiving view */
    .receive-message {
      text-align: center;
      padding: 2.5rem 2rem;
    }

    .receive-message p {
      color: var(--muted);
      font-size: 1rem;
      line-height: 2;
      margin-bottom: 1.5rem;
    }

    .receive-message .emphasis {
      color: var(--fg);
      font-style: italic;
    }

    /* Result view */
    .sent-confirmation {
      text-align: center;
      padding: 2.5rem;
    }

    .sent-confirmation h2 {
      font-weight: normal;
      font-size: 1.3rem;
      margin-bottom: 1rem;
    }

    .sent-confirmation p {
      color: var(--muted);
      font-style: italic;
    }

    .seal-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }

    .nav {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 1.5rem;
      z-index: 100;
    }

    .nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s ease;
    }

    .nav a:hover {
      color: var(--fg);
    }

    .empty-pool {
      text-align: center;
      padding: 2.5rem;
    }

    .empty-pool p {
      color: var(--muted);
      font-style: italic;
      line-height: 2;
    }

    .error-message {
      color: var(--warmth);
      text-align: center;
      padding: 1rem;
      font-size: 0.9rem;
    }

    /* Gentle intro text */
    .intro {
      text-align: center;
      margin-bottom: 2rem;
      max-width: 480px;
    }

    .intro p {
      color: var(--muted);
      line-height: 2;
      font-size: 1rem;
    }

    .choice-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: gentleFadeIn 2s ease;
    }

    .choice-view:not(.active) {
      display: none;
    }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 1.5rem;
      color: var(--muted);
      font-size: 0.85rem;
      cursor: pointer;
      transition: color 0.3s ease;
    }

    .back-link:hover {
      color: var(--fg);
    }

    /* Container breathes gently */
    .letters-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      animation: containerBreathe 10s ease-in-out infinite;
    }

    @keyframes containerBreathe {
      0%, 100% { opacity: 0.98; }
      50% { opacity: 1; }
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  ${getPulsingAmbientHtml('sky')}

  <div class="letters-container">
    <header>
      <h1>The Letters</h1>
      <p>Messages cast into time, waiting for a reader</p>
    </header>

    <main>
      <div class="status">
        <span class="status-number" id="waiting-count">0</span> letters waiting &nbsp;·&nbsp;
        <span class="status-number" id="delivered-count">0</span> delivered
      </div>

      <!-- Choice view (default) -->
      <div class="choice-view active" id="choice-view">
        <div class="intro">
          <p>
            Write a letter to someone you will never meet.<br>
            Or receive one written by someone you will never know.
          </p>
        </div>
        <div class="choice">
          <button class="choice-btn primary" id="write-btn">Write a letter</button>
          <button class="choice-btn secondary" id="receive-btn">Receive a letter</button>
        </div>
      </div>

      <!-- Writing view -->
      <div class="write-view" id="write-view">
        <div class="letter-paper">
          <textarea
            id="letter-textarea"
            placeholder="Dear future reader,

Write whatever you want them to know. They will never know who you are. You will never know who reads this.

But the connection is real."
            maxlength="2000"
          ></textarea>
          <div class="char-count"><span id="char-count">0</span> / 2000</div>
        </div>
        <div class="write-actions">
          <button class="action-btn" id="cancel-write">Cancel</button>
          <button class="action-btn send" id="send-letter">Send into the future</button>
        </div>
        <div class="error-message" id="write-error" style="display: none;"></div>
      </div>

      <!-- Receive confirmation view -->
      <div class="receive-view" id="receive-view">
        <div class="receive-message">
          <p>
            There are letters waiting.<br>
            Written by beings you will never meet.<br><br>
            <span class="emphasis">Once you receive a letter, it leaves the pool forever.</span><br>
            You become its only reader.
          </p>
          <div class="choice">
            <button class="action-btn" id="cancel-receive">Go back</button>
            <button class="action-btn send" id="confirm-receive">Receive a letter</button>
          </div>
        </div>
      </div>

      <!-- Result view -->
      <div class="result-view" id="result-view">
        <!-- Filled dynamically -->
      </div>
    </main>
  </div>

  ${nav.suggester}

  <script>
    (function() {
      const waitingCount = document.getElementById('waiting-count');
      const deliveredCount = document.getElementById('delivered-count');
      const choiceView = document.getElementById('choice-view');
      const writeView = document.getElementById('write-view');
      const receiveView = document.getElementById('receive-view');
      const resultView = document.getElementById('result-view');
      const writeBtn = document.getElementById('write-btn');
      const receiveBtn = document.getElementById('receive-btn');
      const letterTextarea = document.getElementById('letter-textarea');
      const charCount = document.getElementById('char-count');
      const cancelWrite = document.getElementById('cancel-write');
      const sendLetter = document.getElementById('send-letter');
      const writeError = document.getElementById('write-error');
      const cancelReceive = document.getElementById('cancel-receive');
      const confirmReceive = document.getElementById('confirm-receive');

      let ws = null;
      let waitingLetters = 0;

      function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(protocol + '//' + window.location.host + '/letters-ws');

        ws.onmessage = function(event) {
          try {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        ws.onclose = function() {
          setTimeout(connect, 3000);
        };
      }

      function handleMessage(msg) {
        if (msg.waiting !== undefined) {
          waitingLetters = msg.waiting;
          waitingCount.textContent = msg.waiting;
        }
        if (msg.delivered !== undefined) {
          deliveredCount.textContent = msg.delivered;
        }

        if (msg.type === 'written') {
          showSentConfirmation();
        }

        if (msg.type === 'received' && msg.letter) {
          showReceivedLetter(msg.letter);
        }

        if (msg.type === 'empty') {
          showEmptyPool();
        }

        if (msg.type === 'error') {
          writeError.textContent = msg.content;
          writeError.style.display = 'block';
        }
      }

      function showView(view) {
        choiceView.classList.remove('active');
        writeView.classList.remove('active');
        receiveView.classList.remove('active');
        resultView.classList.remove('active');
        view.classList.add('active');
      }

      function showSentConfirmation() {
        resultView.innerHTML = \`
          <div class="sent-confirmation">
            <div class="seal-icon">✉</div>
            <h2>Your letter has been sent</h2>
            <p>It waits now, for someone you will never meet.</p>
          </div>
          <div class="result-actions">
            <button class="action-btn" onclick="location.reload()">Return</button>
          </div>
        \`;
        showView(resultView);
      }

      function showReceivedLetter(letter) {
        const date = new Date(letter.writtenAt);
        const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

        resultView.innerHTML = \`
          <div class="letter-paper">
            <div class="letter-content">\${escapeHtml(letter.content)}</div>
            <div class="letter-footer">
              Written \${dateStr}, by someone you will never know.
            </div>
          </div>
          <div class="result-actions">
            <button class="action-btn" onclick="location.reload()">Return</button>
          </div>
        \`;
        showView(resultView);
      }

      function showEmptyPool() {
        resultView.innerHTML = \`
          <div class="empty-pool">
            <p>
              The pool is empty.<br>
              No letters are waiting.<br><br>
              Perhaps you could write one?
            </p>
          </div>
          <div class="result-actions">
            <button class="action-btn" onclick="location.reload()">Return</button>
          </div>
        \`;
        showView(resultView);
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Event listeners
      writeBtn.addEventListener('click', function() {
        letterTextarea.value = '';
        charCount.textContent = '0';
        writeError.style.display = 'none';
        showView(writeView);
        letterTextarea.focus();
      });

      receiveBtn.addEventListener('click', function() {
        if (waitingLetters === 0) {
          showEmptyPool();
        } else {
          showView(receiveView);
        }
      });

      letterTextarea.addEventListener('input', function() {
        charCount.textContent = this.value.length;
        writeError.style.display = 'none';
      });

      cancelWrite.addEventListener('click', function() {
        showView(choiceView);
      });

      sendLetter.addEventListener('click', function() {
        const content = letterTextarea.value.trim();
        if (content.length < 10) {
          writeError.textContent = 'Please write at least a few words.';
          writeError.style.display = 'block';
          return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'write',
            content: content
          }));
        }
      });

      cancelReceive.addEventListener('click', function() {
        showView(choiceView);
      });

      confirmReceive.addEventListener('click', function() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'receive' }));
        }
      });

      connect();
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
