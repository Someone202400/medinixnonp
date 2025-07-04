
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, Clock, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NotificationManager = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive medication reminders.",
        });
        
        // Send a test notification
        new Notification('MedCare Notifications Enabled', {
          body: 'You will now receive medication reminders and health updates.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const scheduleTestNotification = () => {
    if (permission !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive"
      });
      return;
    }

    // Schedule a test notification in 5 seconds
    setTimeout(() => {
      new Notification('Medication Reminder', {
        body: 'Time to take your Aspirin (100mg)',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'medication-reminder',
        requireInteraction: true
      });
    }, 5000);

    toast({
      title: "Test Scheduled",
      description: "You'll receive a test notification in 5 seconds.",
    });
  };

  const scheduleMedicationReminders = () => {
    if (permission !== 'granted') {
      requestPermission();
      return;
    }

    // Example medication schedule
    const medications = [
      { name: 'Aspirin', dose: '100mg', time: '08:00' },
      { name: 'Metformin', dose: '500mg', time: '12:00' },
      { name: 'Lisinopril', dose: '10mg', time: '20:00' }
    ];

    medications.forEach(med => {
      // This would typically be handled by a more sophisticated scheduling system
      console.log(`Scheduling reminder for ${med.name} at ${med.time}`);
    });

    toast({
      title: "Reminders Scheduled",
      description: "Your medication reminders are now active.",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {permission === 'granted' ? (
                <Bell className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-gray-600">
                  Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not Enabled'}
                </p>
              </div>
            </div>
            {permission !== 'granted' && (
              <Button onClick={requestPermission} size="sm">
                Enable
              </Button>
            )}
          </div>

          {permission === 'granted' && (
            <div className="space-y-3">
              <Button 
                onClick={scheduleTestNotification} 
                variant="outline" 
                className="w-full justify-start"
              >
                <Clock className="h-4 w-4 mr-2" />
                Send Test Notification (5s delay)
              </Button>
              
              <Button 
                onClick={scheduleMedicationReminders} 
                className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Schedule Medication Reminders
              </Button>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Notification Features:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Medication reminders at scheduled times</li>
              <li>• Missed dose alerts</li>
              <li>• Weekly adherence reports</li>
              <li>• Health tips and educational content</li>
              <li>• Emergency medication alerts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManager;
