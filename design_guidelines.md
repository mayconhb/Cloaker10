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

**Typography:** 
- Font: Inter or Geist Sans (via next/font)
- Titles: Use tight letter spacing (tracking-tight)

**Icons:** Lucide React with thin strokes (stroke-width 1.5-2)

## Global Layout

**Header (Navbar):**
- Fixed position with glassmorphism effect (backdrop-filter: blur)
- Logo: Bold "LinkShield" text with tracking-tighter
- Navigation: Subtle links (Dashboard, Analytics) - white when active, gray when inactive
- User menu/avatar aligned right

**Container:** 
- Centered with `max-w-6xl mx-auto`
- Generous padding (`p-6` to `p-8`)
- Nothing should feel cramped

## Dashboard Page (`/admin`)

**KPI Cards Section:**
- Three cards side by side displaying: Total Campaigns, Today's Clicks, Today's Blocks
- Large, semi-transparent icons in card backgrounds for decoration

**Campaigns Table:**
- Use Shadcn Table component within a Card
- Header: Light gray text (`text-zinc-400`)
- Rows: Subtle hover effect (`hover:bg-zinc-800/50`)
- Status column: Small Badge (green or gray)
- Slug column: Monospaced font, gray color, with small icon button for "Copy Link"
- Primary CTA: "New Campaign" button in white (primary accent)

## Create Campaign Page (`/admin/new`)

Design as a professional setup wizard with logical card sections:

**Card 1: Identity**
- Large inputs for Name and Slug
- Input for Safe URL

**Card 2: Traffic Engineering (Split Test)**
- Visual interface for destinations
- "+ Add Offer" button
- Each offer row: Small ID input, large URL input, Weight slider/numeric input
- Trash icon to remove offers

**Card 3: The "Shield" (Security)**
- Use Switches (Toggles) aligned right, NOT checkboxes
- Each security feature layout:
  - [Icon] **Feature Name** [Switch]
  - Small explanatory text below in `text-sm text-muted-foreground`
- Features: Block Desktop, Geographic Blocking (with multi-select), Origin Lock

## Analytics Page (`/admin/[id]`)

**Charts (using Recharts):**
- Clean design: Remove background grids
- Custom tooltips: Dark background, thin border
- Line colors: `emerald-500` (Allowed) vs `rose-500` (Blocked)
- Donut chart: Hollow center with clean side legend

## Micro-Interactions

**Loading States:** Buttons show spinner and disable on click
**Toasts:** Use Sonner/Shadcn Toast - green border for success, red for errors
**Transitions:** Apply `transition-all duration-200` to buttons and inputs for smooth hover effects

## Visual Quality Standards

- Premium SaaS aesthetic similar to Vercel, Linear, or Supabase
- Dark mode throughout
- Minimalist and sophisticated
- NO "Bootstrap default" or "raw HTML" appearance
- Professional product ready for commercial sale