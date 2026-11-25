# Shop.Co Admin + Backend Integration

## What is connected
- Admin login uses `POST /api/auth/login` and only accepts accounts with backend role `admin`.
- Products load from MongoDB via `GET /api/products`; create, edit and delete use the protected product endpoints.
- Orders load from `GET /api/orders`; status changes use `PATCH /api/orders/:id/status`.
- Users load from the new admin-only `GET /api/users` endpoint.
- The frontend stores the JWT in localStorage and sends it as a Bearer token.

## Setup
1. In `backend`, copy `.env.example` to `.env` and set `MONGO_URI`, a long random `JWT_SECRET`, and `CLIENT_URL=http://localhost:5173`.
2. In `backend`, run `npm install`, then `npm run dev`.
3. In `Admin-pannel-pro`, run `npm install`, then `npm run dev`.
4. Open the Vite URL (normally http://localhost:5173) and sign in with a backend admin account.

## Important
- The supplied backend's user model supports `customer` and `admin` roles. Create/promote an admin account securely in your database before signing in.
- Product records require an image path; new products created from this panel use `/images/black-t-shirt.png`.
- The dashboard's sample analytics charts and activity logs remain demo data; live product, order and user tables are API-backed.
- The original backend `.env` was intentionally excluded from this integration package. Configure your own secrets from `.env.example`.
