# Eboocommerce Monolith

One service, one PostgreSQL database. Auth, products, categories, uploads, reviews, cart, orders.

## Run

From repo root: `npm run dev:monolith`

Or: `cd monolith && npm install && npx prisma generate && npm run dev`

Set `.env`: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET.

API: http://localhost:4000/api — Docs: http://localhost:4000/api/docs

## Docker

`docker compose -f docker-compose.monolith.yml up --build`
