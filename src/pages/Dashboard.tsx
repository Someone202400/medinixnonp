
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bell, 
  Clock, 
  Heart, 
  Calendar, 
  Pill, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todaysMedications = [
    { name: "Aspirin", dose: "100mg", time: "08:00", taken: true, color: "bg-green-500" },
    { name: "Metformin", dose: "500mg", time: "12:00", taken: false, color: "bg-blue-500" },
    { name: "Lisinopril", dose: "10mg", time: "20:00", taken: false, color: "bg-purple-500" },
  ];

  const adherenceRate = 85;
  const streakDays = 12;

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
                MedCare Dashboard
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, John! 👋
          </h1>
          <p className="text-gray-600">Here's your medication overview for today</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Today's Medications</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <Pill className="h-8 w-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Adherence Rate</p>
                  <p className="text-2xl font-bold">{adherenceRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Current Streak</p>
                  <p className="text-2xl font-bold">{streakDays} days</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Next Dose</p>
                  <p className="text-2xl font-bold">12:00</p>
                </div>
                <Clock className="h-8 w-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Medications */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900">Today's Medications</CardTitle>
                <Link to="/medications">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaysMedications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${med.color}`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{med.name}</h3>
                        <p className="text-gray-600 text-sm">{med.dose} at {med.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {med.taken ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Taken
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Mark as Taken
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Adherence Progress */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{adherenceRate}%</div>
                  <p className="text-gray-600 text-sm">Adherence Rate</p>
                </div>
                <Progress value={adherenceRate} className="w-full" />
                <div className="grid grid-cols-7 gap-1 mt-4">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <div key={index} className="text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        index < 5 ? 'bg-green-500 text-white' : index === 5 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {day}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/symptom-checker">
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Symptom Checker
                  </Button>
                </Link>
                <Link to="/medication-library">
                  <Button variant="outline" className="w-full justify-start">
                    <Pill className="h-4 w-4 mr-2" />
                    Medication Library
                  </Button>
                </Link>
                <Link to="/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notification Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
