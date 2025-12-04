import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Ruler, Droplets, Loader2, Trash2 } from "lucide-react";

interface Farm {
  id: string;
  name: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  size_acres: number | null;
  soil_type: string | null;
  irrigation_type: string | null;
}

const Farms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: "",
    location_name: "",
    latitude: "",
    longitude: "",
    size_acres: "",
    soil_type: "",
    irrigation_type: "",
  });

  useEffect(() => {
    if (user) fetchFarms();
  }, [user]);

  const fetchFarms = async () => {
    const { data, error } = await supabase
      .from("farms")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (data) setFarms(data);
    setLoading(false);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewFarm({
            ...newFarm,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          });
          toast({ title: "Location detected", description: "GPS coordinates captured" });
        },
        () => toast({ title: "Error", description: "Could not get location", variant: "destructive" })
      );
    }
  };

  const handleAddFarm = async () => {
    if (!newFarm.name || !newFarm.latitude || !newFarm.longitude) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("farms").insert({
      user_id: user!.id,
      name: newFarm.name,
      location_name: newFarm.location_name || null,
      latitude: parseFloat(newFarm.latitude),
      longitude: parseFloat(newFarm.longitude),
      size_acres: newFarm.size_acres ? parseFloat(newFarm.size_acres) : null,
      soil_type: newFarm.soil_type || null,
      irrigation_type: newFarm.irrigation_type || null,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to add farm", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Farm added successfully" });
      setDialogOpen(false);
      setNewFarm({ name: "", location_name: "", latitude: "", longitude: "", size_acres: "", soil_type: "", irrigation_type: "" });
      fetchFarms();
    }
  };

  const handleDeleteFarm = async (id: string) => {
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete farm", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Farm removed" });
      fetchFarms();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">My Farms</h1>
          <p className="text-muted-foreground">Manage your farm locations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Farm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Farm</DialogTitle>
              <DialogDescription>Enter your farm details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Farm Name *</Label>
                <Input
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({ ...newFarm, name: e.target.value })}
                  placeholder="Main Farm"
                />
              </div>
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input
                  value={newFarm.location_name}
                  onChange={(e) => setNewFarm({ ...newFarm, location_name: e.target.value })}
                  placeholder="Village, District"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude *</Label>
                  <Input
                    value={newFarm.latitude}
                    onChange={(e) => setNewFarm({ ...newFarm, latitude: e.target.value })}
                    placeholder="28.6139"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude *</Label>
                  <Input
                    value={newFarm.longitude}
                    onChange={(e) => setNewFarm({ ...newFarm, longitude: e.target.value })}
                    placeholder="77.2090"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full">
                <MapPin className="mr-2 h-4 w-4" /> Get Current Location
              </Button>
              <div className="space-y-2">
                <Label>Size (Acres)</Label>
                <Input
                  type="number"
                  value={newFarm.size_acres}
                  onChange={(e) => setNewFarm({ ...newFarm, size_acres: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label>Soil Type</Label>
                <Select value={newFarm.soil_type} onValueChange={(v) => setNewFarm({ ...newFarm, soil_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alluvial">Alluvial</SelectItem>
                    <SelectItem value="black">Black (Regur)</SelectItem>
                    <SelectItem value="red">Red Soil</SelectItem>
                    <SelectItem value="laterite">Laterite</SelectItem>
                    <SelectItem value="sandy">Sandy</SelectItem>
                    <SelectItem value="clay">Clay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Irrigation Type</Label>
                <Select value={newFarm.irrigation_type} onValueChange={(v) => setNewFarm({ ...newFarm, irrigation_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select irrigation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="canal">Canal</SelectItem>
                    <SelectItem value="well">Well/Bore</SelectItem>
                    <SelectItem value="rain-fed">Rain-fed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddFarm} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Farm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {farms.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No farms yet</h3>
            <p className="text-muted-foreground text-center">Add your first farm to start tracking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Card key={farm.id} className="shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {farm.location_name || `${farm.latitude.toFixed(4)}, ${farm.longitude.toFixed(4)}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFarm(farm.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 text-sm">
                  {farm.size_acres && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-primary">
                      <Ruler className="h-3 w-3" /> {farm.size_acres} acres
                    </span>
                  )}
                  {farm.soil_type && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1">
                      {farm.soil_type}
                    </span>
                  )}
                  {farm.irrigation_type && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-accent">
                      <Droplets className="h-3 w-3" /> {farm.irrigation_type}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Farms;
