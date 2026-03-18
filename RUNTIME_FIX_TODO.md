# Backend Startup Fix TODO

1. [ ] Copy backend/.env.example → backend/.env
2. [ ] Edit backend/.env:
   - Get MongoDB Atlas free URI (signup at mongodb.com/atlas → Connect → Drivers)
   - Generate JWT_SECRET = openssl rand -base64 32
3. [ ] Install/Start MongoDB local or use Atlas URI
4. [ ] cd backend && npm run dev → Check '[backend] MongoDB connected'
5. [ ] Root: npm run dev → Full app

Progress: .env.example created [x]

