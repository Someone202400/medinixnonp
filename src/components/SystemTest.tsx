import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Bell,
  Database,
  Wifi
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  isPushNotificationSupported, 
  subscribeToPushNotifications, 
  sendTestNotification 
} from '@/utils/pushNotificationService';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  icon: React.ReactNode;
}

const SystemTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runSystemTests = async () => {
    setTesting(true);
    setTestResults([]);
    
    const results: TestResult[] = [];

    // Test 1: Service Worker
    try {
      const swRegistration = await navigator.serviceWorker.getRegistration();
      results.push({
        name: 'Service Worker',
        status: swRegistration ? 'success' : 'error',
        message: swRegistration ? 'Service Worker registered successfully' : 'Service Worker not found',
        icon: <Wifi className="h-4 w-4" />
      });
    } catch (error) {
      results.push({
        name: 'Service Worker',
        status: 'error',
        message: 'Service Worker check failed',
        icon: <Wifi className="h-4 w-4" />
      });
    }

    // Test 2: Push Notification Support
    const pushSupported = isPushNotificationSupported();
    results.push({
      name: 'Push Notifications',
      status: pushSupported ? 'success' : 'warning',
      message: pushSupported ? 'Push notifications supported' : 'Push notifications not supported on this device',
      icon: <Bell className="h-4 w-4" />
    });

    // Test 3: Database Connection
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      results.push({
        name: 'Database Connection',
        status: !error ? 'success' : 'error',
        message: !error ? 'Database connection successful' : `Database error: ${error.message}`,
        icon: <Database className="h-4 w-4" />
      });
    } catch (error) {
      results.push({
        name: 'Database Connection',
        status: 'error',
        message: 'Database connection failed',
        icon: <Database className="h-4 w-4" />
      });
    }

    // Test 4: Test Notification
    try {
      await sendTestNotification(
        'System Test ✅',
        'Your notification system is working perfectly!',
        'system-test'
      );
      
      results.push({
        name: 'Test Notification',
        status: 'success',
        message: 'Test notification sent successfully',
        icon: <Bell className="h-4 w-4" />
      });
    } catch (error) {
      results.push({
        name: 'Test Notification',
        status: 'error',
        message: 'Test notification failed',
        icon: <Bell className="h-4 w-4" />
      });
    }

    setTestResults(results);
    setTesting(false);

    // Show summary toast
    const successful = results.filter(r => r.status === 'success').length;
    const total = results.length;
    
    toast({
      title: "System Test Complete",
      description: `${successful}/${total} tests passed`,
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white/90 to-slate-50/70 backdrop-blur-xl border-2 border-slate-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
          <TestTube className="h-6 w-6 text-slate-600" />
          System Health Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          onClick={runSystemTests}
          disabled={testing}
          className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="h-4 w-4 mr-2" />
              Run System Tests
            </>
          )}
        </Button>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/60 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div>{result.icon}</div>
                  <div>
                    <h4 className="font-medium text-slate-800">{result.name}</h4>
                    <p className="text-sm text-slate-600">{result.message}</p>
                  </div>
                </div>
                <div>{getStatusIcon(result.status)}</div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Overall Status:</span>
                <Badge className="bg-green-100 text-green-700">
                  {testResults.filter(r => r.status === 'success').length}/{testResults.length} Passed
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemTest;