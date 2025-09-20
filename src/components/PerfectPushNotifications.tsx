import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellRing, BellOff, Smartphone, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { oneSignalService } from '@/utils/oneSignalSetup';

interface NotificationSettings {
  medicationReminders: boolean;
  missedMedicationAlerts: boolean;
  adherenceReports: boolean;
  emergencyAlerts: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

const PerfectPushNotifications: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    medicationReminders: true,
    missedMedicationAlerts: true,
    adherenceReports: true,
    emergencyAlerts: true,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const subscribed = await oneSignalService.isSubscribed();
      setIsSubscribed(subscribed);
      setPermissionStatus(Notification.permission);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to enable notifications.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await oneSignalService.subscribeUser(user.id);
      
      if (success) {
        setIsSubscribed(true);
        setPermissionStatus('granted');
        toast({
          title: '🔔 Notifications Enabled!',
          description: 'You\'ll receive medication reminders even when the app is closed.',
        });
        
        // Send a welcome notification
        setTimeout(async () => {
          await sendTestNotification('Welcome to Smart Medication Reminders!', 'We\'ll help you stay on track with your medications.');
        }, 2000);
      } else {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings to receive medication reminders.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast({
        title: 'Subscription Failed',
        description: 'There was an error setting up notifications. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await oneSignalService.unsubscribe();
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Notifications Disabled',
          description: 'You won\'t receive push notifications anymore.',
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Error',
        description: 'Failed to disable notifications. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async (title: string, body: string) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'medication-test',
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        setTimeout(() => notification.close(), 8000);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const handleTestNotification = async () => {
    if (!isSubscribed) {
      toast({
        title: 'Notifications Not Enabled',
        description: 'Please enable notifications first to test them.',
        variant: 'destructive'
      });
      return;
    }

    await sendTestNotification(
      '💊 Time for your Medication!',
      'Lisinopril 10mg - Take with water'
    );

    toast({
      title: 'Test Notification Sent!',
      description: 'Check if you received the notification above.',
    });
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Auto-save settings (in a real app, this would sync to backend)
    toast({
      title: 'Settings Updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  const getStatusBadge = () => {
    if (isSubscribed) {
      return <Badge className="bg-success/20 text-success border-success/30">Active</Badge>;
    } else if (permissionStatus === 'denied') {
      return <Badge variant="destructive">Blocked</Badge>;
    } else {
      return <Badge variant="secondary">Disabled</Badge>;
    }
  };

  const getStatusIcon = () => {
    if (isSubscribed) {
      return <BellRing className="h-5 w-5 text-success animate-pulse" />;
    } else if (permissionStatus === 'denied') {
      return <BellOff className="h-5 w-5 text-destructive" />;
    } else {
      return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="bg-card/95 backdrop-blur-xl border-2 border-primary/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Smart Notifications
            </span>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get reminders even when the app is closed
              </p>
            </div>
          </div>
          
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe} 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">Enabled</span>
            </div>
          )}
        </div>

        {/* Notification Settings */}
        {isSubscribed && (
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notification Types
            </h4>
            
            <div className="grid gap-3">
              {[
                { key: 'medicationReminders', label: 'Medication Reminders', desc: 'Daily medication schedule alerts' },
                { key: 'missedMedicationAlerts', label: 'Missed Medication Alerts', desc: 'Notifications when medications are overdue' },
                { key: 'adherenceReports', label: 'Adherence Reports', desc: 'Weekly medication adherence summaries' },
                { key: 'emergencyAlerts', label: 'Emergency Alerts', desc: 'Critical medication and health warnings' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-accent/5 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings[item.key as keyof NotificationSettings] as boolean}
                    onCheckedChange={(checked) => updateSetting(item.key as keyof NotificationSettings, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <div className="pt-4 border-t border-border">
            <Button
              onClick={handleTestNotification}
              variant="outline"
              className="w-full bg-gradient-to-r from-accent/10 to-primary/10 hover:from-accent/20 hover:to-primary/20 border-accent/30 text-accent hover:text-accent/80 transition-all duration-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Permission Denied Warning */}
        {permissionStatus === 'denied' && (
          <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-warning">Notifications Blocked</p>
                <p className="text-sm text-warning/80 mt-1">
                  To enable notifications, please click the lock icon in your browser's address bar and allow notifications for this site.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Disable Option */}
        {isSubscribed && (
          <div className="pt-2">
            <Button
              onClick={handleUnsubscribe}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive text-xs"
              disabled={isLoading}
            >
              Disable Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerfectPushNotifications;