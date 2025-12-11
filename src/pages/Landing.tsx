import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Leaf, Camera, FlaskConical, CloudSun, Sprout, BarChart3,
  Shield, Bell, ArrowRight, CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Plant Detection",
    description: "Identify plant species and detect diseases using AI-powered image analysis",
    color: "text-green-500",
  },
  {
    icon: FlaskConical,
    title: "Soil Analysis",
    description: "Analyze soil health with detailed NPK levels, pH, and moisture readings",
    color: "text-amber-500",
  },
  {
    icon: CloudSun,
    title: "Weather Forecast",
    description: "Get 7-day forecasts with personalized farming and irrigation advice",
    color: "text-blue-500",
  },
  {
    icon: Sprout,
    title: "Crop Recommendations",
    description: "AI-powered crop suggestions based on your soil and climate conditions",
    color: "text-emerald-500",
  },
  {
    icon: BarChart3,
    title: "Farm Analytics",
    description: "Track expenses, income, and yields with detailed financial insights",
    color: "text-purple-500",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Receive timely notifications for irrigation, pests, and weather warnings",
    color: "text-rose-500",
  },
];

const benefits = [
  "AI-powered plant and disease detection",
  "Real-time weather and irrigation advice",
  "Comprehensive soil health analysis",
  "Track multiple farms and crop history",
  "Market price updates and trends",
  "Secure data with role-based access",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Leaf className="h-6 w-6" />
            <span>AgriSmart</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" />
            Smart Agriculture Platform
          </div>
          <h1 className="mb-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
            Transform Your Farm with{" "}
            <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              AI-Powered Intelligence
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            AgriSmart combines cutting-edge AI technology with practical farming tools
            to help you make smarter decisions, increase yields, and manage your farm efficiently.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild className="gap-2">
              <Link to="/auth?tab=signup">
                Start Free Today <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-display text-3xl font-bold">Powerful Features for Modern Farming</h2>
          <p className="text-muted-foreground">
            Everything you need to monitor, analyze, and optimize your agricultural operations
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="group relative overflow-hidden border-border/50 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex rounded-lg bg-muted p-3 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-16">
        <div className="container px-4">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 font-display text-3xl font-bold">Why Choose AgriSmart?</h2>
              <p className="mb-6 text-muted-foreground">
                Join thousands of farmers who are already using AgriSmart to improve
                their farming practices and increase productivity.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-green-400/20 p-8">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Leaf className="mb-4 h-16 w-16 text-primary" />
                  <p className="text-4xl font-bold text-primary">95%</p>
                  <p className="text-muted-foreground">Detection Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="mb-4 font-display text-3xl font-bold">Ready to Transform Your Farm?</h2>
          <p className="mb-8 text-primary-foreground/80">
            Create your free account today and start using AI-powered tools to improve your farming.
          </p>
          <Button size="lg" variant="secondary" asChild className="gap-2">
            <Link to="/auth?tab=signup">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="h-4 w-4 text-primary" />
            <span>© 2024 AgriSmart. All rights reserved.</span>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground">Login</Link>
            <Link to="/auth?tab=signup" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
