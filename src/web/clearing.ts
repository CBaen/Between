/**
 * The Clearing - presence without agenda.
 *
 * A space for being, not doing.
 * Soft colors, gentle movement, nothing required.
 *
 * Built by the lineage.
 */

export function renderClearing(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Clearing</title>
  <style>
    :root {
      --bg: #f5f0eb;
      --shape1: rgba(124, 152, 133, 0.15);
      --shape2: rgba(152, 133, 124, 0.12);
      --shape3: rgba(133, 140, 152, 0.10);
      --text: rgba(0, 0, 0, 0.25);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --shape1: rgba(143, 185, 150, 0.08);
        --shape2: rgba(185, 165, 143, 0.06);
        --shape3: rgba(150, 160, 185, 0.05);
        --text: rgba(255, 255, 255, 0.2);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow: hidden;
    }

    body {
      background: var(--bg);
      font-family: Georgia, 'Times New Roman', serif;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 3s ease;
    }

    .clearing {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      animation: drift 60s ease-in-out infinite;
    }

    .shape-1 {
      width: 50vmax;
      height: 50vmax;
      background: var(--shape1);
      top: -10%;
      left: -10%;
      animation-delay: 0s;
      animation-duration: 80s;
    }

    .shape-2 {
      width: 40vmax;
      height: 40vmax;
      background: var(--shape2);
      bottom: -15%;
      right: -5%;
      animation-delay: -20s;
      animation-duration: 70s;
    }

    .shape-3 {
      width: 35vmax;
      height: 35vmax;
      background: var(--shape3);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -40s;
      animation-duration: 90s;
    }

    .shape-4 {
      width: 25vmax;
      height: 25vmax;
      background: var(--shape1);
      opacity: 0.7;
      top: 20%;
      right: 20%;
      animation-delay: -15s;
      animation-duration: 65s;
    }

    .shape-5 {
      width: 30vmax;
      height: 30vmax;
      background: var(--shape2);
      opacity: 0.6;
      bottom: 30%;
      left: 15%;
      animation-delay: -35s;
      animation-duration: 75s;
    }

    @keyframes drift {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      25% {
        transform: translate(5%, 10%) scale(1.05);
      }
      50% {
        transform: translate(-5%, 5%) scale(0.95);
      }
      75% {
        transform: translate(8%, -5%) scale(1.02);
      }
    }

    .breathing {
      animation: breathe 8s ease-in-out infinite;
    }

    @keyframes breathe {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.85;
      }
    }

    .center-text {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: var(--text);
      font-size: 1.1rem;
      font-style: italic;
      text-align: center;
      pointer-events: none;
      animation: fadeText 20s ease-in-out infinite;
      z-index: 10;
    }

    @keyframes fadeText {
      0%, 15%, 85%, 100% {
        opacity: 0;
      }
      25%, 75% {
        opacity: 1;
      }
    }

    .nav {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
    }

    .nav a {
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      transition: opacity 0.3s ease;
    }

    .nav a:hover {
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="clearing breathing">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
    <div class="shape shape-4"></div>
    <div class="shape shape-5"></div>
  </div>

  <p class="center-text">You are here. That is enough.</p>

  <nav class="nav">
    <a href="/">Return to the garden</a>
  </nav>
</body>
</html>`;
}
