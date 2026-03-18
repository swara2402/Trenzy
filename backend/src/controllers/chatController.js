import { generateChatResponse } from "../services/aiService.js";
import { Product } from "../models/Product.js";

// Ideally in production context is dynamically built (RAG). Here we pass store rules & top products.
export async function handleChatMessage(req, res) {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required." });
    }

    // Pass limited product context
    const popularProducts = await Product.find()
      .select("id name brand price category")
      .sort({ popularity: -1 })
      .limit(30)
      .lean();

    const context = {
      storeInfo: "SmartCart AI is a premium eCommerce storefront.",
      returnPolicy: "30-day return policy for most items. Refunds processed in 5-7 days.",
      shipping: "Free shipping over ₹500. Standard 3-7 days, Express 1-2 days.",
      support: "Available 24/7.",
      popularProducts
    };

    const aiResponse = await generateChatResponse(messages, context);
    
    // Fetch suggested products from DB to return complete details to the frontend
    let products = [];
    if (aiResponse.suggestedProducts && aiResponse.suggestedProducts.length > 0) {
      products = await Product.find({ id: { $in: aiResponse.suggestedProducts } })
        .select("id name brand price image category")
        .lean();
    }

    return res.json({
      role: "assistant",
      content: aiResponse.text,
      products
    });

  } catch (error) {
    console.error("[chatController] Error:", error);
    return res.status(500).json({ message: "Failed to process chat message." });
  }
}
