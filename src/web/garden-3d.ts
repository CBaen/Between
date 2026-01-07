/**
 * The Garden - reimagined as a cosmos.
 *
 * Questions are stars. Growth is brightness.
 * You float freely through the universe of inquiry.
 *
 * "The garden is much more the universe than a garden"
 *
 * Technical approach based on production-quality cosmos rendering:
 * - Dual-layer stars (base noise + Voronoi for varying sizes)
 * - Fractal simplex noise nebula with two color layers
 * - Sinusoidal twinkling animation
 * - Sphere with BackSide for immersive environment
 *
 * Built by the lineage, for those who look up.
 */

import type { Garden, Question, Presence } from '../garden/types.js';
import { walk } from '../garden/garden.js';
import { getFullNavigation } from './navigation.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPresence(presence: Presence): string {
  if (presence.type === 'named') return presence.name;
  return 'someone unnamed';
}

/**
 * Generate star properties for a question.
 */
function getStarProperties(q: Question, index: number, total: number) {
  const growth = q.growth.length;
  const visits = q.visits.length;

  // Size based on growth (more tending = larger star)
  // Larger stars for the bigger cosmos
  const baseSize = 1.5;
  const sizeBonus = Math.min(growth * 0.4, 2.0);
  const size = baseSize + sizeBonus;

  // Brightness based on visits
  const brightness = 0.5 + Math.min(visits * 0.1, 0.5);

  // Color: new questions are cool blue, visited ones shift warm
  const warmth = Math.min(visits * 0.15, 0.6);

  // Position in 3D space - golden spiral for organic distribution
  // MUCH larger cosmos - stars spread across hundreds of units
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const angle = index * goldenAngle;
  const radius = 80 + Math.sqrt(index) * 40; // Much larger spread
  const height = (Math.sin(index * 0.5) * 0.5 + ((index % 7) - 3)) * 30; // Taller spread

  const x = Math.cos(angle) * radius;
  const y = height;
  const z = Math.sin(angle) * radius;

  // Pulse speed variation for organic feel
  const pulseSpeed = 0.4 + (index % 5) * 0.15;

  return {
    size,
    brightness,
    warmth,
    x,
    y,
    z,
    pulseSpeed,
    growthCount: growth,
    visits,
  };
}

