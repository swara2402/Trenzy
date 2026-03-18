# SmartCart Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`
3. Ensure MongoDB is running and `MONGODB_URI` is valid
4. Set `JWT_SECRET` in backend `.env` (minimum 32 chars)

## Run

- Development: `npm run dev`
- Production: `npm start`

## Seed sample products

- `npm run seed`

## API

- `GET /api/health`
- `GET /api/products`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me` (requires `Authorization: Bearer <token>`)

## Security

- Input validation is enforced across auth, user, and product write endpoints.
- Rate limits are enabled:
  - global API limiter
  - stricter auth limiter
  - write-operations limiter for `/api/users/*`
- Secure API headers are set on all responses.
- HTTPS enforcement is available via `ENFORCE_HTTPS=true` (recommended with `TRUST_PROXY=true` behind reverse proxies).
- CORS is restricted to `CLIENT_ORIGIN` + optional `CLIENT_ORIGINS` list.
