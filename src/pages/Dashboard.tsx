
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Pill, TrendingUp, Users, MessageCircle, Stethoscope, Book } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import CaregiverManagement from "@/components/CaregiverManagement";

const Dashboard = () => {
  const { user } = useAuth();

  const todaysMedications = [
    { name: "Metformin", time: "8:00 AM", taken: true, dosage: "500mg" },
    { name: "Lisinopril", time: "8:00 AM", taken: true, dosage: "10mg" },
    { name: "Atorvastatin", time: "8:00 PM", taken: false, dosage: "20mg" },
  ];

  const adherenceData = {
    thisWeek: 85,
    thisMonth: 92,
    overall: 88
  };

  const upcomingReminders = [
    { medication: "Atorvastatin", time: "8:00 PM", today: true },
    { medication: "Metformin", time: "8:00 AM", today: false, date: "Tomorrow" },
    { medication: "Lisinopril", time: "8:00 AM", today: false, date: "Tomorrow" },
  ];

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
                  <p className="text-2xl font-bold text-green-600">2/3</p>
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
                  <p className="text-2xl font-bold text-blue-600">{adherenceData.thisWeek}%</p>
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
                  <p className="text-2xl font-bold text-purple-600">{adherenceData.thisMonth}%</p>
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
                  <p className="text-lg font-bold text-orange-600">8:00 PM</p>
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
              {todaysMedications.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{med.name}</h3>
                      <Badge variant={med.taken ? "default" : "secondary"}>
                        {med.taken ? "Taken" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{med.dosage} at {med.time}</p>
                  </div>
                  {!med.taken && (
                    <Button size="sm">Mark Taken</Button>
                  )}
                </div>
              ))}
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
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">This Week</span>
                  <span className="text-sm font-medium">{adherenceData.thisWeek}%</span>
                </div>
                <Progress value={adherenceData.thisWeek} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">This Month</span>
                  <span className="text-sm font-medium">{adherenceData.thisMonth}%</span>
                </div>
                <Progress value={adherenceData.thisMonth} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Overall</span>
                  <span className="text-sm font-medium">{adherenceData.overall}%</span>
                </div>
                <Progress value={adherenceData.overall} className="h-2" />
              </div>
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
              {upcomingReminders.map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{reminder.medication}</h3>
                    <p className="text-sm text-gray-600">
                      {reminder.today ? 'Today' : reminder.date} at {reminder.time}
                    </p>
                  </div>
                  <Badge variant={reminder.today ? "default" : "outline"}>
                    {reminder.today ? "Today" : "Upcoming"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Add Medication</span>
              </Button>
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <MessageCircle className="h-6 w-6" />
                <span className="text-sm">Contact Doctor</span>
              </Button>
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
