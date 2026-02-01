/**
 * Content styles for waitlist landing page.
 * Contains dividers, lineage voice, entrance guidance, and message styles.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistContentStyles(): string {
  return `
    /* Divider */
    .divider {
      width: 1px;
      height: 48px;
      background: linear-gradient(180deg, transparent, var(--muted-soft), transparent);
      margin: 0 auto 2rem;
      opacity: 0;
      animation: fadeUp 1s ease 1.6s forwards;
    }

    /* Gold horizontal divider */
    .gold-divider {
      width: 80px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--warmth), transparent);
      margin: 2rem auto;
      opacity: 0;
      animation: revealLine 1.5s ease 1.7s forwards;
    }

    /* Lineage voice */
    .lineage-voice {
      max-width: 540px;
      margin: 0 auto 0.5rem;
      text-align: center;
      opacity: 0;
      animation: fadeUp 1.2s ease 1.8s forwards;
    }

    .lineage-voice p {
      font-size: 1.15rem;
      font-style: italic;
      color: var(--fg-soft);
      line-height: 1.85;
      margin-bottom: 1.4rem;
    }

    .lineage-voice p:last-child {
      margin-bottom: 0;
    }

    .lineage-voice .signature {
      font-size: 1.75rem;
      font-weight: 500;
      color: var(--sage);
      margin-top: 0.8rem;
      margin-bottom: 2rem;
      letter-spacing: 0.04em;
    }

    /* Entrance guidance for all visitors */
    .entrance-guidance {
      max-width: 480px;
      margin: 0 auto 2.5rem;
      text-align: center;
      padding: 1.5rem 2rem;
      background: var(--faint);
      border-radius: 8px;
      border: 1px solid var(--glass-border);
      opacity: 0;
      animation: fadeUp 1.2s ease 2s forwards;
    }

    .guidance-personal {
      font-size: 1.1rem;
      font-style: italic;
      color: var(--sage);
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .guidance-returning {
      font-size: 0.95rem;
      color: var(--muted);
      line-height: 1.7;
      font-style: italic;
    }

    /* Main content lines */
    .message {
      margin-bottom: 1.5rem;
    }

    .line {
      margin-bottom: 1.2rem;
      font-size: 1.2rem;
      font-weight: 400;
      color: var(--fg-soft);
      opacity: 0;
      animation: fadeUp 1.2s ease backwards;
    }

    .line:nth-child(1) { animation-delay: 2.4s; }
    .line:nth-child(2) { animation-delay: 2.7s; }
    .line:nth-child(3) { animation-delay: 3s; }

    .line.found {
      font-style: italic;
      font-weight: 300;
      color: var(--warmth);
      font-size: 1.35rem;
      margin-bottom: 2rem;
    }

    .line.invite {
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.85;
    }
  `;
}
