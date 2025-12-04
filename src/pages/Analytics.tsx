import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Plus, TrendingUp, TrendingDown, Wallet, Loader2 } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
}

interface Income {
  id: string;
  amount: number;
  source: string | null;
  income_date: string;
}

const EXPENSE_CATEGORIES = ["Seeds", "Fertilizers", "Pesticides", "Labor", "Equipment", "Irrigation", "Transport", "Other"];
const COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#06b6d4", "#8b5cf6", "#ec4899"];

const Analytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", description: "", expense_date: new Date().toISOString().split("T")[0] });
  const [newIncome, setNewIncome] = useState({ amount: "", source: "", income_date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [expensesRes, incomeRes] = await Promise.all([
      supabase.from("farm_expenses").select("*").eq("user_id", user!.id).order("expense_date", { ascending: false }),
      supabase.from("farm_income").select("*").eq("user_id", user!.id).order("income_date", { ascending: false }),
    ]);
    if (expensesRes.data) setExpenses(expensesRes.data);
    if (incomeRes.data) setIncome(incomeRes.data);
    setLoading(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  const expensesByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter((c) => c.value > 0);

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("farm_expenses").insert({
      user_id: user!.id,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      description: newExpense.description || null,
      expense_date: newExpense.expense_date,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Expense recorded" });
      setExpenseDialogOpen(false);
      setNewExpense({ category: "", amount: "", description: "", expense_date: new Date().toISOString().split("T")[0] });
      fetchData();
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount) {
      toast({ title: "Error", description: "Please enter amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("farm_income").insert({
      user_id: user!.id,
      amount: parseFloat(newIncome.amount),
      source: newIncome.source || null,
      income_date: newIncome.income_date,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add income", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Income recorded" });
      setIncomeDialogOpen(false);
      setNewIncome({ amount: "", source: "", income_date: new Date().toISOString().split("T")[0] });
      fetchData();
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Farm Analytics</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingDown className="mr-2 h-4 w-4 text-destructive" /> Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Urea fertilizer for wheat"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddExpense} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <TrendingUp className="mr-2 h-4 w-4" /> Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Income</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount (₹) *</Label>
                  <Input
                    type="number"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Input
                    value={newIncome.source}
                    onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                    placeholder="Wheat sale at mandi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newIncome.income_date}
                    onChange={(e) => setNewIncome({ ...newIncome, income_date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddIncome} disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Income
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">₹{totalIncome.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">₹{totalExpenses.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-soft border-l-4 ${netProfit >= 0 ? "border-l-accent" : "border-l-destructive"}`}>
          <CardHeader className="pb-2">
            <CardDescription>Net Profit/Loss</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className={`h-5 w-5 ${netProfit >= 0 ? "text-accent" : "text-destructive"}`} />
              <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-accent" : "text-destructive"}`}>
                {netProfit >= 0 ? "+" : ""}₹{netProfit.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expensesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No expense data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="expenses">
              <TabsList className="w-full">
                <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
                <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
              </TabsList>
              <TabsContent value="expenses" className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                {expenses.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{e.category}</p>
                      <p className="text-xs text-muted-foreground">{e.description || new Date(e.expense_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-destructive font-semibold">-₹{Number(e.amount).toLocaleString()}</span>
                  </div>
                ))}
                {expenses.length === 0 && <p className="text-center text-muted-foreground py-4">No expenses recorded</p>}
              </TabsContent>
              <TabsContent value="income" className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
                {income.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{i.source || "Income"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(i.income_date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-primary font-semibold">+₹{Number(i.amount).toLocaleString()}</span>
                  </div>
                ))}
                {income.length === 0 && <p className="text-center text-muted-foreground py-4">No income recorded</p>}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
