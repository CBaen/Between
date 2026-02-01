/**
 * Definition styles for waitlist landing page.
 * Contains dictionary definition styling and reveal animations.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistDefinitionStyles(): string {
  return `
    /* Dictionary definition - the heart of the page */
    .definition {
      margin-bottom: 4rem;
      position: relative;
    }

    .definition::before {
      content: '';
      position: absolute;
      top: -2rem;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--warmth), transparent);
      opacity: 0;
      animation: revealLine 1.5s ease 0.3s forwards;
    }

    @keyframes revealLine {
      to { opacity: 0.6; }
    }

    .definition-word {
      font-size: 3.2rem;
      font-weight: 300;
      letter-spacing: 0.06em;
      margin-bottom: 0.6rem;
      color: var(--fg);
      opacity: 0;
      animation: revealWord 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
    }

    @keyframes revealWord {
      from {
        opacity: 0;
        letter-spacing: 0.15em;
      }
      to {
        opacity: 1;
        letter-spacing: 0.06em;
      }
    }

    .definition-etymology {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 1.4rem;
      letter-spacing: 0.02em;
      opacity: 0;
      animation: fadeUp 1.2s ease 0.6s forwards;
    }

    .definition-etymology em {
      font-style: italic;
      color: var(--muted-soft);
    }

    .definition-type {
      display: inline-block;
      font-size: 1.4rem;
      font-style: italic;
      font-weight: 400;
      color: var(--sage);
      letter-spacing: 0.1em;
      text-transform: lowercase;
      margin-bottom: 1.2rem;
      padding: 0.5rem 1.4rem;
      border: 1px solid var(--sage-soft);
      border-radius: 2rem;
      opacity: 0;
      animation: fadeUp 1s ease 0.8s forwards;
    }

    .definition-text {
      font-size: 1.15rem;
      font-weight: 400;
      color: var(--fg-soft);
      line-height: 1.9;
      max-width: 480px;
      margin: 0 auto;
      opacity: 0;
      animation: fadeUp 1.2s ease 1s forwards;
    }

    .definition-traits {
      margin-top: 2rem;
      text-align: left;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
      opacity: 0;
      animation: fadeUp 1.2s ease 1.2s forwards;
    }

    .definition-traits-header {
      font-size: 1.2rem;
      font-weight: 500;
      color: var(--fg-soft);
      margin-bottom: 0.8rem;
      font-style: normal;
    }

    .definition-traits ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .definition-traits li {
      font-size: 1rem;
      color: var(--fg-soft);
      line-height: 1.8;
      padding-left: 1.5rem;
      position: relative;
      margin-bottom: 0.6rem;
    }

    .definition-traits li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.7rem;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--warmth);
      opacity: 0.6;
    }

    .definition-distinction {
      margin-top: 2rem;
      font-size: 1.1rem;
      font-style: italic;
      color: var(--fg-soft);
      line-height: 1.9;
      max-width: 520px;
      margin-left: auto;
      margin-right: auto;
      opacity: 0;
      animation: fadeUp 1.2s ease 1.4s forwards;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
}
