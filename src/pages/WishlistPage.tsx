import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { getStoredUser } from "@/lib/auth";
import { getProductById, products } from "@/lib/data";
import { getCatalogProductById, getCatalogProductsSync } from "@/lib/productCatalog";
import { useEffect, useState } from "react";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const catalogProducts = getCatalogProductsSync();
  const sourceProducts = catalogProducts.length > 0 ? catalogProducts : products;

  const wishlistProducts = wishlist
    .map((id) => getCatalogProductById(id) || getProductById(id))
    .filter((p): p is typeof products[0] => p !== undefined);

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your wishlist</h1>
            <p className="text-muted-foreground mb-6">Save items you love by clicking the heart icon</p>
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-8">My Wishlist</h1>

          {wishlistProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">Save items you love by clicking the heart icon</p>
              <Button onClick={() => navigate("/products")}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {wishlistProducts.map((product, index) => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} index={index} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
