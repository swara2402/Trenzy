import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getCartSuggestions } from "@/lib/recommendations";
import type { Product } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";

export default function CartSuggestions() {
    const { items } = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                if (items.length === 0) {
                    setLoading(false);
                    return;
                }
                const data = await getCartSuggestions(4);
                setProducts(data.products || []);
            } catch (err) {
                console.error("Failed to load cart suggestions:", err);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [items]);

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Frequently Bought Together</h2>
            <div className="grid grid-cols-2 gap-4">
                {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                ))}
            </div>
        </div>
    );
}
