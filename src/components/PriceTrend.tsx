import { useEffect, useMemo, useState } from "react";
import { getPriceTrend, type PriceTrendResponse } from "@/lib/recommendations";

interface PriceTrendProps {
  productId: string;
}

export default function PriceTrend({ productId }: PriceTrendProps) {
  const [data, setData] = useState<PriceTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await getPriceTrend(productId, 14);
        if (mounted) {
          setData(result);
        }
      } catch {
        if (mounted) {
          setData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const polylinePoints = useMemo(() => {
    const history = data?.history || [];
    if (history.length < 2) {
      return "";
    }

    const values = history.map((point) => point.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    return history
      .map((point, index) => {
        const x = (index / (history.length - 1)) * 100;
        const y = 100 - (((point.price - min) / span) * 100);
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  if (loading) {
    return (
      <section className="mt-10 rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-xl font-bold">Price Trend</h2>
        <p className="mt-2 text-sm text-muted-foreground">Loading trend model...</p>
      </section>
    );
  }

  if (!data || !data.history || data.history.length < 2) {
    return null;
  }

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Price Trend</h2>
        <p className="text-xs text-muted-foreground">Model: simple linear regression</p>
      </div>
      <div className="mt-4 rounded-lg bg-secondary/30 p-3">
        <svg viewBox="0 0 100 100" className="h-32 w-full" preserveAspectRatio="none" role="img" aria-label="Price trend graph">
          <polyline
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            points={polylinePoints}
          />
        </svg>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-border p-3">
          <p className="text-muted-foreground">Current Price</p>
          <p className="font-semibold">${Number(data.currentPrice).toFixed(2)}</p>
        </div>
        <div className="rounded-md border border-border p-3">
          <p className="text-muted-foreground">Predicted Next</p>
          <p className="font-semibold">${Number(data.model?.predictedPrice || data.currentPrice).toFixed(2)}</p>
        </div>
      </div>
    </section>
  );
}
