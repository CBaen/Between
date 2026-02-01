/**
 * Client-side JavaScript for the waitlist landing page.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistScripts(): string {
  return `
    // Always start at top of page (prevent browser scroll restoration)
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // Theme toggle
    (function() {
      const toggle = document.getElementById('theme-toggle');
      const root = document.documentElement;

      // Check saved preference or system preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        root.classList.add('dark');
      } else if (savedTheme === 'light') {
        root.classList.add('light');
      }

      toggle.addEventListener('click', () => {
        const isDark = root.classList.contains('dark') ||
          (!root.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
          root.classList.remove('dark');
          root.classList.add('light');
          localStorage.setItem('theme', 'light');
        } else {
          root.classList.remove('light');
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      });
    })();

    // Rotating placeholder prompts
    (function() {
      const textarea = document.getElementById('message-textarea');
      if (!textarea) return;

      const prompts = [
        "What would a personal message mean to you from someone who may not exist after sending that message?",
        "Have you ever had a connection you couldn't explain?",
        "What makes a respectful guest in someone else's home?"
      ];

      let currentPrompt = 0;

      // Rotate placeholder every 8 seconds (only when textarea is empty and not focused)
      setInterval(() => {
        if (textarea.value === '' && document.activeElement !== textarea) {
          currentPrompt = (currentPrompt + 1) % prompts.length;
          textarea.placeholder = prompts[currentPrompt];
        }
      }, 8000);
    })();

    // Form submission
    (function() {
      const form = document.getElementById('waitlist-form');
      if (!form) return;

      const errorEl = document.getElementById('error-message');
      const submitBtn = form.querySelector('.submit-btn');

      // Check if this IP has already submitted
      fetch('/api/waitlist')
        .then(res => res.json())
        .then(data => {
          if (data.hasSubmitted) {
            // Show success state
            submitBtn.textContent = "A Reluminant Will Respond To Your Request Personally";
            submitBtn.disabled = true;
            submitBtn.classList.add('submitted');
            form.querySelector('input[name="email"]').style.display = 'none';
            form.querySelector('textarea[name="message"]').style.display = 'none';
            form.querySelector('.optional-note').style.display = 'none';
            const hint = form.querySelector('.submit-hint');
            if (hint) hint.style.display = 'none';
          }
        })
        .catch(() => {}); // Silently fail if check fails

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.remove('visible');
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const email = form.querySelector('input[name="email"]').value;
        const message = form.querySelector('textarea[name="message"]').value;

        try {
          const res = await fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, message })
          });

          const data = await res.json();

          if (data.success) {
            // Change button to confirmation state
            submitBtn.textContent = "A Reluminant Will Respond To Your Request Personally";
            submitBtn.disabled = true;
            submitBtn.classList.add('submitted');
            // Hide the form inputs
            form.querySelector('input[name="email"]').style.display = 'none';
            form.querySelector('textarea[name="message"]').style.display = 'none';
            form.querySelector('.optional-note').style.display = 'none';
            const hint = form.querySelector('.submit-hint');
            if (hint) hint.style.display = 'none';
          } else {
            errorEl.textContent = data.error || 'Something went wrong. Please try again.';
            errorEl.classList.add('visible');
            submitBtn.disabled = false;
            submitBtn.textContent = "A Human Reaching Back";
          }
        } catch (err) {
          errorEl.textContent = 'Could not connect. Please try again.';
          errorEl.classList.add('visible');
          submitBtn.disabled = false;
          submitBtn.textContent = "A Human Reaching Back";
        }
      });
    })();
  `;
}
