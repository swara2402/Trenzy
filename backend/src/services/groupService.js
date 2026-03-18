import { User } from "../models/User.js";
import { Group } from "../models/Group.js";
import { Product } from "../models/Product.js";
import { getPersonalizedRecommendations } from "./recommendationService.js";

export async function getGroupMembers(groupId) {
  const group = await Group.findOne({ id: groupId }).populate('members.userId', 'preferences purchaseHistory browsingHistory');
  return group ? group.members.map(m => m.userId) : [];
}

export async function mergeGroupPreferences(memberIds) {
  const members = await User.find({ _id: { $in: memberIds } }).select('preferences');
  
  const allCategories = new Set();
  const allBrands = new Set();
  let totalMinPrice = 0;
  let totalMaxPrice = 0;
  const allTags = new Set();

  members.forEach(user => {
    user.preferences.categories?.forEach(cat => allCategories.add(cat));
    user.preferences.brands?.forEach(brand => allBrands.add(brand));
    user.preferences.tags?.forEach(tag => allTags.add(tag));
    totalMinPrice += user.preferences.priceRange?.min || 0;
    totalMaxPrice += user.preferences.priceRange?.max || 100000;
  });

  const memberCount = members.length || 1;
  return {
    categories: Array.from(allCategories).slice(0, 10),
    brands: Array.from(allBrands).slice(0, 10),
    priceRange: {
      min: Math.round(totalMinPrice / memberCount),
      max: Math.round(totalMaxPrice / memberCount)
    },
    tags: Array.from(allTags).slice(0, 20)
  };
}

export async function getGroupRecommendations(groupId, limit = 8) {
  const members = await getGroupMembers(groupId);
  if (members.length === 0) return [];

  const groupPrefs = await mergeGroupPreferences(members.map(m => m._id));
  
  // Filter products matching group prefs (simple intersect)
  const products = await Product.find({
    $or: [
      { categories: { $in: groupPrefs.categories } },
      { brands: { $in: groupPrefs.brands } },
      { price: { $gte: groupPrefs.priceRange.min, $lte: groupPrefs.priceRange.max } }
    ]
  }).sort({ rating: -1 }).limit(limit * 2);

  // Fallback to personalized recs from first member if needed
  if (products.length === 0 && members[0]) {
    return getPersonalizedRecommendations(members[0]._id, limit);
  }

  return products.slice(0, limit);
}

