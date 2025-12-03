import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, IndianRupee, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SeasonData {
  season: string;
  year: number;
  profit: number;
  loss: number;
}

const SEASONS = ["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"];

const ProfitLossTracker = () => {
  const [seasonData, setSeasonData] = useState<SeasonData[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [profit, setProfit] = useState("");
  const [loss, setLoss] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("farmProfitLoss");
    if (saved) {
      setSeasonData(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    const newEntry: SeasonData = {
      season: selectedSeason,
      year: selectedYear,
      profit: parseFloat(profit) || 0,
      loss: parseFloat(loss) || 0,
    };

    const existingIndex = seasonData.findIndex(
      (d) => d.season === selectedSeason && d.year === selectedYear
    );

    let updated: SeasonData[];
    if (existingIndex >= 0) {
      updated = [...seasonData];
      updated[existingIndex] = newEntry;
    } else {
      updated = [...seasonData, newEntry];
    }

    setSeasonData(updated);
    localStorage.setItem("farmProfitLoss", JSON.stringify(updated));
    setProfit("");
    setLoss("");
    toast({
      title: "Saved!",
      description: `${selectedSeason} ${selectedYear} data saved successfully.`,
    });
  };

  const totalProfit = seasonData.reduce((sum, d) => sum + d.profit, 0);
  const totalLoss = seasonData.reduce((sum, d) => sum + d.loss, 0);
  const netBalance = totalProfit - totalLoss;

  const currentYears = [2023, 2024, 2025];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-2xl font-bold text-green-600">
              <IndianRupee className="h-5 w-5" />
              {totalProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Total Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-2xl font-bold text-red-600">
              <IndianRupee className="h-5 w-5" />
              {totalLoss.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-primary/20 ${netBalance >= 0 ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5' : 'bg-gradient-to-br from-red-500/10 to-orange-500/5'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center gap-1 text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <IndianRupee className="h-5 w-5" />
              {Math.abs(netBalance).toLocaleString()}
              <span className="ml-1 text-sm font-normal">
                {netBalance >= 0 ? '(Profit)' : '(Loss)'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Form */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Add Season Data</CardTitle>
          <CardDescription>Enter your profit and loss for each farming season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Season</Label>
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Profit (₹)</Label>
              <Input
                type="number"
                placeholder="Enter profit"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Loss (₹)</Label>
              <Input
                type="number"
                placeholder="Enter loss"
                value={loss}
                onChange={(e) => setLoss(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSave} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      {seasonData.length > 0 && (
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Season History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium">Season</th>
                    <th className="py-2 text-left font-medium">Year</th>
                    <th className="py-2 text-right font-medium text-green-600">Profit (₹)</th>
                    <th className="py-2 text-right font-medium text-red-600">Loss (₹)</th>
                    <th className="py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonData
                    .sort((a, b) => b.year - a.year || a.season.localeCompare(b.season))
                    .map((d, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">{d.season}</td>
                        <td className="py-2">{d.year}</td>
                        <td className="py-2 text-right text-green-600">{d.profit.toLocaleString()}</td>
                        <td className="py-2 text-right text-red-600">{d.loss.toLocaleString()}</td>
                        <td className={`py-2 text-right font-medium ${d.profit - d.loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(d.profit - d.loss).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfitLossTracker;
