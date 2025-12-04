import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, Search, Store } from "lucide-react";

interface MarketPrice {
  id: string;
  crop_name: string;
  market_name: string;
  price_per_kg: number;
  price_date: string;
}

// Sample market data (in production, this would come from an API)
const SAMPLE_PRICES = [
  { crop_name: "Rice", market_name: "Delhi APMC", price_per_kg: 32, trend: "up" },
  { crop_name: "Wheat", market_name: "Chandigarh Mandi", price_per_kg: 28, trend: "stable" },
  { crop_name: "Cotton", market_name: "Ahmedabad Market", price_per_kg: 65, trend: "down" },
  { crop_name: "Tomato", market_name: "Pune APMC", price_per_kg: 45, trend: "up" },
  { crop_name: "Potato", market_name: "Agra Mandi", price_per_kg: 18, trend: "stable" },
  { crop_name: "Onion", market_name: "Nashik Market", price_per_kg: 25, trend: "up" },
  { crop_name: "Maize", market_name: "Hyderabad APMC", price_per_kg: 22, trend: "down" },
  { crop_name: "Soybean", market_name: "Indore Market", price_per_kg: 48, trend: "up" },
  { crop_name: "Sugarcane", market_name: "Lucknow Mandi", price_per_kg: 3.5, trend: "stable" },
  { crop_name: "Groundnut", market_name: "Rajkot Market", price_per_kg: 55, trend: "up" },
];

const MarketPrices = () => {
  const [prices, setPrices] = useState<typeof SAMPLE_PRICES>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simulate fetching from API
    setTimeout(() => {
      setPrices(SAMPLE_PRICES);
      setLoading(false);
    }, 500);
  }, []);

  const filteredPrices = prices.filter(
    (p) =>
      p.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.market_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <span className="text-yellow-500">—</span>;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "up":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Rising</Badge>;
      case "down":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Falling</Badge>;
      default:
        return <Badge variant="secondary">Stable</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Market Prices</h1>
        <p className="text-muted-foreground">Today's crop prices from nearby markets</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search crop or market..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Price Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-soft bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Highest Price</p>
                <p className="text-2xl font-bold text-green-600">₹65/kg</p>
                <p className="text-xs text-muted-foreground">Cotton</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rising Prices</p>
                <p className="text-2xl font-bold text-primary">5</p>
                <p className="text-xs text-muted-foreground">crops</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falling Prices</p>
                <p className="text-2xl font-bold text-destructive">2</p>
                <p className="text-xs text-muted-foreground">crops</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Markets Tracked</p>
                <p className="text-2xl font-bold">10</p>
                <p className="text-xs text-muted-foreground">locations</p>
              </div>
              <Store className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Today's Prices</CardTitle>
          <CardDescription>Updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Price (₹/kg)</TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((price, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{price.crop_name}</TableCell>
                  <TableCell className="text-muted-foreground">{price.market_name}</TableCell>
                  <TableCell className="text-right font-semibold">₹{price.price_per_kg}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(price.trend)}
                      {getTrendBadge(price.trend)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPrices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No matching crops found
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Prices are indicative and may vary. Please verify with local markets before making decisions.
      </p>
    </div>
  );
};

export default MarketPrices;
