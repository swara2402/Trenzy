# 🚀 AI Upgrade TODO - Make SmartCart INSANE (10/10 Level)

Current Status (from analysis):
- 🟡 Recommendation: Rule-based → Needs ML embeddings/collaborative filtering
- 🟡 Cart Suggestions: Association rules → Needs real mining
- 🟡 Chatbot: LLM backend exists (Gemini), mock without key → Full integration
- ✅ Demand Prediction: Implemented in aiService.js → Integrate UI
- ❌ Missing: Dynamic pricing, Visual search, Fraud, Budget AI, Review summary, Predictive reorder

## PHASE 1: Setup Real AI/ML (Immediate)
- [ ] Add GEMINI_API_KEY to backend/.env (get from Google AI Studio)
- [ ] cd backend && npm i @google/generative-ai tensorflow/tfjs-node pinecone-client
- [ ] Test aiService.js: curl POST /api/chat → Real LLM response
- [ ] Update RUNTIME_FIX_TODO.md: Mark AI ready [x]

## PHASE 2: Upgrade Recommendation Engine → Real ML
- [x] In aiService.js: Add product embeddings (TF.js or Vertex AI)
- [x] Update recommendationService.js: Use aiService.rankProducts for user recs
- [x] Update lib/recommendations.ts: Call upgraded API
- [x] Frontend: PersonalizedFeed.tsx, RecommendedForYou.tsx auto-upgrade
- [x] Test: User login → See ML-ranked recs

## PHASE 3: Full LLM Chatbot
- [ ] Ensure AIChatbot.tsx calls /api/chat (uses generateChatResponse)
- [ ] Add context: User cart/history to chat prompts
- [ ] Handle [PRODUCT:id] tags → Auto-show product cards in chat
- [ ] Test: Ask \"recommend laptop under $1000\" → LLM + products

## PHASE 4: Demand Prediction for Sellers
- [ ] In VendorDashboard.tsx: Add Demand Forecast section
- [ ] Call aiService.getDemandPrediction(storeData) → Show summary/trends/warnings
- [ ] Aggregate storeData: Sales/views/abandon/stock from models
- [ ] Test: Vendor view → \"Demand up 15% on earbuds\"

## PHASE 5: Add MISSING AI Features
### Dynamic Pricing
- [ ] New dynamicPricingService.js: LLM on demand/competitors
- [ ] VendorDashboard: Price optimizer button

### Visual Search
- [ ] New visualSearch.js: Basic image similarity (embeddings)
- [ ] ProductDetail: \"Upload photo to search similar\"

### Fraud Detection
- [ ] New fraudService.js: Anomaly detection on orders/payments

### Others
- [ ] Budget tracking AI: Track user spend → Suggest limits
- [ ] Review summarization: LLM summarize reviews
- [ ] Predictive reorder: Auto-suggest stock for vendors

## PHASE 6: Production Architecture
- [ ] Separate AI microservice (Docker?)
- [ ] Vector DB: Pinecone for product/user embeddings
- [ ] MLflow/Weights&Biases for model tracking
- [ ] A/B test old vs new recs

## Follow-up
- After each phase: Update this TODO [x]
- Run `npm run dev` → Test new features
- Monitor console: No more \"MOCK AI\"

Target: Upgrade just TOP 3 → INSANE level! 🚀
