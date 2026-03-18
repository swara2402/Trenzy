import { Product } from "../models/Product.js";
import { User } from "../models/User.js";

/**
 * Calculates similarity between two products based on category and tags.
 */
function calculateSimilarity(productA, productB) {
  let score = 0;
  
  // Same category is a strong signal
  if (productA.category === productB.category) {
    score += 5;
  }
  
  // Shared tags
  const tagsA = new Set(productA.tags || []);
  const tagsB = productB.tags || [];
  const sharedTags = tagsB.filter(tag => tagsA.has(tag));
  score += sharedTags.length * 2;
  
  // Same brand
  if (productA.brand === productB.brand) {
    score += 3;
  }
  
  return score;
}

/**
 * Gets products similar to a target product.
 */
export async function getSimilarProducts(productId, limit = 4) {
  const currentProduct = await Product.findOne({ id: productId });
  if (!currentProduct) return [];

  // Find products in the same category or with shared tags
  const candidates = await Product.find({
    id: { $ne: productId },
    $or: [
      { category: currentProduct.category },
      { tags: { $in: currentProduct.tags || [] } }
    ]
  }).limit(50); // Fetch a pool of candidates

  return candidates
    .map(product => ({
      product,
      score: calculateSimilarity(currentProduct, product)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);
}

/**
 * Gets personalized recommendations for a user based on their history and preferences.
 */
import { rankProducts } from "./aiService.js";

export async function getPersonalizedRecommendations(userId, limit = 8) {
  const user = await User.findById(userId).select("browsingHistory preferences purchaseHistory");
  if (!user) return [];

  const userContext = {
    preferences: user.preferences || {},
    browsingHistory: user.browsingHistory || [],
    purchaseHistory: user.purchaseHistory || [],
  };

  const recentProductIds = (user.browsingHistory || []).slice(0, 10).map(h => h.productId);
  const interests = {
    categories: new Set(user.preferences?.categories || []),
    brands: new Set(user.preferences?.brands || []),
    tags: new Set(user.preferences?.tags || [])
  };

  // Extract interests from browsing history
  const recentProducts = await Product.find({ id: { $in: recentProductIds } });
  
  recentProducts.forEach(p => {
    interests.categories.add(p.category);
    interests.brands.add(p.brand);
    (p.tags || []).forEach(tag => interests.tags.add(tag));
  });

  // Query candidates matching interests (rule-based filtering, ML ranking)
  const query = {
    id: { $nin: [...recentProductIds, ...(user.purchaseHistory || [])] }
  };

  if (interests.categories.size > 0 || interests.brands.size > 0 || interests.tags.size > 0) {
    query.$or = [];
    if (interests.categories.size > 0) query.$or.push({ category: { $in: Array.from(interests.categories) } });
    if (interests.brands.size > 0) query.$or.push({ brand: { $in: Array.from(interests.brands) } });
    if (interests.tags.size > 0) query.$or.push({ tags: { $in: Array.from(interests.tags) } });
  }

  const candidates = await Product.find(query).limit(limit * 3).sort({ popularity: -1, rating: -1 });

  // ML upgrade: Rank with LLM
  const ranked = await rankProducts(userContext, candidates);

  return ranked.slice(0, limit);
}
