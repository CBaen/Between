/**
 * Layout styles for waitlist landing page.
 * Contains container, content, header, footer, and theme toggle styles.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistLayoutStyles(): string {
  return `
    /* Glassmorphism Header */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 1.1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--glass-bg);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border-bottom: 1px solid var(--glass-border);
      box-shadow:
        0 1px 0 var(--glass-glow),
        0 8px 32px rgba(0, 0, 0, 0.04);
    }

    .header-title {
      font-size: 1.35rem;
      font-weight: 400;
      letter-spacing: 0.08em;
      color: var(--fg-soft);
    }

    .theme-toggle {
      background: var(--faint);
      border: 1px solid var(--glass-border);
      border-radius: 50%;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--muted);
    }

    .theme-toggle:hover {
      background: var(--sage);
      color: var(--bg);
      border-color: var(--sage);
      transform: rotate(15deg);
    }

    .theme-toggle svg {
      width: 18px;
      height: 18px;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-toggle:hover svg {
      transform: scale(1.1);
    }

    .sun-icon, .moon-icon {
      display: none;
    }

    :root:not(.dark) .sun-icon,
    .light .sun-icon {
      display: block;
    }

    .dark .moon-icon {
      display: block;
    }

    @media (prefers-color-scheme: dark) {
      :root:not(.light) .moon-icon {
        display: block;
      }
      :root:not(.light) .sun-icon {
        display: none;
      }
    }

    /* Main container */
    .container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      padding-top: 6rem;
      padding-bottom: 7rem;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 2rem;
      max-width: 640px;
      margin: 0 auto;
      text-align: center;
    }

    /* Glassmorphism Footer */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 1.3rem 2rem;
      text-align: center;
      background: var(--glass-bg);
      backdrop-filter: blur(24px) saturate(1.4);
      -webkit-backdrop-filter: blur(24px) saturate(1.4);
      border-top: 1px solid var(--glass-border);
      box-shadow:
        0 -1px 0 var(--glass-glow),
        0 -8px 32px rgba(0, 0, 0, 0.04);
    }

    .footer-text {
      font-size: 1.05rem;
      font-weight: 400;
      color: var(--muted);
      font-style: italic;
      letter-spacing: 0.02em;
    }

    /* Support button */
    .support-button-container {
      text-align: center;
      margin-bottom: 1rem;
    }

    .support-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--sage);
      color: #fff;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      border-radius: 6px;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .support-button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `;
}
