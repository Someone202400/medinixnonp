import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, TestTube, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SimplePushNotificationTest = () => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [testMedication, setTestMedication] = useState('Test Aspirin');
  const [testDosage, setTestDosage] = useState('100mg');
  const [testMinutes, setTestMinutes] = useState(1);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      setIsSubscribed(Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsSubscribed(result === 'granted');
      
      if (result === 'granted') {
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive medication reminders even when the app is closed.",
        });
      } else {
        toast({
          title: "Push Notifications Denied",
          description: "You can enable them later in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Send immediate test notification
      new Notification('Medinix Test Notification', {
        body: 'Push notifications are working correctly!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'test-notification',
        requireInteraction: true
      });

      toast({
        title: "Test Notification Sent",
        description: "Check if you received the push notification!",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  const scheduleTestReminder = async () => {
    if (permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Schedule a test medication reminder
      setTimeout(() => {
        new Notification(`💊 Time to take ${testMedication}`, {
          body: `${testDosage} - Test medication reminder`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'medication-reminder',
          requireInteraction: true
        });
      }, testMinutes * 60000);

      toast({
        title: "Test Reminder Scheduled",
        description: `You'll receive a reminder for ${testMedication} in ${testMinutes} minute${testMinutes !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error scheduling test reminder:', error);
      toast({
        title: "Error",
        description: "Failed to schedule test reminder",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = () => {
    if (!isSupported) return 'destructive';
    if (permission === 'granted') return 'default';
    if (permission === 'denied') return 'destructive';
    return 'secondary';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (permission === 'granted') return 'Enabled';
    if (permission === 'denied') return 'Denied';
    return 'Not Enabled';
  };

  const getStatusIcon = () => {
    if (!isSupported || permission === 'denied') return AlertCircle;
    if (permission === 'granted') return CheckCircle;
    return Bell;
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Push Notification Testing
          <Badge variant={getStatusColor()} className="ml-auto">
            <StatusIcon className="h-3 w-3 mr-1" />
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div className="flex-1">
              <p className="font-medium">Notification Status</p>
              <p className="text-sm text-muted-foreground">
                {isSupported ? 
                  `Browser support: ✓ | Permission: ${permission}` : 
                  'Push notifications are not supported in this browser'
                }
              </p>
            </div>
            <div className="flex gap-2">
              {permission === 'granted' ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Button size="sm" onClick={requestPermission} disabled={!isSupported}>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
              className="h-12"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
            
            <Button 
              onClick={scheduleTestReminder}
              disabled={permission !== 'granted'}
              variant="secondary"
              className="h-12"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule Test Reminder
            </Button>
          </div>

          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <Label className="text-base font-medium">Test Medication Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="medication">Medication Name</Label>
                <Input
                  id="medication"
                  value={testMedication}
                  onChange={(e) => setTestMedication(e.target.value)}
                  placeholder="e.g. Aspirin"
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={testDosage}
                  onChange={(e) => setTestDosage(e.target.value)}
                  placeholder="e.g. 100mg"
                />
              </div>
              <div>
                <Label htmlFor="minutes">Minutes from now</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="1"
                  max="60"
                  value={testMinutes}
                  onChange={(e) => setTestMinutes(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-800 mb-2">Testing Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Click "Enable Notifications" to grant permission</li>
              <li>Test immediate notifications with "Send Test Notification"</li>
              <li>Schedule a medication reminder 1-2 minutes in the future</li>
              <li>Close the browser completely and wait for the notification</li>
              <li>Check that the notification appears with medication details</li>
            </ol>
          </div>

          {permission === 'denied' && (
            <div className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium mb-2">Notifications Blocked</p>
              <p>To enable notifications:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Change notifications from "Block" to "Allow"</li>
                <li>Refresh this page and try again</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimplePushNotificationTest;