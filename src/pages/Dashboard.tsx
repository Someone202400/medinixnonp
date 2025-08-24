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

  // Start notification services when dashboard loads
  useEffect(() => {
    startNotificationServices();
    
    return () => {
      stopNotificationServices();
    };
  }, [user]);

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
      gradientStart: 'green-700',
      gradientEnd: 'green-400',
      titleFontColor: 'text-green-900',
      titleFontColorHover: 'text-green-800',
      descriptionFontColor: 'text-green-800/90',
      descriptionFontColorHover: 'text-green-800/80',
      iconBackground: 'bg-green-100/50',
      action: () => navigate('/add-medication')
    },
    {
      title: 'Symptom Checker',
      description: 'AI-powered health assessment',
      icon: Stethoscope,
      gradientStart: 'blue-700',
      gradientEnd: 'blue-400',
      titleFontColor: 'text-blue-900',
      titleFontColorHover: 'text-blue-800',
      descriptionFontColor: 'text-blue-800/90',
      descriptionFontColorHover: 'text-blue-800/80',
      iconBackground: 'bg-blue-100/50',
      action: () => navigate('/symptom-checker')
    },
    {
      title: 'Medication Library',
      description: 'Browse medication information',
      icon: BookOpen,
      gradientStart: 'purple-600',
      gradientEnd: 'purple-400',
      titleFontColor: 'text-purple-900',
      titleFontColorHover: 'text-purple-800',
      descriptionFontColor: 'text-purple-800/90',
      descriptionFontColorHover: 'text-purple-800/80',
      iconBackground: 'bg-purple-100/50',
      action: () => navigate('/medication-library')
    },
    {
      title: 'Contact Doctor',
      description: 'Get in touch with healthcare providers',
      icon: MessageCircle,
      gradientStart: 'orange-600',
      gradientEnd: 'orange-400',
      titleFontColor: 'text-orange-900',
      titleFontColorHover: 'text-orange-800',
      descriptionFontColor: 'text-orange-800/90',
      descriptionFontColorHover: 'text-orange-800/80',
      iconBackground: 'bg-orange-100/50',
      action: () => navigate('/contact-doctor')
    },
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
                    className="group p-6 rounded-2xl bg-gradient-to-b hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1"
                    style={{
                      background: `linear-gradient(180deg, ${action.gradientStart}, ${action.gradientEnd}) !important`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 ${action.iconBackground} backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                        <action.icon className={`h-7 w-7 ${action.titleFontColor} group-hover:${action.titleFontColorHover} drop-shadow-lg`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-1 transition-colors ${action.titleFontColor} group-hover:${action.titleFontColorHover}`}>
                          {action.title}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${action.descriptionFontColor} group-hover:${action.descriptionFontColorHover}`}>
                          {action.description}
                        </p>
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
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
