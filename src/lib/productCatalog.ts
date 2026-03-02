import { products, type Product } from "@/lib/data";

const PRODUCT_CATALOG_KEY = "smartcart_product_catalog_v1";

export interface ManagedProduct extends Product {
  stock: number;
}

function normalizeProduct(product: Product): ManagedProduct {
  const stock = typeof product.stock === "number" ? Math.max(0, Math.floor(product.stock)) : product.inStock ? 20 : 0;
  const image = product.image || product.images[0] || "";
  const images = product.images.length > 0 ? product.images : image ? [image] : [];

  return {
    ...product,
    image,
    images,
    stock,
    inStock: stock > 0,
  };
}

function baseProducts(): ManagedProduct[] {
  return products.map(normalizeProduct);
}

export function hasCatalogSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(PRODUCT_CATALOG_KEY));
}

export function getCatalogProductsSync(): ManagedProduct[] {
  if (typeof window === "undefined") return baseProducts();

  const raw = window.localStorage.getItem(PRODUCT_CATALOG_KEY);
  if (!raw) return baseProducts();

  try {
    const parsed = JSON.parse(raw) as Product[];
    if (!Array.isArray(parsed) || parsed.length === 0) return baseProducts();
    return parsed.map(normalizeProduct);
  } catch {
    return baseProducts();
  }
}

export function saveCatalogProducts(nextProducts: Product[]): ManagedProduct[] {
  const normalized = nextProducts.map(normalizeProduct);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PRODUCT_CATALOG_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function upsertCatalogProduct(nextProduct: Product): ManagedProduct[] {
  const current = getCatalogProductsSync();
  const index = current.findIndex((product) => product.id === nextProduct.id);
  if (index >= 0) {
    current[index] = normalizeProduct(nextProduct);
  } else {
    current.push(normalizeProduct(nextProduct));
  }
  return saveCatalogProducts(current);
}

export function deleteCatalogProduct(productId: string): ManagedProduct[] {
  const current = getCatalogProductsSync();
  return saveCatalogProducts(current.filter((product) => product.id !== productId));
}

export function getCatalogProductById(productId: string): ManagedProduct | undefined {
  return getCatalogProductsSync().find((product) => product.id === productId);
}
