import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Store, Sprout, Loader2, Plus, Trash2, Search } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface MarketPrice {
  id: string;
  crop_name: string;
  market_name: string;
  price_per_kg: number;
  price_date: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState({ crop_name: "", market_name: "", price_per_kg: "" });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
      navigate("/");
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    const [profilesRes, pricesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("market_prices").select("*").order("price_date", { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (pricesRes.data) setMarketPrices(pricesRes.data);
    setLoading(false);
  };

  const handleAddPrice = async () => {
    if (!newPrice.crop_name || !newPrice.market_name || !newPrice.price_per_kg) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("market_prices").insert({
      crop_name: newPrice.crop_name,
      market_name: newPrice.market_name,
      price_per_kg: parseFloat(newPrice.price_per_kg),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add price", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Price added" });
      setPriceDialogOpen(false);
      setNewPrice({ crop_name: "", market_name: "", price_per_kg: "" });
      fetchData();
    }
  };

  const handleDeletePrice = async (id: string) => {
    const { error } = await supabase.from("market_prices").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      fetchData();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and platform data</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{profiles.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Store className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-muted-foreground">Market Prices</p>
              <p className="text-2xl font-bold">{marketPrices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Sprout className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Active Farms</p>
              <p className="text-2xl font-bold">-</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="prices">Market Prices</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>Manage farmer accounts</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name || "—"}</TableCell>
                      <TableCell>{profile.phone || "—"}</TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProfiles.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Market Prices</CardTitle>
                  <CardDescription>Manage crop prices</CardDescription>
                </div>
                <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Price
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Market Price</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Crop Name</Label>
                        <Input
                          value={newPrice.crop_name}
                          onChange={(e) => setNewPrice({ ...newPrice, crop_name: e.target.value })}
                          placeholder="Rice"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Market Name</Label>
                        <Input
                          value={newPrice.market_name}
                          onChange={(e) => setNewPrice({ ...newPrice, market_name: e.target.value })}
                          placeholder="Delhi APMC"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹/kg)</Label>
                        <Input
                          type="number"
                          value={newPrice.price_per_kg}
                          onChange={(e) => setNewPrice({ ...newPrice, price_per_kg: e.target.value })}
                          placeholder="32"
                        />
                      </div>
                      <Button onClick={handleAddPrice} disabled={saving} className="w-full">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Price
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>Price (₹/kg)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketPrices.map((price) => (
                    <TableRow key={price.id}>
                      <TableCell className="font-medium">{price.crop_name}</TableCell>
                      <TableCell>{price.market_name}</TableCell>
                      <TableCell>₹{price.price_per_kg}</TableCell>
                      <TableCell>{new Date(price.price_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePrice(price.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {marketPrices.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No prices added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
