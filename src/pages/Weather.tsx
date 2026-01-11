import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  CloudSun, Droplets, Wind, ThermometerSun, Loader2, MapPin, Calendar, 
  CloudRain, Sun, Cloud, CloudSnow, AlertTriangle, Sprout, Eye, Gauge,
  Sunrise, Sunset, Moon, Clock, Thermometer, CloudFog, Zap, ArrowUp,
  RefreshCw, Navigation
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WeatherCurrent {
  temperature: number;
  feels_like: number;
  condition: string;
  condition_icon?: string;
  humidity: number;
  wind_speed: number;
  wind_direction?: string;
  wind_degree?: number;
  pressure?: number;
  visibility?: number;
  rainfall: number;
  uv_index: number;
  rain_chance?: number;
  cloud_cover?: number;
  dew_point?: number;
  air_quality_index?: number;
}

interface SunMoon {
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  moon_phase?: string;
  day_length?: string;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  feels_like?: number;
  condition: string;
  condition_icon?: string;
  rain_chance?: number;
  humidity?: number;
  wind_speed?: number;
  wind_direction?: string;
}

interface ForecastDay {
  day: string;
  date?: string;
  temp: number;
  temp_min?: number;
  temp_max?: number;
  condition: string;
  condition_icon?: string;
  rainfall_chance?: number;
  humidity?: number;
  wind_speed?: number;
  sunrise?: string;
  sunset?: string;
  uv_index?: number;
}

interface WeatherAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  title: string;
  description: string;
  valid_from?: string;
  valid_until?: string;
}

interface IrrigationRecommendation {
  status: 'required' | 'optional' | 'not_needed';
  message: string;
  schedule?: string;
}

interface WeatherData {
  location: string;
  coordinates?: { lat: number; lon: number };
  timezone?: string;
  last_updated?: string;
  current: WeatherCurrent;
  sun_moon?: SunMoon;
  hourly_forecast?: HourlyForecast[];
  forecast: ForecastDay[];
  alerts?: WeatherAlert[];
  farming_advice: string[];
  irrigation_recommendation?: IrrigationRecommendation;
}

const getWeatherIcon = (condition: string, size: "sm" | "md" | "lg" = "md") => {
  const sizeClass = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-12 w-12" : "h-6 w-6";
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return <Zap className={`${sizeClass} text-purple-500`} />;
  }
  if (lowerCondition.includes('heavy rain')) {
    return <CloudRain className={`${sizeClass} text-blue-600`} />;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower') || lowerCondition.includes('drizzle')) {
    return <CloudRain className={`${sizeClass} text-blue-500`} />;
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
    return <CloudFog className={`${sizeClass} text-gray-400`} />;
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) {
    return <CloudSnow className={`${sizeClass} text-blue-300`} />;
  }
  if (lowerCondition.includes('overcast') || lowerCondition.includes('cloudy')) {
    return <Cloud className={`${sizeClass} text-gray-500`} />;
  }
  if (lowerCondition.includes('partly') || lowerCondition.includes('partial')) {
    return <CloudSun className={`${sizeClass} text-yellow-500`} />;
  }
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
    return <Sun className={`${sizeClass} text-yellow-500`} />;
  }
  return <CloudSun className={`${sizeClass} text-primary`} />;
};

