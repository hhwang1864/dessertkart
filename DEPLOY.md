# DessertKart Deployment Guide

## 1. Deploy the API (Cloudflare Workers + D1)

```bash
cd api

# Create D1 database
npx wrangler d1 create dessertkart-db
# → Copy the database_id from output, update wrangler.toml [[d1_databases]] database_id

# Run schema migration
npx wrangler d1 execute dessertkart-db --file=src/db/schema.sql

# Set JWT secret (interactive)
echo "your-random-secret-here" | npx wrangler secret put JWT_SECRET

# Deploy API worker
npx wrangler deploy
# → Note your Workers URL: https://dessertkart-api.<account>.workers.dev
```

## 2. Configure Game with Production API URL

```bash
# In game/ create .env.production
echo "VITE_API_URL=https://dessertkart-api.<account>.workers.dev" > game/.env.production
```

## 3. Deploy Game (Cloudflare Pages)

Option A — Connect via Dashboard:
1. Go to Cloudflare Dashboard → Pages → Create a project
2. Connect GitHub repo `hhwang1864/dessertkart`
3. Build settings:
   - **Build command:** `cd game && npm install && npm run build`
   - **Build output directory:** `game/dist`
4. Add environment variable: `VITE_API_URL` = your Workers URL from step 1

Option B — Deploy from CLI:
```bash
cd game
npm run build
npx wrangler pages deploy dist --project-name=dessertkart
```

## 4. Verify

- Visit your Pages URL → game loads, login screen appears
- Register an account → redirects to menu
- Start a race → 3-2-1 countdown, 4 racers on track
- Finish race → results screen with prize money
- Check shop → 5 karts available to buy
