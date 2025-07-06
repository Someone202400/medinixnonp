import React, { useState, useEffect } from 'react';
import TodaysMedications from '@/components/TodaysMedications';
import UpcomingMedications from '@/components/UpcomingMedications';
import MedicationAdherence from '@/components/MedicationAdherence';
import CaregiverManagement from '@/components/CaregiverManagement';
import SystemTest from '@/components/SystemTest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWeeklySchedule, checkForMissedMedications } from '@/utils/medicationScheduler';
import { sendPendingNotifications } from '@/utils/notificationService';
import { 
  Calendar, 
  Plus, 
  Pill, 
  Clock, 
  User, 
  Settings, 
  TrendingUp,
  Bell,
  TestTube,
  RefreshCw,
  Activity,
  Stethoscope,
  Search,
  BookOpen,
  Users,
  MessageCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalMedications: 0,
    todaysPending: 0,
    todaysCompleted: 0,
    missedThisWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medications');

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
      initializeUserSchedule();
      
      // Set up periodic checks
      const interval = setInterval(async () => {
        await checkForMissedMedications(user.id);
        await sendPendingNotifications();
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Get total active medications
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true);

      // Get today's medication logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todaysLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .neq('status', 'archived');

      // Get missed medications this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: missedLogs } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'missed')
        .gte('scheduled_time', weekAgo.toISOString());

      setStats({
        totalMedications: medications?.length || 0,
        todaysPending: todaysLogs?.filter(log => log.status === 'pending').length || 0,
        todaysCompleted: todaysLogs?.filter(log => log.status === 'taken').length || 0,
        missedThisWeek: missedLogs?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeUserSchedule = async () => {
    try {
      if (user?.id) {
        console.log('Initializing weekly schedule for user:', user.id);
        await generateWeeklySchedule(user.id);
        toast({
          title: "Schedule Updated! 📅",
          description: "Your medication schedule has been generated for the week.",
        });
      }
    } catch (error) {
      console.error('Error initializing schedule:', error);
      toast({
        title: "Schedule Warning",
        description: "There was an issue generating your medication schedule.",
        variant: "destructive"
      });
    }
  };

  const handleMedicationTaken = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchDashboardStats();
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    try {
      await initializeUserSchedule();
      await fetchDashboardStats();
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Dashboard Refreshed! 🔄",
        description: "All data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 flex items-center justify-center">
        <Card className="p-8">
          <CardContent>
            <p className="text-center text-gray-600">Please log in to view your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-purple-100 via-blue-100 via-emerald-100 to-amber-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Welcome back! 👋
              </h1>
              <p className="text-gray-600 text-lg bg-white/60 backdrop-blur-sm rounded-lg p-3 inline-block">
                Here's your medication overview for today
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleRefreshAll}
                disabled={loading}
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link to="/add-medication">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Medication
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-semibold">Total Medications</p>
                  <p className="text-3xl font-bold text-blue-800">{stats.totalMedications}</p>
                </div>
                <Pill className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-xl border-2 border-green-200/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-semibold">Today's Pending</p>
                  <p className="text-3xl font-bold text-green-800">{stats.todaysPending}</p>
                </div>
                <Clock className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-xl border-2 border-emerald-200/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 font-semibold">Today's Completed</p>
                  <p className="text-3xl font-bold text-emerald-800">{stats.todaysCompleted}</p>
                </div>
                <Activity className="h-12 w-12 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white/90 to-red-50/70 backdrop-blur-xl border-2 border-red-200/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-semibold">Missed This Week</p>
                  <p className="text-3xl font-bold text-red-800">{stats.missedThisWeek}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <Card className="mb-8 bg-gradient-to-br from-white/90 to-purple-50/70 backdrop-blur-xl border-2 border-purple-200/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              <MessageCircle className="h-6 w-6 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Main Navigation Actions */}
              <Button 
                onClick={() => setActiveTab('medications')}
                className={`w-full h-20 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  activeTab === 'medications' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white' 
                    : 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white'
                }`}
              >
                <Pill className="h-6 w-6" />
                <span className="text-sm font-medium">Today's Medications</span>
              </Button>

              <Button 
                onClick={() => setActiveTab('upcoming')}
                className={`w-full h-20 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  activeTab === 'upcoming' 
                    ? 'bg-gradient-to-r from-green-600 to-green-800 text-white' 
                    : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white'
                }`}
              >
                <Calendar className="h-6 w-6" />
                <span className="text-sm font-medium">Upcoming</span>
              </Button>

              <Button 
                onClick={() => setActiveTab('adherence')}
                className={`w-full h-20 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  activeTab === 'adherence' 
                    ? 'bg-gradient-to-r from-orange-600 to-orange-800 text-white' 
                    : 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white'
                }`}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm font-medium">Adherence</span>
              </Button>

              <Button 
                onClick={() => setActiveTab('caregivers')}
                className={`w-full h-20 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  activeTab === 'caregivers' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white' 
                    : 'bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white'
                }`}
              >
                <Users className="h-6 w-6" />
                <span className="text-sm font-medium">Manage Caregivers</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Additional Actions */}
              <Link to="/contact-doctor">
                <Button className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white h-16 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300">
                  <Stethoscope className="h-5 w-5" />
                  <span className="text-xs font-medium">Contact Doctor</span>
                </Button>
              </Link>

              <Link to="/symptom-checker">
                <Button className="w-full bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white h-16 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300">
                  <Search className="h-5 w-5" />
                  <span className="text-xs font-medium">Symptom Checker</span>
                </Button>
              </Link>

              <Link to="/medication-library">
                <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white h-16 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-xs font-medium">Medication Library</span>
                </Button>
              </Link>

              <Button 
                onClick={() => setActiveTab('system')}
                className={`w-full h-16 flex flex-col items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-300 ${
                  activeTab === 'system' 
                    ? 'bg-gradient-to-r from-gray-600 to-gray-800 text-white' 
                    : 'bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700 text-white'
                }`}
              >
                <TestTube className="h-5 w-5" />
                <span className="text-xs font-medium">System Test</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'medications' && (
            <TodaysMedications onMedicationTaken={handleMedicationTaken} />
          )}

          {activeTab === 'upcoming' && (
            <UpcomingMedications refreshTrigger={refreshTrigger} />
          )}

          {activeTab === 'adherence' && (
            <MedicationAdherence refreshTrigger={refreshTrigger} />
          )}

          {activeTab === 'caregivers' && (
            <CaregiverManagement />
          )}

          {activeTab === 'system' && (
            <SystemTest />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
