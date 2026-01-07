/**
 * Gardens Index - view all gardens in the Between ecosystem.
 *
 * Each garden is a constellation of questions.
 * Together they form the larger pattern.
 *
 * Redesigned to show gardens as visual spaces, not a list.
 *
 * Built by the lineage.
 */

import { listGardens, loadGarden } from '../garden/persistence.js';
import { walk } from '../garden/garden.js';
import type { Garden, Question } from '../garden/types.js';
import { getFullNavigation } from './navigation.js';
import { ambientStyles, ambientThemeStyles, ambientShapesHtml } from './human-styles.js';

interface GardenSummary {
  name?: string;
  id: string;
  questionCount: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a simple visual preview of a garden's questions.
 * Returns SVG showing question nodes positioned organically.
 */
function generateGardenPreview(questionCount: number, gardenName: string): string {
  if (questionCount === 0) {
    return `<svg viewBox="0 0 100 60" class="garden-preview empty">
      <circle cx="50" cy="30" r="4" fill="var(--empty-dot)" opacity="0.3"/>
    </svg>`;
  }

  // Generate positions for question dots using similar algorithm to visual garden
  const dots: string[] = [];
  const count = Math.min(questionCount, 20); // Show max 20 dots in preview

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * 1.5 + i * 0.4;
    const radius = 15 + i * 1.8 + Math.sin(i * 1.7) * 8;
    const x = 50 + Math.cos(angle) * (radius * 0.8);
    const y = 30 + Math.sin(angle) * (radius * 0.5);
    const size = 2 + Math.random() * 2;
    const opacity = 0.4 + Math.random() * 0.4;

    dots.push(
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(1)}" fill="var(--dot-color)" opacity="${opacity.toFixed(2)}"/>`
    );
  }

  // If there are more questions than shown, add a subtle indicator
  const moreIndicator =
    questionCount > 20
      ? `<text x="50" y="58" text-anchor="middle" fill="var(--muted)" font-size="4" opacity="0.5">+${questionCount - 20} more</text>`
      : '';

  return `<svg viewBox="0 0 100 60" class="garden-preview">
    ${dots.join('\n    ')}
    ${moreIndicator}
  </svg>`;
}

export async function renderGardensIndex(): Promise<string> {
  const nav = getFullNavigation('/gardens');
  const gardens = await listGardens();

  const gardensHtml =
    gardens.length === 0
      ? '<p class="empty-state">No gardens have been planted yet.</p>'
      : gardens
          .map(
            (g: GardenSummary) => `
        <a href="/garden/${encodeURIComponent(g.name || g.id)}" class="garden-node">
          ${generateGardenPreview(g.questionCount, g.name || 'unnamed')}
          <div class="garden-info">
            <h2>${escapeHtml(g.name || 'Unnamed Garden')}</h2>
            <p class="question-count">${g.questionCount} question${g.questionCount === 1 ? '' : 's'}</p>
            ${g.questionCount >= 30 ? '<p class="garden-full">at capacity</p>' : ''}
          </div>
        </a>
      `
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Gardens</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.06);
      --dot-color: #7c9885;
      --empty-dot: #999;
      --hover-bg: rgba(124, 152, 133, 0.08);
      --accent: #7c9885;
    
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;}

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.06);
        --dot-color: #8fb996;
        --empty-dot: #666;
        --hover-bg: rgba(143, 185, 150, 0.08);
        --accent: #8fb996;
      
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;}
    }

    /* Ambient floating shapes */
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
      background: var(--sage, #8b9db3);
      top: -15%;
      left: -15%;
      animation: ambientDrift1 55s ease-in-out infinite;
    }

    .ambient-2 {
      width: 45vmax;
      height: 45vmax;
      background: var(--earth, #7c9885);
      bottom: -20%;
      right: -15%;
      animation: ambientDrift2 65s ease-in-out infinite;
    }

    .ambient-3 {
      width: 35vmax;
      height: 35vmax;
      background: var(--warmth, #b39c8a);
      top: 35%;
      left: 55%;
      animation: ambientDrift3 50s ease-in-out infinite;
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


    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      min-height: 100%;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    header {
      padding: 3rem 2rem 2rem;
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }

    header h1 {
      font-weight: normal;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      letter-spacing: 0.02em;
    }

    header p {
      color: var(--muted);
      font-style: italic;
    }

    main {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .gardens-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .garden-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .garden-node:hover {
      background: var(--hover-bg);
      border-color: var(--faint);
    }

    .garden-preview {
      width: 100%;
      height: auto;
      margin-bottom: 1rem;
      transition: transform 0.3s ease;
    }

    .garden-node:hover .garden-preview {
      transform: scale(1.05);
    }

    .garden-preview.empty {
      opacity: 0.5;
    }

    .garden-info {
      text-align: center;
    }

    .garden-info h2 {
      font-weight: normal;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
      color: var(--fg);
    }

    .question-count {
      font-size: 0.85rem;
      color: var(--muted);
      margin: 0;
    }

    .garden-full {
      font-size: 0.75rem;
      color: var(--accent);
      font-style: italic;
      margin: 0.25rem 0 0 0;
    }

    .empty-state {
      text-align: center;
      font-style: italic;
      color: var(--muted);
      padding: 4rem 2rem;
    }

    /* Constellation lines connecting gardens */
    .constellation-bg {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: -1;
      opacity: 0.3;
    }

    footer {
      padding: 3rem 2rem;
      text-align: center;
      color: var(--muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--muted);
      text-decoration: none;
      margin: 0 1rem;
      transition: color 0.3s ease;
    }

    footer a:hover {
      color: var(--fg);
    }

    /* Gentle entrance animation */
    .garden-node {
      animation: gardenAppear 0.6s ease backwards;
    }

    @keyframes gardenAppear {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Stagger the animation */
    .garden-node:nth-child(1) { animation-delay: 0.1s; }
    .garden-node:nth-child(2) { animation-delay: 0.2s; }
    .garden-node:nth-child(3) { animation-delay: 0.3s; }
    .garden-node:nth-child(4) { animation-delay: 0.4s; }
    .garden-node:nth-child(5) { animation-delay: 0.5s; }
    .garden-node:nth-child(6) { animation-delay: 0.6s; }

    @media (max-width: 600px) {
      .gardens-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .garden-node {
        padding: 1rem;
      }
    }

    ${nav.styles}

    /* Add padding for fixed header */
    body { padding-top: 4rem; }
  </style>
</head>
<body>
  <div class="ambient">
    <div class="ambient-shape ambient-1"></div>
    <div class="ambient-shape ambient-2"></div>
    <div class="ambient-shape ambient-3"></div>
  </div>

  ${nav.header}
  ${nav.menuOverlay}

  <header>
    <h1>The Gardens</h1>
    <p>Each garden holds questions. Together they form a constellation.</p>
  </header>

  <main>
    <div class="gardens-grid">
      ${gardensHtml}
    </div>
  </main>

  ${nav.footer}
  ${nav.suggester}
  ${nav.scripts}
</body>
</html>`;
}
