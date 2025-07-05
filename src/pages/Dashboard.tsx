import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Activity, 
  Heart, 
  AlertCircle,
  Pill,
  TrendingUp,
  Users,
  Settings,
  Stethoscope,
  MessageSquare,
  Library,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import TodaysMedications from '@/components/TodaysMedications';
import UpcomingMedications from '@/components/UpcomingMedications';
import MedicationAdherence from '@/components/MedicationAdherence';
import CaregiverManagement from '@/components/CaregiverManagement';
import { generateWeeklySchedule, checkForMissedMedications } from '@/utils/medicationScheduler';
import { initializeNotifications, sendPendingNotifications } from '@/utils/notificationService';

interface DashboardStats {
  totalMedications: number;
  todaysTaken: number;
  todaysTotal: number;
  weeklyAdherence: number;
  missedThisWeek: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalMedications: 0,
    todaysTaken: 0,
    todaysTotal: 0,
    weeklyAdherence: 0,
    missedThisWeek: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCaregivers, setShowCaregivers] = useState(false);

  useEffect(() => {
    if (user) {
      initializeDashboard();
      const interval = setInterval(() => {
        checkForMissedMedications(user.id);
        sendPendingNotifications();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const initializeDashboard = async () => {
    try {
      // Initialize notifications
      await initializeNotifications();
      
      // Generate weekly medication schedule
      if (user?.id) {
        await generateWeeklySchedule(user.id);
        await checkForMissedMedications(user.id);
      }
      
      // Fetch dashboard stats
      await fetchDashboardStats();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      if (!user?.id) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekStart = startOfWeek(today);
      const weekEnd = endOfWeek(today);

      // Get total active medications
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      // Get today's medication logs
      const { data: todayLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .neq('status', 'archived');

      // Get this week's logs for adherence calculation - Fixed table name
      const { data: weekLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', weekStart.toISOString())
        .lte('scheduled_time', weekEnd.toISOString())
        .neq('status', 'archived');

      const todaysTaken = todayLogs?.filter(log => log.status === 'taken').length || 0;
      const todaysTotal = todayLogs?.length || 0;
      
      const weeklyTaken = weekLogs?.filter(log => log.status === 'taken').length || 0;
      const weeklyTotal = weekLogs?.length || 0;
      const weeklyAdherence = weeklyTotal > 0 ? Math.round((weeklyTaken / weeklyTotal) * 100) : 0;
      
      const missedThisWeek = weekLogs?.filter(log => log.status === 'missed').length || 0;

      setStats({
        totalMedications: medications?.length || 0,
        todaysTaken,
        todaysTotal,
        weeklyAdherence,
        missedThisWeek
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleMedicationTaken = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                {getGreeting()}! 👋
              </h1>
              <p className="text-gray-600 text-lg bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block">
                Here's your medication overview for {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <Link to="/settings">
              <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-xl border-2 border-green-200/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-medium">Today's Progress</p>
                    <p className="text-3xl font-bold text-green-800">
                      {stats.todaysTaken}/{stats.todaysTotal}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-green-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.todaysTotal > 0 ? (stats.todaysTaken / stats.todaysTotal) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-medium">Active Medications</p>
                    <p className="text-3xl font-bold text-blue-800">{stats.totalMedications}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <Pill className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/90 to-purple-50/70 backdrop-blur-xl border-2 border-purple-200/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-medium">Weekly Adherence</p>
                    <p className="text-3xl font-bold text-purple-800">{stats.weeklyAdherence}%</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-purple-100 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.weeklyAdherence}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white/90 to-red-50/70 backdrop-blur-xl border-2 border-red-200/30 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 text-sm font-medium">Missed This Week</p>
                    <p className="text-3xl font-bold text-red-800">{stats.missedThisWeek}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Above Today's Medications */}
          <Card className="bg-gradient-to-br from-white/90 to-indigo-50/70 backdrop-blur-xl border-2 border-indigo-200/30 shadow-2xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                <Activity className="h-6 w-6 text-indigo-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link to="/add-medication">
                  <Button className="w-full h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <Plus className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Add Medication</span>
                    </div>
                  </Button>
                </Link>

                <Link to="/symptom-checker">
                  <Button className="w-full h-20 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <Stethoscope className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Symptom Checker</span>
                    </div>
                  </Button>
                </Link>

                <Link to="/medication-library">
                  <Button className="w-full h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <Library className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Med Library</span>
                    </div>
                  </Button>
                </Link>

                <Button 
                  onClick={() => setShowCaregivers(!showCaregivers)}
                  className="w-full h-20 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="text-center">
                    <UserPlus className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">Caregivers</span>
                  </div>
                </Button>

                <Link to="/contact-doctor">
                  <Button className="w-full h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-sm">Contact Doctor</span>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Caregiver Management */}
          {showCaregivers && (
            <div className="mb-8">
              <CaregiverManagement />
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Medications */}
          <TodaysMedications onMedicationTaken={handleMedicationTaken} />

          {/* Upcoming Medications */}
          <UpcomingMedications refreshTrigger={refreshTrigger} />
        </div>

        {/* Medication Adherence */}
        <div className="mb-8">
          <MedicationAdherence refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