const getUVLevel = (uv: number) => {
  if (uv <= 2) return { level: 'Low', color: 'text-green-500', bg: 'bg-green-500' };
  if (uv <= 5) return { level: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500' };
  if (uv <= 7) return { level: 'High', color: 'text-orange-500', bg: 'bg-orange-500' };
  if (uv <= 10) return { level: 'Very High', color: 'text-red-500', bg: 'bg-red-500' };
  return { level: 'Extreme', color: 'text-purple-500', bg: 'bg-purple-500' };
};

const getAQILevel = (aqi: number) => {
  if (aqi === 1) return { level: 'Good', color: 'text-green-500' };
  if (aqi === 2) return { level: 'Fair', color: 'text-yellow-500' };
  if (aqi === 3) return { level: 'Moderate', color: 'text-orange-500' };
  if (aqi === 4) return { level: 'Poor', color: 'text-red-500' };
  return { level: 'Hazardous', color: 'text-purple-500' };
};

const getAlertColor = (severity: string) => {
  switch (severity) {
    case 'extreme': return 'bg-red-500/20 border-red-500/50 text-red-700 dark:text-red-400';
    case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-400';
    case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700 dark:text-yellow-400';
    default: return 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-400';
  }
};

const Weather = () => {
  const { t } = useTranslation();
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const { toast } = useToast();

  const getIrrigationStatus = (data: WeatherData): IrrigationRecommendation => {
    const { current, forecast } = data;
    
    const upcomingRain = forecast.some(day => 
      day.condition.toLowerCase().includes('rain') || 
      (day.rainfall_chance && day.rainfall_chance > 50)
    );
    
    if (current.rainfall > 5 || (current.humidity > 80 && upcomingRain)) {
      return {
        status: 'not_needed',
        message: t('weather.irrigation.notNeeded'),
        schedule: t('weather.irrigation.skipSchedule')
      };
    }
    
    if (current.temperature > 30 && current.humidity < 50 && !upcomingRain) {
      return {
        status: 'required',
        message: t('weather.irrigation.required'),
        schedule: t('weather.irrigation.requiredSchedule')
      };
    }
    
    if (current.humidity < 60 && !upcomingRain) {
      return {
        status: 'optional',
        message: t('weather.irrigation.optional'),
        schedule: t('weather.irrigation.optionalSchedule')
      };
    }
    
    return {
      status: 'not_needed',
      message: t('weather.irrigation.adequate'),
      schedule: t('weather.irrigation.monitorSchedule')
    };
  };

  const fetchWeather = async (loc?: string) => {
    const searchLocation = loc || location;
    if (!searchLocation && !loc) {
      toast({
        title: t('weather.errors.locationRequired'),
        description: t('weather.errors.locationRequiredDesc'),
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

      const enrichedData = {
        ...data,
        irrigation_recommendation: getIrrigationStatus(data)
      };

      setWeatherData(enrichedData);
      toast({
        title: t('weather.updated'),
        description: t('weather.showingFor', { location: data.location }),
      });
    } catch (error: any) {
      console.error("Weather fetch error:", error);
      toast({
        title: t('weather.errors.fetchFailed'),
        description: error.message || t('weather.errors.fetchFailedDesc'),
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
        () => {
          toast({
            title: t('weather.errors.locationError'),
            description: t('weather.errors.locationErrorDesc'),
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: t('weather.errors.notSupported'),
        description: t('weather.errors.notSupportedDesc'),
        variant: "destructive",
      });
    }
  };

  const irrigationStatusColor = {
    required: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
    optional: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
    not_needed: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 md:pb-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {t('weather.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('weather.subtitle')}
        </p>
      </div>

      {/* Search Section */}
      <Card className="border-primary/20 bg-gradient-card shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('weather.location')}
          </CardTitle>
          <CardDescription>
            {t('weather.locationDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={t('weather.enterCity')}
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
                t('common.search')
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
            {t('weather.useCurrentLocation')}
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardContent className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{t('weather.fetching')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {weatherData && !isLoading && (
        <>
          {/* Current Weather Hero */}
          <Card className="border-primary/20 bg-gradient-hero shadow-strong text-white overflow-hidden relative">
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-white/60">
              <Clock className="h-3 w-3" />
              {weatherData.last_updated ? new Date(weatherData.last_updated).toLocaleTimeString() : new Date().toLocaleTimeString()}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => fetchWeather(weatherData.location)}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="text-2xl">{weatherData.location}</span>
              </CardTitle>
              <CardDescription className="text-white/80">
                {new Date().toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    {getWeatherIcon(weatherData.current?.condition || '', 'lg')}
                    <div>
                      <div className="text-6xl font-bold">
                        {Math.round(weatherData.current?.temperature)}°
                      </div>
                      <p className="text-lg text-white/90">
                        {weatherData.current?.condition}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    <span>Feels like {Math.round(weatherData.current?.feels_like)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    <span>{weatherData.current?.humidity}% humidity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    <span>{weatherData.current?.wind_speed} km/h {weatherData.current?.wind_direction}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CloudRain className="h-4 w-4" />
                    <span>{weatherData.current?.rain_chance || 0}% rain</span>
                  </div>
                </div>
              </div>

              {/* Sunrise/Sunset Bar */}
              {weatherData.sun_moon && (
                <div className="mt-6 flex items-center justify-between rounded-lg bg-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-5 w-5 text-orange-300" />
                    <div>
                      <p className="text-xs text-white/60">Sunrise</p>
                      <p className="font-medium">{weatherData.sun_moon.sunrise}</p>
                    </div>
                  </div>
                  <div className="flex-1 mx-4 h-1 bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-400 rounded-full" />
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-white/60">Sunset</p>
                      <p className="font-medium">{weatherData.sun_moon.sunset}</p>
                    </div>
                    <Sunset className="h-5 w-5 text-orange-400" />
                  </div>
                  {weatherData.sun_moon.moon_phase && (
                    <div className="ml-4 flex items-center gap-2 border-l border-white/20 pl-4">
                      <Moon className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-xs text-white/60">Moon</p>
                        <p className="text-sm">{weatherData.sun_moon.moon_phase}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Details Grid */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-lg bg-blue-500/10 p-2 mb-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-xl font-bold">{weatherData.current?.humidity}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-lg bg-cyan-500/10 p-2 mb-2">
                    <Wind className="h-5 w-5 text-cyan-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-xl font-bold">{weatherData.current?.wind_speed}</p>
                  <p className="text-xs text-muted-foreground">km/h {weatherData.current?.wind_direction}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-lg bg-purple-500/10 p-2 mb-2">
                    <Gauge className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Pressure</p>
                  <p className="text-xl font-bold">{weatherData.current?.pressure || 1013}</p>
                  <p className="text-xs text-muted-foreground">hPa</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-lg bg-green-500/10 p-2 mb-2">
                    <Eye className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                  <p className="text-xl font-bold">{weatherData.current?.visibility || 10}</p>
                  <p className="text-xs text-muted-foreground">km</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className={`rounded-lg p-2 mb-2 ${getUVLevel(weatherData.current?.uv_index || 0).bg}/10`}>
                    <ThermometerSun className={`h-5 w-5 ${getUVLevel(weatherData.current?.uv_index || 0).color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">UV Index</p>
                  <p className="text-xl font-bold">{weatherData.current?.uv_index || 0}</p>
                  <p className={`text-xs ${getUVLevel(weatherData.current?.uv_index || 0).color}`}>
                    {getUVLevel(weatherData.current?.uv_index || 0).level}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-lg bg-blue-600/10 p-2 mb-2">
                    <CloudRain className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">Rain Chance</p>
                  <p className="text-xl font-bold">{weatherData.current?.rain_chance || 0}%</p>
                  <p className="text-xs text-muted-foreground">{weatherData.current?.rainfall || 0}mm</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weather Alerts */}
          {weatherData.alerts && weatherData.alerts.length > 0 && (
            <div className="space-y-3">
              {weatherData.alerts.map((alert, idx) => (
                <Card key={idx} className={`border shadow-soft ${getAlertColor(alert.severity)}`}>
                  <CardContent className="flex items-start gap-3 pt-4 pb-4">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{alert.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          alert.severity === 'extreme' ? 'bg-red-500 text-white' :
                          alert.severity === 'high' ? 'bg-orange-500 text-white' :
                          alert.severity === 'medium' ? 'bg-yellow-500 text-black' :
                          'bg-blue-500 text-white'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mt-1 opacity-80">{alert.description}</p>
                      {alert.valid_until && (
                        <p className="text-xs mt-2 opacity-60">
                          Valid until: {new Date(alert.valid_until).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Hourly Forecast */}
          {weatherData.hourly_forecast && weatherData.hourly_forecast.length > 0 && (
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  24-Hour Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3 pb-4">
                    {weatherData.hourly_forecast.map((hour, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col items-center rounded-xl p-3 min-w-[70px] transition-all ${
                          idx === 0 
                            ? 'bg-primary/15 ring-2 ring-primary/30' 
                            : 'bg-muted/50 hover:bg-muted/70'
                        }`}
                      >
                        <p className={`text-xs font-medium ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {idx === 0 ? 'Now' : hour.time}
                        </p>
                        <div className="my-2">
                          {getWeatherIcon(hour.condition, 'sm')}
                        </div>
                        <p className="text-lg font-bold">{Math.round(hour.temperature)}°</p>
                        {hour.rain_chance !== undefined && hour.rain_chance > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Droplets className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-500">{hour.rain_chance}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Irrigation Recommendation */}
          {weatherData.irrigation_recommendation && (
            <Card className={`border shadow-soft ${irrigationStatusColor[weatherData.irrigation_recommendation.status]}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  {t('weather.irrigationRecommendation')}
                  {weatherData.irrigation_recommendation.status === 'required' && (
                    <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                      {t('weather.actionNeeded')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">
                  {weatherData.irrigation_recommendation.message}
                </p>
                {weatherData.irrigation_recommendation.schedule && (
                  <p className="text-sm opacity-80">
                    <strong>{t('weather.schedule')}:</strong> {weatherData.irrigation_recommendation.schedule}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Farming Recommendations */}
          {weatherData.farming_advice && weatherData.farming_advice.length > 0 && (
            <Card className="border-accent/20 bg-accent/5 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-accent">
                  <Sprout className="h-5 w-5" />
                  {t('weather.farmingRecommendations')}
                </CardTitle>
                <CardDescription>
                  {t('weather.farmingRecommendationsDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {weatherData.farming_advice.map((advice: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent">
                        {idx + 1}
                      </span>
                      <span className="text-sm">{advice}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 7-Day Forecast */}
          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t('weather.sevenDayForecast')}
                </CardTitle>
                <CardDescription>
                  {t('weather.sevenDayForecastDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {weatherData.forecast.slice(0, 7).map((day: ForecastDay, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                        idx === 0 
                          ? 'bg-primary/10 ring-1 ring-primary/30' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <p className={`text-sm font-medium ${idx === 0 ? 'text-primary' : ''}`}>
                          {idx === 0 ? t('weather.today') : day.day}
                        </p>
                        {day.date && (
                          <p className="text-xs text-muted-foreground hidden sm:block">{day.date}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(day.condition, 'sm')}
                        <span className="text-sm text-muted-foreground hidden sm:inline w-24 truncate">
                          {day.condition}
                        </span>
                      </div>

                      {day.rainfall_chance !== undefined && (
                        <div className="flex items-center gap-1 text-blue-500 min-w-[50px]">
                          <Droplets className="h-3 w-3" />
                          <span className="text-xs">{day.rainfall_chance}%</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {day.temp_min !== undefined ? Math.round(day.temp_min) : '--'}°
                        </span>
                        <div className="w-16 h-1.5 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 rounded-full" />
                        <span className="text-sm font-semibold">
                          {day.temp_max !== undefined ? Math.round(day.temp_max) : Math.round(day.temp)}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Air Quality */}
          {weatherData.current?.air_quality_index && (
            <Card className="border-primary/20 bg-gradient-card shadow-soft">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-3">
                      <Navigation className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Air Quality Index</p>
                      <p className={`text-xl font-bold ${getAQILevel(weatherData.current.air_quality_index).color}`}>
                        {getAQILevel(weatherData.current.air_quality_index).level}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-8 h-2 rounded-full ${
                          level <= weatherData.current!.air_quality_index!
                            ? level === 1 ? 'bg-green-500' :
                              level === 2 ? 'bg-yellow-500' :
                              level === 3 ? 'bg-orange-500' :
                              level === 4 ? 'bg-red-500' : 'bg-purple-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Weather;
