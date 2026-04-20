# Signature Cleans Client Portal

Self-hosted client portal for Signature Cleans. Gives cleaning clients secure access to their documents, audit scores, and activity logs without needing to email files around.

Live at: **https://portal.signature-cleans.co.uk**

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router, React 19, Server Components) |
| Database | PostgreSQL via Prisma ORM |
| Auth | Passwordless magic links (JWT sessions, 60-day expiry) |
| Document storage | Dropbox API v2 (OAuth refresh token flow, temporary download links) |
| Email | SMTP via Nodemailer (IONOS) |
| Charts | Recharts |
| Styling | Tailwind CSS 3 |
| Animations | Framer Motion |
| Validation | Zod |
| Hosting | VPS (IONOS), nginx reverse proxy, systemd |

## Architecture

```
Client browser
  |
  v
nginx (SSL termination, port 443)
  |
  v
Next.js server (port 3090, systemd: client-portal.service)
  |
  +--> PostgreSQL (local, Prisma)
  +--> Dropbox API (document sync + temporary download links)
  +--> SMTP (magic link emails)
```

### Multi-tenant model

- **Organisations** own **Clients** (one org can have many client sites)
- **Client Users** are linked to clients by email, granted viewer or admin roles
- **Super Admins** can impersonate any client to view their portal as they see it
- Row-level access: every query filters by the authenticated user's client memberships
- Designed for franchise scale: each territory gets its own org, clients underneath

### Auth flow

1. User enters email on `/login`
2. Server checks if email exists in `client_users` or `super_admins`
3. If yes: generates a one-time token (15 min expiry), sends branded email with magic link
4. If no: returns identical response (prevents email enumeration)
5. User clicks link, token is consumed, JWT session cookie set (60 days, httpOnly, secure)
6. On first login, `users` record auto-created and linked to `client_users`/`super_admins`

## Database Schema

### Core tables

| Table | Purpose |
|-------|---------|
| `organisations` | Top-level tenant (e.g. "Signature Cleans Exeter") |
| `clients` | Individual contract/site (e.g. "Porsche Centre Exeter") |
| `client_users` | Portal access grants, linked by email |
| `documents` | Synced from Dropbox, categorised (audit, contract, site_pack, photo) |
| `audit_scores` | Audit results with score, auditor, notes, date |
| `activity_log` | Timestamped activity feed per client |
| `super_admins` | Admin users who can impersonate any client |
| `users` | Auth identity (auto-created on first magic link login) |
| `verification_tokens` | One-time magic link tokens (15 min TTL) |
| `sessions` / `accounts` | NextAuth compatibility tables (not actively used) |

Full schema: `prisma/schema.prisma`

## Pages

### Client-facing (auth required)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview: stat cards (doc count, latest audit score with trend, average score, audit count), recent documents, activity timeline, audit trend chart |
| `/documents` | Document browser with folder grouping, category chips, search. Click to view or download. |
| `/documents/[id]/view` | Individual document detail with Dropbox temporary download link |
| `/audits` | Audit history: score cards, trend arrows, expandable notes |
| `/activity` | Full chronological activity log |

### Auth

| Route | Description |
|-------|-------------|
| `/login` | Magic link request form |
| `/check-email` | Confirmation screen after sending link |
| `/logged-out` | Post-logout landing |

### Admin (super_admin only)

| Route | Description |
|-------|-------------|
| `/admin` | Client list with impersonation controls. Click a client to view their portal as they see it. |

### API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/send-link` | POST | Send magic link email |
| `/api/auth/verify` | GET | Consume magic link token, set session |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/documents/[id]/download` | GET | Generate Dropbox temporary link and redirect |
| `/api/admin/impersonate` | POST | Start impersonating a client (super_admin) |
| `/api/admin/stop-impersonating` | POST | End impersonation |

## Components

| Component | Purpose |
|-----------|---------|
| `AuditTrendChart` | Recharts line chart for audit score history |
| `AuditNotesCell` | Expandable/collapsible audit notes in table rows |
| `DocumentsBrowser` | Folder-grouped document table with category chips and search |
| `ImpersonationBanner` | Yellow banner shown when admin is impersonating a client |
| `NavLink` | Active-state nav link for sidebar |

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/portal"

# Auth
AUTH_SECRET="random-64-char-string"

# SMTP (for magic link emails)
SMTP_HOST="smtp.ionos.co.uk"
SMTP_PORT=587
SMTP_USER="hello@signature-cleans.co.uk"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Signature Cleans <hello@signature-cleans.co.uk>"

# Dropbox (for document sync)
DROPBOX_APP_KEY="your-app-key"
DROPBOX_APP_SECRET="your-app-secret"
DROPBOX_REFRESH_TOKEN="your-refresh-token"

# Portal
PORTAL_BASE_URL="https://portal.signature-cleans.co.uk"
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Install and run

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Push schema to database (creates tables)
pnpm prisma:push

# Seed demo data (optional)
pnpm seed

# Development
pnpm dev

# Production build
pnpm build
pnpm start
```

The app runs on port **3090** by default.

### Production deployment (systemd)

```ini
# /etc/systemd/system/client-portal.service
[Unit]
Description=Signature Cleans Client Portal
After=network.target postgresql.service

[Service]
Type=simple
User=dorabot
WorkingDirectory=/var/www/portal
ExecStart=/home/dorabot/.nvm/versions/node/v22.22.1/bin/node node_modules/.bin/next start -p 3090
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name portal.signature-cleans.co.uk;

    ssl_certificate /etc/letsencrypt/live/portal.signature-cleans.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.signature-cleans.co.uk/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Dropbox Integration

Documents are synced from Dropbox using the API v2 refresh token flow:

1. `listFolderRecursive()` lists all files in a client's Dropbox folder
2. Files are inserted into the `documents` table with their Dropbox path and ID
3. When a user clicks "Download", the server generates a temporary Dropbox link (4 hours) via `getTemporaryLink()` and redirects

Sync scripts are in `scripts/`:
- `sync-porsche-to-nelson-test.ts` — example sync script for Porsche documents

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/seed.ts` | Seeds the database with demo organisations, clients, users, audits, and documents |
| `scripts/sync-porsche-to-nelson-test.ts` | Syncs Porsche Dropbox documents to the Nelson Test demo client |

## Design System

Brand colours defined in `tailwind.config.ts`:

| Token | Value | Usage |
|-------|-------|-------|
| `sc-dark` | `#1a1a1a` | Primary text, dark backgrounds |
| `accent` / `accent-dark` | `#2c5f2d` | Buttons, links, positive indicators |
| `sc-yellow` | `#f9a825` | Highlights, labels |
| `danger` | `#dc2626` | Negative indicators |
| `border` | `#e8e6e1` | Card borders, dividers |
| `bg` | `#fafaf9` | Page background |

Typography: Geist (sans) + Geist Mono. Display headings use tight tracking (-0.015em).

## Licence

Proprietary. Signature Cleans internal use only.
