import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, FlaskConical, CloudSun, Sprout, TrendingUp, Leaf, Wallet } from "lucide-react";
import ProfitLossTracker from "@/components/ProfitLossTracker";

const Dashboard = () => {
  const features = [
    {
      title: "Plant Detection",
      description: "Upload leaf photos to identify plant species and detect diseases",
      icon: Camera,
      to: "/plant-detection",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Soil Analysis",
      description: "Get detailed soil reports and fertilizer recommendations",
      icon: FlaskConical,
      to: "/soil-analysis",
      gradient: "from-amber-500 to-orange-600",
    },
    {
      title: "Weather Forecast",
      description: "Real-time weather data with farming recommendations",
      icon: CloudSun,
      to: "/weather",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      title: "Crop Recommendations",
      description: "Find the best crops based on your soil and climate",
      icon: Sprout,
      to: "/crop-recommendation",
      gradient: "from-lime-500 to-green-600",
    },
  ];

  return (
    <div className="space-y-8 pb-20 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-8 text-white shadow-strong md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8" />
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              Smart Agriculture Platform
            </h1>
          </div>
          <p className="text-lg text-white/90">
            AI-powered tools for modern farming. Detect plant diseases, analyze soil health, 
            monitor weather, and get personalized crop recommendations.
          </p>
          <div className="flex flex-wrap gap-3 pt-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/plant-detection">
                <Camera className="mr-2 h-4 w-4" />
                Start Detection
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link to="/weather">
                <CloudSun className="mr-2 h-4 w-4" />
                Check Weather
              </Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <Sprout className="h-full w-full" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">98.5%</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Plant disease detection accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Plant Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">500+</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Species and diseases covered
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-card shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weather Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CloudSun className="h-5 w-5 text-accent" />
              <div className="text-3xl font-bold text-primary">Live</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time weather updates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Tracker */}
      <div>
        <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-bold text-foreground">
          <Wallet className="h-6 w-6 text-primary" />
          Season Profit & Loss
        </h2>
        <ProfitLossTracker />
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="mb-6 font-display text-2xl font-bold text-foreground">
          Explore Features
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {features.map(({ title, description, icon: Icon, to, gradient }) => (
            <Link key={to} to={to} className="group">
              <Card className="h-full border-primary/20 bg-gradient-card shadow-soft transition-all hover:shadow-medium">
                <CardHeader>
                  <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-medium`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl transition-colors group-hover:text-primary">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-start text-primary hover:text-primary">
                    Get Started
                    <TrendingUp className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
