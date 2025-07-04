import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Bell, 
  TrendingUp, 
  Shield, 
  Smartphone, 
  Clock,
  CheckCircle,
  Pill,
  Calendar,
  AlertTriangle,
  Home,
  User,
  Menu
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MedCare
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                FREE
              </Badge>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="flex items-center space-x-2 text-blue-600 font-medium">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
              <Link to="/" className="flex items-center space-x-2 text-blue-600 font-medium px-2 py-1">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link to="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1">
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <div className="px-2 py-1 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Your Complete Medication Companion
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Manage your medications, track your health, and stay on top of your well-being.
          </p>
          <div className="space-x-4">
            <Link to="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <span>Smart Reminders</span>
                </CardTitle>
                <CardDescription>
                  Get notified when it's time to take your medications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Customizable reminders ensure you never miss a dose.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Adherence Tracking</span>
                </CardTitle>
                <CardDescription>
                  Track your medication adherence over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Visualize your progress and stay motivated.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <span>Symptom Checker</span>
                </CardTitle>
                <CardDescription>
                  Identify potential side effects and interactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Make informed decisions about your health.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <span>Mobile Access</span>
                </CardTitle>
                <CardDescription>
                  Access your medication information on the go.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Available on iOS and Android devices.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-red-500" />
                  <span>Dose Reminders</span>
                </CardTitle>
                <CardDescription>
                  Never miss a dose with timely reminders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Stay on track with your medication schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span>Progress Tracking</span>
                </CardTitle>
                <CardDescription>
                  Monitor your medication adherence and health progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  See how well you're managing your medications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover-scale">
              <CardContent>
                <div className="mb-4">
                  <Pill className="h-6 w-6 text-blue-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    "MedCare has been a lifesaver for me. I used to forget my medications all the time, but now I never miss a dose!"
                  </p>
                </div>
                <CardTitle>Sarah J.</CardTitle>
                <CardDescription>Patient</CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardContent>
                <div className="mb-4">
                  <Calendar className="h-6 w-6 text-green-500 mb-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    "I love how easy it is to track my medication adherence with MedCare. It helps me stay motivated and on track."
                  </p>
                </div>
                <CardTitle>Michael K.</CardTitle>
                <CardDescription>Patient</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gray-50 dark:bg-gray-900 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join MedCare today and start managing your medications with ease.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
