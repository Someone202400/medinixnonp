
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
import { useToast } from '@/hooks/use-toast';
import UpcomingMedications from '@/components/UpcomingMedications';
import MedicationAdherence from '@/components/MedicationAdherence';
import CaregiverManagement from '@/components/CaregiverManagement';
import { generateDailyMedicationSchedule } from '@/utils/medicationScheduler';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<any[]>([]);
  const [todaysMeds, setTodaysMeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      initializeDashboard();
      
      // Set up real-time subscription to refresh data when medications are added
      const channel = supabase
        .channel('medications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Medications changed, refreshing...');
            initializeDashboard();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medication_logs',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Medication logs changed, refreshing...');
            fetchTodaysMedications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const initializeDashboard = async () => {
    try {
      await fetchMedications();
      await generateTodaysSchedule();
      await fetchTodaysMedications();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true);

      if (error) throw error;
      
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const generateTodaysSchedule = async () => {
    try {
      if (user?.id) {
        await generateDailyMedicationSchedule(user.id);
      }
    } catch (error) {
      console.error('Error generating today\'s schedule:', error);
    }
  };

  const fetchTodaysMedications = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get today's medication logs
      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          medications (name, dosage)
        `)
        .eq('user_id', user?.id)
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      setTodaysMeds(logs || []);
    } catch (error) {
      console.error('Error fetching today\'s medications:', error);
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
                  <p className="text-3xl font-bold">{todaysMeds.length || 0}</p>
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
                    {todaysMeds.length > 0 ? Math.round((todaysMeds.filter(med => med.status === 'taken').length / todaysMeds.length) * 100) + "%" : "0%"}
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

        {/* Quick Actions */}
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
              {todaysMeds.length > 0 ? (
                <div className="space-y-4">
                  {todaysMeds.slice(0, 5).map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{log.medications?.name}</h3>
                          <p className="text-sm text-gray-600">{log.medications?.dosage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {new Date(log.scheduled_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <Badge 
                          variant={log.status === 'taken' ? 'default' : log.status === 'missed' ? 'destructive' : 'outline'}
                          className={
                            log.status === 'taken' 
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : log.status === 'missed'
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          }
                        >
                          {log.status === 'taken' ? 'Taken' : log.status === 'missed' ? 'Missed' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {todaysMeds.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {todaysMeds.length - 5} more doses scheduled for today
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No medications scheduled for today</p>
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

          {/* Right Column: Upcoming Medications, Medication Adherence, and Caregiver Management */}
          <div className="space-y-6">
            {/* Upcoming Medications */}
            <UpcomingMedications />

            {/* Medication Adherence */}
            <MedicationAdherence />

            {/* Caregiver Management */}
            <div className="bg-gradient-to-br from-white/90 to-orange-50/70 backdrop-blur-xl border-2 border-orange-200/30 shadow-2xl rounded-lg">
              <CaregiverManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
