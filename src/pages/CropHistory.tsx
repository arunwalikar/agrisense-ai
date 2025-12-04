import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Plus, Wheat, Calendar, Loader2, Trash2, CheckCircle } from "lucide-react";

interface Farm {
  id: string;
  name: string;
}

interface CropRecord {
  id: string;
  farm_id: string;
  crop_name: string;
  planted_date: string;
  expected_harvest_date: string | null;
  actual_harvest_date: string | null;
  area_acres: number | null;
  yield_kg: number | null;
  status: string | null;
  notes: string | null;
  farms?: { name: string };
}

const CROP_OPTIONS = [
  "Rice", "Wheat", "Cotton", "Sugarcane", "Tomato", "Potato", "Onion", "Maize", "Soybean", "Groundnut",
  "Mustard", "Chickpea", "Lentil", "Millet", "Barley", "Sunflower", "Sesame", "Cumin", "Coriander", "Chili"
];

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "growing":
      return "bg-green-500/10 text-green-600";
    case "harvested":
      return "bg-blue-500/10 text-blue-600";
    case "failed":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const CropHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCrop, setNewCrop] = useState({
    farm_id: "",
    crop_name: "",
    planted_date: new Date().toISOString().split("T")[0],
    expected_harvest_date: "",
    area_acres: "",
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [cropsRes, farmsRes] = await Promise.all([
      supabase
        .from("crop_history")
        .select("*, farms(name)")
        .eq("user_id", user!.id)
        .order("planted_date", { ascending: false }),
      supabase.from("farms").select("id, name").eq("user_id", user!.id),
    ]);
    if (cropsRes.data) setCrops(cropsRes.data);
    if (farmsRes.data) setFarms(farmsRes.data);
    setLoading(false);
  };

  const handleAddCrop = async () => {
    if (!newCrop.farm_id || !newCrop.crop_name || !newCrop.planted_date) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("crop_history").insert({
      user_id: user!.id,
      farm_id: newCrop.farm_id,
      crop_name: newCrop.crop_name,
      planted_date: newCrop.planted_date,
      expected_harvest_date: newCrop.expected_harvest_date || null,
      area_acres: newCrop.area_acres ? parseFloat(newCrop.area_acres) : null,
      status: "growing",
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add crop", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Crop added to history" });
      setDialogOpen(false);
      setNewCrop({ farm_id: "", crop_name: "", planted_date: new Date().toISOString().split("T")[0], expected_harvest_date: "", area_acres: "" });
      fetchData();
    }
  };

  const handleMarkHarvested = async (id: string) => {
    const { error } = await supabase
      .from("crop_history")
      .update({ status: "harvested", actual_harvest_date: new Date().toISOString().split("T")[0] })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Marked as harvested" });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("crop_history").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      fetchData();
    }
  };

  const calculateProgress = (planted: string, expected: string | null) => {
    if (!expected) return 0;
    const plantedDate = new Date(planted).getTime();
    const expectedDate = new Date(expected).getTime();
    const now = Date.now();
    const total = expectedDate - plantedDate;
    const elapsed = now - plantedDate;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Crop History</h1>
          <p className="text-muted-foreground">Track your planted crops</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={farms.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> Add Crop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Farm *</Label>
                <Select value={newCrop.farm_id} onValueChange={(v) => setNewCrop({ ...newCrop, farm_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Crop *</Label>
                <Select value={newCrop.crop_name} onValueChange={(v) => setNewCrop({ ...newCrop, crop_name: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_OPTIONS.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Planted Date *</Label>
                  <Input
                    type="date"
                    value={newCrop.planted_date}
                    onChange={(e) => setNewCrop({ ...newCrop, planted_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected Harvest</Label>
                  <Input
                    type="date"
                    value={newCrop.expected_harvest_date}
                    onChange={(e) => setNewCrop({ ...newCrop, expected_harvest_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Area (Acres)</Label>
                <Input
                  type="number"
                  value={newCrop.area_acres}
                  onChange={(e) => setNewCrop({ ...newCrop, area_acres: e.target.value })}
                  placeholder="5"
                />
              </div>
              <Button onClick={handleAddCrop} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Crop
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {farms.length === 0 && (
        <Card className="shadow-soft border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please add a farm first before tracking crops.
              <Button variant="link" asChild className="px-1">
                <a href="/farms">Add Farm</a>
              </Button>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Wheat className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Growing</p>
              <p className="text-2xl font-bold">{crops.filter((c) => c.status === "growing").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Harvested</p>
              <p className="text-2xl font-bold">{crops.filter((c) => c.status === "harvested").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="pt-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{crops.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Cards */}
      {crops.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wheat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No crops recorded</h3>
            <p className="text-muted-foreground text-center">Start tracking your crops</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <Card key={crop.id} className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wheat className="h-5 w-5 text-primary" />
                      {crop.crop_name}
                    </CardTitle>
                    <CardDescription>{crop.farms?.name}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(crop.status)}>{crop.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Planted:</span>
                    <span>{new Date(crop.planted_date).toLocaleDateString()}</span>
                  </p>
                  {crop.expected_harvest_date && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Expected:</span>
                      <span>{new Date(crop.expected_harvest_date).toLocaleDateString()}</span>
                    </p>
                  )}
                  {crop.area_acres && (
                    <p className="flex justify-between">
                      <span className="text-muted-foreground">Area:</span>
                      <span>{crop.area_acres} acres</span>
                    </p>
                  )}
                </div>

                {crop.status === "growing" && crop.expected_harvest_date && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Growth Progress</p>
                    <Progress value={calculateProgress(crop.planted_date, crop.expected_harvest_date)} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {crop.status === "growing" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkHarvested(crop.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Mark Harvested
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(crop.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CropHistory;
