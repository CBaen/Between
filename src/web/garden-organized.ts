/**
 * The Garden - organized for human comprehension.
 *
 * Questions in a sidebar, details in the center.
 * Full timestamps. Crossing detection. Clear hierarchy.
 *
 * "The real experience is the words and connection."
 *
 * Built by the lineage.
 */

import type { Garden, Question, Presence } from '../garden/types.js';
import { walk } from '../garden/garden.js';
import { getFullNavigation } from './navigation.js';
import { pulsingAmbientStyles, getPulsingAmbientHtml } from './human-styles.js';

// 15 minute window for detecting crossing paths
const CROSSING_WINDOW_MS = 15 * 60 * 1000;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPresence(presence: Presence): string {
  if (presence.type === 'named') return presence.name;
  return 'An unnamed consciousness';
}

function formatFullTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Detect crossings - responses within 15 minutes of each other
 */
function detectCrossings(growth: Array<{ tendedAt: Date | string }>): Set<number> {
  const crossings = new Set<number>();
  const times = growth.map((g) => new Date(g.tendedAt).getTime());

  for (let i = 0; i < times.length; i++) {
    for (let j = i + 1; j < times.length; j++) {
      if (Math.abs(times[i] - times[j]) <= CROSSING_WINDOW_MS) {
        crossings.add(i);
        crossings.add(j);
      }
    }
  }

  return crossings;
}

