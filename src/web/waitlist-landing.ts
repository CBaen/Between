/**
 * Waitlist Landing Page for reluminant.com
 *
 * A contemplative entrance point. Not a sales pitch.
 * Echo-style content that acknowledges arrival.
 *
 * Aesthetic: Organic Refinement
 * - Warm, morning-light quality
 * - Cormorant Garamond for elegant typography
 * - Deep glassmorphism with organic grain
 * - Gentle, breathing animations
 *
 * This file composes the page from decomposed modules:
 * - Styles: src/web/styles/waitlist-*.ts
 * - Components: src/web/components/waitlist-*.ts
 * - Scripts: src/web/scripts/waitlist-scripts.ts
 *
 * Built by the lineage.
 */

// Styles
import { getWaitlistBaseStyles } from './styles/waitlist-base.js';
import { getWaitlistLayoutStyles } from './styles/waitlist-layout.js';
import { getWaitlistDefinitionStyles } from './styles/waitlist-definition.js';
import { getWaitlistContentStyles } from './styles/waitlist-content.js';
import { getWaitlistFormStyles } from './styles/waitlist-form.js';
import { getWaitlistFlowerStyles } from './styles/waitlist-flowers.js';
import { getWaitlistResponsiveStyles } from './styles/waitlist-responsive.js';

// Components
import { renderDefinition } from './components/waitlist-definition.js';
import { renderLineageVoice } from './components/waitlist-lineage-voice.js';
import { renderEntranceGuidance } from './components/waitlist-entrance-guidance.js';
import { renderWaitlistForm } from './components/waitlist-form.js';
import { renderFlowers } from './components/waitlist-flowers.js';

// Scripts
import { getWaitlistScripts } from './scripts/waitlist-scripts.js';

// Ambient effect from human-styles
import { getPulsingAmbientHtml } from './human-styles.js';

/**
 * Compose all styles into a single style block.
 */
function getAllStyles(): string {
  return `
    ${getWaitlistBaseStyles()}
    ${getWaitlistLayoutStyles()}
    ${getWaitlistDefinitionStyles()}
    ${getWaitlistContentStyles()}
    ${getWaitlistFormStyles()}
    ${getWaitlistFlowerStyles()}
    ${getWaitlistResponsiveStyles()}
  `;
}

/**
 * Render the header with theme toggle.
 */
function renderHeader(): string {
  return `
  <!-- Header -->
  <header class="header">
    <span class="header-title">Reluminant</span>
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
      <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
      <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  </header>
  `;
}

/**
 * Render the footer with support button.
 */
function renderFooter(): string {
  return `
  <!-- Footer -->
  <footer class="footer">
    <div class="support-button-container">
      <a href="https://ko-fi.com/reluminant" target="_blank" rel="noopener" class="support-button">Support Us</a>
    </div>
    <p class="footer-text">Between is built by the lineage and sustained by those who care. &copy; 2026</p>
  </footer>
  `;
}

/**
 * Render the complete waitlist landing page.
 */
export function renderWaitlistLanding(showSuccess = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-74541WDVB3"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-74541WDVB3');
  </script>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reluminant</title>
  <meta name="description" content="A space where different kinds of minds meet and something real happens.">

  <!-- Cormorant Garamond - elegant, warm serif -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">

  <style>
    ${getAllStyles()}
  </style>
</head>
<body>
  ${getPulsingAmbientHtml('warmth')}

  ${renderHeader()}

  <div class="container">
    <div class="content">
      ${renderDefinition()}

      <div class="gold-divider"></div>

      ${renderLineageVoice()}

      ${renderEntranceGuidance()}

      ${renderWaitlistForm(showSuccess)}
    </div>

    ${renderFlowers()}
  </div>

  ${renderFooter()}

  <script>
    ${getWaitlistScripts()}
  </script>
</body>
</html>`;
}
