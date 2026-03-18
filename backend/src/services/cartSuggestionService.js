import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";

/**
 * Gets product suggestions for the current cart items based on order history.
 * (Market Basket Analysis / Association Rules)
 */
import { rankProducts } from "./aiService.js";

export async function getCartSuggestions(currentCartProductIds, limit = 4) {
    if (!currentCartProductIds || currentCartProductIds.length === 0) {
        // Return popular products as fallback
        return Product.find()
            .sort({ popularity: -1 })
            .limit(limit);
    }

    const cartContext = {
      currentCart: currentCartProductIds,
      type: 'cart_suggestions'
    };

    // Market basket candidates
    const associatedOrders = await Order.find({
        "items.productId": { $in: currentCartProductIds }
    }).select("items.productId");

    const occurrenceMap = new Map();

    associatedOrders.forEach(order => {
        const productIdsInOrder = order.items.map(item => item.productId);

        const hasMatch = productIdsInOrder.some(id => currentCartProductIds.includes(id));

        if (hasMatch) {
            productIdsInOrder.forEach(id => {
                if (!currentCartProductIds.includes(id)) {
                    occurrenceMap.set(id, (occurrenceMap.get(id) || 0) + 1);
                }
            });
        }
    });

    const sortedIds = Array.from(occurrenceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

    let candidates = [];
    if (sortedIds.length > 0) {
        candidates = await Product.find({ id: { $in: sortedIds } });
    }

    // Fallback categories
    if (candidates.length < limit * 2) {
        const cartProducts = await Product.find({ id: { $in: currentCartProductIds } }).select("category");
        const categories = Array.from(new Set(cartProducts.map(p => p.category)));

        const seenIds = new Set([...currentCartProductIds, ...candidates.map(p => p.id)]);
        const fallback = await Product.find({
            category: { $in: categories },
            id: { $nin: Array.from(seenIds) }
        })
            .sort({ popularity: -1 })
            .limit(limit * 2);

        candidates = [...candidates, ...fallback];
    }

    // ML upgrade: Rank suggestions with LLM
    const ranked = await rankProducts(cartContext, candidates);

    return ranked.slice(0, limit);
}
