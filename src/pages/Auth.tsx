import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Loader2, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Welcome back!", description: "You have logged in successfully." });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = signupSchema.safeParse(signupData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message.includes("already registered") 
          ? "This email is already registered. Please login instead."
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Account Created!", description: "Welcome to AgriSmart. Your account is ready." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      setErrors({ forgotEmail: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check Your Email",
        description: "If an account exists with this email, you will receive a password reset link.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
        <Card className="w-full max-w-md shadow-strong">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">Reset Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="farmer@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
                {errors.forgotEmail && <p className="text-sm text-destructive">{errors.forgotEmail}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full gap-2"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Leaf className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">AgriSmart</CardTitle>
          <CardDescription>Digital Farm Management Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="farmer@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    placeholder="John Doe"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                  />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="farmer@example.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
