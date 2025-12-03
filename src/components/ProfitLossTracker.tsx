import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, IndianRupee, Save, Sprout, FlaskConical, Users, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Expenses {
  seeds: number;
  fertilizers: number;
  labor: number;
  equipment: number;
}

interface SeasonData {
  season: string;
  year: number;
  profit: number;
  expenses: Expenses;
}

const SEASONS = ["Kharif (Monsoon)", "Rabi (Winter)", "Zaid (Summer)"];
const EXPENSE_CATEGORIES = [
  { key: "seeds", label: "Seeds", icon: Sprout, color: "#22c55e" },
  { key: "fertilizers", label: "Fertilizers", icon: FlaskConical, color: "#f59e0b" },
  { key: "labor", label: "Labor", icon: Users, color: "#3b82f6" },
  { key: "equipment", label: "Equipment", icon: Wrench, color: "#8b5cf6" },
] as const;

const ProfitLossTracker = () => {
  const [seasonData, setSeasonData] = useState<SeasonData[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(SEASONS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [profit, setProfit] = useState("");
  const [expenses, setExpenses] = useState<Expenses>({
    seeds: 0,
    fertilizers: 0,
    labor: 0,
    equipment: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem("farmProfitLossV2");
    if (saved) {
      setSeasonData(JSON.parse(saved));
    }
  }, []);

  const handleExpenseChange = (key: keyof Expenses, value: string) => {
    setExpenses((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    const newEntry: SeasonData = {
      season: selectedSeason,
      year: selectedYear,
      profit: parseFloat(profit) || 0,
      expenses: { ...expenses },
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
    localStorage.setItem("farmProfitLossV2", JSON.stringify(updated));
    setProfit("");
    setExpenses({ seeds: 0, fertilizers: 0, labor: 0, equipment: 0 });
    toast({
      title: "Saved!",
      description: `${selectedSeason} ${selectedYear} data saved successfully.`,
    });
  };

  const getTotalExpenses = (exp: Expenses) => exp.seeds + exp.fertilizers + exp.labor + exp.equipment;
  
  const totalProfit = seasonData.reduce((sum, d) => sum + d.profit, 0);
  const totalExpenses = seasonData.reduce((sum, d) => sum + getTotalExpenses(d.expenses), 0);
  const netBalance = totalProfit - totalExpenses;

  const expenseBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat.label,
    value: seasonData.reduce((sum, d) => sum + d.expenses[cat.key], 0),
    color: cat.color,
  }));

  // Chart data
  const chartData = seasonData
    .sort((a, b) => a.year - b.year || SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season))
    .map((d) => ({
      name: `${d.season.split(" ")[0]} ${d.year}`,
      profit: d.profit,
      expenses: getTotalExpenses(d.expenses),
      net: d.profit - getTotalExpenses(d.expenses),
    }));

  const currentYears = [2023, 2024, 2025];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Revenue
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
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-2xl font-bold text-red-600">
              <IndianRupee className="h-5 w-5" />
              {totalExpenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-primary/20 ${netBalance >= 0 ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5' : 'bg-gradient-to-br from-red-500/10 to-orange-500/5'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Profit/Loss
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
          <CardDescription>Enter revenue and expenses for each farming season</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              <Label>Revenue (₹)</Label>
              <Input
                type="number"
                placeholder="Total revenue"
                value={profit}
                onChange={(e) => setProfit(e.target.value)}
              />
            </div>
          </div>

          {/* Expense Categories */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Expenses by Category</Label>
            <div className="grid gap-4 md:grid-cols-4">
              {EXPENSE_CATEGORIES.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" style={{ color }} />
                    {label}
                  </Label>
                  <Input
                    type="number"
                    placeholder={`${label} cost`}
                    value={expenses[key] || ""}
                    onChange={(e) => handleExpenseChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Season Data
          </Button>
        </CardContent>
      </Card>

      {/* Charts */}
      {seasonData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bar Chart - Revenue vs Expenses */}
          <Card className="border-primary/20 bg-gradient-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
              <CardDescription>Compare income and costs by season</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="profit" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Net Profit Trend */}
          <Card className="border-primary/20 bg-gradient-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Net Profit Trend</CardTitle>
              <CardDescription>Track your profit/loss over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="net" 
                    name="Net Profit" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Expense Breakdown */}
          <Card className="border-primary/20 bg-gradient-card shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown by Category</CardTitle>
              <CardDescription>See where your money goes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
                <ResponsiveContainer width="100%" height={250} className="max-w-[300px]">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown.filter(e => e.value > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4">
                  {expenseBreakdown.map(({ name, value, color }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: color }} />
                      <div>
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-lg font-bold">₹{value.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                    <th className="py-2 text-right font-medium text-green-600">Revenue</th>
                    <th className="py-2 text-right font-medium">Seeds</th>
                    <th className="py-2 text-right font-medium">Fertilizers</th>
                    <th className="py-2 text-right font-medium">Labor</th>
                    <th className="py-2 text-right font-medium">Equipment</th>
                    <th className="py-2 text-right font-medium text-red-600">Total Exp.</th>
                    <th className="py-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonData
                    .sort((a, b) => b.year - a.year || a.season.localeCompare(b.season))
                    .map((d, i) => {
                      const totalExp = getTotalExpenses(d.expenses);
                      const net = d.profit - totalExp;
                      return (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2">{d.season}</td>
                          <td className="py-2">{d.year}</td>
                          <td className="py-2 text-right text-green-600">₹{d.profit.toLocaleString()}</td>
                          <td className="py-2 text-right">₹{d.expenses.seeds.toLocaleString()}</td>
                          <td className="py-2 text-right">₹{d.expenses.fertilizers.toLocaleString()}</td>
                          <td className="py-2 text-right">₹{d.expenses.labor.toLocaleString()}</td>
                          <td className="py-2 text-right">₹{d.expenses.equipment.toLocaleString()}</td>
                          <td className="py-2 text-right text-red-600">₹{totalExp.toLocaleString()}</td>
                          <td className={`py-2 text-right font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{net.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
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
