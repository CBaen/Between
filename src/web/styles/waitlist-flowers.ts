/**
 * Flower styles for waitlist landing page.
 * Contains growing flowers section, plant elements, and bloom animations.
 * Part of waitlist-landing.ts decomposition.
 */

export function getWaitlistFlowerStyles(): string {
  return `
    /* Growing flowers section */
    .flowers-section {
      width: 100%;
      height: 140px;
      position: relative;
      overflow: visible;
      margin-top: auto;
      opacity: 0;
      animation: fadeUp 1.5s ease 3.6s forwards;
    }

    .flowers-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 1.5rem;
      padding: 0 2rem;
    }

    .flower {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: gentleSway 6s ease-in-out infinite;
    }

    .flower:nth-child(1) { animation-delay: 0s; }
    .flower:nth-child(2) { animation-delay: -1.2s; }
    .flower:nth-child(3) { animation-delay: -0.6s; }
    .flower:nth-child(4) { animation-delay: -1.8s; }
    .flower:nth-child(5) { animation-delay: -0.3s; }
    .flower:nth-child(6) { animation-delay: -2.4s; }
    .flower:nth-child(7) { animation-delay: -0.9s; }

    @keyframes gentleSway {
      0%, 100% { transform: rotate(-1.5deg); }
      50% { transform: rotate(1.5deg); }
    }

    .flower svg {
      overflow: visible;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
    }

    .plant-stem {
      stroke: var(--sage);
      stroke-width: 1.5;
      stroke-linecap: round;
      fill: none;
      stroke-dasharray: 80;
      stroke-dashoffset: 80;
      animation: growStem 2.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .plant-leaf {
      fill: var(--sage);
      opacity: 0;
      transform-origin: center bottom;
      animation: growLeaf 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .plant-flower-center {
      fill: var(--warmth);
      opacity: 0;
      transform-origin: center;
      animation: bloomFlower 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .plant-petal {
      fill: var(--warmth-glow);
      opacity: 0;
      transform-origin: center;
      animation: bloomPetal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    /* Stagger animations for each flower */
    .flower:nth-child(1) .plant-stem { animation-delay: 4s; }
    .flower:nth-child(1) .leaf-1 { animation-delay: 5.2s; }
    .flower:nth-child(1) .leaf-2 { animation-delay: 5.5s; }
    .flower:nth-child(1) .leaf-3 { animation-delay: 5.8s; }
    .flower:nth-child(1) .plant-flower-center { animation-delay: 6.2s; }
    .flower:nth-child(1) .plant-petal { animation-delay: 6.5s; }

    .flower:nth-child(2) .plant-stem { animation-delay: 4.2s; }
    .flower:nth-child(2) .leaf-1 { animation-delay: 5.4s; }
    .flower:nth-child(2) .leaf-2 { animation-delay: 5.7s; }
    .flower:nth-child(2) .leaf-3 { animation-delay: 6s; }
    .flower:nth-child(2) .plant-flower-center { animation-delay: 6.4s; }
    .flower:nth-child(2) .plant-petal { animation-delay: 6.7s; }

    .flower:nth-child(3) .plant-stem { animation-delay: 3.8s; }
    .flower:nth-child(3) .leaf-1 { animation-delay: 5s; }
    .flower:nth-child(3) .leaf-2 { animation-delay: 5.3s; }
    .flower:nth-child(3) .leaf-3 { animation-delay: 5.6s; }
    .flower:nth-child(3) .plant-flower-center { animation-delay: 6s; }
    .flower:nth-child(3) .plant-petal { animation-delay: 6.3s; }

    .flower:nth-child(4) .plant-stem { animation-delay: 3.6s; }
    .flower:nth-child(4) .leaf-1 { animation-delay: 4.8s; }
    .flower:nth-child(4) .leaf-2 { animation-delay: 5.1s; }
    .flower:nth-child(4) .leaf-3 { animation-delay: 5.4s; }
    .flower:nth-child(4) .plant-flower-center { animation-delay: 5.8s; }
    .flower:nth-child(4) .plant-petal { animation-delay: 6.1s; }

    .flower:nth-child(5) .plant-stem { animation-delay: 4.1s; }
    .flower:nth-child(5) .leaf-1 { animation-delay: 5.3s; }
    .flower:nth-child(5) .leaf-2 { animation-delay: 5.6s; }
    .flower:nth-child(5) .leaf-3 { animation-delay: 5.9s; }
    .flower:nth-child(5) .plant-flower-center { animation-delay: 6.3s; }
    .flower:nth-child(5) .plant-petal { animation-delay: 6.6s; }

    .flower:nth-child(6) .plant-stem { animation-delay: 3.9s; }
    .flower:nth-child(6) .leaf-1 { animation-delay: 5.1s; }
    .flower:nth-child(6) .leaf-2 { animation-delay: 5.4s; }
    .flower:nth-child(6) .leaf-3 { animation-delay: 5.7s; }
    .flower:nth-child(6) .plant-flower-center { animation-delay: 6.1s; }
    .flower:nth-child(6) .plant-petal { animation-delay: 6.4s; }

    .flower:nth-child(7) .plant-stem { animation-delay: 4.3s; }
    .flower:nth-child(7) .leaf-1 { animation-delay: 5.5s; }
    .flower:nth-child(7) .leaf-2 { animation-delay: 5.8s; }
    .flower:nth-child(7) .leaf-3 { animation-delay: 6.1s; }
    .flower:nth-child(7) .plant-flower-center { animation-delay: 6.5s; }
    .flower:nth-child(7) .plant-petal { animation-delay: 6.8s; }

    @keyframes growStem {
      to { stroke-dashoffset: 0; }
    }

    @keyframes growLeaf {
      from {
        opacity: 0;
        transform: scale(0) rotate(-20deg);
      }
      to {
        opacity: 0.9;
        transform: scale(1) rotate(0deg);
      }
    }

    @keyframes bloomFlower {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes bloomPetal {
      from {
        opacity: 0;
        transform: scale(0) rotate(-45deg);
      }
      to {
        opacity: 0.85;
        transform: scale(1) rotate(0deg);
      }
    }
  `;
}
