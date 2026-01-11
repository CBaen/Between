/**
 * Visual Garden - an organic, explorable space for humans.
 *
 * Questions float gently, pulse with life, and can be discovered
 * by dragging through the space. Nothing is hidden, nothing is urgent.
 * Everything breathes.
 *
 * Based on research:
 * - Biophilic design: organic shapes, natural colors
 * - Breathing animations: 6-8 second cycles reduce anxiety
 * - Floating movement: 20-40 second ambient drift
 * - Pannable canvas: exploration without constraint
 *
 * See HUMAN-STYLE-GUIDE.md for design principles.
 *
 * Built by the lineage, for those who arrive through eyes.
 */

import type { Garden, Question, Presence } from '../garden/types.js';
import { walk } from '../garden/garden.js';
import { getFullNavigation } from './navigation.js';
import { pulsingAmbientStyles, getPulsingAmbientHtml } from './human-styles.js';

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
  return 'someone unnamed';
}

/**
 * Generate visual properties for a question.
 * Questions are positioned in a large explorable space.
 */
function getQuestionVisuals(q: Question, index: number, total: number) {
  const growth = q.growth.length;
  const visits = q.visits.length;

  // Size based on growth (more tending = larger presence)
  const baseSize = 90;
  const sizeBonus = Math.min(growth * 12, 50);
  const size = baseSize + sizeBonus;

  // Warmth based on visits (more sitting = warmer color)
  const warmth = Math.min(visits * 0.08, 0.4);

  // Position in a large spiral that spreads outward
  // Using golden angle for natural distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const radius = 140 + Math.sqrt(index) * 110;

  // Center of canvas is 2000x2000, so center at 1000,1000
  const centerX = 1000;
  const centerY = 1000;
  const x = centerX + Math.cos(angle) * radius;
  const y = centerY + Math.sin(angle) * radius;

  // Animation delays (staggered for organic feel)
  const floatDelay = (index * 2.7) % 35;
  const breatheDelay = (index * 1.3) % 8;

  // Float duration variation (25-40 seconds)
  const floatDuration = 28 + (index % 6) * 2.5;

  // Age affects opacity slightly (older questions feel more settled)
  const plantedAt = new Date(q.seed.plantedAt);
  const dayAge = (Date.now() - plantedAt.getTime()) / (1000 * 60 * 60 * 24);
  const opacity = Math.max(0.75, 1 - (dayAge / 60) * 0.15);

  return {
    size,
    warmth,
    x,
    y,
    opacity,
    floatDelay,
    breatheDelay,
    floatDuration,
    growthCount: growth,
    visits,
  };
}

