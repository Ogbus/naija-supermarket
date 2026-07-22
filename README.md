# NaijaMart

A mobile-responsive e-commerce site for everyday Nigerian supermarket products, built with:

- **Frontend:** vanilla HTML, CSS, JavaScript (no framework/build step)
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`)
- **Auth:** JWT (short-lived access token + httpOnly refresh cookie)
- **Payments:** Paystack (hosted checkout redirect + webhook)

## Features

- **Users:** registration (required to shop), login, JWT auth
- **Products:** ~50 seeded Nigerian supermarket staples across 11 categories (rice, garri, beans, cooking oil & seasoning, canned foods, beverages, dairy, baking, snacks, household/toiletries, fresh produce, baby products)
- **Cart:** persisted server-side per user (not localStorage — survives across devices/sessions)
- **Orders:** created from cart at checkout, full order history for customers
- **Inventory:** stock tracked per product, auto-decremented on successful payment, low-stock alerts for admins
- **Payments:** real Paystack integration — initialize transaction, redirect to Paystack's hosted page, verify on return, and a webhook endpoint for asynchronous confirmation
- **Admin roles:** separate admin panel to manage products, inventory, and order status, plus a sales dashboard

## Project structure

```
ecommerce-app/
├── server/              Express backend
│   ├── db/               SQLite schema, connection, seed script
│   ├── middleware/        auth (JWT) + error handling
│   ├── controllers/       route handler logic
│   ├── routes/             route definitions
│   ├── utils/              JWT + Paystack helpers
│   └── server.js           app entrypoint
├── public/               Static frontend (served by Express)
│   ├── *.html              storefront pages
│   ├── admin/               admin panel pages
│   ├── css/                 stylesheets
│   └── js/                  client-side scripts
├── .env.example
└── package.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — set these to long random strings (e.g. `openssl rand -hex 32`)
- `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — get test keys from your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developer)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — credentials for the admin account the seed script creates
- `CLIENT_URL` — the URL your app runs on (used for Paystack's redirect callback and CORS)

### 3. Seed the database

This creates the SQLite file, all tables, the product catalog, and the admin account:

```bash
npm run seed
```

You can re-run this safely — it won't duplicate products or overwrite an existing admin account.

### 4. Start the server

```bash
npm start
```

Visit **http://localhost:3000**. Log in to the admin panel at **http://localhost:3000/admin/dashboard.html** using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

For auto-restart during development:

```bash
npm run dev
```

## Paystack webhook (for production)

For inventory/order status to update reliably even if a customer closes their browser mid-payment, set your webhook URL in the Paystack dashboard to:

```
https://your-domain.com/api/payments/webhook
```

Locally, you can test this with a tunneling tool like `ngrok` pointed at port 3000.

## Notes on the payment flow

1. Customer checks out → `POST /api/orders` creates a `pending` order from their cart.
2. `POST /api/payments/initialize` creates a Paystack transaction and returns a hosted `authorization_url`.
3. The browser redirects there; Paystack redirects back to `/checkout.html?reference=...`.
4. The frontend calls `GET /api/payments/verify/:reference`, which confirms the transaction with Paystack, marks the order `paid`, decrements inventory, and clears the cart.
5. The `/api/payments/webhook` endpoint does the same thing independently (verified via the `x-paystack-signature` header) so payment confirmation isn't solely dependent on the customer's browser completing step 4. Both paths are idempotent.

## Extending this project

Ideas for a v2:

- Product images: replace the placeholder SVGs with real photos
- Email notifications on order status changes (e.g. via Nodemailer)
- Pagination / infinite scroll for the product grid
- Product reviews and ratings
- Discount codes / coupons table
- Multiple delivery fee tiers by state
- Server-side input validation with `express-validator` (already installed, not yet wired up on every route)
