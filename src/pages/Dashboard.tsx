
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Pill, TrendingUp, Users, MessageCircle, Stethoscope, Book, Settings as SettingsIcon, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import CaregiverManagement from "@/components/CaregiverManagement";

const Dashboard = () => {
  const { user } = useAuth();

  // For now, showing "No data yet" until real medication data is integrated
  const hasData = false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Here's your health overview for today</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                  <Pill className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Today's Progress</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {hasData ? "2/3" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">This Week</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {hasData ? "85%" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">This Month</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {hasData ? "92%" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Next Dose</p>
                  <p className="text-lg font-bold text-gray-800">
                    {hasData ? "8:00 PM" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Moved above Today's Medications */}
        <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="text-indigo-700 text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Link to="/symptom-checker">
                <Button variant="outline" className="w-full h-28 flex flex-col gap-3 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                  <Stethoscope className="h-7 w-7 text-indigo-600" />
                  <span className="text-sm font-medium">Symptom Checker</span>
                </Button>
              </Link>
              <Link to="/medication-library">
                <Button variant="outline" className="w-full h-28 flex flex-col gap-3 hover:bg-green-50 hover:border-green-200 transition-colors">
                  <Book className="h-7 w-7 text-green-600" />
                  <span className="text-sm font-medium">Medication Library</span>
                </Button>
              </Link>
              <Link to="/add-medication">
                <Button variant="outline" className="w-full h-28 flex flex-col gap-3 hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Plus className="h-7 w-7 text-purple-600" />
                  <span className="text-sm font-medium">Add Medication</span>
                </Button>
              </Link>
              <Link to="/contact-doctor">
                <Button variant="outline" className="w-full h-28 flex flex-col gap-3 hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <MessageCircle className="h-7 w-7 text-blue-600" />
                  <span className="text-sm font-medium">Contact Doctor</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" className="w-full h-28 flex flex-col gap-3 hover:bg-gray-50 hover:border-gray-200 transition-colors">
                  <SettingsIcon className="h-7 w-7 text-gray-600" />
                  <span className="text-sm font-medium">Settings</span>
                </Button>
              </Link>
              <div className="flex items-center justify-center">
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600 font-semibold text-sm">Emergency?</p>
                  <p className="text-red-800 font-bold text-lg">Call 911</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Medications */}
          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Pill className="h-5 w-5" />
                Today's Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasData ? (
                <div>Medication data will appear here</div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No data yet</p>
                  <p className="text-sm">Add your first medication to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adherence Progress */}
          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <TrendingUp className="h-5 w-5" />
                Adherence Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasData ? (
                <div>Progress data will appear here</div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No data yet</p>
                  <p className="text-sm">Start tracking medications to see your progress</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card className="bg-white/90 backdrop-blur-md border-white/30 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Clock className="h-5 w-5" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasData ? (
                <div>Reminders will appear here</div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No data yet</p>
                  <p className="text-sm">Add medications to set up reminders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Caregiver Management */}
        <CaregiverManagement />
      </div>
    </div>
  );
};

export default Dashboard;
