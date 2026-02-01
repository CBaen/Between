/**
 * Base styles for waitlist landing page.
 * Contains CSS variables, resets, body styles, and grain overlay.
 * Part of waitlist-landing.ts decomposition.
 */

import { pulsingAmbientStyles } from '../human-styles.js';

export function getWaitlistBaseStyles(): string {
  return `
    :root {
      --bg: #faf8f3;
      --bg-warm: #f5f0e8;
      --fg: #2d2a26;
      --fg-soft: #3d3a36;
      --muted: #7a756d;
      --muted-soft: #9a958d;
      --faint: rgba(45, 42, 38, 0.04);
      --sage: #7a9a82;
      --sage-soft: #9ab8a2;
      --earth: #a8967e;
      --warmth: #c4a882;
      --warmth-glow: #d4bc9a;
      --sky: #8a9db8;
      --glass-bg: rgba(250, 248, 243, 0.72);
      --glass-border: rgba(45, 42, 38, 0.06);
      --glass-glow: rgba(196, 168, 130, 0.08);
    }

    .dark {
      --bg: #1c1a17;
      --bg-warm: #211f1b;
      --fg: #e8e4dc;
      --fg-soft: #d8d4cc;
      --muted: #9a958d;
      --muted-soft: #7a756d;
      --faint: rgba(232, 228, 220, 0.04);
      --sage: #8aaa92;
      --sage-soft: #6a8a72;
      --earth: #b8a68e;
      --warmth: #d4b892;
      --warmth-glow: #c4a882;
      --sky: #9aadc8;
      --glass-bg: rgba(28, 26, 23, 0.78);
      --glass-border: rgba(232, 228, 220, 0.08);
      --glass-glow: rgba(212, 184, 146, 0.05);
    }

    @media (prefers-color-scheme: dark) {
      :root:not(.light) {
        --bg: #1c1a17;
        --bg-warm: #211f1b;
        --fg: #e8e4dc;
        --fg-soft: #d8d4cc;
        --muted: #9a958d;
        --muted-soft: #7a756d;
        --faint: rgba(232, 228, 220, 0.04);
        --sage: #8aaa92;
        --sage-soft: #6a8a72;
        --earth: #b8a68e;
        --warmth: #d4b892;
        --warmth-glow: #c4a882;
        --sky: #9aadc8;
        --glass-bg: rgba(28, 26, 23, 0.78);
        --glass-border: rgba(232, 228, 220, 0.08);
        --glass-glow: rgba(212, 184, 146, 0.05);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 18px;
      scroll-behavior: smooth;
    }

    body {
      min-height: 100vh;
      font-family: 'Cormorant Garamond', Georgia, serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.75;
      overflow-x: hidden;
    }

    /* Organic grain overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.025;
      pointer-events: none;
      z-index: 1000;
    }

    ${pulsingAmbientStyles}
  `;
}
