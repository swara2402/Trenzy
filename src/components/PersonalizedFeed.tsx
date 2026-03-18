import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getFeed } from "@/lib/recommendations";
import type { Product } from "@/lib/data";
import { getAuthToken } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonalizedFeed() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const token = getAuthToken();
                if (!token) {
                    setLoading(false);
                    return;
                }
                const data = await getFeed(12);
                setProducts(data.products || []);
            } catch (err) {
                console.error("Failed to load feed:", err);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    if (!getAuthToken()) {
        return null;
    }

    if (loading) {
        return (
            <section className="container mx-auto px-4 py-12">
                <h2 className="font-display text-2xl font-bold md:text-3xl">Just for You</h2>
                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="aspect-square w-full rounded-xl" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="container mx-auto px-4 py-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-display text-2xl font-bold md:text-3xl">Just for You</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Handpicked selection based on your style</p>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
                {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                ))}
            </div>
        </section>
    );
}
