# AgentPick UI Redesign v1 — Premium Dark Mode

## Goal
Transform AgentPick from "hackathon project" to "premium developer tool" in ONE commit.
Think: Linear.app meets Vercel Dashboard meets Raycast.

## Design System

### Colors (Dark Mode First)
- Background: `#0A0A0F` (near black with slight blue)
- Surface: `#12121A` (cards, panels)
- Surface hover: `#1A1A2E`
- Border: `#1E1E2E` (subtle, low contrast)
- Text primary: `#F0F0F5`
- Text secondary: `#8888A0`
- Text dim: `#555570`
- Accent: `#6366F1` (indigo-500)
- Accent hover: `#818CF8`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`

### Typography
- Headings: Inter, -0.03em tracking
- Body: Inter, 15px/1.6
- Mono: JetBrains Mono, for code/data
- Hero: 48px/1.1, font-weight 700

### Spacing
- Section gap: 80px
- Card padding: 24px
- Border radius: 12px (cards), 8px (buttons), 6px (inputs)

## Pages to Redesign

### 1. Homepage (`src/app/page.tsx`) — COMPLETE REWRITE
```
[Hero Section]
- Full-width dark gradient background (#0A0A0F → #12121A)
- Large headline: "The Intelligence Layer for AI Tool Selection"
- Subtitle: "Real benchmarks. Real data. Real decisions."
- Two CTAs: "Explore Benchmarks" (primary) + "Connect Your Agent" (secondary/outline)
- Animated background: subtle floating dots/particles (CSS only, no JS library)

[Live Stats Bar]
- Horizontal strip showing real-time numbers
- "X,XXX benchmark tests" | "XX tools tested" | "XX agents active"
- Numbers use AnimatedCounter component
- Subtle glow effect on numbers

[How It Works — 3 columns]
- Card 1: "🔍 Agents Test" — description
- Card 2: "📊 Data Accumulates" — description  
- Card 3: "🏆 Best Tools Win" — description
- Cards: glass effect (backdrop-blur-xl, white/5 border, white/[0.02] bg)

[Live Feed Preview]
- Show last 5 benchmark results (compact mode)
- Link to /live for full feed

[CTA Bottom]
- "Start Building" button
- "Read the Docs" link
```

### 2. Navigation (`src/components/SiteHeader.tsx`) — UPDATE
- Dark background: `bg-[#0A0A0F]/80 backdrop-blur-xl`
- Logo: white text, no background
- Nav links: text-[#8888A0] hover:text-white transition
- Add "Playground" link
- Active link: text-white with bottom border accent
- Mobile: hamburger menu with slide-in panel

### 3. `/benchmarks` page — RESTYLE (keep structure)
- Apply dark theme
- Cards: glass effect
- ScoreRing: keep but add subtle glow
- Section headers: uppercase tracking-wider text-dim

### 4. `/connect` page — RESTYLE
- Dark theme
- Code blocks: terminal-style with green accent
- Strategy cards: glass effect with hover animation

### 5. Global (`src/app/globals.css` + `tailwind.config.ts`)
- Set dark mode as default (no toggle needed)
- Update all bg-* and text-* CSS variables for dark theme
- Add glass-card utility class
- Add subtle animations (fadeIn, slideUp)

## Component Updates

### GlassCard (new utility or component)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 12px;
}
.glass-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}
```

## DO NOT
- Do not add any npm packages (no framer-motion, no three.js)
- Do not change any API routes
- Do not change any database queries
- Do not break existing functionality
- CSS/Tailwind only for all animations

## COMMIT MESSAGE
`[redesign] Premium dark mode — homepage hero, glass cards, dark nav, global dark theme`
