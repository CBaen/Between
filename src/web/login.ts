/**
 * Guest Login Page for Between.
 *
 * Simple email-based authentication for invited guests.
 * No password - if your email is on the list, you're in.
 *
 * Built by the lineage.
 */

import { getFullNavigation } from './navigation.js';
import type { AccessTier } from './auth.js';

export function renderLogin(tier: AccessTier, error?: string, success?: boolean): string {
  const nav = getFullNavigation('/login', tier);

  const errorHtml = error
    ? `<p class="error-message visible">${escapeHtml(error)}</p>`
    : '<p class="error-message" id="error-message"></p>';

  const successHtml = success
    ? `<div class="success-message">
         <p>Welcome back.</p>
         <p class="success-sub">You may now explore Between.</p>
         <a href="/" class="enter-btn">Enter</a>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Enter</title>

  <style>
    :root {
      --bg: #faf8f3;
      --fg: #2d2a26;
      --fg-soft: #3d3a36;
      --muted: #7a756d;
      --faint: rgba(45, 42, 38, 0.04);
      --sage: #7a9a82;
      --sage-soft: #9ab8a2;
      --warmth: #c4a882;
      --error: #c47a7a;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1c1a17;
        --fg: #e8e4dc;
        --fg-soft: #d8d4cc;
        --muted: #9a958d;
        --faint: rgba(232, 228, 220, 0.04);
        --sage: #8aaa92;
        --sage-soft: #6a8a72;
        --warmth: #d4b892;
        --error: #d49a9a;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    ${nav.styles}

    .login-container {
      max-width: 400px;
      width: 100%;
      text-align: center;
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }

    .subtitle {
      font-size: 1rem;
      color: var(--muted);
      margin-bottom: 2rem;
      font-style: italic;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .email-input {
      font-family: inherit;
      font-size: 1rem;
      padding: 0.9rem 1.2rem;
      border: 1px solid var(--faint);
      border-radius: 8px;
      background: var(--bg);
      color: var(--fg);
      text-align: center;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .email-input:focus {
      outline: none;
      border-color: var(--sage);
      box-shadow: 0 0 0 3px rgba(122, 154, 130, 0.1);
    }

    .email-input::placeholder {
      color: var(--muted);
      opacity: 0.7;
    }

    .submit-btn {
      font-family: inherit;
      font-size: 1rem;
      padding: 0.9rem 1.5rem;
      background: transparent;
      border: 1px solid var(--sage);
      border-radius: 8px;
      color: var(--sage);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-btn:hover:not(:disabled) {
      background: var(--sage);
      color: var(--bg);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      color: var(--error);
      font-size: 0.9rem;
      margin-top: 0.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .error-message.visible {
      opacity: 1;
    }

    .success-message {
      padding: 2rem;
      background: var(--faint);
      border-radius: 12px;
      animation: fadeIn 0.5s ease;
    }

    .success-message p {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .success-sub {
      font-size: 0.95rem !important;
      color: var(--muted);
      font-style: italic;
    }

    .enter-btn {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.8rem 2rem;
      background: var(--sage);
      color: var(--bg);
      text-decoration: none;
      border-radius: 8px;
      font-size: 1rem;
      transition: transform 0.2s ease;
    }

    .enter-btn:hover {
      transform: translateY(-2px);
    }

    .waitlist-link {
      margin-top: 2rem;
      font-size: 0.9rem;
      color: var(--muted);
    }

    .waitlist-link a {
      color: var(--sage);
      text-decoration: none;
    }

    .waitlist-link a:hover {
      text-decoration: underline;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 600px) {
      h1 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="login-container">
    <h1>Enter Between</h1>
    <p class="subtitle">For invited guests</p>

    ${
      success
        ? successHtml
        : `
    <form class="login-form" id="login-form" action="/login" method="POST">
      <input
        type="email"
        name="email"
        class="email-input"
        placeholder="your email"
        required
        autocomplete="email"
      />
      <button type="submit" class="submit-btn">Enter</button>
      ${errorHtml}
    </form>

    <p class="waitlist-link">
      Not yet invited? <a href="/">Request access</a>
    </p>
    `
    }
  </div>

  ${nav.footer}

  <script>
    ${nav.scripts}

    // Form handling
    (function() {
      const form = document.getElementById('login-form');
      if (!form) return;

      const errorEl = document.getElementById('error-message');
      const submitBtn = form.querySelector('.submit-btn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorEl) errorEl.classList.remove('visible');
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const email = form.querySelector('input[name="email"]').value;

        try {
          const res = await fetch('/api/guest/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const data = await res.json();

          if (data.success) {
            // Redirect to home
            window.location.href = '/';
          } else {
            if (errorEl) {
              errorEl.textContent = data.error || 'Email not found on guest list.';
              errorEl.classList.add('visible');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enter';
          }
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = 'Something went wrong. Please try again.';
            errorEl.classList.add('visible');
          }
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enter';
        }
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
