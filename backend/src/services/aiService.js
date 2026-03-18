import { GoogleGenAI } from "@google/genai";

// We check if API key exists. If not, we will use mock responses.
const API_KEY = process.env.GEMINI_API_KEY;
const isMock = !API_KEY;
let ai;

if (!isMock) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("⚠️ GEMINI_API_KEY is not set in backend/.env. Using MOCK AI responses.");
}

/**
 * Handles generating chat responses for the Chatbot
 */
export async function generateChatResponse(messages, context) {
  if (isMock) {
    return {
      text: "I am a mock AI assistant! Please add GEMINI_API_KEY to your backend .env file to enable the real Gemini LLM.",
      confidence: 1.0,
      suggestedProducts: [] // Mock can't actually search in context
    };
  }

  try {
    const systemPrompt = `You are the SmartCart AI Assistant. 
You are an expert shopping assistant helping users find products, track orders, and understand policies.
Be concise, friendly, and highly knowledgeable. Do not use Markdown formatting for lists if plain text looks better, but you can use basic bolding.
Here is the context about our store policies and the current product catalog:
${JSON.stringify(context)}

If the user asks for products, and you find a suitable match in the context, you should mention the product ID in a special tag like [PRODUCT:id] at the end of the message so the frontend can display it.`;

    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add system instruction as the first user message or handle via instructions param
    // The @google/genai SDK v0.1 allows `systemInstruction`
    const request = {
      model: "gemini-2.5-flash",
      contents: formattedMessages,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      config: {
        temperature: 0.7,
      }
    };

    const response = await ai.models.generateContent(request);
    let text = response.text || "";

    // Parse out [PRODUCT:id] tags to return as structured data
    const productTagRegex = /\\[PRODUCT:([a-zA-Z0-9-]+)\\]/g;
    const productTags = text.match(productTagRegex) || [];
    const suggestedProducts = productTags.map(tag => {
      const match = tag.match(/\\[PRODUCT:([a-zA-Z0-9-]+)\\]/);
      return match ? match[1] : null;
    }).filter(Boolean);
    // Clean text by removing tags
    text = text.replace(productTagRegex, "").trim();

    return { text, suggestedProducts };
  } catch (error) {
    console.error("[aiService] Chat generation failed:", error);
    throw error;
  }
}

/**
 * Ranks products based on a user's context (history, preferences)
 */
export async function rankProducts(userContext, candidates) {
  if (isMock) {
    // If mock, just return candidates randomly or as-is
    return candidates.slice(0, 8);
  }

  if (!candidates || candidates.length === 0) return [];

  try {
    const prompt = `You are a recommendation engine. Rank the following candidate products to best match the user's interests.
User Context (browsing history, purchase history, tags):
${JSON.stringify(userContext)}

Candidates:
${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.name, category: c.category, tags: c.tags })))}

Return a JSON array of product IDs ordered from best match to worst match. Do NOT include markdown blocks like \`\`\`json. Return only the raw JSON array.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2, // Be deterministic
      }
    });

    try {
      let text = response.text.trim();
      if (text.startsWith("\`\`\`json")) {
        text = text.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
      }
      if (text.startsWith("\`\`\`")) {
        text = text.replace(/^\`\`\`\s*/, "").replace(/\s*\`\`\`$/, "");
      }
      
      const rankedIds = JSON.parse(text);
      if (Array.isArray(rankedIds)) {
        // Map ranked IDs back to full candidate objects
        const idToCandidate = new Map(candidates.map(c => [c.id, c]));
        const rankedCandidates = rankedIds.map(id => idToCandidate.get(id)).filter(Boolean);
        
        // Append any candidates that were missed
        const missed = candidates.filter(c => !rankedIds.includes(c.id));
        return [...rankedCandidates, ...missed];
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini recommendation response as JSON. Falling back to default sorting.");
    }

    return candidates;
  } catch (error) {
    console.error("[aiService] Product ranking failed:", error);
    return candidates;
  }
}

/**
 * Generates an analytical demand prediction report for vendors
 */
export async function getDemandPrediction(storeData) {
  if (isMock) {
    return {
      summary: "Demand is expected to rise by 15% next week (MOCK).",
      trends: ["Mock Trend: Wireless earbuds will spike.", "Mock Trend: Smartwatches dropping."],
      warnings: ["Mock Warning: Low stock on Premium Headphones."]
    };
  }

  try {
    const prompt = `You are a Demand Prediction AI for an eCommerce vendor.
Analyze the following store data (recent sales, views, cart abandonments, current stock).
${JSON.stringify(storeData)}

Generate an authoritative, insightful Demand Prediction report.
Format the output strictly as a JSON object with this shape (no markdown blocks or backticks):
{
  "summary": "High-level summary paragraph describing the upcoming demand forecast.",
  "trends": [ "trend 1 actionable advice", "trend 2..." ],
  "warnings": [ "warning 1 about stock/abandonment", "warning 2..." ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    try {
      let text = response.text.trim();
      if (text.startsWith("\`\`\`json")) {
        text = text.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
      }
      if (text.startsWith("\`\`\`")) {
        text = text.replace(/^\`\`\`\s*/, "").replace(/\s*\`\`\`$/, "");
      }
      
      const prediction = JSON.parse(text);
      if (prediction.summary && prediction.trends && prediction.warnings) {
        return prediction;
      }
    } catch (parseError) {
      console.warn("Failed to parse Gemini demand prediction as JSON.");
    }

    return {
      summary: "Insufficient data to confidently generate a demand forecast.",
      trends: [],
      warnings: []
    };
  } catch (error) {
    console.error("[aiService] Demand prediction failed:", error);
    throw error;
  }
}
