import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Smartphone, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { oneSignalService } from '@/utils/oneSignalService';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  medicationReminders: boolean;
  missedMedicationAlerts: boolean;
  adherenceReports: boolean;
  emergencyAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  criticalOverride: boolean;
}

const PushNotificationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    medicationReminders: true,
    missedMedicationAlerts: true,
    adherenceReports: false,
    emergencyAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    criticalOverride: true
  });

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      loadNotificationSettings();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const subscribed = await oneSignalService.isSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (preferences) {
        setSettings({
          medicationReminders: preferences.medication_reminders ?? true,
          missedMedicationAlerts: preferences.emergency_alerts ?? true,
          adherenceReports: preferences.adherence_reports ?? false,
          emergencyAlerts: preferences.emergency_alerts ?? true,
          quietHoursEnabled: !!(preferences.quiet_hours_start && preferences.quiet_hours_end),
          quietHoursStart: preferences.quiet_hours_start || '22:00',
          quietHoursEnd: preferences.quiet_hours_end || '07:00',
          criticalOverride: preferences.critical_override ?? true
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const success = await oneSignalService.subscribeUser(user?.id || '');
      
      if (success) {
        setIsSubscribed(true);
        
        // Save subscription to database
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user?.id,
            push_notifications_enabled: true,
            ...settings
          });

        toast({
          title: "Push Notifications Enabled! 🔔",
          description: "You'll now receive medication reminders even when the app is closed.",
        });

        // Send test notification
        await oneSignalService.testNotification();
      } else {
        toast({
          title: "Subscription Failed",
          description: "Unable to enable push notifications. Please check your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true);
      const success = await oneSignalService.unsubscribeUser();
      
      if (success) {
        setIsSubscribed(false);
        
        // Update database
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: user?.id,
            push_notifications_enabled: false
          });

        toast({
          title: "Push Notifications Disabled",
          description: "You'll no longer receive push notifications.",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      // Map UI settings to database fields
      const dbUpdate: any = {
        user_id: user?.id,
        medication_reminders: newSettings.medicationReminders,
        emergency_alerts: newSettings.emergencyAlerts,
        adherence_reports: newSettings.adherenceReports,
        critical_override: newSettings.criticalOverride,
        quiet_hours_start: newSettings.quietHoursEnabled ? newSettings.quietHoursStart : null,
        quiet_hours_end: newSettings.quietHoursEnabled ? newSettings.quietHoursEnd : null
      };

      await supabase
        .from('notification_preferences')
        .upsert(dbUpdate);

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = async () => {
    try {
      await oneSignalService.testNotification();

      toast({
        title: "Test Notification Sent! 📱",
        description: "Check your notifications to see how reminders will appear.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Main Subscription Card */}
      <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isSubscribed ? (
              <Bell className="h-6 w-6 text-green-600" />
            ) : (
              <BellOff className="h-6 w-6 text-gray-400" />
            )}
            Push Notifications
            <Badge className={`ml-2 ${isSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {isSubscribed ? 'Active' : 'Disabled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Smart Medication Reminders</h3>
              <p className="text-gray-600 mb-4">
                Get notifications exactly when your medications are due, even when the app is closed. 
                Includes action buttons to quickly mark medications as taken, snooze, or skip.
              </p>
              
              {!isSubscribed ? (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {isLoading ? 'Setting up...' : 'Enable Push Notifications'}
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    onClick={sendTestNotification}
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Send Test Notification
                  </Button>
                  <Button 
                    onClick={handleUnsubscribe}
                    variant="destructive"
                    size="sm"
                  >
                    Disable Notifications
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {isSubscribed && (
        <Card className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-xl border-2 border-green-200/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-green-800">
              <Clock className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Types */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Notification Types</h4>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <div className="font-medium text-gray-800">Medication Reminders</div>
                  <div className="text-sm text-gray-600">Get notified exactly when medications are due</div>
                </div>
                <Switch
                  checked={settings.medicationReminders}
                  onCheckedChange={(value) => updateSetting('medicationReminders', value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Missed Medication Alerts
                  </div>
                  <div className="text-sm text-gray-600">Alert when medications are 15+ minutes overdue</div>
                </div>
                <Switch
                  checked={settings.missedMedicationAlerts}
                  onCheckedChange={(value) => updateSetting('missedMedicationAlerts', value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <div className="font-medium text-gray-800">Weekly Adherence Reports</div>
                  <div className="text-sm text-gray-600">Summary of your medication adherence</div>
                </div>
                <Switch
                  checked={settings.adherenceReports}
                  onCheckedChange={(value) => updateSetting('adherenceReports', value)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <div className="font-medium text-gray-800">Emergency Alerts</div>
                  <div className="text-sm text-gray-600">Critical medication reminders (heart meds, insulin)</div>
                </div>
                <Switch
                  checked={settings.emergencyAlerts}
                  onCheckedChange={(value) => updateSetting('emergencyAlerts', value)}
                />
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-700">Quiet Hours</h4>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-gray-800">Enable Quiet Hours</div>
                  <div className="text-sm text-gray-600">No notifications during sleep hours</div>
                </div>
                <Switch
                  checked={settings.quietHoursEnabled}
                  onCheckedChange={(value) => updateSetting('quietHoursEnabled', value)}
                />
              </div>

              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                    <input
                      type="time"
                      value={settings.quietHoursStart}
                      onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
                    <input
                      type="time"
                      value={settings.quietHoursEnd}
                      onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {settings.quietHoursEnabled && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-gray-800">Critical Override</div>
                    <div className="text-sm text-gray-600">Allow emergency alerts during quiet hours</div>
                  </div>
                  <Switch
                    checked={settings.criticalOverride}
                    onCheckedChange={(value) => updateSetting('criticalOverride', value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA Installation Prompt */}
      <Card className="bg-gradient-to-br from-white/90 to-purple-50/70 backdrop-blur-xl border-2 border-purple-200/30 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-purple-800">
            <Smartphone className="h-5 w-5" />
            Install as App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">Add to Home Screen</h3>
              <p className="text-gray-600 mb-4">
                Install MedCare as a mobile app for the best experience. Works offline and feels like a native app!
              </p>
              <div className="text-sm text-gray-500">
                <p>• Faster loading and better performance</p>
                <p>• Works offline for viewing medication schedules</p>
                <p>• Home screen shortcut with app icon</p>
                <p>• Full-screen experience without browser UI</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PushNotificationManager;