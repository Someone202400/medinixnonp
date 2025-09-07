import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOneSignal } from '@/components/OneSignalProvider';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, TestTube, Clock } from 'lucide-react';

export const PushNotificationTest = () => {
  const { isInitialized, isSubscribed, subscribeUser, unsubscribeUser, sendTestNotification } = useOneSignal();
  const { toast } = useToast();
  const [testMedication, setTestMedication] = useState('Test Aspirin');
  const [testDosage, setTestDosage] = useState('100mg');
  const [testMinutes, setTestMinutes] = useState(1);

  const handleScheduleTestReminder = async () => {
    const now = new Date();
    const scheduleTime = new Date(now.getTime() + testMinutes * 60000);
    
    // Create a test notification using browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification(`Time to take ${testMedication}`, {
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
    } else {
      toast({
        title: "Notifications Not Available",
        description: "Please enable notifications first",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Push Notification Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div>
              <p className="font-medium">OneSignal Status</p>
              <p className="text-sm text-muted-foreground">
                {isInitialized ? 'Initialized' : 'Not initialized'} • {isSubscribed ? 'Subscribed' : 'Not subscribed'}
              </p>
            </div>
            <div className="flex gap-2">
              {isSubscribed ? (
                <Button variant="outline" size="sm" onClick={unsubscribeUser}>
                  <BellOff className="h-4 w-4 mr-2" />
                  Unsubscribe
                </Button>
              ) : (
                <Button size="sm" onClick={subscribeUser}>
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={sendTestNotification}
              disabled={!isSubscribed}
              className="h-12"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Immediate Test Notification
            </Button>
            
            <Button 
              onClick={handleScheduleTestReminder}
              variant="secondary"
              className="h-12"
            >
              <Clock className="h-4 w-4 mr-2" />
              Schedule Test Medication Reminder
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

          <div className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-medium text-amber-800 mb-2">Testing Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-700">
              <li>First, subscribe to notifications using the "Subscribe" button</li>
              <li>Test immediate notifications with "Send Test Notification"</li>
              <li>Schedule a medication reminder 1-2 minutes in the future</li>
              <li>Close the browser completely and wait for the notification</li>
              <li>Verify the notification appears with action buttons</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationTest;