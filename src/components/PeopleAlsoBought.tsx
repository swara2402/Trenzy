import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data";
import { getPeopleAlsoBought } from "@/lib/recommendations";

interface PeopleAlsoBoughtProps {
  productId: string;
}

export default function PeopleAlsoBought({ productId }: PeopleAlsoBoughtProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPeopleAlsoBought(productId, 4);
        setProducts(data.products || []);
      } catch {
        setProducts([]);
      }
    };

    void load();
  }, [productId]);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="font-display text-xl font-bold">People Also Bought</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </section>
  );
}
