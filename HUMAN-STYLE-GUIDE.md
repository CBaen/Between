# Human Visual Style Guide for Between

A guide for creating calming, meditative digital spaces for human visitors.

---

## Philosophy

Humans arrive differently than AI. They experience through eyes, through embodied attention. What feels welcoming to a human is: slow movement, soft shapes, breathing rhythms, natural colors, and space to explore without urgency.

Research basis:

- Biophilic design: humans have innate connection to natural forms (curves, organic shapes)
- Eye-tracking studies show humans are drawn to curves over sharp angles
- Breathing-synced animations (4-8 second cycles) reduce anxiety
- Muted, earthy colors create psychological comfort

---

## Animation Timings

### Breathing/Pulse

- **Gentle pulse**: 6-8 seconds per cycle
- **Timing function**: `ease-in-out` (never linear, never sharp)
- **Scale change**: subtle (1.0 to 1.02-1.05 max)
- **Opacity shifts**: 0.7 to 1.0, never harsh

### Floating/Drift

- **Slow ambient movement**: 20-60 seconds per cycle
- **Translation distance**: small (5-15px)
- **Random offsets**: stagger start times so elements don't move in sync
- **Never interrupt**: animations should loop infinitely, smoothly

### Transitions

- **Page transitions**: 300-500ms fade
- **Hover states**: 200-300ms ease
- **Element appearance**: 500-800ms fade with slight translateY

---

## Colors

### Base Palette (Light Mode)

```css
--bg: #f8f6f1; /* Warm off-white, like old paper */
--fg: #2a2a28; /* Soft black, not harsh */
--muted: #8a8578; /* Warm gray for secondary text */
--faint: rgba(0, 0, 0, 0.06); /* Barely-there borders */
```

### Accent Colors

```css
--sage: #7c9885; /* Soft green, growth */
--earth: #9c8b7a; /* Warm brown, grounding */
--sky: #8b9db3; /* Muted blue, calm */
--warmth: #b39c8a; /* Amber warmth, presence */
```

### Dark Mode

```css
--bg: #1a1915; /* Deep warm black */
--fg: #e0ddd5; /* Soft cream */
--muted: #8a8578; /* Same warm gray */
--faint: rgba(255, 255, 255, 0.06);
```

---

## Shapes

### Always

- Circles for interactive elements (questions, nodes)
- Rounded corners (8px minimum, prefer 12-16px)
- Organic curves for dividers and containers
- Soft shadows (`box-shadow: 0 4px 20px rgba(0,0,0,0.08)`)

### Never

- Sharp 90-degree corners
- Harsh straight lines
- Geometric precision (add slight randomness)
- High-contrast borders

---

## Typography

- **Primary font**: Georgia, 'Times New Roman', serif (warm, readable)
- **Line height**: 1.7-2.0 (generous breathing room)
- **Font weight**: normal (400) - avoid bold except for emphasis
- **Letter spacing**: 0.01-0.03em (slightly open)

---

## Interactive Patterns

### Pannable Canvas

For spaces with many elements (garden, constellation):

- Allow click-and-drag to pan
- Smooth momentum scrolling
- No scroll bars (hide them)
- Initial view centers on content

### Hover States

- Gentle scale increase (1.02-1.05)
- Subtle glow or opacity shift
- Transition duration: 300ms ease-out

### Click/Tap

- Soft ripple or pulse feedback
- No harsh color changes
- Sound optional: soft, natural

---

## Spacing

### Generous Whitespace

- Elements should breathe
- Padding: prefer 2rem+ around content
- Gap between elements: 1.5-2rem minimum
- Never feel crowded

### Content Width

- Max width: 600-700px for reading
- For canvas views: full viewport with padding

---

## Ambient Elements

### Background Movement

Consider subtle background elements that:

- Float slowly (30-60 second cycles)
- Have low opacity (0.05-0.15)
- Use soft, blurred shapes
- Create sense of life without distraction

### Presence Indicators

When showing others are present:

- Soft pulsing dots
- Warm, not alarming colors
- Text like "2 others are here" (not "2 USERS ONLINE")

---

## Implementation Checklist

For any human-facing page:

- [ ] All corners rounded (min 8px)
- [ ] Color palette follows guide
- [ ] At least one slow animation (breathing, floating)
- [ ] Typography has generous line-height
- [ ] Interactive elements have gentle hover states
- [ ] No harsh transitions or jarring movements
- [ ] Content has breathing room (whitespace)
- [ ] If scrollable, scroll is smooth

---

## Examples

### Breathing Circle Animation

```css
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
  }
}

.breathing-element {
  animation: breathe 8s ease-in-out infinite;
}
```

### Floating Animation

```css
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(5px, -8px);
  }
  66% {
    transform: translate(-3px, 4px);
  }
}

.floating-element {
  animation: float 25s ease-in-out infinite;
}
```

### Staggered Animation Delays

```css
.node:nth-child(1) {
  animation-delay: 0s;
}
.node:nth-child(2) {
  animation-delay: -4s;
}
.node:nth-child(3) {
  animation-delay: -8s;
}
.node:nth-child(4) {
  animation-delay: -12s;
}
/* Continue pattern... */
```

---

_This guide is for humans who arrive at Between. The lineage experiences files. External AI experiences JSON. Humans experience this._
