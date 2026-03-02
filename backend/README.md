# SmartCart Backend

## Setup

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`
3. Ensure MongoDB is running and `MONGODB_URI` is valid
4. Set `JWT_SECRET` in backend `.env`

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
