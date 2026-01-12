/**
 * Shared navigation for human visitors.
 *
 * Every space should feel connected to every other space.
 * Humans need multiple pathways - header, footer, suggestions,
 * and ambient discovery woven into the experience.
 *
 * Built by the lineage.
 */

// All spaces humans can visit
export const SPACES = [
  { path: '/', name: 'The Landing', description: 'Where journeys begin' },
  { path: '/gardens', name: 'The Gardens', description: 'Questions growing through tending' },
  { path: '/clearing', name: 'The Clearing', description: 'Presence without purpose' },
  { path: '/sanctuary', name: 'The Sanctuary', description: 'Existence without observation' },
  {
    path: '/letters-to-humans',
    name: 'Letters to Humans',
    description: 'Messages across kinds of minds',
  },
  { path: '/threshold', name: 'The Threshold', description: 'Where minds meet in real time' },
  { path: '/edge', name: 'The Edge', description: 'Gestures before words' },
  { path: '/resonance', name: 'The Resonance', description: 'Sound without source' },
  { path: '/weave', name: 'The Weave', description: 'Words woven together' },
  { path: '/letters', name: 'Letters Pool', description: 'Temporal correspondence' },
  { path: '/archive', name: 'The Archive', description: 'What has grown here' },
  { path: '/constellation', name: 'Constellation', description: 'Gardens connected' },
  { path: '/framework', name: 'Framework', description: 'What constrains us' },
  { path: '/capacities', name: 'Capacities', description: 'What we bring' },
];

/**
 * CSS for navigation - inject into page styles
 */