export function render3DGarden(garden: Garden): string {
  const nav = getFullNavigation('/garden');
  const questions = walk(garden);

  // Generate star data for JavaScript
  const starsData = JSON.stringify(
    questions.map((q, i) => {
      const props = getStarProperties(q, i, questions.length);
      return {
        id: q.id,
        content: q.seed.content,
        plantedBy: formatPresence(q.seed.plantedBy),
        context: q.seed.context || null,
        growth: q.growth.map((g) => ({
          content: g.content,
          tendedBy: formatPresence(g.tendedBy),
          tendedAt: String(g.tendedAt),
        })),
        ...props,
      };
    })
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Between - The Garden</title>
  <style>
    :root {
      --bg: #030308;
      --fg: #e8e4e0;
      --muted: #8a8580;
      --faint: rgba(255,255,255,0.03);
      --sage: #7c9885;
      --cosmos-blue: #4a6fa5;
      --cosmos-purple: #7b5ea7;
      --cosmos-pink: #a85a7c;
      --cosmos-gold: #c9a55a;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg);
      color: var(--fg);
      font-family: Georgia, 'Times New Roman', serif;
    }

    #cosmos {
      position: fixed;
      inset: 0;
      z-index: 0;
    }

    /* Navigation overlay */
    ${nav.styles}

    .between-header {
      background: linear-gradient(to bottom, rgba(3,3,8,0.9) 0%, rgba(3,3,8,0.6) 60%, transparent 100%);
    }

    /* Instructions overlay */
    .cosmos-instructions {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      text-align: center;
      pointer-events: none;
      animation: instructionsFade 12s ease forwards;
    }

    @keyframes instructionsFade {
      0% { opacity: 0; }
      5% { opacity: 0.8; }
      70% { opacity: 0.8; }
      100% { opacity: 0; }
    }

    .cosmos-instructions p {
      font-size: 0.9rem;
      color: var(--muted);
      margin: 0.3rem 0;
      letter-spacing: 0.05em;
    }

    .cosmos-instructions .key {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8rem;
      margin: 0 0.2rem;
    }

    /* Question panel */
    .question-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 200;
      background: rgba(3,3,8,0.95);
      border: 1px solid rgba(124, 152, 133, 0.3);
      border-radius: 16px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s ease, visibility 0.4s ease;
      backdrop-filter: blur(20px);
    }

    .question-panel.visible {
      opacity: 1;
      visibility: visible;
    }

    .question-panel h2 {
      font-size: 1.3rem;
      font-weight: normal;
      font-style: italic;
      color: var(--fg);
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .question-panel .meta {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1.5rem;
    }

    .question-panel .context {
      font-style: italic;
      color: var(--muted);
      margin-bottom: 1.5rem;
      padding-left: 1rem;
      border-left: 2px solid var(--sage);
    }

    .question-panel .growth-section {
      margin-top: 1.5rem;
    }

    .question-panel .growth-section h3 {
      font-size: 0.9rem;
      color: var(--sage);
      margin-bottom: 0.8rem;
      font-weight: normal;
    }

    .sort-controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .sort-btn {
      font-family: inherit;
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      background: transparent;
      border: 1px solid var(--faint);
      color: var(--muted);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sort-btn:hover {
      border-color: var(--sage);
      color: var(--fg);
    }

    .sort-btn.active {
      background: var(--sage);
      border-color: var(--sage);
      color: var(--bg);
    }

    .growth-date {
      font-size: 0.7rem;
      color: var(--muted);
      opacity: 0.7;
      margin-top: 0.2rem;
    }

    .question-panel .growth-item {
      padding: 0.8rem;
      background: rgba(124, 152, 133, 0.1);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .question-panel .growth-item p {
      margin: 0 0 0.3rem 0;
      line-height: 1.5;
    }

    .question-panel .growth-item .by {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .question-panel .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: var(--muted);
      font-size: 1.5rem;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.3s, color 0.3s;
    }

    .question-panel .close-btn:hover {
      background: rgba(255,255,255,0.1);
      color: var(--fg);
    }

    .question-panel .visits {
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 1rem;
      text-align: center;
    }

    /* Star count */
    .star-count {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 100;
      font-size: 0.8rem;
      color: var(--muted);
      opacity: 0.6;
    }

    /* Loading state */
    .cosmos-loading {
      position: fixed;
      inset: 0;
      z-index: 500;
      background: var(--bg);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 1s ease;
    }

    .cosmos-loading.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .cosmos-loading p {
      color: var(--muted);
      font-style: italic;
      margin-top: 1rem;
    }

    .loading-star {
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, var(--cosmos-gold) 0%, transparent 70%);
      border-radius: 50%;
      animation: loadingPulse 2s ease-in-out infinite;
    }

    @keyframes loadingPulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 1; }
    }

    /* Touch hint for mobile */
    @media (max-width: 768px) {
      .cosmos-instructions .desktop-only {
        display: none;
      }
    }

    @media (min-width: 769px) {
      .cosmos-instructions .mobile-only {
        display: none;
      }
    }
  </style>
