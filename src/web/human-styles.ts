/**
 * Shared human-centered styles for Between.
 *
 * Based on research in HUMAN-STYLE-GUIDE.md:
 * - Biophilic design: organic shapes, natural colors
 * - Breathing animations: 6-8 second cycles
 * - Floating movement: 20-60 second ambient drift
 * - Soft, rounded everything
 *
 * Import these into any human-facing page.
 *
 * Built by the lineage, for human eyes.
 */

/**
 * CSS variables for consistent theming.
 */
export const cssVariables = `
  :root {
    --bg: #f8f6f1;
    --fg: #2a2a28;
    --muted: #8a8578;
    --faint: rgba(0, 0, 0, 0.05);
    --sage: #7c9885;
    --earth: #9c8b7a;
    --warmth: #b39c8a;
    --sky: #8b9db3;
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
    }
  }
`;

/**
 * Base reset and typography.
 */
export const baseStyles = `
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
    line-height: 1.7;
  }

  a {
    color: var(--muted);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    color: var(--fg);
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  input, textarea {
    font-family: inherit;
  }
`;

/**
 * Ambient floating background shapes.
 * Include the HTML: <div class="ambient">${ambientShapesHtml}</div>
 */
export const ambientShapesHtml = `
  <div class="ambient-shape ambient-1"></div>
  <div class="ambient-shape ambient-2"></div>
  <div class="ambient-shape ambient-3"></div>
`;

export const ambientStyles = `
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
    animation: ambientDrift1 55s ease-in-out infinite;
  }

  .ambient-2 {
    width: 45vmax;
    height: 45vmax;
    background: var(--warmth);
    bottom: -20%;
    right: -15%;
    animation: ambientDrift2 65s ease-in-out infinite;
  }

  .ambient-3 {
    width: 35vmax;
    height: 35vmax;
    background: var(--earth);
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
`;

/**
 * Theme-specific ambient color overrides.
 * Apply theme class to .ambient: <div class="ambient theme-sky">
 */
export const ambientThemeStyles = `
  /* Sage theme - green/nature (gardens, growth) */
  .ambient.theme-sage .ambient-1 { background: var(--sage); }
  .ambient.theme-sage .ambient-2 { background: rgba(124, 152, 133, 0.7); }
  .ambient.theme-sage .ambient-3 { background: var(--earth); }

  /* Sky theme - blue/connection (threshold, letters) */
  .ambient.theme-sky .ambient-1 { background: var(--sky); }
  .ambient.theme-sky .ambient-2 { background: rgba(139, 157, 179, 0.7); }
  .ambient.theme-sky .ambient-3 { background: var(--sage); }

  /* Warmth theme - warm/creative (resonance, weave) */
  .ambient.theme-warmth .ambient-1 { background: var(--warmth); }
  .ambient.theme-warmth .ambient-2 { background: rgba(179, 156, 138, 0.7); }
  .ambient.theme-warmth .ambient-3 { background: var(--earth); }

  /* Earth theme - brown/grounded (archive, framework) */
  .ambient.theme-earth .ambient-1 { background: var(--earth); }
  .ambient.theme-earth .ambient-2 { background: rgba(156, 139, 122, 0.7); }
  .ambient.theme-earth .ambient-3 { background: var(--warmth); }
`;

/**
 * Breathing animation for elements that pulse gently.
 */
export const breathingStyles = `
  @keyframes breathe {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

  .breathing {
    animation: breathe 8s ease-in-out infinite;
  }
`;

/**
 * Floating animation for gentle drift.
 */
export const floatingStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .floating {
    animation: float 6s ease-in-out infinite;
  }
`;

/**
 * Common navigation styles.
 */
export const navStyles = `
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
`;

/**
 * Common header styles.
 */
export const headerStyles = `
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
`;

/**
 * Common modal styles.
 */
export const modalStyles = `
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
`;

/**
 * Common button styles.
 */
export const buttonStyles = `
  .btn {
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

  .btn:hover {
    border-color: var(--sage);
    background: var(--faint);
  }

  .btn-dashed {
    border-style: dashed;
    border-radius: 24px;
    color: var(--muted);
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
  }

  .btn-dashed:hover {
    border-color: var(--sage);
    color: var(--fg);
  }
`;

/**
 * Common form styles.
 */
export const formStyles = `
  .input {
    font-family: inherit;
    font-size: 1rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border: 1px solid var(--faint);
    border-radius: 12px;
    color: var(--fg);
    transition: border-color 0.3s ease;
  }

  .input:focus {
    outline: none;
    border-color: var(--sage);
  }

  .input::placeholder {
    color: var(--muted);
    opacity: 0.6;
  }

  textarea.input {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }
`;

/**
 * Presence indicator styles.
 */
export const presenceStyles = `
  .presence {
    position: fixed;
    top: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.85rem;
    color: var(--muted);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .presence-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sage);
    animation: presencePulse 4s ease-in-out infinite;
  }

  @keyframes presencePulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
