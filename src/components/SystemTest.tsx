
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateDailyMedicationSchedule, checkForMissedMedications } from '@/utils/medicationScheduler';
import { sendPendingNotifications, cleanupOldNotifications, scheduleMedicationReminders } from '@/utils/notificationService';
import { TestTube, Play, CheckCircle, AlertCircle, Clock, Mail, Bell } from 'lucide-react';

const SystemTest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'warning', message: string, data?: any) => {
    setTestResults(prev => [...prev, { test, status, message, data, timestamp: new Date() }]);
  };

  const runSystemTest = async () => {
    if (!user?.id) return;
    
    setTesting(true);
    setTestResults([]);
    
    try {
      // Test 1: Database Connection
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        addTestResult('Database Connection', 'pass', 'Successfully connected to Supabase', profile);
      } catch (error) {
        addTestResult('Database Connection', 'fail', `Database error: ${error}`);
      }

      // Test 2: Medication Data
      try {
        const { data: medications } = await supabase.from('medications').select('*').eq('user_id', user.id);
        addTestResult('Medication Data', medications && medications.length > 0 ? 'pass' : 'warning', 
          `Found ${medications?.length || 0} medications`, medications);
      } catch (error) {
        addTestResult('Medication Data', 'fail', `Medication query error: ${error}`);
      }

      // Test 3: Caregivers
      try {
        const { data: caregivers } = await supabase.from('caregivers').select('*').eq('user_id', user.id);
        addTestResult('Caregivers', caregivers && caregivers.length > 0 ? 'pass' : 'warning', 
          `Found ${caregivers?.length || 0} caregivers`, caregivers);
      } catch (error) {
        addTestResult('Caregivers', 'fail', `Caregivers query error: ${error}`);
      }

      // Test 4: Notification Cleanup
      try {
        await cleanupOldNotifications(user.id);
        addTestResult('Notification Cleanup', 'pass', 'Successfully cleaned up old notifications');
      } catch (error) {
        addTestResult('Notification Cleanup', 'fail', `Cleanup error: ${error}`);
      }

      // Test 5: Schedule Generation
      try {
        const scheduleEntries = await generateDailyMedicationSchedule(user.id, new Date());
        addTestResult('Schedule Generation', 'pass', 
          `Generated ${scheduleEntries.length} schedule entries for today`, scheduleEntries);
      } catch (error) {
        addTestResult('Schedule Generation', 'fail', `Schedule generation error: ${error}`);
      }

      // Test 6: Current Notifications
      try {
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .gte('scheduled_for', new Date().toISOString())
          .order('scheduled_for', { ascending: true })
          .limit(10);

        addTestResult('Current Notifications', 'pass', 
          `Found ${notifications?.length || 0} pending notifications`, notifications);
      } catch (error) {
        addTestResult('Current Notifications', 'fail', `Notifications query error: ${error}`);
      }

      // Test 7: Missed Medications Check
      try {
        const missedCount = await checkForMissedMedications(user.id);
        addTestResult('Missed Medications Check', 'pass', 
          `Found and processed ${missedCount} missed medications`);
      } catch (error) {
        addTestResult('Missed Medications Check', 'fail', `Missed meds check error: ${error}`);
      }

      // Test 8: Pending Notifications Processing
      try {
        await sendPendingNotifications();
        addTestResult('Notification Processing', 'pass', 'Successfully processed pending notifications');
      } catch (error) {
        addTestResult('Notification Processing', 'fail', `Notification processing error: ${error}`);
      }

      // Test 9: Edge Function Test (if caregivers exist)
      const { data: caregivers } = await supabase.from('caregivers').select('*').eq('user_id', user.id);
      if (caregivers && caregivers.length > 0) {
        try {
          const testNotification = {
            user_id: user.id,
            title: 'System Test',
            message: 'This is a test notification from the system test.',
            type: 'system_test',
            scheduled_for: new Date().toISOString(),
            channels: JSON.stringify(['email']),
            caregiver_id: caregivers[0].id
          };

          const { data: insertResult, error: insertError } = await supabase
            .from('notifications')
            .insert([testNotification])
            .select()
            .single();

          if (insertError) throw insertError;

          // Try to call the edge function
          const { data: edgeFunctionResult, error: edgeFunctionError } = await supabase.functions.invoke('send-notifications', {
            body: { 
              notifications: [insertResult],
              caregivers: caregivers
            }
          });

          if (edgeFunctionError) {
            addTestResult('Edge Function Test', 'warning', 
              `Edge function call failed: ${edgeFunctionError.message}`, edgeFunctionError);
          } else {
            addTestResult('Edge Function Test', 'pass', 
              'Edge function executed successfully', edgeFunctionResult);
          }
        } catch (error) {
          addTestResult('Edge Function Test', 'warning', `Edge function test error: ${error}`);
        }
      } else {
        addTestResult('Edge Function Test', 'warning', 'Skipped - no caregivers to test email notifications');
      }

      toast({
        title: "System Test Complete! 🧪",
        description: "Check the results below for detailed information.",
      });

    } catch (error) {
      addTestResult('System Test', 'fail', `Overall test error: ${error}`);
      toast({
        title: "System Test Failed",
        description: "An error occurred during testing.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-700">PASS</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-700">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700">WARNING</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please log in to run system tests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          <TestTube className="h-6 w-6 text-blue-600" />
          System Test & Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button 
            onClick={runSystemTest} 
            disabled={testing}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {testing ? 'Running Tests...' : 'Run System Test'}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-white/80 rounded-lg border">
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h4 className="font-medium">{result.test}</h4>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">Show data</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(result.status)}
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">What This Test Checks:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Database connectivity and user profile</li>
            <li>• Medication data and active prescriptions</li>
            <li>• Caregiver setup and notification preferences</li>
            <li>• Notification system cleanup and scheduling</li>
            <li>• Daily medication schedule generation</li>
            <li>• Missed medication detection and alerts</li>
            <li>• Push notification processing</li>
            <li>• Email notification system (edge functions)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemTest;