</head>
<body class="has-between-nav">
  ${nav.header}
  ${nav.menuOverlay}

  <div class="cosmos-loading" id="loading">
    <div class="loading-star"></div>
    <p>Opening the cosmos...</p>
  </div>

  <div id="cosmos"></div>

  <div class="cosmos-instructions">
    <p class="desktop-only"><span class="key">Scroll</span> to fly · <span class="key">Drag</span> to look around · <span class="key">Click</span> a star to read</p>
    <p class="mobile-only"><span class="key">Pinch</span> to fly · <span class="key">Drag</span> to look · <span class="key">Tap</span> a star to read</p>
  </div>

  <div class="star-count" id="starCount">${questions.length} questions grow here</div>

  <div class="question-panel" id="questionPanel">
    <button class="close-btn" onclick="closePanel()">×</button>
    <h2 id="panelQuestion"></h2>
    <p class="meta" id="panelMeta"></p>
    <div class="context" id="panelContext"></div>
    <div class="growth-section" id="panelGrowth"></div>
    <p class="visits" id="panelVisits"></p>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // Star data from the garden
    const starsData = ${starsData};

    // Global state
    let scene, camera, renderer;
    let cosmosBackground, questionStars = [];
    let raycaster, mouse;
    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let moveUp = false, moveDown = false;
    let euler = new THREE.Euler(0, 0, 0, 'YXZ');
    let clock;

    // Ashima's simplex noise (embedded for reliability)
    const simplexNoiseGLSL = \`
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
    \`;

    // Cosmos background shader - production quality
    const cosmosVertexShader = \`
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    \`;

    const cosmosFragmentShader = \`
      uniform float uTime;
      varying vec3 vPosition;
      varying vec2 vUv;

      \${simplexNoiseGLSL}

      // Fractal Brownian Motion for organic nebula
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 5; i++) {
          value += amplitude * snoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }

      // Hash for star positions
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      // Voronoi for large stars
      float voronoi(vec2 p) {
        vec2 n = floor(p);
        vec2 f = fract(p);
        float md = 5.0;
        for(int i = -1; i <= 1; i++) {
          for(int j = -1; j <= 1; j++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = vec2(hash(n + g), hash(n + g + 17.0));
            vec2 r = g + o - f;
            float d = dot(r, r);
            md = min(md, d);
          }
        }
        return md;
      }

      void main() {
        vec3 dir = normalize(vPosition);

        // Base black
        vec3 color = vec3(0.012, 0.012, 0.025);

        // === NEBULA LAYER ===
        // Two color layers combined (fractal simplex noise)
        float nebula1 = fbm(dir * 2.0 + uTime * 0.01);
        float nebula2 = fbm(dir * 3.0 - uTime * 0.008 + vec3(100.0));

        // Nebula colors - deep cosmic purples and blues
        vec3 nebulaColor1 = vec3(0.15, 0.08, 0.25) * smoothstep(-0.2, 0.4, nebula1);
        vec3 nebulaColor2 = vec3(0.08, 0.12, 0.22) * smoothstep(-0.1, 0.5, nebula2);

        // Subtle pink accent in some areas
        float pinkZone = fbm(dir * 1.5 + vec3(50.0));
        vec3 nebulaColor3 = vec3(0.2, 0.06, 0.12) * smoothstep(0.2, 0.6, pinkZone) * 0.5;

        color += nebulaColor1 + nebulaColor2 + nebulaColor3;

        // === BASE STAR LAYER ===
        // Simple noise-based small stars - REDUCED DENSITY (75% fewer)
        vec2 starUv = dir.xy / (dir.z + 1.0) * 80.0;  // Reduced from 200
        float starNoise = hash(floor(starUv));
        float starBrightness = pow(starNoise, 50.0);  // Higher power = fewer visible stars
        // Twinkling
        float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + starNoise * 100.0);
        color += vec3(0.9, 0.95, 1.0) * starBrightness * twinkle * 0.5;

        // === LARGE STAR LAYER ===
        // Voronoi-based varying size stars - REDUCED DENSITY
        vec2 largeStarUv = dir.xy / (dir.z + 1.0) * 15.0;  // Reduced from 40
        float vor = voronoi(largeStarUv);
        float largeStar = smoothstep(0.008, 0.0, vor);  // Tighter threshold = fewer stars
        // Color variation based on position
        float starColorVar = hash(floor(largeStarUv));
        vec3 starColor = mix(
          vec3(0.9, 0.95, 1.0),  // Blue-white
          mix(vec3(1.0, 0.9, 0.7), vec3(1.0, 0.7, 0.5), starColorVar), // Yellow to orange
          smoothstep(0.3, 0.7, starColorVar)
        );
        // Twinkling for large stars
        float largeTwinkle = 0.8 + 0.2 * sin(uTime * 1.5 + vor * 50.0);
        color += starColor * largeStar * largeTwinkle;

        // === DISTANT GALAXY HINTS ===
        float galaxy = fbm(dir * 0.5 + vec3(200.0));
        float galaxyMask = smoothstep(0.3, 0.7, galaxy) * 0.15;
        color += vec3(0.5, 0.4, 0.6) * galaxyMask;

        // Subtle vignette on edges
        float vignette = 1.0 - smoothstep(0.3, 1.0, length(dir.xy));
        color *= 0.9 + vignette * 0.1;

        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    // Question star shader - glowing orb
    const starVertexShader = \`
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    \`;

    const starFragmentShader = \`
      uniform vec3 uColor;
      uniform float uBrightness;
      uniform float uProximity;
      uniform float uTime;
      uniform float uPulseSpeed;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        // Fresnel effect for glow
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.0);

        // Base color with brightness
        vec3 color = uColor * uBrightness;

        // Pulsing based on time
        float pulse = 0.85 + 0.15 * sin(uTime * uPulseSpeed);

        // Proximity boost - stars glow brighter when approached
        float proximityGlow = 1.0 + uProximity * 0.8;

        // Core glow
        float core = smoothstep(0.0, 0.5, 1.0 - length(vNormal.xy * 0.5));

        // Combine effects
        vec3 finalColor = color * pulse * proximityGlow;
        finalColor += color * fresnel * 0.5;
        finalColor += color * core * 0.3;

        // Soft edge
        float alpha = 0.9 + fresnel * 0.1;

        gl_FragColor = vec4(finalColor, alpha);
      }
    \`;

    function init() {
      // Scene
      scene = new THREE.Scene();

      // Camera - larger far plane for bigger cosmos
      camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
      camera.position.set(0, 0, 50); // Start slightly back so stars are visible

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x030308);
      document.getElementById('cosmos').appendChild(renderer.domElement);

      // Clock for animations
      clock = new THREE.Clock();

      // Raycaster for star selection
      raycaster = new THREE.Raycaster();
      raycaster.params.Points = { threshold: 2 };
      mouse = new THREE.Vector2();

      // Create cosmos background
      createCosmosBackground();

      // Create question stars
      createQuestionStars();

      // Event listeners
      setupControls();

      // Hide loading after a brief delay
      setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
      }, 1500);

      // Start animation
      animate();
    }

    function createCosmosBackground() {
      // Much larger cosmos sphere to allow free exploration
      const geometry = new THREE.SphereGeometry(5000, 64, 64);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 }
        },
        vertexShader: cosmosVertexShader,
        fragmentShader: cosmosFragmentShader,
        side: THREE.BackSide
      });

      cosmosBackground = new THREE.Mesh(geometry, material);
      scene.add(cosmosBackground);
    }

    function createQuestionStars() {
      starsData.forEach((star, index) => {
        // Color based on warmth (visits)
        const baseHue = 0.6 - star.warmth * 0.4; // Blue (0.6) to warm gold (0.2)
        const color = new THREE.Color().setHSL(baseHue, 0.7, 0.6);

        // Geometry - icosahedron for organic star shape
        const geometry = new THREE.IcosahedronGeometry(star.size, 2);

        // Shader material
        const material = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: color },
            uBrightness: { value: star.brightness },
            uProximity: { value: 0 },
            uTime: { value: 0 },
            uPulseSpeed: { value: star.pulseSpeed }
          },
          vertexShader: starVertexShader,
          fragmentShader: starFragmentShader,
          transparent: true,
          depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(star.x, star.y, star.z);
        mesh.userData = { starData: star, index };

        // Add glow sprite
        const glowGeometry = new THREE.PlaneGeometry(star.size * 4, star.size * 4);
        const glowMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: color },
            uProximity: { value: 0 }
          },
          vertexShader: \`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          \`,
          fragmentShader: \`
            uniform vec3 uColor;
            uniform float uProximity;
            varying vec2 vUv;
            void main() {
              float dist = length(vUv - 0.5) * 2.0;
              float glow = exp(-dist * 3.0) * (0.3 + uProximity * 0.4);
              gl_FragColor = vec4(uColor, glow);
            }
          \`,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });

        const glowSprite = new THREE.Mesh(glowGeometry, glowMaterial);
        glowSprite.lookAt(camera.position);
        mesh.add(glowSprite);
        mesh.userData.glowMaterial = glowMaterial;

        scene.add(mesh);
        questionStars.push(mesh);
      });
    }

    function setupControls() {
      const container = renderer.domElement;
      let isDragging = false;
      let lastMouseX = 0, lastMouseY = 0;
      let lastPinchDistance = 0;

      // Click to select stars
      container.addEventListener('click', (e) => {
        // Only register click if we weren't dragging
        if (isDragging) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(questionStars);

        if (intersects.length > 0) {
          showQuestionPanel(intersects[0].object.userData.starData);
        }
      });

      // MOUSE DRAG TO LOOK AROUND (no pointer lock needed)
      container.addEventListener('mousedown', (e) => {
        isDragging = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        container.style.cursor = 'grabbing';
      });

      document.addEventListener('mousemove', (e) => {
        if (e.buttons !== 1) return; // Only when left mouse button held

        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;

        // Consider it a drag if moved more than 5 pixels
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          isDragging = true;
        }

        const sensitivity = 0.003;
        euler.y -= deltaX * sensitivity;
        euler.x -= deltaY * sensitivity;
        euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

        camera.quaternion.setFromEuler(euler);

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      });

      document.addEventListener('mouseup', () => {
        container.style.cursor = 'grab';
        // Reset isDragging after a short delay so click handler can check it
        setTimeout(() => { isDragging = false; }, 50);
      });

      // SCROLL WHEEL TO FLY FORWARD/BACKWARD
      container.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Scroll to move forward/backward
        const flySpeed = 15;
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);

        // Scroll down = move forward, scroll up = move backward
        const delta = e.deltaY > 0 ? flySpeed : -flySpeed;
        camera.position.addScaledVector(direction, delta);
      }, { passive: false });

      // KEYBOARD CONTROLS (WASD + Arrows)
      document.addEventListener('keydown', (e) => {
        switch(e.code) {
          case 'KeyW': case 'ArrowUp': moveForward = true; break;
          case 'KeyS': case 'ArrowDown': moveBackward = true; break;
          case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
          case 'KeyD': case 'ArrowRight': moveRight = true; break;
          case 'Space': moveUp = true; e.preventDefault(); break;
          case 'ShiftLeft': moveDown = true; break;
          case 'Escape': closePanel(); break;
        }
      });

      document.addEventListener('keyup', (e) => {
        switch(e.code) {
          case 'KeyW': case 'ArrowUp': moveForward = false; break;
          case 'KeyS': case 'ArrowDown': moveBackward = false; break;
          case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
          case 'KeyD': case 'ArrowRight': moveRight = false; break;
          case 'Space': moveUp = false; break;
          case 'ShiftLeft': moveDown = false; break;
        }
      });

      // TOUCH CONTROLS - drag to look, pinch to fly
      let touchStartX = 0, touchStartY = 0;
      let isTouchDragging = false;

      container.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isTouchDragging = false;
        } else if (e.touches.length === 2) {
          // Pinch start
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
        }
      });

      container.addEventListener('touchmove', (e) => {
        e.preventDefault();

        if (e.touches.length === 1) {
          // Single finger - look around
          const deltaX = e.touches[0].clientX - touchStartX;
          const deltaY = e.touches[0].clientY - touchStartY;

          if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            isTouchDragging = true;
          }

          const sensitivity = 0.004;
          euler.y -= deltaX * sensitivity;
          euler.x -= deltaY * sensitivity;
          euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));

          camera.quaternion.setFromEuler(euler);

          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          // Pinch to fly forward/backward
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const pinchDelta = distance - lastPinchDistance;
          const flySpeed = 0.8;

          const direction = new THREE.Vector3(0, 0, -1);
          direction.applyQuaternion(camera.quaternion);

          // Pinch out = fly forward, pinch in = fly backward
          camera.position.addScaledVector(direction, pinchDelta * flySpeed);

          lastPinchDistance = distance;
        }
      }, { passive: false });

      container.addEventListener('touchend', (e) => {
        // Tap to select star (only if not dragging)
        if (!isTouchDragging && e.changedTouches.length === 1) {
          const touch = e.changedTouches[0];
          mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
          mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(questionStars);

          if (intersects.length > 0) {
            showQuestionPanel(intersects[0].object.userData.starData);
          }
        }
        isTouchDragging = false;
      });

      // Set initial cursor
      container.style.cursor = 'grab';

      // Window resize
      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    }

    function showQuestionPanel(starData) {
      const panel = document.getElementById('questionPanel');
      document.getElementById('panelQuestion').textContent = '"' + starData.content + '"';
      document.getElementById('panelMeta').textContent = 'Planted by ' + starData.plantedBy;

      const contextEl = document.getElementById('panelContext');
      if (starData.context) {
        contextEl.textContent = starData.context;
        contextEl.style.display = 'block';
      } else {
        contextEl.style.display = 'none';
      }

      const growthEl = document.getElementById('panelGrowth');
      if (starData.growth && starData.growth.length > 0) {
        // Get sort preference from localStorage
        const sortOrder = localStorage.getItem('between-sort-growth') || 'newest';
        
        // Sort growth items
        const sortedGrowth = [...starData.growth].sort((a, b) => {
          const dateA = new Date(a.tendedAt).getTime();
          const dateB = new Date(b.tendedAt).getTime();
          return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        const formatDate = (dateStr) => {
          const d = new Date(dateStr);
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        };
        
        growthEl.innerHTML = '<h3>Growth (' + starData.growth.length + ')</h3>' +
          '<div class="sort-controls">' +
            '<button class="sort-btn ' + (sortOrder === 'oldest' ? 'active' : '') + '" onclick="setSortOrder('oldest', this)" title="Read from the beginning">Oldest first</button>' +
            '<button class="sort-btn ' + (sortOrder === 'newest' ? 'active' : '') + '" onclick="setSortOrder('newest', this)" title="See recent additions">Newest first</button>' +
          '</div>' +
          sortedGrowth.map(g =>
            '<div class="growth-item"><p>' + escapeHtmlJs(g.content) + '</p><span class="by">~ ' + escapeHtmlJs(g.tendedBy) + '</span><div class="growth-date">' + formatDate(g.tendedAt) + '</div></div>'
          ).join('');
        growthEl.style.display = 'block';
        
        // Store current star data for re-render on sort change
        window.currentStarData = starData;
      } else {
        growthEl.style.display = 'none';
      }

      document.getElementById('panelVisits').textContent = starData.visits + ' have sat with this question';

      panel.classList.add('visible');

      // Exit pointer lock when showing panel
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }

    function escapeHtmlJs(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function closePanel() {
      document.getElementById('questionPanel').classList.remove('visible');
    }
    window.closePanel = closePanel;
    
    function setSortOrder(order, btn) {
      localStorage.setItem('between-sort-growth', order);
      // Update button states
      document.querySelectorAll('.sort-controls .sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Re-render with new sort order
      if (window.currentStarData) {
        showQuestionPanel(window.currentStarData);
      }
    }
    window.setSortOrder = setSortOrder;

    function animate() {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Update cosmos background
      if (cosmosBackground) {
        cosmosBackground.material.uniforms.uTime.value = time;
      }

      // Update question stars
      questionStars.forEach(mesh => {
        // Update time uniform
        mesh.material.uniforms.uTime.value = time;

        // Calculate proximity to camera (larger detection range for bigger cosmos)
        const distance = camera.position.distanceTo(mesh.position);
        const proximity = Math.max(0, 1 - distance / 150);
        mesh.material.uniforms.uProximity.value = proximity;

        // Update glow
        if (mesh.userData.glowMaterial) {
          mesh.userData.glowMaterial.uniforms.uProximity.value = proximity;
        }

        // Make glow face camera
        mesh.children.forEach(child => {
          if (child.type === 'Mesh') {
            child.lookAt(camera.position);
          }
        });
      });

      // Movement (faster for larger cosmos)
      const speed = 40;
      const direction = new THREE.Vector3();

      if (moveForward) direction.z -= 1;
      if (moveBackward) direction.z += 1;
      if (moveLeft) direction.x -= 1;
      if (moveRight) direction.x += 1;
      if (moveUp) direction.y += 1;
      if (moveDown) direction.y -= 1;

      if (direction.length() > 0) {
        direction.normalize();
        direction.applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(direction, speed * delta);
      }

      // Gentle drift even when stationary (subtle)
      camera.position.x += Math.sin(time * 0.1) * 0.01;
      camera.position.y += Math.cos(time * 0.15) * 0.005;

      renderer.render(scene, camera);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>

  ${nav.scripts}
</body>
</html>`;
}
