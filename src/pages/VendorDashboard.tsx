import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/Footer";
import { getStoredUser } from "@/lib/auth";
import {
  deleteCatalogProduct,
  getCatalogProductsSync,
  saveCatalogProducts,
  type ManagedProduct,
} from "@/lib/productCatalog";

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

export default function VendorDashboard() {
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [form, setForm] = useState<ProductFormState>(initialForm);
const [savingProduct, setSavingProduct] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    // A real app would fetch only this vendor's products. For now, filter by vendorId loosely or just show all if basic.
    // In this simple catalog mock, we'll store vendorId on the product.
    const allProducts = getCatalogProductsSync();
    // Assuming we add a vendorId field to ManagedProducts or just show all for the demo
    const myProducts = allProducts.filter((p: any) => p.vendorId === user?.id || !p.vendorId);
    setProducts(myProducts);
  }, [user?.id]);

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

    const nextProduct: ManagedProduct & { vendorId?: string } = {
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
      vendorId: user?.id,
    };

    const current = getCatalogProductsSync();
    const index = current.findIndex((item) => item.id === nextProduct.id);
    const next = [...current];

    if (index >= 0) {
      next[index] = nextProduct;
    } else {
      next.unshift(nextProduct);
    }

    saveCatalogProducts(next);
    
    // Update local state
    const myProducts = next.filter((p: any) => p.vendorId === user?.id || (!p.vendorId && (index >= 0)));
    setProducts(myProducts);
    
    setSavingProduct(false);
    resetForm();
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm("Delete this product?")) return;
    const next = deleteCatalogProduct(productId);
    setProducts(next.filter((p: any) => p.vendorId === user?.id || !p.vendorId));
  };

  const updateStock = (productId: string, delta: number) => {
    const current = getCatalogProductsSync();
    const next = current.map((product) => {
      if (product.id !== productId) return product;
      const stock = Math.max(0, product.stock + delta);
      return { ...product, stock, inStock: stock > 0 };
    });
    saveCatalogProducts(next);
    setProducts(next.filter((p: any) => p.vendorId === user?.id || !p.vendorId));
  };

  const fetchDemandPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const user = getStoredUser();
      const token = user ? localStorage.getItem('token') || user.token : null;
      const response = await fetch('/api/ai/demand', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      } else {
        console.error('Prediction API error:', response.statusText);
      }
    } catch (error) {
      console.error('Demand prediction error:', error);
    } finally {
      setLoadingPrediction(false);
    }
  };

  if (!user || user.role !== "vendor") {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You must be logged in as a Seller to view this page.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your catalog, stock, and business analytics.</p>
          </div>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold mb-4">{form.id ? "Update Product" : "List New Product"}</h2>
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
                    <Label>Price (₹)</Label>
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
                  <Button onClick={handleSaveProduct} disabled={savingProduct} className="gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90">
                    <Plus className="h-4 w-4 mr-1" />
                    {form.id ? "Update Product" : "List Product"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>Reset</Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
<h2 className="font-display text-xl font-bold mb-4">My Listed Products</h2>
  <div className="mb-6">
    <Button onClick={fetchDemandPrediction} className="w-full mb-4">
      Generate AI Demand Forecast
    </Button>
    {prediction && (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">AI Demand Forecast</h3>
        <p className="text-muted-foreground">{prediction.summary}</p>
        <div>
          <h4 className="font-medium mb-2">Trends:</h4>
          <ul className="space-y-1 text-sm">
            {prediction.trends.map((trend, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                {trend}
              </li>
            ))}
          </ul>
        </div>
        {prediction.warnings.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-orange-600">Warnings:</h4>
            <ul className="space-y-1 text-sm">
              {prediction.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}
  </div>
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You have no products listed.</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="rounded-lg border border-border p-3">
                      <div className="flex gap-3">
                        <img src={product.image} alt={product.name} className="h-14 w-14 rounded-md object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand} - ₹{product.price.toFixed(2)}</p>
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
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
