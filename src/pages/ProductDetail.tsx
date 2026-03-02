import { useParams, Link } from "react-router-dom";
import { getProductById, getReviewsForProduct, products } from "@/lib/data";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { Star, ShoppingBag, ArrowLeft, Check, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getCatalogProductById, getCatalogProductsSync } from "@/lib/productCatalog";
import { getStoredUser, getAuthToken } from "@/lib/auth";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const catalogProducts = getCatalogProductsSync();
  const product = getCatalogProductById(id || "") || getProductById(id || "");
  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    
    // Fetch reviews from backend first, fallback to local
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/reviews?productId=${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        if (data.reviews && data.reviews.length > 0) {
          const formatted = data.reviews.map((r: any) => ({
            id: r._id,
            userName: r.userId?.username || "Anonymous",
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.createdAt).toISOString().split("T")[0],
          }));
          setReviews(formatted);
          return;
        }
      }
    } catch (error) {
      console.log("Using local reviews");
    }
    // Fallback to local reviews
    setReviews(getReviewsForProduct(id || ""));
  };

  const handleSubmitReview = async () => {
    if (!user) {
      setReviewError("Please login to submit a review");
      return;
    }

    setSubmitting(true);
    setReviewError("");

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReview: Review = {
          id: data.review._id,
          userName: user.username || "You",
          rating: data.review.rating,
          comment: data.review.comment,
          date: new Date().toISOString().split("T")[0],
        };
        setReviews([newReview, ...reviews]);
        setShowReviewForm(false);
        setReviewComment("");
        setReviewRating(5);
      } else {
        const error = await response.json();
        setReviewError(error.message || "Failed to submit review");
      }
    } catch (error) {
      setReviewError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Product not found</p>
          <Link to="/products" className="mt-2 text-sm text-accent hover:underline">
            ← Back to products
          </Link>
        </div>
      </div>
    );
  }

  const sourceProducts = catalogProducts.length > 0 ? catalogProducts : products;
  const recommended = sourceProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to products
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {/* Images */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${
                      selectedImage === i ? "border-accent" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
            <h1 className="mt-1 font-display text-3xl font-bold">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(product.rating) ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
                  <span className="rounded-lg bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="mt-4 text-muted-foreground">{product.description}</p>

            {product.features && product.features.length > 0 && (
              <ul className="mt-4 space-y-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6">
              <Button
                onClick={() => addToCart(product)}
                size="lg"
                className="w-full md:w-auto shadow-accent-glow hover:opacity-90"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>

            {/* AI recommendation hint */}
            <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-accent">AI Pick</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This product matches your browsing preferences. People who viewed this also loved similar items in {product.category}.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Customer Reviews ({reviews.length})</h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (!user) {
                  setReviewError("Please login to write a review");
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
            >
              Write a Review
            </Button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Write Your Review</h3>
              <div className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= reviewRating 
                              ? "fill-accent text-accent" 
                              : "text-border hover:text-accent/50"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="comment">Your Review</Label>
                  <Textarea
                    id="comment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                {reviewError && (
                  <p className="text-sm text-red-500">{reviewError}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSubmitReview} 
                    disabled={submitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.userName}</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < review.rating ? "fill-accent text-accent" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 text-center py-8">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            </div>
          )}
        </section>

        {/* Recommended */}
        {recommended.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold">You Might Also Like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {recommended.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </div>
  );
}
