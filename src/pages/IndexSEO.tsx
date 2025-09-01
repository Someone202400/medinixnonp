import { ArrowRight, Bell, Shield, Users, Calendar, Smartphone, CheckCircle, Heart, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PWAInstallPrompt />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Free Medication Reminder App - Never Miss Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Medications
              </span>{" "}
              Again
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Free nonprofit medication reminder app with push notifications. Track medication adherence, get smart reminders exactly when needed, and improve your health outcomes with our student-built technology. Perfect for seniors, chronic illness patients, and anyone who wants reliable medication management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                Start Free Medication Tracking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                size="lg"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg"
              >
                Sign In to Your Medications
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <main>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Smart Medication Management for Better Health
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              Get push notifications exactly when it's time to take your medications. Our free medication reminder app helps you maintain perfect medication adherence with smart notifications, tracking, and health management tools. Designed by students for everyone who needs reliable medication management.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Track Your Medication Adherence
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-4xl mx-auto mb-12">
            Monitor how well you're taking your medications with detailed adherence tracking. See your medication history, identify patterns, and improve your health outcomes with data-driven insights. Our nonprofit technology helps patients achieve better health through consistent medication management.
          </p>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Advanced Health Features
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-4xl mx-auto mb-12">
            Access our comprehensive medication library, AI-powered symptom checker, and direct doctor communication tools. Everything you need to manage your medications and health in one free, student-built app. No subscriptions, no hidden costs - just better health outcomes.
          </p>
        </section>

        <section className="bg-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Why Choose Medinix for Medication Management
            </h2>
            <p className="text-lg text-gray-600 text-center max-w-4xl mx-auto mb-12">
              Built by students who understand the challenges of medication adherence. Our free medication reminder app combines push notification technology with comprehensive health tracking. Perfect for seniors, chronic illness patients, busy professionals, and anyone who wants to improve their medication compliance and overall health.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Bell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Medication Reminders That Work</h3>
                  <p className="text-gray-600">
                    Push notifications sent exactly when it's time to take your medications. Never miss a dose with our reliable reminder system.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Medication Adherence Tracking</h3>
                  <p className="text-gray-600">
                    Track your medication compliance with detailed statistics and visual charts. Improve your health outcomes.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Free Health Management</h3>
                  <p className="text-gray-600">
                    Completely free nonprofit service. No subscriptions, no hidden fees. Just reliable medication management.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Medication Management
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive medication management tools designed to help you maintain perfect medication adherence and achieve better health outcomes through consistent medication tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Push Notification Reminders</h3>
                <p className="text-gray-600 leading-relaxed">
                  Smart medication reminders sent exactly when it's time to take your medications. Push notifications work even when your phone is closed, ensuring you never miss a dose.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Medication Adherence Tracking</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your medication compliance with detailed statistics, visual adherence charts, and medication history. Identify patterns to improve your health outcomes.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Free Nonprofit Service</h3>
                <p className="text-gray-600 leading-relaxed">
                  Completely free medication reminder app built by students. No subscriptions, no hidden fees, no premium tiers - just reliable medication management for everyone.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Medication Schedule Management</h3>
                <p className="text-gray-600 leading-relaxed">
                  Easily manage complex medication schedules with multiple daily doses. Perfect for chronic illness management and prescription medication tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile-First Design</h3>
                <p className="text-gray-600 leading-relaxed">
                  Progressive Web App that works perfectly on mobile devices. Install to your home screen for instant access to your medication schedule.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Medication Library & Symptom Checker</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access comprehensive medication information and AI-powered symptom checking to support your health management journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Free Medication Management in Georgia
          </h2>
          <p className="text-lg text-gray-600 text-center max-w-4xl mx-auto">
            Serving patients throughout Georgia with free, student-built medication reminder technology. Helping improve medication adherence and health outcomes in Atlanta, Savannah, Columbus, and communities statewide. Our nonprofit mission ensures everyone has access to reliable health management tools.
          </p>
        </section>
      </main>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Never Miss Your Medications Again?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands who trust Medinix for reliable medication management. Free forever, no hidden costs.
          </p>
          <Button 
            onClick={() => navigate('/register')}
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
          >
            Start Your Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;