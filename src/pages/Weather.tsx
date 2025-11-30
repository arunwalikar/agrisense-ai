import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CloudSun, Droplets, Wind, ThermometerSun, Loader2, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Weather = () => {
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const { toast } = useToast();

  const fetchWeather = async (loc?: string) => {
    const searchLocation = loc || location;
    if (!searchLocation && !loc) {
      toast({
        title: "Location Required",
        description: "Please enter a location to get weather data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location: searchLocation },
      });

      if (error) throw error;

      setWeatherData(data);
      toast({
        title: "Weather Updated",
        description: `Showing weather for ${data.location}`,
      });
    } catch (error: any) {
      console.error("Weather fetch error:", error);
      toast({
        title: "Failed to Fetch Weather",
        description: error.message || "Could not retrieve weather data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Weather Forecast
        </h1>
        <p className="text-muted-foreground">
          Get real-time weather data with farming-specific recommendations
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </CardTitle>
          <CardDescription>
            Enter a city name or use your current location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter city name (e.g., New York, London)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchWeather()}
            />
            <Button
              onClick={() => fetchWeather()}
              disabled={isLoading}
              className="bg-gradient-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="w-full"
          >
            <MapPin className="mr-2 h-4 w-4" />
            Use Current Location
          </Button>
        </CardContent>
      </Card>

      {/* Weather Display */}
      {weatherData && (
        <>
          {/* Current Weather */}
          <Card className="border-primary/20 bg-gradient-hero shadow-strong text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-2xl">{weatherData.location}</span>
                <CloudSun className="h-8 w-8" />
              </CardTitle>
              <CardDescription className="text-white/80">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-6xl font-bold">
                    {weatherData.current?.temperature}°C
                  </div>
                  <p className="mt-2 text-xl text-white/90">
                    {weatherData.current?.condition}
                  </p>
                </div>
                <div className="text-right text-sm text-white/80">
                  <p>Feels like {weatherData.current?.feels_like}°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Details */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-3">
                    <Droplets className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="text-2xl font-bold">{weatherData.current?.humidity}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-500/10 p-3">
                    <Wind className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wind Speed</p>
                    <p className="text-2xl font-bold">{weatherData.current?.wind_speed} km/h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-600/10 p-3">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rainfall</p>
                    <p className="text-2xl font-bold">{weatherData.current?.rainfall || 0} mm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-3">
                    <ThermometerSun className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">UV Index</p>
                    <p className="text-2xl font-bold">{weatherData.current?.uv_index || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Farming Recommendations */}
          {weatherData.farming_advice && (
            <Card className="border-accent/20 bg-accent/5 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <CloudSun className="h-5 w-5" />
                  Farming Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {weatherData.farming_advice.map((advice: string, idx: number) => (
                  <p key={idx} className="flex items-start gap-2">
                    <span className="mt-1 text-accent">•</span>
                    <span>{advice}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  7-Day Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-7">
                  {weatherData.forecast.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-muted/50 p-3 text-center"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {day.day}
                      </p>
                      <CloudSun className="mx-auto my-2 h-6 w-6 text-primary" />
                      <p className="text-lg font-bold">{day.temp}°</p>
                      <p className="text-xs text-muted-foreground">{day.condition}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!weatherData && !isLoading && (
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
            <p className="text-center">
              Enter a location to view weather data and farming recommendations
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Weather;
