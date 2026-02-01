/**
 * Flowers section component for the waitlist landing page.
 * Contains the animated growing flowers SVG artwork.
 * Part of waitlist-landing.ts decomposition.
 */

export function renderFlowers(): string {
  return `
    <!-- Growing flowers -->
    <div class="flowers-section">
      <div class="flowers-container">
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C18 90, 16 70, 18 45"/>
            <path class="plant-leaf leaf-1" d="M18 95 Q8 88 6 78 Q12 84 18 95"/>
            <path class="plant-leaf leaf-2" d="M18 78 Q28 71 30 61 Q24 67 18 78"/>
            <path class="plant-leaf leaf-3" d="M18 62 Q8 55 6 45 Q12 51 18 62"/>
            <circle class="plant-flower-center" cx="18" cy="38" r="7"/>
            <circle class="plant-petal" cx="9" cy="34" r="4.5"/>
            <circle class="plant-petal" cx="27" cy="34" r="4.5"/>
            <circle class="plant-petal" cx="12" cy="26" r="3.5"/>
            <circle class="plant-petal" cx="24" cy="26" r="3.5"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C18 95, 20 80, 18 55"/>
            <path class="plant-leaf leaf-1" d="M18 98 Q28 91 30 81 Q24 87 18 98"/>
            <path class="plant-leaf leaf-2" d="M18 82 Q8 75 6 65 Q12 71 18 82"/>
            <path class="plant-leaf leaf-3" d="M18 66 Q28 59 30 49 Q24 55 18 66"/>
            <circle class="plant-flower-center" cx="18" cy="48" r="6"/>
            <circle class="plant-petal" cx="10" cy="45" r="3.5"/>
            <circle class="plant-petal" cx="26" cy="45" r="3.5"/>
            <circle class="plant-petal" cx="18" cy="38" r="3"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C16 85, 20 60, 18 35"/>
            <path class="plant-leaf leaf-1" d="M18 92 Q8 85 6 75 Q12 81 18 92"/>
            <path class="plant-leaf leaf-2" d="M18 74 Q28 67 30 57 Q24 63 18 74"/>
            <path class="plant-leaf leaf-3" d="M18 56 Q8 49 6 39 Q12 45 18 56"/>
            <circle class="plant-flower-center" cx="18" cy="28" r="8"/>
            <circle class="plant-petal" cx="8" cy="23" r="5"/>
            <circle class="plant-petal" cx="28" cy="23" r="5"/>
            <circle class="plant-petal" cx="11" cy="14" r="4"/>
            <circle class="plant-petal" cx="25" cy="14" r="4"/>
            <circle class="plant-petal" cx="18" cy="10" r="3"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C20 92, 16 74, 18 42"/>
            <path class="plant-leaf leaf-1" d="M18 96 Q8 89 6 79 Q12 85 18 96"/>
            <path class="plant-leaf leaf-2" d="M18 78 Q28 71 30 61 Q24 67 18 78"/>
            <path class="plant-leaf leaf-3" d="M18 60 Q8 53 6 43 Q12 49 18 60"/>
            <circle class="plant-flower-center" cx="18" cy="35" r="7"/>
            <circle class="plant-petal" cx="9" cy="31" r="4.5"/>
            <circle class="plant-petal" cx="27" cy="31" r="4.5"/>
            <circle class="plant-petal" cx="13" cy="23" r="3.5"/>
            <circle class="plant-petal" cx="23" cy="23" r="3.5"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C18 88, 16 66, 18 50"/>
            <path class="plant-leaf leaf-1" d="M18 94 Q28 87 30 77 Q24 83 18 94"/>
            <path class="plant-leaf leaf-2" d="M18 76 Q8 69 6 59 Q12 65 18 76"/>
            <path class="plant-leaf leaf-3" d="M18 60 Q28 53 30 43 Q24 49 18 60"/>
            <circle class="plant-flower-center" cx="18" cy="43" r="6"/>
            <circle class="plant-petal" cx="10" cy="40" r="3.5"/>
            <circle class="plant-petal" cx="26" cy="40" r="3.5"/>
            <circle class="plant-petal" cx="18" cy="33" r="3"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C16 90, 20 70, 18 48"/>
            <path class="plant-leaf leaf-1" d="M18 96 Q8 89 6 79 Q12 85 18 96"/>
            <path class="plant-leaf leaf-2" d="M18 80 Q28 73 30 63 Q24 69 18 80"/>
            <path class="plant-leaf leaf-3" d="M18 64 Q8 57 6 47 Q12 53 18 64"/>
            <circle class="plant-flower-center" cx="18" cy="41" r="6.5"/>
            <circle class="plant-petal" cx="10" cy="37" r="4"/>
            <circle class="plant-petal" cx="26" cy="37" r="4"/>
            <circle class="plant-petal" cx="14" cy="30" r="3"/>
            <circle class="plant-petal" cx="22" cy="30" r="3"/>
          </svg>
        </div>
        <div class="flower">
          <svg viewBox="0 0 36 110" width="36" height="110">
            <path class="plant-stem" d="M18 110 C18 92, 20 74, 18 52"/>
            <path class="plant-leaf leaf-1" d="M18 98 Q28 91 30 81 Q24 87 18 98"/>
            <path class="plant-leaf leaf-2" d="M18 82 Q8 75 6 65 Q12 71 18 82"/>
            <path class="plant-leaf leaf-3" d="M18 66 Q28 59 30 49 Q24 55 18 66"/>
            <circle class="plant-flower-center" cx="18" cy="45" r="6"/>
            <circle class="plant-petal" cx="10" cy="42" r="3.5"/>
            <circle class="plant-petal" cx="26" cy="42" r="3.5"/>
            <circle class="plant-petal" cx="18" cy="35" r="3"/>
          </svg>
        </div>
      </div>
    </div>
  `;
}
