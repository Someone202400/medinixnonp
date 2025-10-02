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
import EnhancedTodaysMedications from '@/components/EnhancedTodaysMedications';
import UpcomingMedications from '@/components/UpcomingMedications';
import SimpleMedicationAdherence from '@/components/SimpleMedicationAdherence';
import PerfectPushNotifications from '@/components/PerfectPushNotifications';
import { OneSignalProvider } from '@/components/OneSignalProvider';
import { startNotificationServices, stopNotificationServices } from '@/utils/notificationService';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [adherenceRefreshTrigger, setAdherenceRefreshTrigger] = useState(0);

  useEffect(() => {
    const initializeUserData = async () => {
      if (user?.id) {
        // Import here to avoid circular dependencies
        const { ensureMedicationDataExists, createSampleMedicationData } = await import('@/utils/medicationDataGenerator');
        
        // Check if user has medications, if not create sample data
        try {
          const { data: medications } = await supabase
            .from('medications')
            .select('*')
            .eq('user_id', user.id)
            .eq('active', true);

          if (!medications || medications.length === 0) {
            console.log('No medications found, creating sample data');
            await createSampleMedicationData(user.id);
          } else {
            console.log('Medications found, ensuring current data exists');
            await ensureMedicationDataExists(user.id);
          }
        } catch (error) {
          console.error('Error initializing user data:', error);
          // Still try to create sample data as fallback
          const { createSampleMedicationData } = await import('@/utils/medicationDataGenerator');
          await createSampleMedicationData(user.id);
        }
        
        // Trigger refresh for all components
        setAdherenceRefreshTrigger(prev => prev + 1);
      }
    };

    initializeUserData();
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
      variant: 'success',
      action: () => navigate('/add-medication')
    },
    {
      title: 'Symptom Checker',
      description: 'AI-powered health assessment',
      icon: Stethoscope,
      variant: 'primary',
      action: () => navigate('/symptom-checker')
    },
    {
      title: 'Medication Library',
      description: 'Browse medication information',
      icon: BookOpen,
      variant: 'accent',
      action: () => navigate('/medication-library')
    },
    {
      title: 'Contact Doctor',
      description: 'Get in touch with healthcare providers',
      icon: MessageCircle,
      variant: 'warning',
      action: () => navigate('/contact-doctor')
    },
  ];

  return (
    <OneSignalProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20 md:pb-0 touch-manipulation">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-md border-b border-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    MedCare Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground hidden md:block">Welcome back, {user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4"
                  size="sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="text-destructive border-destructive/20 hover:bg-destructive/10 text-xs md:text-sm px-2 md:px-4"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left Column - Today's Medications */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              <EnhancedTodaysMedications onMedicationTaken={handleMedicationTaken} />
              <UpcomingMedications />
            </div>

            {/* Right Column - Adherence & Quick Actions */}
            <div className="space-y-4 md:space-y-8">
              <SimpleMedicationAdherence refreshTrigger={adherenceRefreshTrigger} />
              
              {/* Perfect Push Notifications */}
              <PerfectPushNotifications />
              
              {/* Quick Actions */}
              <Card className="bg-card/90 backdrop-blur-xl border-2 border-primary/30 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    <Calendar className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`group p-3 md:p-6 rounded-xl md:rounded-2xl hover:shadow-2xl transition-all duration-300 text-left transform hover:scale-105 hover:-translate-y-1 ${
                        action.variant === 'success' ? 'bg-gradient-to-br from-success/20 to-success/10 border border-success/30' :
                        action.variant === 'primary' ? 'bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30' :
                        action.variant === 'accent' ? 'bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30' :
                        'bg-gradient-to-br from-warning/20 to-warning/10 border border-warning/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className={`w-10 h-10 md:w-14 md:h-14 backdrop-blur-sm rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ${
                          action.variant === 'success' ? 'bg-success/20' :
                          action.variant === 'primary' ? 'bg-primary/20' :
                          action.variant === 'accent' ? 'bg-accent/20' :
                          'bg-warning/20'
                        }`}>
                          <action.icon className={`h-5 w-5 md:h-7 md:w-7 drop-shadow-lg ${
                            action.variant === 'success' ? 'text-success' :
                            action.variant === 'primary' ? 'text-primary' :
                            action.variant === 'accent' ? 'text-accent' :
                            'text-warning'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-sm md:text-lg mb-1 transition-colors ${
                            action.variant === 'success' ? 'text-success group-hover:text-success/80' :
                            action.variant === 'primary' ? 'text-primary group-hover:text-primary/80' :
                            action.variant === 'accent' ? 'text-accent group-hover:text-accent/80' :
                            'text-warning group-hover:text-warning/80'
                          }`}>
                            {action.title}
                          </h3>
                          <p className={`text-xs md:text-sm leading-relaxed transition-colors hidden md:block ${
                            action.variant === 'success' ? 'text-success/70 group-hover:text-success/60' :
                            action.variant === 'primary' ? 'text-primary/70 group-hover:text-primary/60' :
                            action.variant === 'accent' ? 'text-accent/70 group-hover:text-accent/60' :
                            'text-warning/70 group-hover:text-warning/60'
                          }`}>
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* System Status - Hidden on mobile */}
              <div className="hidden md:block">
                <Card className="bg-card/90 backdrop-blur-xl border-2 border-border shadow-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                      <TestTube className="h-5 w-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Notifications</span>
                      <Badge className="bg-success/20 text-success">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reminders</span>
                      <Badge className="bg-success/20 text-success">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

        </div>
      </div>
    </OneSignalProvider>
  );
};

export default Dashboard;
