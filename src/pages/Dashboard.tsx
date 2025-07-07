import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Pill, 
  Calendar, 
  TrendingUp, 
  MessageCircle, 
  Settings, 
  Users, 
  Stethoscope,
  TestTube,
  BookOpen,
  Plus
} from 'lucide-react';
import TodaysMedications from '@/components/TodaysMedications';
import UpcomingMedications from '@/components/UpcomingMedications';
import MedicationAdherence from '@/components/MedicationAdherence';
import { startNotificationServices, stopNotificationServices } from '@/utils/notificationService';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [adherenceRefreshTrigger, setAdherenceRefreshTrigger] = useState(0);
  const [caregiverCount, setCaregiverCount] = useState(0);

  // Start notification services when dashboard loads
  useEffect(() => {
    startNotificationServices();
    fetchCaregiverCount();
    
    return () => {
      stopNotificationServices();
    };
  }, [user]);

  const fetchCaregiverCount = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('caregivers')
        .select('id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setCaregiverCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching caregiver count:', error);
    }
  };

  const handleMedicationTaken = () => {
    // Trigger adherence refresh when medication is taken
    setAdherenceRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const quickActions = [
    {
      title: 'Add Medication',
      description: 'Add a new medication to your schedule',
      icon: Plus,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/add-medication')
    },
    {
      title: 'Symptom Checker',
      description: 'AI-powered health assessment',
      icon: Stethoscope,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/symptom-checker')
    },
    {
      title: 'Medication Library',
      description: 'Browse medication information',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/medication-library')
    },
    {
      title: 'Contact Doctor',
      description: 'Get in touch with healthcare providers',
      icon: MessageCircle,
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/contact-doctor')
    },
    {
      title: 'Manage Caregivers',
      description: 'Add and manage your caregivers',
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MedCare Dashboard
                </h1>
                <p className="text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Medications */}
          <div className="lg:col-span-2 space-y-8">
            <TodaysMedications onMedicationTaken={handleMedicationTaken} />
            <UpcomingMedications />
          </div>

          {/* Right Column - Adherence & Quick Actions */}
          <div className="space-y-8">
            <MedicationAdherence refreshTrigger={adherenceRefreshTrigger} />
            
            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-white/90 to-indigo-50/70 backdrop-blur-xl border-2 border-indigo-200/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="p-4 rounded-xl bg-gradient-to-r hover:shadow-lg transition-all duration-200 text-left group"
                    style={{
                      background: `linear-gradient(135deg, ${action.color.split(' ')[1]}, ${action.color.split(' ')[3]})`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{action.title}</h3>
                        <p className="text-white/80 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-gradient-to-br from-white/90 to-gray-50/70 backdrop-blur-xl border-2 border-gray-200/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-700">
                  <TestTube className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notifications</span>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reminders</span>
                  <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Caregivers</span>
                  <Badge className="bg-blue-100 text-blue-700">
                    {caregiverCount} Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
