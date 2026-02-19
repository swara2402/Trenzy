import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products, categories } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { SlidersHorizontal, X } from "lucide-react";

type SortOption = "popular" | "price-low" | "price-high" | "rating";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";

  const [sort, setSort] = useState<SortOption>("popular");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sort) {
      case "popular":
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [categoryFilter, searchQuery, sort, priceRange]);

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([0, 300]);
    setSort("popular");
  };

  const activeCategory = categories.find((c) => c.id === categoryFilter);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory.name : "All Products"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{filtered.length} products</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low → High</option>
              <option value="price-high">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${filtersOpen ? "block" : "hidden"} w-full shrink-0 md:block md:w-56`}>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold">Filters</h3>
                <button onClick={clearFilters} className="text-xs text-accent hover:underline">
                  Clear all
                </button>
              </div>

              {/* Categories */}
              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</h4>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => setSearchParams(searchQuery ? { search: searchQuery } : {})}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                      !categoryFilter ? "bg-accent/10 font-medium text-accent" : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        const params: Record<string, string> = { category: cat.id };
                        if (searchQuery) params.search = searchQuery;
                        setSearchParams(params);
                      }}
                      className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                        categoryFilter === cat.id ? "bg-accent/10 font-medium text-accent" : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price Range</h4>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    min={0}
                  />
                  <span className="text-muted-foreground">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Active filters */}
            {(categoryFilter || searchQuery) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    {activeCategory?.name}
                    <button onClick={() => {
                      const params: Record<string, string> = {};
                      if (searchQuery) params.search = searchQuery;
                      setSearchParams(params);
                    }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    "{searchQuery}"
                    <button onClick={() => {
                      const params: Record<string, string> = {};
                      if (categoryFilter) params.category = categoryFilter;
                      setSearchParams(params);
                    }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">No products found</p>
                <p className="mt-1 text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {filtered.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
