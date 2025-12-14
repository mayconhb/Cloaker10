# LinkShield

## Overview

LinkShield is a link protection and cloaking SaaS platform designed for affiliates and advertisers. It protects landing pages and offers from bots, scrapers, spies, and unauthorized access through a multi-layer security system. The platform provides campaign management with configurable blocking rules, traffic analytics, and custom domain support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/UI (Radix primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with custom dark theme (zinc-950 background, premium SaaS aesthetic)
- **Build Tool**: Vite with React plugin
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Style**: RESTful JSON API under `/api` prefix
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)
- **Authentication**: Simple email/password auth (hardcoded admin user for development)

### Multi-Layer Protection System
The core business logic implements 4 security layers:
1. **Anti-Automation (Bot Detection)** - User-Agent blacklist for scrapers, headless browsers, CLI tools
2. **Device Filtering** - Block desktop or mobile devices based on campaign configuration
3. **Geolocation Blocking** - Country-based IP filtering (planned)
4. **Origin Lock** - Validates traffic origin via fbclid parameter or in-app browsers

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Key Tables**: users, sessions, campaigns, domains, access_logs
- **Migrations**: Drizzle Kit with `db:push` command

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/ui/   # Shadcn/UI components
│   ├── pages/           # Route pages (Dashboard, NewCampaign, etc.)
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and query client
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database access layer
│   ├── botDetector.ts   # Layer 1: Bot detection
│   ├── deviceDetector.ts # Layer 2: Device filtering
│   └── dnsVerifier.ts   # Custom domain verification
├── shared/              # Shared types and schema
│   └── schema.ts        # Drizzle schema definitions
└── migrations/          # Database migrations
```

### Build Configuration
- Development: `tsx server/index.ts` with Vite middleware for HMR
- Production: esbuild bundles server to `dist/index.cjs`, Vite builds client to `dist/public`
- TypeScript paths: `@/` maps to client/src, `@shared/` maps to shared/

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, requires `DATABASE_URL` environment variable
- **Session Store**: PostgreSQL-backed sessions via connect-pg-simple

### Authentication
- **Replit Auth**: OpenID Connect integration available (replitAuth.ts) but currently using simple auth
- **Session Secret**: Requires `SESSION_SECRET` environment variable

### Third-Party Services (Potential)
- **DNS Verification**: Built-in DNS resolution for custom domain verification
- **Geolocation**: IP-to-country lookup (implementation pending)

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session encryption key
- `REPL_ID`, `REPL_OWNER`, `REPL_SLUG` - Replit environment (auto-set)

### Frontend Libraries
- Recharts for analytics visualizations
- Lucide React for icons (thin stroke style)
- date-fns for date formatting