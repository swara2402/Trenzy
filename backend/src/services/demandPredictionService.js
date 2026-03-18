import { getDemandPrediction } from './aiService.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';

/**
 * Aggregates store data for demand prediction
 */
export async function getStoreDataForPrediction(vendorId, days = 30) {
  const storeData = {};

  // Recent sales
  const recentOrders = await Order.find({
    'sellerId': vendorId,
    createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
  }).select('items createdAt');

  storeData.sales = recentOrders.map(order => ({
    date: order.createdAt,
    items: order.items.map(item => item.productId),
    value: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }));

  // Low stock products
  storeData.lowStock = await Product.find({
    sellerId: vendorId,
    stock: { $lt: 10 }
  }).select('id name stock salesVelocity');

  // Product views/abandonments (placeholder - from analytics)
  storeData.views = []; // Integrate with Analytics model
  storeData.abandonments = []; // From cart abandonment tracking

  return storeData;
}

/**
 * Gets demand prediction report for vendor
 */
export async function getVendorDemandPrediction(vendorId) {
  const storeData = await getStoreDataForPrediction(vendorId);
  const prediction = await getDemandPrediction(storeData);
  return prediction;
}

export default { getVendorDemandPrediction };