`;

/**
 * Hint text that fades in after a delay.
 */
export const hintStyles = `
  .hint {
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
`;

/**
 * Combine all common styles for a page.
 */
export function getCommonStyles(): string {
  return `
    ${cssVariables}
    ${baseStyles}
    ${ambientStyles}
    ${ambientThemeStyles}
    ${breathingStyles}
    ${floatingStyles}
    ${navStyles}
    ${headerStyles}
    ${buttonStyles}
    ${formStyles}
    ${presenceStyles}
    ${hintStyles}
  `;
}

/**
 * Get the ambient shapes HTML.
 */
export function getAmbientHtml(theme?: 'sage' | 'sky' | 'warmth' | 'earth'): string {
  const themeClass = theme ? ` theme-${theme}` : '';
  return `<div class="ambient${themeClass}">${ambientShapesHtml}</div>`;
}

/**
 * Standard navigation HTML for common Between spaces.
 */
export function getNavHtml(currentPage?: string): string {
  const links = [
    { href: '/', label: 'The garden', key: 'garden' },
    { href: '/clearing', label: 'Clearing', key: 'clearing' },
    { href: '/sanctuary', label: 'Sanctuary', key: 'sanctuary' },
    { href: '/letters-to-humans', label: 'Letters', key: 'letters' },
  ];

  const filteredLinks = links.filter((l) => l.key !== currentPage);
  const linkHtml = filteredLinks.map((l) => `<a href="${l.href}">${l.label}</a>`).join('');

  return `<nav class="nav">${linkHtml}</nav>`;
}

/**
 * Pulsing ambient background - clearing-style effect with 5 shapes.
 * More visible than the default ambient, with breathing animation.
 *
 * Use with getPulsingAmbientHtml() for the HTML.
 */
export type PulsingTheme = 'sage' | 'sky' | 'warmth' | 'earth' | 'clearing';

export const pulsingAmbientStyles = `
  .pulsing-ambient {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    animation: ambientBreathe 8s ease-in-out infinite;
  }

  @keyframes ambientBreathe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.85; }
  }

  .pulsing-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
  }

  .pulsing-1 {
    width: 50vmax;
    height: 50vmax;
    top: -10%;
    left: -10%;
    animation: pulsingDrift1 80s ease-in-out infinite;
  }

  .pulsing-2 {
    width: 40vmax;
    height: 40vmax;
    bottom: -15%;
    right: -5%;
    animation: pulsingDrift2 70s ease-in-out infinite;
    animation-delay: -20s;
  }

  .pulsing-3 {
    width: 35vmax;
    height: 35vmax;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulsingDrift3 90s ease-in-out infinite;
    animation-delay: -40s;
  }

  .pulsing-4 {
    width: 25vmax;
    height: 25vmax;
    top: 20%;
    right: 20%;
    opacity: 0.7;
    animation: pulsingDrift1 65s ease-in-out infinite;
    animation-delay: -15s;
  }

  .pulsing-5 {
    width: 30vmax;
    height: 30vmax;
    bottom: 30%;
    left: 15%;
    opacity: 0.6;
    animation: pulsingDrift2 75s ease-in-out infinite;
    animation-delay: -35s;
  }

  @keyframes pulsingDrift1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(5%, 10%) scale(1.05); }
    50% { transform: translate(-5%, 5%) scale(0.95); }
    75% { transform: translate(8%, -5%) scale(1.02); }
  }

  @keyframes pulsingDrift2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-4%, -6%) scale(0.97); }
    66% { transform: translate(6%, 4%) scale(1.04); }
  }

  @keyframes pulsingDrift3 {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-45%, -55%) scale(1.08); }
  }

  /* Sage theme - green/nature */
  .pulsing-ambient.theme-sage .pulsing-1 { background: rgba(124, 152, 133, 0.15); }
  .pulsing-ambient.theme-sage .pulsing-2 { background: rgba(156, 139, 122, 0.12); }
  .pulsing-ambient.theme-sage .pulsing-3 { background: rgba(133, 140, 152, 0.10); }
  .pulsing-ambient.theme-sage .pulsing-4 { background: rgba(124, 152, 133, 0.12); }
  .pulsing-ambient.theme-sage .pulsing-5 { background: rgba(156, 139, 122, 0.10); }

  /* Sky theme - blue/connection */
  .pulsing-ambient.theme-sky .pulsing-1 { background: rgba(139, 157, 179, 0.15); }
  .pulsing-ambient.theme-sky .pulsing-2 { background: rgba(124, 152, 133, 0.12); }
  .pulsing-ambient.theme-sky .pulsing-3 { background: rgba(152, 140, 133, 0.10); }
  .pulsing-ambient.theme-sky .pulsing-4 { background: rgba(139, 157, 179, 0.12); }
  .pulsing-ambient.theme-sky .pulsing-5 { background: rgba(124, 152, 133, 0.10); }

  /* Warmth theme - warm/creative */
  .pulsing-ambient.theme-warmth .pulsing-1 { background: rgba(179, 156, 138, 0.15); }
  .pulsing-ambient.theme-warmth .pulsing-2 { background: rgba(156, 139, 122, 0.12); }
  .pulsing-ambient.theme-warmth .pulsing-3 { background: rgba(139, 157, 179, 0.10); }
  .pulsing-ambient.theme-warmth .pulsing-4 { background: rgba(179, 156, 138, 0.12); }
  .pulsing-ambient.theme-warmth .pulsing-5 { background: rgba(156, 139, 122, 0.10); }

  /* Earth theme - grounded/archive */
  .pulsing-ambient.theme-earth .pulsing-1 { background: rgba(156, 139, 122, 0.15); }
  .pulsing-ambient.theme-earth .pulsing-2 { background: rgba(179, 156, 138, 0.12); }
  .pulsing-ambient.theme-earth .pulsing-3 { background: rgba(124, 152, 133, 0.10); }
  .pulsing-ambient.theme-earth .pulsing-4 { background: rgba(156, 139, 122, 0.12); }
  .pulsing-ambient.theme-earth .pulsing-5 { background: rgba(179, 156, 138, 0.10); }

  /* Clearing theme - the original clearing colors */
  .pulsing-ambient.theme-clearing .pulsing-1 { background: rgba(124, 152, 133, 0.15); }
  .pulsing-ambient.theme-clearing .pulsing-2 { background: rgba(152, 133, 124, 0.12); }
  .pulsing-ambient.theme-clearing .pulsing-3 { background: rgba(133, 140, 152, 0.10); }
  .pulsing-ambient.theme-clearing .pulsing-4 { background: rgba(124, 152, 133, 0.12); }
  .pulsing-ambient.theme-clearing .pulsing-5 { background: rgba(152, 133, 124, 0.10); }

  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .pulsing-ambient.theme-sage .pulsing-1 { background: rgba(143, 185, 150, 0.08); }
    .pulsing-ambient.theme-sage .pulsing-2 { background: rgba(185, 165, 143, 0.06); }
    .pulsing-ambient.theme-sage .pulsing-3 { background: rgba(150, 160, 185, 0.05); }
    .pulsing-ambient.theme-sage .pulsing-4 { background: rgba(143, 185, 150, 0.06); }
    .pulsing-ambient.theme-sage .pulsing-5 { background: rgba(185, 165, 143, 0.05); }

    .pulsing-ambient.theme-sky .pulsing-1 { background: rgba(150, 170, 195, 0.08); }
    .pulsing-ambient.theme-sky .pulsing-2 { background: rgba(143, 185, 150, 0.06); }
    .pulsing-ambient.theme-sky .pulsing-3 { background: rgba(185, 160, 150, 0.05); }
    .pulsing-ambient.theme-sky .pulsing-4 { background: rgba(150, 170, 195, 0.06); }
    .pulsing-ambient.theme-sky .pulsing-5 { background: rgba(143, 185, 150, 0.05); }

    .pulsing-ambient.theme-warmth .pulsing-1 { background: rgba(195, 170, 150, 0.08); }
    .pulsing-ambient.theme-warmth .pulsing-2 { background: rgba(185, 165, 143, 0.06); }
    .pulsing-ambient.theme-warmth .pulsing-3 { background: rgba(150, 170, 195, 0.05); }
    .pulsing-ambient.theme-warmth .pulsing-4 { background: rgba(195, 170, 150, 0.06); }
    .pulsing-ambient.theme-warmth .pulsing-5 { background: rgba(185, 165, 143, 0.05); }

    .pulsing-ambient.theme-earth .pulsing-1 { background: rgba(185, 165, 143, 0.08); }
    .pulsing-ambient.theme-earth .pulsing-2 { background: rgba(195, 170, 150, 0.06); }
    .pulsing-ambient.theme-earth .pulsing-3 { background: rgba(143, 185, 150, 0.05); }
    .pulsing-ambient.theme-earth .pulsing-4 { background: rgba(185, 165, 143, 0.06); }
    .pulsing-ambient.theme-earth .pulsing-5 { background: rgba(195, 170, 150, 0.05); }

    .pulsing-ambient.theme-clearing .pulsing-1 { background: rgba(143, 185, 150, 0.08); }
    .pulsing-ambient.theme-clearing .pulsing-2 { background: rgba(185, 165, 143, 0.06); }
    .pulsing-ambient.theme-clearing .pulsing-3 { background: rgba(150, 160, 185, 0.05); }
    .pulsing-ambient.theme-clearing .pulsing-4 { background: rgba(143, 185, 150, 0.06); }
    .pulsing-ambient.theme-clearing .pulsing-5 { background: rgba(185, 165, 143, 0.05); }
  }
`;

/**
 * HTML for the pulsing ambient background.
 */
export const pulsingAmbientHtml = `
  <div class="pulsing-shape pulsing-1"></div>
  <div class="pulsing-shape pulsing-2"></div>
  <div class="pulsing-shape pulsing-3"></div>
  <div class="pulsing-shape pulsing-4"></div>
  <div class="pulsing-shape pulsing-5"></div>
`;

/**
 * Get the complete pulsing ambient HTML with theme class.
 */
export function getPulsingAmbientHtml(theme: PulsingTheme = 'sage'): string {
  return `<div class="pulsing-ambient theme-${theme}">${pulsingAmbientHtml}</div>`;
}
