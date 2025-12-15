# LinkShield Design Guidelines

## Design System Foundation

**Component Library:** Shadcn/UI for all interactive elements (Buttons, Inputs, Cards, Dialogs, Sheets, Switches, Badges, Tables)

**CSS Framework:** Tailwind CSS

**Color Palette:**
- Background: `zinc-950` (#09090b) - Near-black, not pure black
- Surface/Cards: `zinc-900` with subtle `zinc-800` borders
- Primary Accent: Pure white (`#ffffff`) for text and primary buttons (inverted)
- Secondary: `zinc-800` for secondary buttons
- Semantic Colors:
  - `emerald-500`: "Allowed" / "Active" status
  - `rose-500`: "Blocked" / "Error" status
  - `amber-500`: Warnings/Alerts

**Premium Gradients:**
- Primary Gradient: `from-emerald-400 via-emerald-500 to-teal-600` - Used for accents and highlights
- Success Gradient: `from-emerald-500 to-emerald-700` - For success states
- Shield Gradient: `from-slate-200 via-white to-slate-200` - For premium logo/branding
- Glow Accent: `emerald-500/20` for subtle glows behind important elements
- Card Gradients: Subtle `from-zinc-900 via-zinc-900 to-zinc-800` for depth

**Typography:** 
- Font: Inter or Geist Sans (via next/font)
- Titles: Use tight letter spacing (tracking-tight)

**Icons:** Lucide React with thin strokes (stroke-width 1.5-2)

## Glassmorphism & Visual Effects

**Glassmorphism Implementation:**
- Background: `bg-zinc-900/60` or `bg-zinc-950/80`
- Backdrop blur: `backdrop-blur-xl` or `backdrop-blur-2xl`
- Border: `border border-zinc-800/50` or `border-white/5`
- For extra premium feel: Add subtle gradient overlays

**Glow Effects:**
- Use `shadow-emerald-500/10` or `shadow-emerald-500/20` for subtle emerald glow
- Apply to important CTAs and active elements
- Use sparingly to maintain sophistication

**Surface Hierarchy:**
- Level 0 (Background): `bg-zinc-950`
- Level 1 (Cards): `bg-zinc-900/50` with `border-zinc-800/50`
- Level 2 (Elevated): `bg-zinc-800/50` with `border-zinc-700/50`
- Level 3 (Highlighted): Gradient overlays or emerald accents

## Animations & Transitions (framer-motion)

**Entry Animations:**
- Use `initial={{ opacity: 0, y: 20 }}` and `animate={{ opacity: 1, y: 0 }}`
- Stagger children with `transition={{ delay: index * 0.1 }}`
- Duration: 0.5s to 0.8s for smooth entries

**Hover Animations:**
- Scale: `whileHover={{ scale: 1.02 }}` (subtle, never more than 1.05)
- Use `transition={{ type: "spring", stiffness: 300 }}`

**Standard Transitions:**
- All elements: `transition-all duration-300`
- Buttons/inputs: `transition-all duration-200`
- Page transitions: 0.4s to 0.6s

## Global Layout

**Header (Navbar):**
- Fixed position with enhanced glassmorphism: `bg-zinc-950/70 backdrop-blur-2xl`
- Border: `border-b border-white/5`
- Logo: Gradient text or white with emerald accent
- Navigation: Pills with hover states, active indicator
- Height: h-16

**Container:** 
- Centered with `max-w-6xl mx-auto`
- Generous padding (`p-6` to `p-8`)
- Nothing should feel cramped

## Landing Page

**Hero Section:**
- Full viewport height with centered content
- Glassmorphism container for hero text
- Animated gradient background orbs (emerald/teal)
- Large, bold headline with gradient accent text
- Animated status badge
- Multiple CTAs with different weights

**Features Section:**
- Cards with hover animations
- Icon backgrounds with gradient/glow
- Staggered entry animations

**Trust Indicators:**
- Security badges with icons
- Stats/metrics display
- Subtle animations

**Footer:**
- Multiple columns with links
- Social media icons
- Copyright and legal

## Dashboard Page

**KPI Cards Section:**
- Three cards with subtle gradient backgrounds
- Large icons (w-8 h-8 or larger) with emerald color
- Semi-transparent decorative icons
- Hover lift effect

**Campaigns Table:**
- Card wrapper with enhanced styling
- Header row with muted text
- Zebra striping or hover highlights
- Status badges with color coding
- Action buttons grouped
- Empty state with illustration

## Create Campaign Page

**Card Sections:**
- Distinct visual hierarchy between sections
- Icon + Title in card headers
- Emerald accent for section icons

**Security Toggles:**
- Enhanced toggle items with:
  - Icon in decorative container
  - Clear labels and descriptions
  - Premium switch styling
  - Visual feedback on toggle
- Consider gradient borders for active toggles

## Micro-Interactions

**Loading States:** 
- Buttons show spinner and disable on click
- Skeleton loaders with pulse animation
- Smooth fade transitions

**Toasts:** 
- Use Shadcn Toast with emerald border for success
- Red/rose border for errors
- Subtle entry animation

**Transitions:** 
- Apply `transition-all duration-200` minimum
- Smooth color and transform changes

## Visual Quality Standards

- Premium SaaS aesthetic similar to Vercel, Linear, or Supabase
- Dark mode throughout
- Minimalist and sophisticated
- Clean typography hierarchy
- Consistent spacing (4px grid)
- NO "Bootstrap default" or "raw HTML" appearance
- Professional product ready for commercial sale
- Subtle animations that enhance UX without distraction
