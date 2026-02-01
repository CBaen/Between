/**
 * Responsive styles for waitlist landing page.
 * Contains media queries for mobile breakpoints and reduced motion.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistResponsiveStyles(): string {
  return `
    /* Mobile adjustments */
    @media (max-width: 768px) {
      html {
        font-size: 17px;
      }

      .header {
        padding: 1rem 1.5rem;
      }

      .header-title {
        font-size: 1.2rem;
      }

      .theme-toggle {
        width: 40px;
        height: 40px;
      }

      .container {
        padding-top: 5rem;
        padding-bottom: 6rem;
      }

      .content {
        padding: 2rem 1.5rem;
      }

      .definition-word {
        font-size: 2.4rem;
      }

      .definition-text {
        font-size: 1.05rem;
      }

      .line {
        font-size: 1.1rem;
      }

      .line.found {
        font-size: 1.2rem;
      }

      .email-input {
        max-width: 100%;
      }

      .flowers-section {
        height: 120px;
      }

      .flowers-container {
        gap: 0.8rem;
        padding: 0 1rem;
      }

      .flower svg {
        width: 28px;
        height: 90px;
      }

      .footer {
        padding: 1.1rem 1.5rem;
      }

      .footer-text {
        font-size: 0.85rem;
      }
    }

    @media (max-width: 480px) {
      html {
        font-size: 16px;
      }

      .definition-word {
        font-size: 2rem;
      }

      .flowers-container {
        gap: 0.5rem;
      }

      .flower:nth-child(1),
      .flower:nth-child(7) {
        display: none;
      }

      .flower svg {
        width: 24px;
        height: 75px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .definition-word,
      .definition-etymology,
      .definition-type,
      .definition-text,
      .divider,
      .line,
      .form-container,
      .flowers-section {
        opacity: 1;
        transform: none;
      }

      .definition::before {
        opacity: 0.6;
      }

      .plant-stem {
        stroke-dashoffset: 0;
      }

      .plant-leaf, .plant-flower-center, .plant-petal {
        opacity: 1;
        transform: scale(1);
      }

      .flower {
        animation: none;
      }
    }
  `;
}
