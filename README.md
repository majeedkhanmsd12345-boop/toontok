# ToonTok — real backend MVP


This project is a real full-stack starting point for the ToonTok design you provided.

## Architecture

- **Frontend:** React + Vite, deployable to Vercel
- **Backend:** Cloudflare Worker
- **Database:** Cloudflare D1
- **Video:** Cloudflare Stream direct uploads
- **Persistent data:** users, videos, likes, views, comments, follows, wallets and withdrawals are stored in D1 — not localStorage.
- **Admin:** admin role is stored in D1. The seed script can promote `majeedkhanmsd12345@gmail.com`.

> Important: this code creates a real application backend, but it cannot guarantee income. Creator earnings need a real revenue source (ads, subscriptions, paid gifts, sponsorships, etc.) and a payout provider/account approved for your country. The withdrawal module below records requests and lets an admin approve/reject them; it does not magically send money.

## 1. Create Cloudflare resources

Install Wrangler:
```bash
npm install -g wrangler
wrangler login
```

Create a D1 database:
```bash
cd apps/api
wrangler d1 create toontok-db
```

Put the returned database ID into `wrangler.toml`.

Create a Cloudflare Stream API token with permission to create direct uploads and read Stream assets. Then:
```bash
wrangler secret put CLOUDFLARE_ACCOUNT_ID
wrangler secret put CLOUDFLARE_STREAM_TOKEN
```

Apply the schema:
```bash
wrangler d1 execute toontok-db --file=./schema.sql
```

Deploy:
```bash
wrangler deploy
```

## 2. Frontend

```bash
cd ../web
npm install
```

Create `.env`:
```env
VITE_API_URL=https://YOUR-WORKER.workers.dev
```

Run:
```bash
npm run dev
```

For Vercel, set the same `VITE_API_URL` environment variable and deploy the `apps/web` directory.

## 3. Admin

Register with:
`majeedkhanmsd12345@gmail.com`

Then run:
```bash
cd ../api
wrangler d1 execute toontok-db --command="UPDATE users SET role='admin' WHERE email='majeedkhanmsd12345@gmail.com';"
```

For production, do not hard-code an admin email in application logic; use the database role as the source of truth.

## What is already persistent

- accounts and sessions
- profiles
- video metadata
- Cloudflare Stream video IDs
- views
- likes
- comments
- follows
- wallet balances
- withdrawal requests
- admin approve/reject state

## What still needs production integration

1. Email verification / password reset.
2. Stronger abuse/rate limiting and moderation.
3. Cloudflare Turnstile or another bot protection layer.
4. A real payout provider available to your business in Pakistan (for example, an approved local payment/merchant integration).
5. A real monetization source before crediting creator balances.
6. App Store / Play Store packaging if you want native mobile apps.

Never credit users just because they watched their own videos or repeatedly refresh a page. Production earnings must be server-side, fraud-checked and funded by actual platform revenue.
