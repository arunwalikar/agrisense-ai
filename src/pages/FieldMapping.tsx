import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Loader2, Trash2, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Field {
  id: string;
  name: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  soil_type: string | null;
  soil_data: any;
  notes: string | null;
  created_at: string;
}

const FieldMapping = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [newField, setNewField] = useState({
    name: "",
    location_name: "",
    latitude: "",
    longitude: "",
    soil_type: "",
    notes: "",
  });

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fields')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFields(data || []);
    } catch (error: any) {
      console.error("Error fetching fields:", error);
      toast({
        title: "Failed to Load Fields",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewField((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast({
          title: "Location Captured",
          description: "GPS coordinates set successfully",
        });
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Could not get your location",
          variant: "destructive",
        });
      }
    );
  };

  const analyzeSoilAtLocation = async (latitude: number, longitude: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-soil', {
        body: {
          latitude,
          longitude,
          useDigitalData: true,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Soil analysis error:", error);
      return null;
    }
  };

  const addField = async () => {
    if (!newField.name || !newField.latitude || !newField.longitude) {
      toast({
        title: "Missing Information",
        description: "Please provide name and location",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      // Get soil data for this location
      const soilData = await analyzeSoilAtLocation(
        parseFloat(newField.latitude),
        parseFloat(newField.longitude)
      );

      const { data, error } = await supabase
        .from('fields')
        .insert([{
          name: newField.name,
          location_name: newField.location_name || null,
          latitude: parseFloat(newField.latitude),
          longitude: parseFloat(newField.longitude),
          soil_type: newField.soil_type || null,
          soil_data: soilData,
          notes: newField.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setFields([data, ...fields]);
      setNewField({
        name: "",
        location_name: "",
        latitude: "",
        longitude: "",
        soil_type: "",
        notes: "",
      });

      toast({
        title: "Field Added",
        description: "Field has been added successfully with soil analysis",
      });
    } catch (error: any) {
      console.error("Error adding field:", error);
      toast({
        title: "Failed to Add Field",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteField = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fields')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFields(fields.filter(f => f.id !== id));
      toast({
        title: "Field Deleted",
        description: "Field has been removed",
      });
    } catch (error: any) {
      console.error("Error deleting field:", error);
      toast({
        title: "Failed to Delete Field",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Field Mapping
        </h1>
        <p className="text-muted-foreground">
          Manage and track soil data for multiple field locations
        </p>
      </div>

      {/* Add New Field Section */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Field
          </CardTitle>
          <CardDescription>
            Register a new field location with soil data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fieldName">Field Name *</Label>
              <Input
                id="fieldName"
                placeholder="e.g., North Field"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                placeholder="e.g., Springfield Farm"
                value={newField.location_name}
                onChange={(e) => setNewField({ ...newField, location_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <div className="flex gap-2">
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="e.g., 40.7128"
                  value={newField.latitude}
                  onChange={(e) => setNewField({ ...newField, latitude: e.target.value })}
                />
                <Button onClick={getCurrentLocation} variant="outline" size="icon">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="e.g., -74.0060"
                value={newField.longitude}
                onChange={(e) => setNewField({ ...newField, longitude: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soilType">Soil Type</Label>
              <Select
                value={newField.soil_type}
                onValueChange={(value) => setNewField({ ...newField, soil_type: value })}
              >
                <SelectTrigger id="soilType">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="silty">Silty</SelectItem>
                  <SelectItem value="peaty">Peaty</SelectItem>
                  <SelectItem value="chalky">Chalky</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about this field..."
                value={newField.notes}
                onChange={(e) => setNewField({ ...newField, notes: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={addField}
            disabled={isAdding}
            className="w-full bg-gradient-primary"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Field & Analyzing Soil...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Fields List */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-accent" />
            Your Fields ({fields.length})
          </CardTitle>
          <CardDescription>
            Manage your registered field locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && fields.length === 0 && (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <p className="text-center text-sm">
                No fields registered yet. Add your first field above.
              </p>
            </div>
          )}

          {!isLoading && fields.length > 0 && (
            <div className="space-y-4">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{field.name}</h3>
                      {field.location_name && (
                        <p className="text-sm text-muted-foreground">{field.location_name}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                          📍 {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                        </span>
                        {field.soil_type && (
                          <span className="rounded-full bg-accent/10 px-2 py-1 text-accent">
                            Soil: {field.soil_type}
                          </span>
                        )}
                      </div>
                      {field.soil_data && (
                        <div className="mt-3 rounded-lg bg-secondary p-3">
                          <p className="text-xs font-medium text-foreground">Soil Analysis:</p>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>Quality: {field.soil_data.quality || "N/A"}</span>
                            <span>Category: {field.soil_data.category || "N/A"}</span>
                            <span>N: {field.soil_data.nitrogen_status || "N/A"}</span>
                            <span>P: {field.soil_data.phosphorus_status || "N/A"}</span>
                          </div>
                        </div>
                      )}
                      {field.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{field.notes}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => deleteField(field.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FieldMapping;
