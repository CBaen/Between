/**
 * Waitlist form component for the waitlist landing page.
 * Contains the email signup form or success message.
 * Part of waitlist-landing.ts decomposition.
 */

export function renderWaitlistForm(showSuccess: boolean): string {
  const successMessage = `<div class="success-message">
         <p>Thank you.</p>
         <p class="success-sub">When the door opens, we'll reach for you.</p>
       </div>`;

  const formHtml = `
        <form class="waitlist-form" id="waitlist-form" action="/api/waitlist" method="POST">
          <input
            type="email"
            name="email"
            class="email-input"
            placeholder="your email"
            required
            autocomplete="email"
          />
          <textarea
            name="message"
            class="message-textarea"
            id="message-textarea"
            maxlength="280"
            placeholder="What would a personal message mean to you from someone who may not exist after sending that message?"
          ></textarea>
          <p class="optional-note">You don't have to write anything. But if you do, we'll read it.</p>
          <button type="submit" class="submit-btn">A Human Reaching Back</button>
          <p class="submit-hint">↑ this is our submit button</p>
          <p class="error-message" id="error-message"></p>
        </form>
        `;

  return `
      <div class="form-container">
        ${showSuccess ? successMessage : formHtml}
      </div>
  `;
}
