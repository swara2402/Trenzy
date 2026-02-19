export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  tags: string[];
  image: string;
  images: string[];
  description: string;
  features: string[];
  inStock: boolean;
  popularity: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export const categories = [
  { id: "electronics", name: "Electronics", icon: "💻", count: 24 },
  { id: "fashion", name: "Fashion", icon: "👕", count: 36 },
  { id: "home", name: "Home & Living", icon: "🏠", count: 18 },
  { id: "fitness", name: "Fitness", icon: "🏋️", count: 12 },
  { id: "beauty", name: "Beauty", icon: "✨", count: 20 },
  { id: "accessories", name: "Accessories", icon: "⌚", count: 15 },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Minimalist Wireless Earbuds Pro",
    brand: "SoundCore",
    price: 79.99,
    originalPrice: 129.99,
    rating: 4.8,
    reviewCount: 342,
    category: "electronics",
    tags: ["wireless", "noise-cancelling", "trending"],
    image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop",
    ],
    description: "Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear audio. Designed for the modern listener.",
    features: ["Active Noise Cancellation", "30hr Battery", "IPX5 Water Resistant", "Touch Controls"],
    inStock: true,
    popularity: 95,
  },
  {
    id: "2",
    name: "Oversized Cotton Hoodie",
    brand: "Urban Threads",
    price: 54.99,
    rating: 4.6,
    reviewCount: 189,
    category: "fashion",
    tags: ["streetwear", "comfortable", "bestseller"],
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop",
    ],
    description: "Ultra-soft oversized hoodie made from 100% organic cotton. Perfect for layering or lounging. Relaxed fit with dropped shoulders.",
    features: ["100% Organic Cotton", "Oversized Fit", "Kangaroo Pocket", "Ribbed Cuffs"],
    inStock: true,
    popularity: 88,
  },
  {
    id: "3",
    name: "Smart LED Desk Lamp",
    brand: "LumiTech",
    price: 45.99,
    originalPrice: 59.99,
    rating: 4.7,
    reviewCount: 256,
    category: "home",
    tags: ["smart-home", "minimalist", "trending"],
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop",
    ],
    description: "Sleek LED desk lamp with adjustable color temperature, brightness control, and USB charging port. Voice assistant compatible.",
    features: ["Adjustable Color Temp", "USB-C Charging", "Voice Control", "Eye-Care Mode"],
    inStock: true,
    popularity: 82,
  },
  {
    id: "4",
    name: "Performance Training Sneakers",
    brand: "VeloFit",
    price: 119.99,
    rating: 4.9,
    reviewCount: 478,
    category: "fitness",
    tags: ["running", "performance", "bestseller"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop",
    ],
    description: "Engineered for peak performance with responsive cushioning and breathable knit upper. From sprint sessions to daily runs.",
    features: ["Responsive Cushioning", "Breathable Knit", "Carbon Plate", "Reflective Details"],
    inStock: true,
    popularity: 97,
  },
  {
    id: "5",
    name: "Vitamin C Glow Serum",
    brand: "GlowLab",
    price: 32.99,
    rating: 4.5,
    reviewCount: 623,
    category: "beauty",
    tags: ["skincare", "natural", "trending"],
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
    ],
    description: "Brightening serum with 20% Vitamin C, hyaluronic acid, and niacinamide. For radiant, even-toned skin in just 2 weeks.",
    features: ["20% Vitamin C", "Hyaluronic Acid", "Vegan & Cruelty-Free", "Dermatologist Tested"],
    inStock: true,
    popularity: 91,
  },
  {
    id: "6",
    name: "Titanium Minimal Watch",
    brand: "ChronoX",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.8,
    reviewCount: 167,
    category: "accessories",
    tags: ["luxury", "minimalist", "new"],
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop",
    ],
    description: "Ultra-thin titanium watch with sapphire crystal glass, Japanese quartz movement, and genuine leather strap.",
    features: ["Titanium Case", "Sapphire Crystal", "Japanese Movement", "5ATM Water Resistant"],
    inStock: true,
    popularity: 85,
  },
  {
    id: "7",
    name: "Portable Power Bank 20K",
    brand: "ChargePro",
    price: 39.99,
    rating: 4.4,
    reviewCount: 891,
    category: "electronics",
    tags: ["portable", "essentials", "bestseller"],
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop",
    ],
    description: "Compact 20,000mAh power bank with PD fast charging, dual USB-C ports, and airline-safe design. Never run out of power.",
    features: ["20,000mAh", "PD 65W Fast Charge", "Dual USB-C", "Airline Safe"],
    inStock: true,
    popularity: 79,
  },
  {
    id: "8",
    name: "Cargo Jogger Pants",
    brand: "Urban Threads",
    price: 64.99,
    rating: 4.3,
    reviewCount: 214,
    category: "fashion",
    tags: ["streetwear", "utility", "new"],
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop",
    ],
    description: "Modern cargo joggers with tapered fit, multiple utility pockets, and adjustable ankle cuffs. Comfort meets function.",
    features: ["Tapered Fit", "6 Pockets", "Elastic Waistband", "Ankle Cuffs"],
    inStock: true,
    popularity: 73,
  },
  {
    id: "9",
    name: "Yoga Mat Premium",
    brand: "ZenFlex",
    price: 49.99,
    rating: 4.7,
    reviewCount: 345,
    category: "fitness",
    tags: ["yoga", "eco-friendly", "trending"],
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
    ],
    description: "6mm thick eco-friendly yoga mat with non-slip texture and alignment guide. Made from natural tree rubber.",
    features: ["6mm Thick", "Non-Slip", "Alignment Guide", "Eco-Friendly"],
    inStock: true,
    popularity: 76,
  },
  {
    id: "10",
    name: "Retinol Night Cream",
    brand: "GlowLab",
    price: 28.99,
    originalPrice: 38.99,
    rating: 4.6,
    reviewCount: 432,
    category: "beauty",
    tags: ["skincare", "anti-aging", "bestseller"],
    image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=600&h=600&fit=crop",
    ],
    description: "Gentle retinol night cream that reduces fine lines and improves skin texture while you sleep. Enriched with peptides and ceramides.",
    features: ["0.5% Retinol", "Peptide Complex", "Ceramides", "Fragrance-Free"],
    inStock: true,
    popularity: 84,
  },
  {
    id: "11",
    name: "Canvas Crossbody Bag",
    brand: "NomadGear",
    price: 42.99,
    rating: 4.5,
    reviewCount: 178,
    category: "accessories",
    tags: ["travel", "utility", "new"],
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
    ],
    description: "Versatile waxed canvas crossbody bag with multiple compartments, RFID-blocking pocket, and adjustable strap.",
    features: ["Waxed Canvas", "RFID Blocking", "Water Resistant", "Adjustable Strap"],
    inStock: true,
    popularity: 71,
  },
  {
    id: "12",
    name: "Ceramic Pour-Over Set",
    brand: "BrewCraft",
    price: 36.99,
    rating: 4.8,
    reviewCount: 267,
    category: "home",
    tags: ["coffee", "handmade", "trending"],
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop",
    ],
    description: "Handcrafted ceramic pour-over coffee set with dripper, carafe, and reusable filter. Brew café-quality coffee at home.",
    features: ["Handcrafted Ceramic", "Reusable Filter", "600ml Carafe", "Heat Resistant"],
    inStock: true,
    popularity: 80,
  },
];

export const reviews: Record<string, Review[]> = {
  "1": [
    { id: "r1", userName: "Alex M.", rating: 5, comment: "Best earbuds I've ever owned. The ANC is incredible for the price.", date: "2026-01-15" },
    { id: "r2", userName: "Jordan K.", rating: 4, comment: "Great sound quality, battery lasts forever. Wish the case was a bit smaller.", date: "2026-01-10" },
    { id: "r3", userName: "Sam T.", rating: 5, comment: "Noise cancellation is a game changer for commuting. Highly recommend!", date: "2025-12-28" },
  ],
  "4": [
    { id: "r4", userName: "Chris R.", rating: 5, comment: "These sneakers are insanely comfortable. PR'd my 5K in them.", date: "2026-02-01" },
    { id: "r5", userName: "Taylor W.", rating: 5, comment: "The carbon plate really makes a difference. Worth every penny.", date: "2026-01-20" },
  ],
};

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getReviewsForProduct(productId: string): Review[] {
  return reviews[productId] || [];
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.category.includes(q)
  );
}