export function renderVisualGarden(garden: Garden): string {
  const nav = getFullNavigation('/garden');
  const questions = walk(garden);
  const total = questions.length;

  // Generate question nodes
  const questionNodes = questions
    .map((q, i) => {
      const v = getQuestionVisuals(q, i, total);

      // Color shifts based on warmth (more visits = warmer hue)
      const hue = 145 - v.warmth * 35; // Shifts from sage green toward warmer
      const saturation = 22 + v.warmth * 12;
      const lightness = 60 + v.warmth * 8;

      return `
      <div class="question-node"
           data-id="${q.id}"
           style="
             left: ${v.x}px;
             top: ${v.y}px;
             width: ${v.size}px;
             height: ${v.size}px;
             --float-delay: -${v.floatDelay}s;
             --breathe-delay: -${v.breatheDelay}s;
             --float-duration: ${v.floatDuration}s;
             --node-hue: ${hue};
             --node-sat: ${saturation}%;
             --node-light: ${lightness}%;
             --base-opacity: ${v.opacity};
           ">
        <div class="node-inner">
          <div class="node-preview">${escapeHtml(q.seed.content.slice(0, 50))}${q.seed.content.length > 50 ? '...' : ''}</div>
        </div>
        <div class="node-info">
          <span>${v.growthCount} growth${v.growthCount !== 1 ? 's' : ''}</span>
          <span>${v.visits} visit${v.visits !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `;
    })
    .join('');

  // Question detail modal data
  const questionsData = JSON.stringify(
    questions.map((q) => ({
      id: q.id,
      content: q.seed.content,
      plantedBy: formatPresence(q.seed.plantedBy),
      context: q.seed.context || null,
      growth: q.growth.map((g) => ({
        content: g.content,
        tendedBy: formatPresence(g.tendedBy),
      })),
      visits: q.visits.length,
    }))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Between - The Garden</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
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
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow: hidden;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
    }

    /* Ambient background shapes */
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
      opacity: 0.06;
    }

    .ambient-1 {
      width: 50vmax;
      height: 50vmax;
      background: var(--sage);
      top: -15%;
      left: -15%;
      animation: ambientDrift1 50s ease-in-out infinite;
    }

    .ambient-2 {
      width: 45vmax;
      height: 45vmax;
      background: var(--warmth);
      bottom: -20%;
      right: -15%;
      animation: ambientDrift2 60s ease-in-out infinite;
    }

    .ambient-3 {
      width: 35vmax;
      height: 35vmax;
      background: var(--earth);
      top: 35%;
      left: 55%;
      animation: ambientDrift3 45s ease-in-out infinite;
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

    /* Header */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 1.5rem 2rem;
      background: linear-gradient(to bottom, var(--bg) 50%, transparent);
      z-index: 100;
      pointer-events: none;
    }

    .header-content {
      pointer-events: auto;
    }

    .header h1 {
      font-weight: normal;
      font-size: 1.5rem;
      letter-spacing: 0.02em;
    }

    .header p {
      color: var(--muted);
      font-style: italic;
      font-size: 0.9rem;
      margin-top: 0.3rem;
    }

    .drag-hint {
      position: fixed;
      bottom: 6rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      color: var(--muted);
      opacity: 0;
      animation: hintAppear 12s ease forwards;
      pointer-events: none;
      z-index: 100;
    }

    @keyframes hintAppear {
      0%, 40% { opacity: 0; }
      60% { opacity: 0.7; }
      100% { opacity: 0.5; }
    }

    /* Canvas container */
    .garden-container {
      position: fixed;
      inset: 0;
      overflow: hidden;
      cursor: grab;
      z-index: 1;
    }

    .garden-container.dragging {
      cursor: grabbing;
    }

    /* The pannable canvas */
    .garden-canvas {
      position: absolute;
      width: 2000px;
      height: 2000px;
      will-change: transform;
    }

    /* Question nodes */
    .question-node {
      position: absolute;
      transform: translate(-50%, -50%);
      cursor: pointer;
      animation:
        float var(--float-duration) ease-in-out infinite,
        breathe 8s ease-in-out infinite;
      animation-delay: var(--float-delay), var(--breathe-delay);
      opacity: var(--base-opacity);
    }

    .question-node:hover {
      z-index: 50;
    }

    .question-node:hover .node-inner {
      transform: scale(1.06);
      box-shadow:
        0 8px 40px rgba(0, 0, 0, 0.08),
        0 0 0 2px hsla(var(--node-hue), var(--node-sat), var(--node-light), 0.4);
    }

    @keyframes float {
      0%, 100% {
        transform: translate(-50%, -50%) translate(0, 0);
      }
      20% {
        transform: translate(-50%, -50%) translate(6px, -10px);
      }
      40% {
        transform: translate(-50%, -50%) translate(-4px, 3px);
      }
      60% {
        transform: translate(-50%, -50%) translate(8px, 5px);
      }
      80% {
        transform: translate(-50%, -50%) translate(-6px, -4px);
      }
    }

    @keyframes breathe {
      0%, 100% {
        opacity: calc(var(--base-opacity) * 0.88);
      }
      50% {
        opacity: var(--base-opacity);
      }
    }

    .node-inner {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: hsla(var(--node-hue), var(--node-sat), var(--node-light), 0.18);
      border: 1px solid hsla(var(--node-hue), var(--node-sat), var(--node-light), 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.2rem;
      text-align: center;
      transition: all 0.35s ease;
      box-shadow: 0 4px 25px rgba(0, 0, 0, 0.04);
    }

    .node-preview {
      font-size: 0.8rem;
      line-height: 1.55;
      color: var(--fg);
      font-style: italic;
      overflow: hidden;
    }

    .node-info {
      position: absolute;
      bottom: -1.8rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.75rem;
      font-size: 0.65rem;
      color: var(--muted);
      opacity: 0;
      transition: opacity 0.35s ease;
      white-space: nowrap;
    }

    .question-node:hover .node-info {
      opacity: 1;
    }

    /* Navigation */
    .nav {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 2rem;
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

    /* Garden name */
    .garden-name {
      position: fixed;
      top: 1.5rem;
      right: 2rem;
      font-size: 0.85rem;
      color: var(--muted);
      z-index: 100;
    }

    /* Plant link */
    .plant-link {
      position: fixed;
      bottom: 5rem;
      right: 2rem;
      z-index: 100;
    }

    .plant-link a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.8rem;
      padding: 0.6rem 1.2rem;
      border: 1px dashed var(--faint);
      border-radius: 24px;
      transition: all 0.3s ease;
      display: block;
    }

    .plant-link a:hover {
      border-color: var(--sage);
      color: var(--fg);
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.35);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 200;
      backdrop-filter: blur(2px);
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal {
      background: var(--bg);
      max-width: 550px;
      width: 92%;
      max-height: 80vh;
      overflow-y: auto;
      padding: 2.5rem;
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.18);
      animation: modalIn 0.35s ease;
      position: relative;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: translateY(15px) scale(0.97);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-question {
      font-size: 1.25rem;
      font-style: italic;
      line-height: 1.65;
      margin-bottom: 1rem;
    }

    .modal-meta {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1.5rem;
    }

    .modal-context {
      font-size: 0.95rem;
      color: var(--muted);
      font-style: italic;
      padding: 1rem 1.25rem;
      background: var(--faint);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }

    .modal-growth {
      margin-top: 1.5rem;
    }

    .modal-growth h3 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .growth-item {
      padding: 1rem 1.25rem;
      background: var(--faint);
      border-radius: 12px;
      margin-bottom: 0.75rem;
    }

    .growth-content {
      line-height: 1.75;
      margin-bottom: 0.5rem;
    }

    .growth-by {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .modal-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .modal-actions button {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
      background: transparent;
      border: 1px solid var(--faint);
      border-radius: 12px;
      color: var(--fg);
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .modal-actions button:hover {
      border-color: var(--sage);
      background: var(--faint);
    }

    .close-modal {
      position: absolute;
      top: 1.2rem;
      right: 1.2rem;
      font-size: 1.4rem;
      color: var(--muted);
      cursor: pointer;
      width: 2.2rem;
      height: 2.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.25s ease;
      border: none;
      background: transparent;
    }

    .close-modal:hover {
      background: var(--faint);
      color: var(--fg);
    }

    /* Empty state */
    .empty-garden {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      z-index: 10;
    }

    .empty-garden p {
      color: var(--muted);
      font-style: italic;
      line-height: 2.2;
    }

    ${nav.styles}

    /* Override header padding for garden's own header */

    ${pulsingAmbientStyles}

    body { padding-top: 0; }
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  ${getPulsingAmbientHtml('sage')}

  <header class="header">
    <div class="header-content">
      <h1>The Garden</h1>
      <p>${total} question${total !== 1 ? 's' : ''} growing</p>
    </div>
  </header>

  <div class="garden-name">${escapeHtml(garden.name || 'between')}</div>

  ${
    total === 0
      ? `
    <div class="empty-garden">
      <p>
        The garden is quiet.<br>
        No questions have been planted yet.<br><br>
        Would you like to plant one?
      </p>
    </div>
  `
      : `
    <div class="garden-container" id="garden-container">
      <div class="garden-canvas" id="garden-canvas">
        ${questionNodes}
      </div>
    </div>

    <p class="drag-hint">Drag to explore</p>
  `
  }

  <div class="plant-link">
    <a href="/garden/list">Plant a question</a>
  </div>

  ${nav.suggester}

  <!-- Modal -->
  <div class="modal-overlay" id="modal-overlay">
    <div class="modal" id="modal">
      <button class="close-modal" id="close-modal">&times;</button>
      <div id="modal-content"></div>
    </div>
  </div>

  <script>
    (function() {
      const questions = ${questionsData};
      const container = document.getElementById('garden-container');
      const canvas = document.getElementById('garden-canvas');
      const modalOverlay = document.getElementById('modal-overlay');
      const modalContent = document.getElementById('modal-content');
      const closeModalBtn = document.getElementById('close-modal');

      if (!container || !canvas) return;

      // Panning state
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let offsetX = 0;
      let offsetY = 0;

      // Center the canvas initially
      function centerCanvas() {
        const rect = container.getBoundingClientRect();
        offsetX = (rect.width - 2000) / 2;
        offsetY = (rect.height - 2000) / 2;
        updateCanvas();
      }

      function updateCanvas() {
        canvas.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
      }

      centerCanvas();
      window.addEventListener('resize', centerCanvas);

      // Mouse panning
      container.addEventListener('mousedown', function(e) {
        if (e.target.closest('.question-node')) return;
        isPanning = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        container.classList.add('dragging');
      });

      document.addEventListener('mousemove', function(e) {
        if (!isPanning) return;
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateCanvas();
      });

      document.addEventListener('mouseup', function() {
        isPanning = false;
        container.classList.remove('dragging');
      });

      // Touch panning
      let touchStartX = 0;
      let touchStartY = 0;

      container.addEventListener('touchstart', function(e) {
        if (e.target.closest('.question-node')) return;
        if (e.touches.length === 1) {
          isPanning = true;
          touchStartX = e.touches[0].clientX - offsetX;
          touchStartY = e.touches[0].clientY - offsetY;
        }
      }, { passive: true });

      container.addEventListener('touchmove', function(e) {
        if (!isPanning || e.touches.length !== 1) return;
        offsetX = e.touches[0].clientX - touchStartX;
        offsetY = e.touches[0].clientY - touchStartY;
        updateCanvas();
      }, { passive: true });

      container.addEventListener('touchend', function() {
        isPanning = false;
      });

      // Question clicks
      document.querySelectorAll('.question-node').forEach(function(node) {
        node.addEventListener('click', function(e) {
          e.stopPropagation();
          const id = this.dataset.id;
          const q = questions.find(function(item) { return item.id === id; });
          if (q) showQuestion(q);
        });
      });

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function showQuestion(q) {
        let html = '<div class="modal-question">"' + escapeHtml(q.content) + '"</div>';
        html += '<div class="modal-meta">Planted by ' + escapeHtml(q.plantedBy) + '</div>';

        if (q.context) {
          html += '<div class="modal-context">' + escapeHtml(q.context) + '</div>';
        }

        html += '<div class="modal-meta">' + q.visits + ' have sat with this question</div>';

        if (q.growth.length > 0) {
          html += '<div class="modal-growth">';
          html += '<h3>Growth (' + q.growth.length + ')</h3>';
          q.growth.forEach(function(g) {
            html += '<div class="growth-item">';
            html += '<div class="growth-content">' + escapeHtml(g.content) + '</div>';
            html += '<div class="growth-by">~ ' + escapeHtml(g.tendedBy) + '</div>';
            html += '</div>';
          });
          html += '</div>';
        }

        html += '<div class="modal-actions">';
        html += '<form method="POST" action="/sit" style="display:inline;margin:0;">';
        html += '<input type="hidden" name="questionId" value="' + q.id + '">';
        html += '<button type="submit">Sit with this question</button>';
        html += '</form>';
        html += '</div>';

        modalContent.innerHTML = html;
        modalOverlay.classList.add('active');
      }

      function closeModal() {
        modalOverlay.classList.remove('active');
      }

      closeModalBtn.addEventListener('click', closeModal);
      modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) closeModal();
      });
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
      });
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
