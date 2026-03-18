import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, TrendingUp, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/data';
import { useCart } from '@/contexts/CartContext';

interface Props {
  products: Product[];
  title?: string;
  className?: string;
}

export function GroupRecommendations({ products, title = "Best for Your Group", className = "" }: Props) {
  const { addToCart } = useCart();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              Group AI Match
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" asChild>
            <Link to="/groups" className="flex items-center gap-1">
              View All Group Recs <Users2 className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

