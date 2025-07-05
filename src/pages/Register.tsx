
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { signUp, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    
    // Clear password error when user starts typing
    if (e.target.name === 'confirmPassword' || e.target.name === 'password') {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    const userData = {
      full_name: `${formData.firstName} ${formData.lastName}`,
      notification_preferences: {
        push: true,
        email: true
      }
    };

    const { error } = await signUp(formData.email, formData.password, userData);
    
    // Only set loading to false if there was an error
    if (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border-2 border-white/30 shadow-2xl animate-fade-in transform hover:scale-[1.02] transition-all duration-300">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 via-purple-500 via-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <Heart className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Join MedCare
          </CardTitle>
          <p className="text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg p-2 inline-block">Create your account to get started</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-semibold">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10 border-2 border-purple-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-semibold">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10 border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 border-2 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-rose-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 border-2 border-rose-200 focus:border-rose-400 focus:ring-rose-400 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-rose-400 hover:text-rose-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 bg-white/80 backdrop-blur-sm"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-indigo-400 hover:text-indigo-600 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg font-medium">{passwordError}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <input
                id="terms"
                type="checkbox"
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                required
                disabled={isLoading}
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the{" "}
                <Link to="/terms" className="text-purple-600 hover:text-purple-800 font-semibold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-800 font-semibold">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-rose-500 via-purple-500 via-blue-500 to-emerald-500 hover:from-rose-600 hover:via-purple-600 hover:via-blue-600 hover:to-emerald-600 text-white font-bold py-3 text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "🚀 Create Account"}
            </Button>
          </form>
          
          <div className="text-center text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-lg p-3">
            Already have an account?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-800 font-bold">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