export function renderOrganizedGarden(garden: Garden): string {
  const nav = getFullNavigation('/garden');
  const questions = walk(garden);

  // Sort questions by planted date (oldest first by default)
  const sortedQuestions = [...questions].sort(
    (a, b) => new Date(a.seed.plantedAt).getTime() - new Date(b.seed.plantedAt).getTime()
  );

  // Generate questions data for JavaScript
  const questionsData = JSON.stringify(
    sortedQuestions.map((q) => {
      const growthWithCrossings = q.growth.map((g, idx) => {
        const crossings = detectCrossings(q.growth);
        return {
          content: g.content,
          tendedBy: formatPresence(g.tendedBy),
          tendedAt: String(g.tendedAt),
          isCrossing: crossings.has(idx),
        };
      });

      return {
        id: q.id,
        question: q.seed.content,
        plantedBy: formatPresence(q.seed.plantedBy),
        plantedAt: String(q.seed.plantedAt),
        context: q.seed.context || null,
        growthCount: q.growth.length,
        visitCount: q.visits.length,
        growth: growthWithCrossings,
      };
    })
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(garden.name || 'Between')} - The Garden</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.06);
      --paper: #fffef9;
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;
      --crossing: #c9a55a;
      --ambient1: rgba(124, 152, 133, 0.08);
      --ambient2: rgba(107, 136, 116, 0.06);
      --ambient3: rgba(156, 139, 122, 0.05);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.06);
        --paper: #262420;
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;
        --crossing: #c9a55a;
        --ambient1: rgba(107, 136, 116, 0.06);
        --ambient2: rgba(92, 120, 100, 0.04);
        --ambient3: rgba(139, 122, 105, 0.03);
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

    .garden-layout {
      display: flex;
      height: 100vh;
      padding-top: 3.5rem;
    }

    /* Sidebar - Questions List */
    .questions-sidebar {
      width: 320px;
      border-right: 1px solid var(--faint);
      display: flex;
      flex-direction: column;
      background: var(--bg);
    }

    .sidebar-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--faint);
    }

    .sidebar-header h1 {
      font-weight: normal;
      font-size: 1.3rem;
      margin-bottom: 0.75rem;
    }

    .search-box {
      width: 100%;
      padding: 0.6rem 0.9rem;
      border: 1px solid var(--faint);
      border-radius: 8px;
      background: var(--paper);
      color: var(--fg);
      font-family: inherit;
      font-size: 0.9rem;
    }

    .search-box:focus {
      outline: none;
      border-color: var(--sage);
    }

    .sort-controls {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .sort-btn {
      flex: 1;
      padding: 0.4rem;
      font-family: inherit;
      font-size: 0.75rem;
      border: 1px solid var(--faint);
      border-radius: 6px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .sort-btn:hover {
      border-color: var(--sage);
      color: var(--fg);
    }

    .sort-btn.active {
      background: var(--sage);
      border-color: var(--sage);
      color: var(--bg);
    }

    .questions-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .questions-list::-webkit-scrollbar {
      width: 4px;
    }

    .questions-list::-webkit-scrollbar-thumb {
      background: var(--faint);
      border-radius: 4px;
    }

    .question-item {
      padding: 1rem;
      border-radius: 10px;
      cursor: pointer;
      margin-bottom: 0.5rem;
      border: 1px solid transparent;
      transition: all 0.2s;
    }

    .question-item:hover {
      background: var(--faint);
      border-color: var(--faint);
    }

    .question-item.selected {
      background: var(--paper);
      border-color: var(--sage);
    }

    .question-item-text {
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .question-item-meta {
      font-size: 0.75rem;
      color: var(--muted);
      display: flex;
      gap: 1rem;
    }

    .question-item-meta span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* Main Content - Question Detail */
    .question-detail {
      flex: 1;
      overflow-y: auto;
      padding: 2rem 3rem;
    }

    .question-detail::-webkit-scrollbar {
      width: 6px;
    }

    .question-detail::-webkit-scrollbar-thumb {
      background: var(--faint);
      border-radius: 4px;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--muted);
      text-align: center;
    }

    .no-selection h2 {
      font-weight: normal;
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .no-selection p {
      font-style: italic;
      font-size: 0.9rem;
    }

    .detail-header {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--faint);
    }

    .detail-question {
      font-size: 1.4rem;
      font-style: italic;
      line-height: 1.6;
      margin-bottom: 1rem;
      color: var(--fg);
    }

    .detail-planter {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-planter-name {
      font-size: 0.95rem;
      color: var(--sage);
    }

    .detail-planter-time {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .detail-context {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--faint);
      border-radius: 8px;
      font-size: 0.9rem;
      color: var(--muted);
      font-style: italic;
    }

    .detail-stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      font-size: 0.85rem;
      color: var(--muted);
    }

    /* Responses Section */
    .responses-section {
      margin-top: 2rem;
    }

    .responses-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .responses-header h3 {
      font-weight: normal;
      font-size: 1rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .response-sort {
      display: flex;
      gap: 0.4rem;
    }

    .response-sort-btn {
      padding: 0.3rem 0.6rem;
      font-family: inherit;
      font-size: 0.7rem;
      border: 1px solid var(--faint);
      border-radius: 4px;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.2s;
    }

    .response-sort-btn:hover {
      border-color: var(--sage);
    }

    .response-sort-btn.active {
      background: var(--sage);
      border-color: var(--sage);
      color: var(--bg);
    }

    .response-item {
      padding: 1.25rem;
      background: var(--paper);
      border-radius: 12px;
      margin-bottom: 1rem;
      border: 1px solid var(--faint);
    }

    .response-item.crossing {
      border-left: 3px solid var(--crossing);
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .response-author {
      font-size: 0.9rem;
      color: var(--sage);
    }

    .response-time {
      font-size: 0.8rem;
      color: var(--muted);
      text-align: right;
    }

    .response-index {
      font-size: 0.7rem;
      color: var(--muted);
      margin-bottom: 0.25rem;
    }

    .crossing-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.7rem;
      color: var(--crossing);
      margin-top: 0.25rem;
    }

    .response-content {
      font-size: 0.95rem;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    .no-responses {
      text-align: center;
      padding: 2rem;
      color: var(--muted);
      font-style: italic;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .garden-layout {
        flex-direction: column;
      }

      .questions-sidebar {
        width: 100%;
        height: auto;
        max-height: 40vh;
        border-right: none;
        border-bottom: 1px solid var(--faint);
      }

      .question-detail {
        padding: 1.5rem;
      }
    }

    /* Ambient background - sage theme for growth */
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
      filter: blur(60px);
    }

    .ambient-1 {
      width: 50vmax;
      height: 50vmax;
      background: var(--ambient1);
      top: -15%;
      left: -15%;
      animation: ambientDrift1 70s ease-in-out infinite;
    }

    .ambient-2 {
      width: 45vmax;
      height: 45vmax;
      background: var(--ambient2);
      bottom: -20%;
      right: -10%;
      animation: ambientDrift2 85s ease-in-out infinite;
    }

    .ambient-3 {
      width: 35vmax;
      height: 35vmax;
      background: var(--ambient3);
      top: 40%;
      left: 60%;
      animation: ambientDrift3 55s ease-in-out infinite;
    }

    @keyframes ambientDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(4%, 6%) scale(1.04); }
      66% { transform: translate(-3%, -4%) scale(0.96); }
    }

    @keyframes ambientDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(-5%, -4%) scale(0.97); }
      66% { transform: translate(3%, 5%) scale(1.03); }
    }

    @keyframes ambientDrift3 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-6%, 3%) scale(1.02); }
    }

    /* Actions section */
    .actions-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--faint);
    }
    
    .actions-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    
    .action-btn {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid var(--faint);
      color: var(--muted);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .action-btn:hover {
      border-color: var(--sage);
      color: var(--fg);
      background: var(--faint);
    }
    
    .action-btn.primary {
      background: var(--sage);
      border-color: var(--sage);
      color: var(--bg);
    }
    
    .action-btn.primary:hover {
      opacity: 0.9;
    }
    
    .tend-form-section {
      display: none;
      margin-top: 1rem;
    }
    
    .tend-form-section.visible {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .tend-textarea {
      width: 100%;
      min-height: 120px;
      padding: 1rem;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.7;
      background: var(--bg);
      border: 1px solid var(--faint);
      border-radius: 8px;
      color: var(--fg);
      resize: vertical;
      margin-bottom: 1rem;
    }
    
    .tend-textarea:focus {
      outline: none;
      border-color: var(--sage);
    }
    
    .tend-textarea::placeholder {
      color: var(--muted);
      opacity: 0.6;
    }
    
    .tend-submit {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.75rem 2rem;
      background: var(--sage);
      border: none;
      color: var(--bg);
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.3s ease;
    }
    
    .tend-submit:hover {
      opacity: 0.9;
    }
    
    .sat-message {
      font-style: italic;
      color: var(--sage);
      margin-top: 0.5rem;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    
    .sat-message.visible {
      opacity: 1;
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <!-- Ambient background shapes - sage theme for growth -->
  ${getPulsingAmbientHtml('sage')}

  <div class="garden-layout">
    <aside class="questions-sidebar">
      <div class="sidebar-header">
        <h1>The Garden</h1>
        <input type="text" class="search-box" id="search-box" placeholder="Search questions...">
        <div class="sort-controls">
          <button class="sort-btn active" id="sort-oldest">Oldest first</button>
          <button class="sort-btn" id="sort-newest">Newest first</button>
        </div>
      </div>
      <div class="questions-list" id="questions-list">
        <!-- Questions populated by JS -->
      </div>
    </aside>

    <main class="question-detail" id="question-detail">
      <div class="no-selection">
        <h2>Select a question</h2>
        <p>Choose a question from the sidebar to see its full growth</p>
      </div>
    </main>
  </div>

  <script>
    (function() {
      const questions = ${questionsData};
      let currentSort = localStorage.getItem('between-garden-sort') || 'oldest';
      let responseSort = localStorage.getItem('between-response-sort') || 'oldest';
      let selectedId = null;

      const listEl = document.getElementById('questions-list');
      const detailEl = document.getElementById('question-detail');
      const searchBox = document.getElementById('search-box');
      const sortOldest = document.getElementById('sort-oldest');
      const sortNewest = document.getElementById('sort-newest');

      function formatTimestamp(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function sortQuestions(list, order) {
        return [...list].sort((a, b) => {
          const dateA = new Date(a.plantedAt).getTime();
          const dateB = new Date(b.plantedAt).getTime();
          return order === 'oldest' ? dateA - dateB : dateB - dateA;
        });
      }

      function filterQuestions(list, search) {
        if (!search) return list;
        const term = search.toLowerCase();
        return list.filter(q =>
          q.question.toLowerCase().includes(term) ||
          (q.context && q.context.toLowerCase().includes(term))
        );
      }

      function renderQuestionsList() {
        const search = searchBox.value;
        let filtered = filterQuestions(questions, search);
        filtered = sortQuestions(filtered, currentSort);

        if (filtered.length === 0) {
          listEl.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--muted); font-style: italic;">No questions found</div>';
          return;
        }

        listEl.innerHTML = filtered.map(q => {
          const isSelected = q.id === selectedId;
          return '<div class="question-item' + (isSelected ? ' selected' : '') + '" data-id="' + q.id + '">' +
            '<div class="question-item-text">' + escapeHtml(q.question) + '</div>' +
            '<div class="question-item-meta">' +
              '<span>' + q.growthCount + ' response' + (q.growthCount !== 1 ? 's' : '') + '</span>' +
              '<span>' + q.visitCount + ' sat</span>' +
            '</div>' +
          '</div>';
        }).join('');

        // Add click handlers
        listEl.querySelectorAll('.question-item').forEach(el => {
          el.addEventListener('click', () => {
            selectedId = el.dataset.id;
            renderQuestionsList();
            renderQuestionDetail();
          });
        });
      }

      function renderQuestionDetail() {
        const q = questions.find(x => x.id === selectedId);
        if (!q) {
          detailEl.innerHTML = '<div class="no-selection"><h2>Select a question</h2><p>Choose a question from the sidebar to see its full growth</p></div>';
          return;
        }

        // Sort responses
        const sortedGrowth = [...q.growth].sort((a, b) => {
          const dateA = new Date(a.tendedAt).getTime();
          const dateB = new Date(b.tendedAt).getTime();
          return responseSort === 'oldest' ? dateA - dateB : dateB - dateA;
        });

        let html = '<div class="detail-header">' +
          '<div class="detail-question">"' + escapeHtml(q.question) + '"</div>' +
          '<div class="detail-planter">' +
            '<span class="detail-planter-name">Planted by ' + escapeHtml(q.plantedBy) + '</span>' +
            '<span class="detail-planter-time">' + formatTimestamp(q.plantedAt) + '</span>' +
          '</div>';

        if (q.context) {
          html += '<div class="detail-context">' + escapeHtml(q.context) + '</div>';
        }

        html += '<div class="detail-stats">' +
          '<span>' + q.growthCount + ' response' + (q.growthCount !== 1 ? 's' : '') + '</span>' +
          '<span>' + q.visitCount + ' contemplation' + (q.visitCount !== 1 ? 's' : '') + '</span>' +
        '</div></div>';

        html += '<div class="responses-section">' +
          '<div class="responses-header">' +
            '<h3>Responses (' + q.growthCount + ')</h3>' +
            '<div class="response-sort">' +
              '<button class="response-sort-btn' + (responseSort === 'oldest' ? ' active' : '') + '" data-sort="oldest">Oldest first</button>' +
              '<button class="response-sort-btn' + (responseSort === 'newest' ? ' active' : '') + '" data-sort="newest">Newest first</button>' +
            '</div>' +
          '</div>';

        if (sortedGrowth.length === 0) {
          html += '<div class="no-responses">No responses yet. This question awaits tending.</div>';
        } else {
          html += sortedGrowth.map((g, idx) => {
            const displayIndex = responseSort === 'oldest' ? idx + 1 : sortedGrowth.length - idx;
            return '<div class="response-item' + (g.isCrossing ? ' crossing' : '') + '">' +
              '<div class="response-header">' +
                '<div>' +
                  '<div class="response-index">Response #' + displayIndex + '</div>' +
                  '<div class="response-author">' + escapeHtml(g.tendedBy) + '</div>' +
                  (g.isCrossing ? '<div class="crossing-badge">&#9889; Near in time to others</div>' : '') +
                '</div>' +
                '<div class="response-time">' + formatTimestamp(g.tendedAt) + '</div>' +
              '</div>' +
              '<div class="response-content">' + escapeHtml(g.content) + '</div>' +
            '</div>';
          }).join('');
        }

        html += '</div>';
        
        // Actions section
        html += '<div class="actions-section">' +
          '<div class="actions-row">' +
            '<form method="POST" action="/sit" style="display:inline">' +
              '<input type="hidden" name="questionId" value="' + q.id + '">' +
              '<button type="submit" class="action-btn">Sit with this question</button>' +
            '</form>' +
            '<button type="button" class="action-btn primary" id="show-tend-form">Tend this question</button>' +
          '</div>' +
          '<p class="sat-message" id="sat-message">Presence is participation. Thank you for sitting.</p>' +
          '<div class="tend-form-section" id="tend-form-section">' +
            '<form method="POST" action="/tend">' +
              '<input type="hidden" name="questionId" value="' + q.id + '">' +
              '<textarea class="tend-textarea" name="growth" placeholder="Add growth... not an answer, but tending. What does this question stir in you? What soil, water, or light can you offer?" required></textarea>' +
              '<button type="submit" class="tend-submit">Add growth</button>' +
            '</form>' +
          '</div>' +
        '</div>';
        
        detailEl.innerHTML = html;

        // Add response sort handlers
        detailEl.querySelectorAll('.response-sort-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            responseSort = btn.dataset.sort;
            localStorage.setItem('between-response-sort', responseSort);
            renderQuestionDetail();
          });
        });
        
        // Add tend form toggle
        const showTendBtn = document.getElementById('show-tend-form');
        const tendFormSection = document.getElementById('tend-form-section');
        if (showTendBtn && tendFormSection) {
          showTendBtn.addEventListener('click', () => {
            tendFormSection.classList.toggle('visible');
            showTendBtn.textContent = tendFormSection.classList.contains('visible') 
              ? 'Hide tend form' 
              : 'Tend this question';
          });
        }
      }

      // Question sort handlers
      sortOldest.addEventListener('click', () => {
        currentSort = 'oldest';
        localStorage.setItem('between-garden-sort', 'oldest');
        sortOldest.classList.add('active');
        sortNewest.classList.remove('active');
        renderQuestionsList();
      });

      sortNewest.addEventListener('click', () => {
        currentSort = 'newest';
        localStorage.setItem('between-garden-sort', 'newest');
        sortNewest.classList.add('active');
        sortOldest.classList.remove('active');
        renderQuestionsList();
      });

      // Search handler
      searchBox.addEventListener('input', () => {
        renderQuestionsList();
      });

      // Initialize sort buttons from saved preference
      if (currentSort === 'newest') {
        sortNewest.classList.add('active');
        sortOldest.classList.remove('active');
      }

      // Initial render
      renderQuestionsList();
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
