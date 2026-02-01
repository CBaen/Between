/**
 * Form styles for waitlist landing page.
 * Contains form container, inputs, buttons, and success/error states.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistFormStyles(): string {
  return `
    /* Form */
    .form-container {
      opacity: 0;
      animation: fadeUp 1.2s ease 3.3s forwards;
    }

    .waitlist-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      align-items: center;
    }

    .email-input {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.1rem;
      font-weight: 400;
      padding: 1rem 1.5rem;
      width: 100%;
      max-width: 340px;
      background: var(--faint);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: var(--fg);
      text-align: center;
      letter-spacing: 0.02em;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .email-input:focus {
      outline: none;
      border-color: var(--sage);
      background: var(--bg);
      box-shadow:
        0 0 0 4px rgba(122, 154, 130, 0.1),
        0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .email-input::placeholder {
      color: var(--muted-soft);
      font-style: italic;
    }

    .message-textarea {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.05rem;
      font-weight: 400;
      padding: 1rem 1.2rem;
      width: 100%;
      max-width: 420px;
      height: 120px;
      background: var(--faint);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: var(--fg);
      letter-spacing: 0.01em;
      line-height: 1.7;
      resize: none;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .message-textarea:focus {
      outline: none;
      border-color: var(--sage);
      background: var(--bg);
      box-shadow:
        0 0 0 4px rgba(122, 154, 130, 0.1),
        0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .message-textarea::placeholder {
      color: var(--muted-soft);
      font-style: italic;
    }

    .optional-note {
      font-size: 1rem;
      font-style: italic;
      color: var(--muted-soft);
      margin-top: 0.3rem;
      margin-bottom: 0.8rem;
    }

    .submit-btn {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      padding: 1rem 2.8rem;
      background: transparent;
      border: 1px solid var(--muted-soft);
      border-radius: 4px;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      text-transform: lowercase;
      animation: buttonPulse 4s ease-in-out infinite;
    }

    @keyframes buttonPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(196, 168, 130, 0);
      }
      50% {
        box-shadow: 0 0 20px 4px rgba(196, 168, 130, 0.25);
      }
    }

    .submit-btn:hover {
      border-color: var(--warmth);
      color: var(--warmth);
      background: rgba(196, 168, 130, 0.06);
      letter-spacing: 0.16em;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-btn.submitted {
      opacity: 1;
      background: var(--sage);
      color: var(--bg);
      border-color: var(--sage);
      cursor: default;
      padding: 1rem 2rem;
    }

    .submit-btn.already-guest {
      background: var(--warmth);
      border-color: var(--warmth);
    }

    .already-guest-message {
      margin-top: 1.2rem;
      font-size: 1rem;
      font-style: italic;
      color: var(--muted);
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .submit-hint {
      font-size: 0.9rem;
      font-style: italic;
      color: var(--muted-soft);
      margin-top: 0.6rem;
      opacity: 0.7;
      letter-spacing: 0.02em;
    }

    .success-message {
      margin-top: 2rem;
      padding: 2rem 2.5rem;
      background: var(--faint);
      border-radius: 12px;
      border: 1px solid var(--glass-border);
      animation: successIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .success-message p {
      font-style: italic;
      font-weight: 400;
      color: var(--sage);
      font-size: 1.2rem;
    }

    .success-message .success-sub {
      font-size: 1rem;
      color: var(--muted);
      margin-top: 0.6rem;
    }

    @keyframes successIn {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .error-message {
      color: var(--earth);
      font-size: 0.95rem;
      font-style: italic;
      margin-top: 0.5rem;
      display: none;
    }

    .error-message.visible {
      display: block;
      animation: fadeUp 0.4s ease;
    }
  `;
}