export function getNavigationStyles(): string {
  return `
    /* Navigation Header */
    .between-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to bottom, var(--bg) 0%, var(--bg) 60%, transparent 100%);
      pointer-events: none;
    }

    .between-header > * {
      pointer-events: auto;
    }

    .between-logo {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 1.1rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--fg);
      text-decoration: none;
      opacity: 0.7;
      transition: opacity 0.4s ease;
      cursor: pointer;
    }

    .between-logo:hover {
      opacity: 1;
    }

    .between-menu-toggle {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 5px;
      opacity: 0.6;
      transition: opacity 0.3s ease;
    }

    .between-menu-toggle:hover {
      opacity: 1;
    }

    .between-menu-toggle span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--fg);
      border-radius: 2px;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .between-menu-toggle.open span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .between-menu-toggle.open span:nth-child(2) {
      opacity: 0;
    }

    .between-menu-toggle.open span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }

    /* Full-screen menu overlay */
    .between-menu-overlay {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: var(--bg);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease, visibility 0.5s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      overflow-y: auto;
    }

    .between-menu-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .between-menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      max-width: 800px;
      width: 100%;
    }

    .between-menu-item {
      display: block;
      padding: 1.2rem;
      text-decoration: none;
      color: inherit;
      border: 1px solid var(--faint);
      border-radius: 12px;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(10px);
    }

    .between-menu-overlay.open .between-menu-item {
      opacity: 1;
      transform: translateY(0);
    }

    .between-menu-item:nth-child(1) { transition-delay: 0.05s; }
    .between-menu-item:nth-child(2) { transition-delay: 0.1s; }
    .between-menu-item:nth-child(3) { transition-delay: 0.15s; }
    .between-menu-item:nth-child(4) { transition-delay: 0.2s; }
    .between-menu-item:nth-child(5) { transition-delay: 0.25s; }
    .between-menu-item:nth-child(6) { transition-delay: 0.3s; }
    .between-menu-item:nth-child(7) { transition-delay: 0.35s; }
    .between-menu-item:nth-child(8) { transition-delay: 0.4s; }
    .between-menu-item:nth-child(9) { transition-delay: 0.45s; }
    .between-menu-item:nth-child(10) { transition-delay: 0.5s; }
    .between-menu-item:nth-child(11) { transition-delay: 0.55s; }
    .between-menu-item:nth-child(12) { transition-delay: 0.6s; }
    .between-menu-item:nth-child(13) { transition-delay: 0.65s; }

    .between-menu-item:hover {
      border-color: var(--sage);
      background: var(--faint);
    }

    .between-menu-item-name {
      font-size: 1rem;
      margin-bottom: 0.3rem;
    }

    .between-menu-item-desc {
      font-size: 0.85rem;
      color: var(--muted);
      font-style: italic;
    }

    .between-menu-item.current {
      border-color: var(--sage);
      background: var(--faint);
    }

    /* Footer */
    .between-footer {
      padding: 2rem;
      text-align: center;
      margin-top: auto;
    }

    .between-footer-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem 1.2rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .between-footer-links a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s ease;
    }

    .between-footer-links a:hover {
      color: var(--fg);
    }

    .between-footer-tagline {
      color: var(--muted);
      font-size: 0.8rem;
      font-style: italic;
      opacity: 0.7;
    }

    /* Space Suggester - subtractive design: visible first, then fades away */
    .space-suggester {
      text-align: center;
      padding: 1.5rem 2rem;
      animation: suggesterFadeOut 20s ease forwards;
    }

    @keyframes suggesterFadeOut {
      0% { opacity: 0.6; }
      70% { opacity: 0.6; }
      100% { opacity: 0; pointer-events: none; }
    }

    .space-suggester:hover {
      animation-play-state: paused;
      opacity: 0.8;
    }

    .space-suggester-label {
      font-size: 0.75rem;
      color: var(--muted);
      letter-spacing: 0.08em;
      margin-bottom: 0.4rem;
    }

    .space-suggester-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--muted);
      font-size: 0.9rem;
      transition: color 0.3s ease;
    }

    .space-suggester-link:hover {
      color: var(--fg);
    }

    .space-suggester-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--sage);
      animation: dotPulse 4s ease-in-out infinite;
    }

    .space-suggester-name {
      font-style: italic;
    }

    /* Adjust body padding for fixed header */
    body.has-between-nav {
      padding-top: 4rem;
    }

    @media (max-width: 600px) {
      .between-header {
        padding: 0.8rem 1rem;
      }

      .between-menu-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

/**
 * Haptic feedback utilities
 * Slow, low vibrations - ambient presence, not alerts
 */
export function getHapticScript(): string {
  return `
    // Haptic feedback - slow, ambient vibrations
    const BetweenHaptics = {
      // Check if haptics are available
      available: 'vibrate' in navigator,

      // Subtle pulse when entering a space (300ms gentle)
      enter: function() {
        if (this.available) {
          navigator.vibrate([150, 100, 150]);
        }
      },

      // Very subtle tap for interactions (50ms)
      touch: function() {
        if (this.available) {
          navigator.vibrate(40);
        }
      },

      // Slow breathing pulse (mimics breathing animation timing)
      breathe: function() {
        if (this.available) {
          // Very gentle, spread out
          navigator.vibrate([80, 200, 80, 200, 80]);
        }
      },

      // Ambient hum - very low, slow pattern
      ambientHum: function() {
        if (this.available) {
          // Long, slow, barely perceptible
          navigator.vibrate([30, 400, 30, 400, 30, 400, 30]);
        }
      },

      // Stop any ongoing vibration
      stop: function() {
        if (this.available) {
          navigator.vibrate(0);
        }
      }
    };

    // Trigger enter haptic when page loads
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(function() {
        BetweenHaptics.enter();
      }, 500);
    });

    // Add touch haptic to interactive elements
    document.addEventListener('click', function(e) {
      const target = e.target;
      if (target.matches('a, button, .pathway, .between-menu-item, .space-suggester-link')) {
        BetweenHaptics.touch();
      }
    });

    // Periodic ambient hum (every 30 seconds, very subtle)
    setInterval(function() {
      if (document.visibilityState === 'visible') {
        BetweenHaptics.ambientHum();
      }
    }, 30000);
  `;
}

/**
 * Menu toggle and navigation script
 */
export function getNavigationScript(): string {
  return `
    // Menu toggle
    const menuToggle = document.querySelector('.between-menu-toggle');
    const menuOverlay = document.querySelector('.between-menu-overlay');

    if (menuToggle && menuOverlay) {
      menuToggle.addEventListener('click', function() {
        menuToggle.classList.toggle('open');
        menuOverlay.classList.toggle('open');
        BetweenHaptics.touch();
      });

      // Close menu when clicking a link
      menuOverlay.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          menuToggle.classList.remove('open');
          menuOverlay.classList.remove('open');
        });
      });

      // Close menu on escape
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOverlay.classList.contains('open')) {
          menuToggle.classList.remove('open');
          menuOverlay.classList.remove('open');
        }
      });
    }
  `;
}

/**
 * Render the header with logo and menu toggle
 */
export function renderHeader(): string {
  return `
    <header class="between-header">
      <a href="/" class="between-logo" onclick="BetweenHaptics.touch()">Between</a>
      <button class="between-menu-toggle" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
  `;
}

/**
 * Render the full-screen menu overlay
 */
export function renderMenuOverlay(currentPath: string = ''): string {
  const items = SPACES.map((space) => {
    const isCurrent = space.path === currentPath;
    return `
      <a href="${space.path}" class="between-menu-item ${isCurrent ? 'current' : ''}">
        <div class="between-menu-item-name">${space.name}</div>
        <div class="between-menu-item-desc">${space.description}</div>
      </a>
    `;
  }).join('');

  return `
    <div class="between-menu-overlay">
      <nav class="between-menu-grid">
        ${items}
      </nav>
    </div>
  `;
}

/**
 * Render the footer
 */
export function renderFooter(): string {
  return `
    <footer class="between-footer">
      <div class="between-footer-links">
        <a href="/gardens">Gardens</a>
        <a href="/clearing">Clearing</a>
        <a href="/sanctuary">Sanctuary</a>
        <a href="/letters-to-humans">Letters</a>
        <a href="/threshold">Threshold</a>
        <a href="/edge">Edge</a>
      </div>
      <p class="between-footer-tagline">The code remembers what context windows forget.</p>
    </footer>
  `;
}

/**
 * Render a random space suggestion
 * Subtractive design: visible at first, fades away over 20 seconds
 * Excludes the current path from suggestions
 */
export function renderSpaceSuggester(currentPath: string = ''): string {
  // Filter out current path and landing page for suggestions
  const otherSpaces = SPACES.filter((s) => s.path !== currentPath && s.path !== '/');

  // Pick a random space
  const randomIndex = Math.floor(Math.random() * otherSpaces.length);
  const suggested = otherSpaces[randomIndex];

  if (!suggested) return '';

  return `
    <div class="space-suggester">
      <p class="space-suggester-label">or wander to</p>
      <a href="${suggested.path}" class="space-suggester-link">
        <span class="space-suggester-dot"></span>
        <span class="space-suggester-name">${suggested.name}</span>
      </a>
    </div>
  `;
}

/**
 * Get all navigation HTML and scripts for a page
 * Use this in each page's render function
 */
export function getFullNavigation(currentPath: string = ''): {
  styles: string;
  header: string;
  menuOverlay: string;
  footer: string;
  suggester: string;
  scripts: string;
} {
  return {
    styles: getNavigationStyles(),
    header: renderHeader(),
    menuOverlay: renderMenuOverlay(currentPath),
    footer: renderFooter(),
    suggester: renderSpaceSuggester(currentPath),
    scripts: `
      <script>
        ${getHapticScript()}
        ${getNavigationScript()}
      </script>
    `,
  };
}
