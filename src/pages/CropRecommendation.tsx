import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Sprout, Loader2, Calendar, TrendingUp, Droplets, FlaskConical, MapPin, 
  CloudSun, AlertTriangle, CalendarCheck, Clock, Scissors, CheckCircle2,
  CloudRain, Sun, Thermometer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    humidity: number;
    condition: string;
    rainfall?: number;
    wind_speed?: number;
  };
  forecast: Array<{
    day: string;
    date?: string;
    temp_max?: number;
    temp_min?: number;
    temp?: number;
    condition: string;
    rainfall_chance?: number;
    humidity?: number;
  }>;
  alerts?: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
  }>;
}

const CropRecommendation = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suitabilityResult, setSuitabilityResult] = useState<any>(null);
  const [isSuitabilityLoading, setIsSuitabilityLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    soilType: "",
    ph: "",
    temperature: "",
    rainfall: "",
    season: "",
    location: "",
  });

  const [suitabilityData, setSuitabilityData] = useState({
    cropName: "",
    soilType: "",
    ph: "",
    temperature: "",
    rainfall: "",
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchWeatherForLocation = async (location: string) => {
    setIsFetchingWeather(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { location },
      });

      if (error) throw error;
      setWeatherData(data);
      
      // Auto-fill temperature from current weather
      if (data.current?.temperature) {
        setFormData(prev => ({
          ...prev,
          temperature: data.current.temperature.toString(),
        }));
      }

      toast({
        title: t('cropRecommendation.weatherFetched'),
        description: t('cropRecommendation.weatherDataLoaded', { location: data.location }),
      });
    } catch (error: any) {
      console.error("Weather fetch error:", error);
      toast({
        title: t('cropRecommendation.weatherFetchFailed'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const fetchSoilFromLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: t('cropRecommendation.geolocationNotSupported'),
        description: t('cropRecommendation.browserNotSupported'),
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationString = `${latitude},${longitude}`;
        
        try {
          // Fetch soil data
          const { data, error } = await supabase.functions.invoke('analyze-soil', {
            body: { 
              useDigitalData: true,
              latitude,
              longitude
            },
          });

          if (error) throw error;

          const soilTypeMap: Record<string, string> = {
            'sandy': 'sandy',
            'loamy': 'loamy',
            'clay': 'clay',
            'silty': 'silty',
            'peaty': 'peaty',
            'chalky': 'chalky',
            'sandy loam': 'sandy',
            'clay loam': 'clay',
            'silt loam': 'silty',
          };

          const detectedType = data.soil_type?.toLowerCase() || '';
          const mappedType = Object.entries(soilTypeMap).find(([key]) => 
            detectedType.includes(key)
          )?.[1] || '';

          setFormData(prev => ({
            ...prev,
            soilType: mappedType,
            ph: data.pH?.toString() || prev.ph,
            temperature: data.temperature?.toString() || prev.temperature,
            location: locationString,
          }));

          setLocationInfo(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

          // Also fetch weather data
          await fetchWeatherForLocation(locationString);

          toast({
            title: t('cropRecommendation.soilDataRetrieved'),
            description: t('cropRecommendation.formAutoFilled'),
          });
        } catch (error: any) {
          console.error("Failed to fetch soil data:", error);
          toast({
            title: t('cropRecommendation.failedToFetchSoil'),
            description: error.message || t('cropRecommendation.couldNotRetrieveSoil'),
            variant: "destructive",
          });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast({
          title: t('cropRecommendation.locationError'),
          description: error.message || t('cropRecommendation.couldNotGetLocation'),
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const getCropRecommendations = async () => {
    if (!formData.soilType || !formData.ph || !formData.temperature || !formData.season) {
      toast({
        title: t('cropRecommendation.missingInfo'),
        description: t('cropRecommendation.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('recommend-crops', {
        body: {
          soilType: formData.soilType,
          ph: parseFloat(formData.ph),
          temperature: parseFloat(formData.temperature),
          rainfall: formData.rainfall ? parseFloat(formData.rainfall) : null,
          season: formData.season,
          location: formData.location || locationInfo || undefined,
          weatherData: weatherData || undefined,
        },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: t('cropRecommendation.recommendationsReady'),
        description: t('cropRecommendation.bestCropsIdentified'),
      });
    } catch (error: any) {
      console.error("Recommendation error:", error);
      toast({
        title: t('cropRecommendation.failedToGetRecommendations'),
        description: error.message || t('cropRecommendation.couldNotGenerateRecommendations'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSoilSuitability = async () => {
    if (!suitabilityData.cropName) {
      toast({
        title: t('cropRecommendation.missingInfo'),
        description: t('cropRecommendation.enterCropName'),
        variant: "destructive",
      });
      return;
    }

    setIsSuitabilityLoading(true);
    setSuitabilityResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('check-soil-suitability', {
        body: {
          cropName: suitabilityData.cropName,
          soilType: suitabilityData.soilType || undefined,
          ph: suitabilityData.ph ? parseFloat(suitabilityData.ph) : undefined,
          temperature: suitabilityData.temperature ? parseFloat(suitabilityData.temperature) : undefined,
          rainfall: suitabilityData.rainfall ? parseFloat(suitabilityData.rainfall) : undefined,
        },
      });

      if (error) throw error;

      setSuitabilityResult(data);
      toast({
        title: t('cropRecommendation.analysisComplete'),
        description: t('cropRecommendation.suitabilityAnalysisReady'),
      });
    } catch (error: any) {
      console.error("Suitability analysis error:", error);
      toast({
        title: t('cropRecommendation.failedToAnalyzeSuitability'),
        description: error.message || t('cropRecommendation.couldNotAnalyzeSuitability'),
        variant: "destructive",
      });
    } finally {
      setIsSuitabilityLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const lower = condition.toLowerCase();
    if (lower.includes('rain')) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-4 w-4 text-yellow-500" />;
    return <CloudSun className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t('cropRecommendation.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('cropRecommendation.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="recommend" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommend">{t('cropRecommendation.tabRecommend')}</TabsTrigger>
          <TabsTrigger value="suitability">{t('cropRecommendation.tabSuitability')}</TabsTrigger>
        </TabsList>

        <TabsContent value="recommend" className="space-y-6">
          {/* Weather Preview Card */}
          {weatherData && (
            <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 shadow-soft">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/20 p-2">
                      <CloudSun className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weather Integrated</p>
                      <p className="font-medium">{weatherData.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span>{Math.round(weatherData.current?.temperature)}°C</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span>{weatherData.current?.humidity}%</span>
                    </div>
                    <span className="text-muted-foreground">{weatherData.current?.condition}</span>
                  </div>
                </div>
                {weatherData.alerts && weatherData.alerts.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{weatherData.alerts[0].title}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Section */}
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  {t('cropRecommendation.farmConditions')}
                </CardTitle>
                <CardDescription>
                  {t('cropRecommendation.farmConditionsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto-fetch location button */}
                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                  <Button
                    onClick={fetchSoilFromLocation}
                    disabled={isFetchingLocation || isFetchingWeather}
                    variant="outline"
                    className="w-full"
                  >
                    {isFetchingLocation || isFetchingWeather ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isFetchingWeather ? 'Fetching weather...' : t('cropRecommendation.fetchingSoilData')}
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        {t('cropRecommendation.autoFillLocation')}
                      </>
                    )}
                  </Button>
                  {locationInfo && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">{locationInfo}</p>
                  )}
                </div>

                {/* Manual location input */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location (for weather)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Enter city name..."
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => formData.location && fetchWeatherForLocation(formData.location)}
                      disabled={!formData.location || isFetchingWeather}
                    >
                      {isFetchingWeather ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CloudSun className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{t('cropRecommendation.orEnterManually')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soilType">{t('cropRecommendation.soilType')} *</Label>
                  <Select
                    value={formData.soilType}
                    onValueChange={(value) => handleInputChange("soilType", value)}
                  >
                    <SelectTrigger id="soilType">
                      <SelectValue placeholder={t('cropRecommendation.selectSoilType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandy">{t('cropRecommendation.soilTypes.sandy')}</SelectItem>
                      <SelectItem value="loamy">{t('cropRecommendation.soilTypes.loamy')}</SelectItem>
                      <SelectItem value="clay">{t('cropRecommendation.soilTypes.clay')}</SelectItem>
                      <SelectItem value="silty">{t('cropRecommendation.soilTypes.silty')}</SelectItem>
                      <SelectItem value="peaty">{t('cropRecommendation.soilTypes.peaty')}</SelectItem>
                      <SelectItem value="chalky">{t('cropRecommendation.soilTypes.chalky')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ph">{t('cropRecommendation.soilPh')} *</Label>
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    placeholder={t('cropRecommendation.phPlaceholder')}
                    value={formData.ph}
                    onChange={(e) => handleInputChange("ph", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">{t('cropRecommendation.temperature')} *</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    placeholder={t('cropRecommendation.temperaturePlaceholder')}
                    value={formData.temperature}
                    onChange={(e) => handleInputChange("temperature", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rainfall">{t('cropRecommendation.rainfall')}</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    step="1"
                    placeholder={t('cropRecommendation.rainfallPlaceholder')}
                    value={formData.rainfall}
                    onChange={(e) => handleInputChange("rainfall", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">{t('cropRecommendation.season')} *</Label>
                  <Select
                    value={formData.season}
                    onValueChange={(value) => handleInputChange("season", value)}
                  >
                    <SelectTrigger id="season">
                      <SelectValue placeholder={t('cropRecommendation.selectSeason')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">{t('cropRecommendation.seasons.spring')}</SelectItem>
                      <SelectItem value="summer">{t('cropRecommendation.seasons.summer')}</SelectItem>
                      <SelectItem value="autumn">{t('cropRecommendation.seasons.autumn')}</SelectItem>
                      <SelectItem value="winter">{t('cropRecommendation.seasons.winter')}</SelectItem>
                      <SelectItem value="monsoon">{t('cropRecommendation.seasons.monsoon')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={getCropRecommendations}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Sprout className="mr-2 h-4 w-4" />
                      {weatherData ? 'Get Weather-Smart Recommendations' : t('cropRecommendation.getRecommendations')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {t('cropRecommendation.recommendedCrops')}
                </CardTitle>
                <CardDescription>
                  {t('cropRecommendation.bestCropsForConditions')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!result && !isLoading && (
                  <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                    <p className="text-center text-sm">
                      {t('cropRecommendation.fillFormToSee')}
                    </p>
                  </div>
                )}

                {isLoading && (
                  <div className="flex h-[500px] items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {weatherData ? 'Analyzing weather patterns...' : 'Generating recommendations...'}
                      </p>
                    </div>
                  </div>
                )}

                {result && (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      <div className="rounded-lg bg-accent/10 p-4">
                        <h3 className="mb-3 font-semibold text-accent">{t('cropRecommendation.topRecommendations')}</h3>
                        <div className="space-y-3">
                          {result.crops?.map((crop: any, idx: number) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-foreground">{crop.name}</h4>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {crop.description}
                                  </p>
                                  {crop.weather_suitability && (
                                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                      🌤️ {crop.weather_suitability}
                                    </p>
                                  )}
                                </div>
                                <span className="rounded-full bg-accent/20 px-2 py-1 text-xs font-medium text-accent">
                                  {crop.suitability}% {t('cropRecommendation.match')}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                  {t('cropRecommendation.growth')}: {crop.growth_period}
                                </span>
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                                  {t('cropRecommendation.yield')}: {crop.expected_yield}
                                </span>
                              </div>
                            </div>
                          )) || <p className="text-sm text-muted-foreground">{t('cropRecommendation.noCropsAvailable')}</p>}
                        </div>
                      </div>

                      {/* Planting Schedule */}
                      {result.planting_schedule && (
                        <div className="rounded-lg bg-green-500/10 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                            <CalendarCheck className="h-4 w-4" />
                            Optimal Planting Schedule
                          </h3>
                          {result.planting_schedule.optimal_planting_window && (
                            <div className="rounded-lg bg-green-500/10 p-3 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-green-600" />
                                <span className="font-medium text-green-700 dark:text-green-300">
                                  {result.planting_schedule.optimal_planting_window.start_date} → {result.planting_schedule.optimal_planting_window.end_date}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {result.planting_schedule.optimal_planting_window.reason}
                              </p>
                            </div>
                          )}
                          {result.planting_schedule.weather_considerations && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Weather Considerations:</p>
                              <ul className="space-y-1">
                                {result.planting_schedule.weather_considerations.map((item: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CloudSun className="h-3 w-3 mt-1 text-blue-500 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {result.planting_schedule.pre_planting_tasks && result.planting_schedule.pre_planting_tasks.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase">Pre-Planting Tasks:</p>
                              {result.planting_schedule.pre_planting_tasks.map((task: any, idx: number) => (
                                <div key={idx} className="rounded bg-background/50 p-2 text-sm">
                                  <p className="font-medium">{task.task}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ⏰ {task.timing} | 🌤️ {task.weather_dependency}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Harvesting Schedule */}
                      {result.harvesting_schedule && (
                        <div className="rounded-lg bg-orange-500/10 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-orange-600 dark:text-orange-400">
                            <Scissors className="h-4 w-4" />
                            Harvesting Schedule
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-orange-600" />
                              <span className="font-medium">
                                Expected: {result.harvesting_schedule.estimated_harvest_date}
                              </span>
                            </div>
                            {result.harvesting_schedule.harvest_window && (
                              <p className="text-sm text-muted-foreground">
                                Optimal window: {result.harvesting_schedule.harvest_window}
                              </p>
                            )}
                            {result.harvesting_schedule.weather_indicators && (
                              <p className="text-sm text-muted-foreground">
                                🌡️ {result.harvesting_schedule.weather_indicators}
                              </p>
                            )}
                            {result.harvesting_schedule.pre_harvest_checklist && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Pre-Harvest Checklist:</p>
                                <ul className="space-y-1">
                                  {result.harvesting_schedule.pre_harvest_checklist.map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm">
                                      <CheckCircle2 className="h-3 w-3 text-orange-500" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Weekly Weather Actions */}
                      {result.weekly_weather_actions && result.weekly_weather_actions.length > 0 && (
                        <div className="rounded-lg bg-blue-500/10 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                            <Clock className="h-4 w-4" />
                            This Week's Weather Actions
                          </h3>
                          <div className="space-y-3">
                            {result.weekly_weather_actions.slice(0, 2).map((week: any, idx: number) => (
                              <div key={idx} className="rounded-lg bg-background/50 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{week.week}</span>
                                  <span className="text-xs text-muted-foreground">{week.weather_summary}</span>
                                </div>
                                <ul className="space-y-1 mb-2">
                                  {week.recommended_actions?.map((action: string, actionIdx: number) => (
                                    <li key={actionIdx} className="flex items-start gap-2 text-sm">
                                      <span className="text-green-500">✓</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                                {week.warnings && week.warnings.length > 0 && (
                                  <div className="flex items-start gap-2 text-sm text-yellow-600">
                                    <AlertTriangle className="h-3 w-3 mt-1 shrink-0" />
                                    <span>{week.warnings.join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Irrigation Plan */}
                      {result.irrigation_plan && (
                        <div className="rounded-lg bg-cyan-500/10 p-4">
                          <h3 className="mb-2 flex items-center gap-2 font-semibold text-cyan-600 dark:text-cyan-400">
                            <Droplets className="h-4 w-4" />
                            Weather-Adjusted Irrigation
                          </h3>
                          <p className="text-sm mb-2">{result.irrigation_plan.base_schedule}</p>
                          {result.irrigation_plan.current_recommendation && (
                            <div className="rounded bg-cyan-500/10 p-2 text-sm">
                              <span className="font-medium">This week:</span> {result.irrigation_plan.current_recommendation}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Weather Alerts Impact */}
                      {result.weather_alerts_impact && result.weather_alerts_impact.length > 0 && (
                        <div className="rounded-lg bg-yellow-500/10 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle className="h-4 w-4" />
                            Weather Alert Impacts
                          </h3>
                          <div className="space-y-2">
                            {result.weather_alerts_impact.map((alert: any, idx: number) => (
                              <div key={idx} className="rounded bg-background/50 p-2 text-sm">
                                <p className="font-medium text-yellow-700 dark:text-yellow-300">{alert.alert}</p>
                                <p className="text-muted-foreground">Impact: {alert.impact}</p>
                                <p className="text-green-600">Action: {alert.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monthly Farming Plan */}
                      {result.selected_crop && result.farming_plan && result.farming_plan.length > 0 && (
                        <div className="rounded-lg bg-primary/10 p-4">
                          <h3 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                            <Calendar className="h-4 w-4" />
                            {t('cropRecommendation.monthlyFarmingPlan')}: {result.selected_crop}
                          </h3>
                          <div className="space-y-2">
                            {result.farming_plan?.map((month: any, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-lg border-l-4 border-accent bg-card p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-foreground">{month.month}</span>
                                  <span className="text-sm text-accent">{month.phase}</span>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {month.activities}
                                </p>
                              </div>
                            )) || <p className="text-sm text-muted-foreground">{t('cropRecommendation.noPlanAvailable')}</p>}
                          </div>
                        </div>
                      )}

                      {/* Water Requirements */}
                      <div className="rounded-lg bg-blue-500/10 p-4">
                        <h3 className="mb-2 flex items-center gap-2 font-semibold text-blue-600">
                          <Droplets className="h-4 w-4" />
                          {t('cropRecommendation.waterRequirements')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {result.water_requirements || t('cropRecommendation.standardIrrigation')}
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="rounded-lg bg-secondary p-4">
                        <h3 className="mb-2 font-semibold text-foreground">{t('cropRecommendation.additionalTips')}</h3>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {result.tips?.map((tip: string, idx: number) => (
                            <li key={idx}>{tip}</li>
                          )) || <li>{t('cropRecommendation.consultExperts')}</li>}
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="border-primary/20 bg-gradient-card shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">{t('cropRecommendation.factorsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <div>
                <h4 className="mb-1 font-medium text-foreground">{t('cropRecommendation.factorsSoil')}</h4>
                <p>{t('cropRecommendation.factorsSoilDesc')}</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-foreground">{t('cropRecommendation.factorsClimate')}</h4>
                <p>{t('cropRecommendation.factorsClimateDesc')}</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-foreground">{t('cropRecommendation.factorsWater')}</h4>
                <p>{t('cropRecommendation.factorsWaterDesc')}</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-foreground">{t('cropRecommendation.factorsMarket')}</h4>
                <p>{t('cropRecommendation.factorsMarketDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suitability" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Suitability Input Section */}
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  {t('cropRecommendation.suitabilityTitle')}
                </CardTitle>
                <CardDescription>
                  {t('cropRecommendation.suitabilityDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cropNameCheck">{t('cropRecommendation.cropName')} *</Label>
                  <Input
                    id="cropNameCheck"
                    placeholder={t('cropRecommendation.cropNamePlaceholder')}
                    value={suitabilityData.cropName}
                    onChange={(e) => setSuitabilityData({ ...suitabilityData, cropName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soilTypeCheck">{t('cropRecommendation.soilType')}</Label>
                  <Select
                    value={suitabilityData.soilType}
                    onValueChange={(value) => setSuitabilityData({ ...suitabilityData, soilType: value })}
                  >
                    <SelectTrigger id="soilTypeCheck">
                      <SelectValue placeholder={t('cropRecommendation.selectSoilType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandy">{t('cropRecommendation.soilTypes.sandy')}</SelectItem>
                      <SelectItem value="loamy">{t('cropRecommendation.soilTypes.loamy')}</SelectItem>
                      <SelectItem value="clay">{t('cropRecommendation.soilTypes.clay')}</SelectItem>
                      <SelectItem value="silty">{t('cropRecommendation.soilTypes.silty')}</SelectItem>
                      <SelectItem value="peaty">{t('cropRecommendation.soilTypes.peaty')}</SelectItem>
                      <SelectItem value="chalky">{t('cropRecommendation.soilTypes.chalky')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phCheck">{t('cropRecommendation.soilPh')}</Label>
                  <Input
                    id="phCheck"
                    type="number"
                    step="0.1"
                    placeholder={t('cropRecommendation.phPlaceholder')}
                    value={suitabilityData.ph}
                    onChange={(e) => setSuitabilityData({ ...suitabilityData, ph: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperatureCheck">{t('cropRecommendation.temperature')}</Label>
                  <Input
                    id="temperatureCheck"
                    type="number"
                    step="0.1"
                    placeholder={t('cropRecommendation.temperaturePlaceholder')}
                    value={suitabilityData.temperature}
                    onChange={(e) => setSuitabilityData({ ...suitabilityData, temperature: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rainfallCheck">{t('cropRecommendation.rainfall')}</Label>
                  <Input
                    id="rainfallCheck"
                    type="number"
                    placeholder={t('cropRecommendation.rainfallPlaceholder')}
                    value={suitabilityData.rainfall}
                    onChange={(e) => setSuitabilityData({ ...suitabilityData, rainfall: e.target.value })}
                  />
                </div>

                <Button
                  onClick={checkSoilSuitability}
                  disabled={isSuitabilityLoading}
                  className="w-full bg-gradient-primary"
                >
                  {isSuitabilityLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <FlaskConical className="mr-2 h-4 w-4" />
                      {t('cropRecommendation.checkSuitability')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Suitability Results Section */}
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  {t('cropRecommendation.suitabilityReport')}
                </CardTitle>
                <CardDescription>
                  {t('cropRecommendation.suitabilityReportDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!suitabilityResult && !isSuitabilityLoading && (
                  <div className="flex h-[500px] items-center justify-center text-muted-foreground">
                    <p className="text-center text-sm">
                      {t('cropRecommendation.enterCropToCheck')}
                    </p>
                  </div>
                )}

                {isSuitabilityLoading && (
                  <div className="flex h-[500px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {suitabilityResult && (
                  <div className="space-y-4">
                    <div className={`rounded-lg p-4 ${suitabilityResult.is_suitable ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${suitabilityResult.is_suitable ? 'text-green-600' : 'text-red-600'}`}>
                          {suitabilityResult.is_suitable ? t('cropRecommendation.suitable') : t('cropRecommendation.notSuitable')}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${suitabilityResult.is_suitable ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`}>
                          {suitabilityResult.suitability_score}% {t('cropRecommendation.match')}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {suitabilityResult.summary}
                      </p>
                    </div>

                    {suitabilityResult.current_conditions_analysis && (
                      <div className="rounded-lg bg-secondary p-4">
                        <h3 className="mb-3 font-semibold text-foreground">{t('cropRecommendation.currentConditions')}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(suitabilityResult.current_conditions_analysis).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between rounded bg-background p-2">
                              <span className="capitalize text-muted-foreground">{key.replace('_status', '')}:</span>
                              <span className={`font-medium ${
                                value === 'optimal' ? 'text-green-600' : 
                                value === 'acceptable' ? 'text-yellow-600' : 
                                'text-red-600'
                              }`}>
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suitabilityResult.soil_requirements && (
                      <div className="rounded-lg bg-primary/10 p-4">
                        <h3 className="mb-3 font-semibold text-primary">{t('cropRecommendation.idealRequirements')}</h3>
                        <div className="space-y-2 text-sm">
                          {suitabilityResult.soil_requirements.ideal_ph && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('cropRecommendation.phLabel')}:</span>
                              <span className="font-medium text-foreground">{suitabilityResult.soil_requirements.ideal_ph}</span>
                            </div>
                          )}
                          {suitabilityResult.soil_requirements.ideal_temperature && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('cropRecommendation.temperatureLabel')}:</span>
                              <span className="font-medium text-foreground">{suitabilityResult.soil_requirements.ideal_temperature}</span>
                            </div>
                          )}
                          {suitabilityResult.soil_requirements.ideal_rainfall && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('cropRecommendation.rainfallLabel')}:</span>
                              <span className="font-medium text-foreground">{suitabilityResult.soil_requirements.ideal_rainfall}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {suitabilityResult.recommendations && suitabilityResult.recommendations.length > 0 && (
                      <div className="rounded-lg bg-accent/10 p-4">
                        <h3 className="mb-2 font-semibold text-accent">{t('cropRecommendation.recommendations')}</h3>
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {suitabilityResult.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {suitabilityResult.alternative_crops && suitabilityResult.alternative_crops.length > 0 && (
                      <div className="rounded-lg bg-blue-500/10 p-4">
                        <h3 className="mb-2 font-semibold text-blue-600">{t('cropRecommendation.alternativeCrops')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {suitabilityResult.alternative_crops.map((crop: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-600"
                            >
                              {crop}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CropRecommendation;
