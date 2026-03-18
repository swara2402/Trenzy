interface ParsedQuery {
  keywords: string[];
  category?: string;
  color?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
}

const COLORS = new Set(['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'gray', 'brown', 'beige']);
const CATEGORIES = new Set(['shoes', 'laptop', 'phone', 'dress', 'shirt', 'pants', 'bag', 'watch', 'headphones']);
const BRANDS = new Set(['samsung', 'apple', 'nike', 'adidas', 'sony', 'dell', 'hp']);

export function parseSearchQuery(input: string): ParsedQuery {
  const lower = input.toLowerCase().trim();
  const result: ParsedQuery = { keywords: [] };

  // Extract price ranges
  const priceMatch = lower.match(/(?:under|less|below)?\\s*(\\d+(?:\\.\\d+)?)(?:\\s*(?:rs|rupees))?/gi);
  if (priceMatch) {
    const price = parseFloat(priceMatch[0]);
    result.maxPrice = Math.round(price);
  }
  const priceOverMatch = lower.match(/(?:over|above|more)\\s*(\\d+(?:\\.\\d+)?)(?:\\s*(?:rs|rupees))?/gi);
  if (priceOverMatch) {
    const price = parseFloat(priceOverMatch[0]);
    result.minPrice = Math.round(price);
  }

  // Extract keywords (words not matched as filters)
  const words = lower.split(/\\s+/);
  const keywords = [];
  for (const word of words) {
    const cleanWord = word.replace(/[.,!?]/g, '');
    if (CATEGORIES.has(cleanWord)) {
      result.category = cleanWord;
    } else if (COLORS.has(cleanWord)) {
      result.color = cleanWord;
    } else if (BRANDS.has(cleanWord)) {
      result.brand = cleanWord;
    } else if (!isNaN(parseFloat(cleanWord)) && !result.minPrice && !result.maxPrice) {
      result.maxPrice = parseFloat(cleanWord);
    } else {
      keywords.push(cleanWord);
    }
  }
  result.keywords = keywords.filter(k => k.length > 1);

  return result;
}

// Build query string from parsed
export function buildQueryString(parsed: ParsedQuery, originalQuery: string): string {
  const params = new URLSearchParams();
  if (parsed.keywords.length > 0) params.set('search', parsed.keywords.join(' '));
  if (parsed.category) params.set('category', parsed.category);
  if (parsed.color) params.set('color', parsed.color);
  if (parsed.brand) params.set('brand', parsed.brand);
  if (parsed.minPrice !== undefined) params.set('minPrice', parsed.minPrice.toString());
  if (parsed.maxPrice !== undefined) params.set('maxPrice', parsed.maxPrice.toString());
  return params.toString();
}

