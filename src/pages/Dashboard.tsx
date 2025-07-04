
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Pill,
  User,
  TrendingUp,
  Bell,
  Phone,
  Settings,
  Stethoscope,
  BookOpen,
  Plus,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [upcomingMeds, setUpcomingMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true);

      if (error) throw error;
      
      setMedications(data || []);
      
      // Mock upcoming medications for demo - replace with real logic
      const upcoming = (data || []).slice(0, 3).map(med => ({
        ...med,
        nextDose: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
      
      setUpcomingMeds(upcoming);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Add Medication",
      icon: Plus,
      link: "/add-medication",
      gradient: "from-emerald-400 to-cyan-400",
      hoverGradient: "hover:from-emerald-500 hover:to-cyan-500"
    },
    {
      title: "Symptom Checker",
      icon: Stethoscope,
      link: "/symptom-checker",
      gradient: "from-blue-400 to-purple-400",
      hoverGradient: "hover:from-blue-500 hover:to-purple-500"
    },
    {
      title: "Medication Library",
      icon: BookOpen,
      link: "/medication-library",
      gradient: "from-purple-400 to-pink-400",
      hoverGradient: "hover:from-purple-500 hover:to-pink-500"
    },
    {
      title: "Contact Doctor",
      icon: Phone,
      link: "/contact-doctor",
      gradient: "from-orange-400 to-red-400",
      hoverGradient: "hover:from-orange-500 hover:to-red-500"
    },
    {
      title: "Settings",
      icon: Settings,
      link: "/settings",
      gradient: "from-gray-400 to-slate-400",
      hoverGradient: "hover:from-gray-500 hover:to-slate-500"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 text-xl bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block">
            Here's your health overview for today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Active Medications</p>
                  <p className="text-3xl font-bold">{medications.length || 0}</p>
                </div>
                <Pill className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100">Doses Today</p>
                  <p className="text-3xl font-bold">{upcomingMeds.length || 0}</p>
                </div>
                <Clock className="h-10 w-10 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Adherence Rate</p>
                  <p className="text-3xl font-bold">
                    {medications.length > 0 ? "95%" : "0%"}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Health Score</p>
                  <p className="text-3xl font-bold">
                    {medications.length > 0 ? "Good" : "N/A"}
                  </p>
                </div>
                <Activity className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Moved above Today's Medications */}
        <Card className="mb-8 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl border-2 border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              <Bell className="h-6 w-6 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} to={action.link}>
                    <Button
                      variant="outline"
                      className={`h-20 w-full flex flex-col items-center gap-2 bg-gradient-to-br ${action.gradient} ${action.hoverGradient} text-white border-0 shadow-lg transform hover:scale-110 transition-all duration-300 hover:shadow-xl`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-bold">{action.title}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Medications */}
          <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <Calendar className="h-6 w-6 text-blue-600" />
                Today's Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMeds.length > 0 ? (
                <div className="space-y-4">
                  {upcomingMeds.map((med, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{med.name}</h3>
                          <p className="text-sm text-gray-600">{med.dosage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{med.nextDose}</p>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Upcoming
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No data yet</p>
                  <p className="text-gray-400">Add your first medication to get started</p>
                  <Link to="/add-medication">
                    <Button className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      Add Medication
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Insights */}
          <Card className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-xl border-2 border-emerald-200/30 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
                Health Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medications.length > 0 ? (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">✅ Great Adherence!</h3>
                    <p className="text-green-700">You're maintaining excellent medication compliance</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-2">📊 Weekly Progress</h3>
                    <p className="text-blue-700">Track your medication patterns and health trends</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                    <h3 className="font-semibold text-purple-800 mb-2">💡 Recommendations</h3>
                    <p className="text-purple-700">Consider setting up pill organizers for easier management</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No data yet</p>
                  <p className="text-gray-400">Health insights will appear once you start tracking medications</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
