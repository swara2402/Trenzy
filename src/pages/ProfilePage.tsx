import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, Settings, Plus, Trash2, Edit, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { getStoredUser, logout, getAuthToken, type AuthUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

interface Address {
  _id?: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface UserProfile extends AuthUser {
  addresses: Address[];
  monthlyBudget: number;
  currentMonthSpending: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
  });

  const [addressForm, setAddressForm] = useState<Address>({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    isDefault: false,
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (storedUser) {
      fetchUserProfile(storedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setProfileForm({
          username: data.user.username || "",
          email: data.user.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditingProfile(false);
        setUser({ ...user!, username: profileForm.username });
        localStorage.setItem("smartcart_user", JSON.stringify({ ...user!, username: profileForm.username }));
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const url = editingAddress?._id 
        ? `${API_BASE_URL}/api/users/addresses/${editingAddress._id}`
        : `${API_BASE_URL}/api/users/addresses`;
      const method = editingAddress?._id ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setShowAddressForm(false);
        setEditingAddress(null);
        resetAddressForm();
      }
    } catch (error) {
      console.error("Failed to save address:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/users/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error("Failed to delete address:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "USA",
      isDefault: false,
    });
  };

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm(address);
    setShowAddressForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Please sign in</h1>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your profile</p>
            <Link to="/login">
              <Button>Sign In</Button>
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

        <div className="max-w-5xl mx-auto space-y-8">
          <h1 className="font-display text-4xl font-extrabold mb-8 tracking-tight">My Profile</h1>

          {/* Profile Section */}
          <Card className="rounded-3xl glassmorphism-card shadow-elevated border-white/5 overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
              <CardTitle className="flex items-center justify-between font-display text-2xl">
                <span>Account Information</span>
                {!editingProfile && (
                  <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="rounded-xl">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleProfileSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({ username: profile?.username || "", email: profile?.email || "" });
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center shadow-accent-glow">
                      <User className="h-10 w-10 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl font-bold tracking-tight">
                        {profile?.username || "User"}
                      </h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {profile?.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses Section */}
          <Card className="rounded-3xl glassmorphism-card shadow-elevated border-white/5 overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
              <CardTitle className="flex items-center justify-between font-display text-2xl">
                <span>Saved Addresses</span>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowAddressForm(true);
                  setEditingAddress(null);
                  resetAddressForm();
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Address
                </Button>
              </CardTitle>
            </CardHeader>

          {/* Budget Guardian Section */}
          <Card className="rounded-3xl glassmorphism-card shadow-elevated border-white/5 overflow-hidden">
            <CardHeader className="bg-secondary/30 border-b border-border/50 pb-6">
              <CardTitle className="font-display text-2xl">Budget Guardian</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid gap-2">
                  <Label>Monthly Budget (₹)</Label>
                  <Input
                    type="number"
                    value={profile?.monthlyBudget || 0}
                    onChange={async (e) => {
                      const budget = parseFloat(e.target.value) || 0;
                      if (budget < 0) return;
                      setSaving(true);
                      try {
                        const token = getAuthToken();
                        const response = await fetch(`${API_BASE_URL}/api/users/budget`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ monthlyBudget: budget }),
                        });
                        if (response.ok) {
                          await fetchUserProfile(user!.id);
                        }
                      } catch (error) {
                        console.error("Budget update failed:", error);
                      } finally {
                        setSaving(false);
                      }
                    }}
                    min="0"
                    step="1000"
                    placeholder="Enter monthly budget"
                    className="w-48"
                  />
                </div>
                {profile?.monthlyBudget > 0 && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Current Spending</span>
                      <span>₹{profile.currentMonthSpending.toLocaleString()} / ₹{profile.monthlyBudget.toLocaleString()}</span>
                    </div>
                    <div className="relative mt-2">
                      <div className="h-3 bg-secondary/50 rounded-full overflow-hidden drop-shadow-inner border border-white/5">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${profile.currentMonthSpending / profile.monthlyBudget >= 0.9 ? 'bg-destructive shadow-destructive/50' : 'bg-accent shadow-accent-glow'}`}
                          style={{ width: `${Math.min((profile.currentMonthSpending / profile.monthlyBudget) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="absolute right-0 -top-6 text-xs font-bold text-foreground">
                        {Math.round((profile.currentMonthSpending / profile.monthlyBudget) * 100)}%
                      </span>
                    </div>
                    {profile.currentMonthSpending / profile.monthlyBudget >= 0.9 && (
                      <p className="mt-2 text-sm text-destructive font-medium flex items-center gap-1">
                        <Check className="h-4 w-4" />
                        Budget alert: You're near your limit. Consider cheaper alternatives.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            <CardContent>
              {showAddressForm ? (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="label">Address Label</Label>
                      <Input
                        id="label"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                        placeholder="Home, Work, etc."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={addressForm.fullName}
                        onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      value={addressForm.addressLine1}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                    <Input
                      id="addressLine2"
                      value={addressForm.addressLine2}
                      onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={addressForm.postalCode}
                        onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="isDefault" className="font-normal">Set as default address</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddressSave} disabled={saving}>
                      {saving ? "Saving..." : editingAddress?._id ? "Update Address" : "Add Address"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                      resetAddressForm();
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : profile?.addresses && profile.addresses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 pt-6">
                  {profile.addresses.map((address) => (
                    <div key={address._id} className="relative p-6 border border-white/10 rounded-2xl bg-secondary/20 hover:bg-secondary/30 transition-colors">
                      {address.isDefault && (
                        <span className="absolute top-4 right-4 text-xs font-bold tracking-wider uppercase bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20">
                          Default
                        </span>
                      )}
                      <div className="flex items-start gap-3 mb-4">
                        <MapPin className="h-5 w-5 text-accent mt-0.5" />
                        <div>
                          <p className="font-medium">{address.label}</p>
                          <p className="text-sm">{address.fullName}</p>
                          <p className="text-sm text-muted-foreground">{address.addressLine1}</p>
                          {address.addressLine2 && <p className="text-sm text-muted-foreground">{address.addressLine2}</p>}
                          <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.postalCode}</p>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => openEditAddress(address)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAddress(address._id!)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No saved addresses. Add one to get started.</p>
              )}
            </CardContent>
          </Card>

          {/* Logout */}
          <div className="flex justify-end">
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
