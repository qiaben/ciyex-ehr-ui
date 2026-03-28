# Ciyex EHR UI

Clinical EHR frontend for the Ciyex platform — built with Next.js, React, and Tailwind CSS. Provides providers, nurses, front desk, billing staff, and administrators with a full-featured EHR interface.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| Auth | Keycloak (OAuth2 + PKCE) |
| Data | FHIR R4 |
| Rich Text | Tiptap |
| Video | Jitsi React SDK |
| Payments | Stripe |
| Real-time | STOMP over WebSocket |
| Charts | ApexCharts, Recharts |
| Testing | Playwright |
| Package Manager | pnpm |
| Container | Docker (node:20-alpine) |

## Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Running [Ciyex EHR Backend](https://github.com/ciyex-org/ciyex) API
- Keycloak instance (for authentication)

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/ciyex-org/ciyex-ehr-ui.git
cd ciyex-ehr-ui
pnpm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_API_BASE=http://localhost:8080
NEXT_PUBLIC_ENV=dev
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8180
NEXT_PUBLIC_KEYCLOAK_REALM=master
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=ciyex-app
NEXT_PUBLIC_ORG_ID=your-org-id
NEXT_PUBLIC_TELEHEALTH_WS_URL=ws://localhost:4443
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
NEXT_PUBLIC_MARKETPLACE_URL=http://localhost:3002
NEXT_PUBLIC_STRIPE_PK=your-stripe-publishable-key
NEXT_PUBLIC_DEBUG=false
```

### 3. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
pnpm build
pnpm start
```

## Docker

```bash
docker build -t ciyex-ehr-ui .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://backend:8080/api \
  -e NEXT_PUBLIC_KEYCLOAK_ENABLED=true \
  -e NEXT_PUBLIC_KEYCLOAK_URL=http://keycloak:8180 \
  ciyex-ehr-ui
```

## Running Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui
```

Set `TEST_USER_PASSWORD` environment variable for test user authentication.

## Project Structure

```
src/
  app/           # Next.js App Router pages
  components/    # Reusable UI components
  context/       # React context providers
  hooks/         # Custom React hooks
  lib/           # Shared libraries and API clients
  plugins/       # Plugin modules (payment gateway, efax, etc.)
  styles/        # Global styles
  utils/         # Utilities and env config
tests/
  e2e/           # Playwright E2E tests
```

## Related Repositories

- [ciyex](https://github.com/ciyex-org/ciyex) — EHR Backend (Spring Boot)
- [ciyex-portal-ui](https://github.com/ciyex-org/ciyex-portal-ui) — Patient Portal (Next.js)

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).
