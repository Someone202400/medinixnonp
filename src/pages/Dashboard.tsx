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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600 mt-2">Here's your health overview for today</p>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Pill className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Today's Progress</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {hasData ? "2/3" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {hasData ? "85%" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-400">
                    {hasData ? "92%" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Dose</p>
                  <p className="text-lg font-bold text-gray-400">
                    {hasData ? "8:00 PM" : "No data yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Medications */}
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Today's Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasData ? (
                <div>Medication data will appear here</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No medications added yet</p>
                  <p className="text-sm">Add your first medication to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adherence Progress */}
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Adherence Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasData ? (
                <div>Progress data will appear here</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No data yet</p>
                  <p className="text-sm">Start tracking medications to see your progress</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reminders */}
          <Card className="bg-white/80 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasData ? (
                <div>Reminders will appear here</div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reminders yet</p>
                  <p className="text-sm">Add medications to set up reminders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link to="/symptom-checker">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Stethoscope className="h-6 w-6" />
                  <span className="text-sm">Symptom Checker</span>
                </Button>
              </Link>
              <Link to="/medication-library">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Book className="h-6 w-6" />
                  <span className="text-sm">Medication Library</span>
                </Button>
              </Link>
              <Link to="/add-medication">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span className="text-sm">Add Medication</span>
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <MessageCircle className="h-6 w-6" />
                <span className="text-sm">Contact Doctor</span>
              </Button>
              <Link to="/settings">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                  <SettingsIcon className="h-6 w-6" />
                  <span className="text-sm">Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Caregiver Management */}
        <CaregiverManagement />
      </div>
    </div>
  );
};

export default Dashboard;
