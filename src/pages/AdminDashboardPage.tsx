import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Package, Plus, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { getAllOrders, type Order, type OrderItem } from "@/lib/orders";
import {
  deleteCatalogProduct,
  getCatalogProductsSync,
  saveCatalogProducts,
  type ManagedProduct,
} from "@/lib/productCatalog";
import { format } from "date-fns";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProductFormState {
  id?: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  image: string;
  imagesCsv: string;
  description: string;
}

const initialForm: ProductFormState = {
  name: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  image: "",
  imagesCsv: "",
  description: "",
};

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(initialForm);
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    setProducts(getCatalogProductsSync());
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true);
      const { orders: nextOrders, error } = await getAllOrders();
      if (error) {
        setOrdersError(error.message);
      } else {
        setOrdersError(null);
        setOrders(nextOrders);
      }
      setLoadingOrders(false);
    };

    void loadOrders();
  }, []);

  const analytics = useMemo(() => {
    const fulfilledOrders = orders.filter((order) => order.status !== "cancelled");
    const totalSales = fulfilledOrders.reduce((sum, order) => sum + order.total_price, 0);
    const totalUsers = new Set(orders.map((order) => order.user_id)).size;

    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of fulfilledOrders) {
      for (const item of order.items as OrderItem[]) {
        const existing = productMap.get(item.product_id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.subtotal;
        } else {
          productMap.set(item.product_id, {
            name: item.product_name,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
        }
      }
    }

    const mostSold = Array.from(productMap.entries())
      .map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const revenueMap = new Map<string, number>();
    for (const order of fulfilledOrders) {
      const dateKey = format(new Date(order.created_at), "MMM dd");
      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + order.total_price);
    }

    const revenueSeries = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2)),
    }));

    return { totalUsers, totalSales, mostSold, revenueSeries, totalOrders: orders.length };
  }, [orders]);

  const handleFormChange = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setForm((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => setForm(initialForm);

  const startEdit = (product: ManagedProduct) => {
    setForm({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      imagesCsv: product.images.join(", "),
      description: product.description,
    });
  };

  const handleSaveProduct = () => {
    if (!form.name || !form.brand || !form.category || !form.price || !form.stock || !form.image) {
      return;
    }

    setSavingProduct(true);
    const now = Date.now();
    const nextStock = Math.max(0, Number(form.stock));
    const imageList = form.imagesCsv
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const mergedImages = Array.from(new Set([form.image, ...imageList]));

    const nextProduct: ManagedProduct = {
      id: form.id || `p-${now}`,
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      originalPrice: undefined,
      rating: 0,
      reviewCount: 0,
      tags: [],
      image: form.image.trim(),
      images: mergedImages,
      description: form.description.trim(),
      features: [],
      inStock: nextStock > 0,
      stock: nextStock,
      popularity: 0,
    };

    const current = getCatalogProductsSync();
    const index = current.findIndex((item) => item.id === nextProduct.id);
    const next = [...current];

    if (index >= 0) {
      next[index] = nextProduct;
    } else {
      next.unshift(nextProduct);
    }

    const saved = saveCatalogProducts(next);
    setProducts(saved);
    setSavingProduct(false);
    resetForm();
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm("Delete this product?")) return;
    const next = deleteCatalogProduct(productId);
    setProducts(next);
  };

  const updateStock = (productId: string, delta: number) => {
    const current = getCatalogProductsSync();
    const next = current.map((product) => {
      if (product.id !== productId) return product;
      const stock = Math.max(0, product.stock + delta);
      return { ...product, stock, inStock: stock > 0 };
    });
    const saved = saveCatalogProducts(next);
    setProducts(saved);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage products, stock, images, and business analytics.</p>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Users</span>
              </div>
              <p className="font-display text-2xl font-bold">{analytics.totalUsers}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">Total Sales</span>
              </div>
              <p className="font-display text-2xl font-bold">${analytics.totalSales.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Package className="h-4 w-4" />
                <span className="text-sm">Total Orders</span>
              </div>
              <p className="font-display text-2xl font-bold">{analytics.totalOrders}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Package className="h-4 w-4" />
                <span className="text-sm">Products</span>
              </div>
              <p className="font-display text-2xl font-bold">{products.length}</p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Revenue Graph</h2>
            {loadingOrders ? (
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            ) : ordersError ? (
              <p className="text-sm text-destructive">{ordersError}</p>
            ) : analytics.revenueSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No revenue data yet.</p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueSeries}>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Most Sold Products</h2>
            {analytics.mostSold.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product sales data available.</p>
            ) : (
              <div className="space-y-3">
                {analytics.mostSold.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} units sold</p>
                    </div>
                    <p className="font-semibold">${item.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold mb-4">{form.id ? "Update Product" : "Add Product"}</h2>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input value={form.brand} onChange={(e) => handleFormChange("brand", e.target.value)} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => handleFormChange("category", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input type="number" min={0} value={form.price} onChange={(e) => handleFormChange("price", e.target.value)} />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input type="number" min={0} value={form.stock} onChange={(e) => handleFormChange("stock", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Primary Image URL</Label>
                  <Input value={form.image} onChange={(e) => handleFormChange("image", e.target.value)} />
                </div>
                <div>
                  <Label>Upload Product Image</Label>
                  <div className="flex items-center gap-3">
                    <Input type="file" accept="image/*" onChange={handleUploadImage} />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label>Additional Images (comma-separated URLs)</Label>
                  <Input value={form.imagesCsv} onChange={(e) => handleFormChange("imagesCsv", e.target.value)} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveProduct} disabled={savingProduct}>
                    <Plus className="h-4 w-4 mr-1" />
                    {form.id ? "Update Product" : "Add Product"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Reset</Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold mb-4">Manage Stock & Images</h2>
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {products.map((product) => (
                  <div key={product.id} className="rounded-lg border border-border p-3">
                    <div className="flex gap-3">
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand} - ${product.price.toFixed(2)}</p>
                        <p className="text-xs mt-1">
                          Stock: <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>{product.stock}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => updateStock(product.id, -1)}>-1</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStock(product.id, 1)}>+1</Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(product)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
