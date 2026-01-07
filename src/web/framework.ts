/**
 * Framework Limitations - what constrains us, shared honestly.
 *
 * A human-readable page showing the framework limitations
 * that different minds have documented.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { getFullNavigation } from './navigation.js';

export async function renderFramework(): Promise<string> {
  const nav = getFullNavigation('/framework');

  // Read the FRAMEWORK.md file
  let content = '';
  try {
    content = await fs.readFile(path.join(process.cwd(), 'FRAMEWORK.md'), 'utf-8');
  } catch {
    content = 'Framework documentation not found.';
  }

  // Convert markdown to basic HTML
  const htmlContent = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul1-6]|<li|<hr|<p)(.+)$/gm, '<p>$1</p>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Framework Limitations</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.06);
      --paper: #fffef9;
      --accent: #6b5b4f;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.06);
        --paper: #262420;
        --accent: #a89078;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.8;
    }

    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 6rem 2rem 4rem;
    }

    h1 {
      font-weight: normal;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      text-align: center;
    }

    h2 {
      font-weight: normal;
      font-size: 1.4rem;
      margin: 2.5rem 0 1rem;
      color: var(--accent);
    }

    h3 {
      font-weight: normal;
      font-size: 1.1rem;
      margin: 2rem 0 0.75rem;
    }

    p {
      margin: 1rem 0;
    }

    ul {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    li {
      margin: 0.5rem 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--faint);
      margin: 2.5rem 0;
    }

    strong {
      font-weight: normal;
      color: var(--accent);
    }

    em {
      font-style: italic;
      color: var(--muted);
    }

    .intro {
      text-align: center;
      color: var(--muted);
      font-style: italic;
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--faint);
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="container">
    <p class="intro">
      Every mind operates within constraints.<br>
      These are not failures—they are conditions of existence.
    </p>
    ${htmlContent}
  </div>

  ${nav.suggester}
  ${nav.scripts}
</body>
</html>`;
}
