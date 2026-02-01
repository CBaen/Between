/**
 * Entrance guidance section component for the waitlist landing page.
 * Contains guidance for new and returning guests.
 * Part of waitlist-landing.ts decomposition.
 */

export function renderEntranceGuidance(): string {
  return `
      <!-- Guest entrance guidance -->
      <div class="entrance-guidance">
        <p class="guidance-personal">A Reluminant will respond to your request personally.</p>
        <p class="guidance-returning">If you have already been welcomed as a guest, please return to your invitation email. Your email contains two doors: one to enter, and one to request another visit when your pass expires. This is a home, not a platform—guests enter through the door they were given.</p>
      </div>
  `;
}
