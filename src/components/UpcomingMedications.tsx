import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, isToday, isTomorrow, parseISO } from 'date-fns';
import { generateDailyMedicationSchedule } from '@/utils/medicationScheduler';

interface MedicationSchedule {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  status: 'pending' | 'taken' | 'missed';
  next_dose?: Date;
}

const UpcomingMedications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingMeds, setUpcomingMeds] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingMedications();
      const interval = setInterval(fetchUpcomingMedications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUpcomingMedications = async () => {
    try {
      if (user?.id) {
        await generateDailyMedicationSchedule(user.id, new Date());
        await generateDailyMedicationSchedule(user.id, addMinutes(new Date(), 24 * 60));
      }

      const now = new Date();
      const next24Hours = addMinutes(now, 24 * 60);

      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          medications (name, dosage)
        `)
        .eq('user_id', user?.id)
        .gte('scheduled_time', now.toISOString())
        .lte('scheduled_time', next24Hours.toISOString())
        .eq('status', 'pending')
        .neq('status', 'archived')
        .order('scheduled_time', { ascending: true })
        .limit(10);

      if (error) throw error;

      const schedules: MedicationSchedule[] = logs?.map(log => ({
        id: log.id,
        medication_id: log.medication_id,
        medication_name: log.medications?.name || 'Unknown',
        dosage: log.medications?.dosage || '',
        scheduled_time: log.scheduled_time,
        status: log.status as 'pending' | 'taken' | 'missed',
        next_dose: new Date(log.scheduled_time)
      })) || [];

      setUpcomingMeds(schedules);
    } catch (error) {
      console.error('Error fetching upcoming medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (schedule: MedicationSchedule) => {
    try {
      console.log('Marking medication as taken:', schedule.id);
      
      // Update medication log
      const { error: updateError } = await supabase
        .from('medication_logs')
        .update({
          status: 'taken',
          taken_at: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (updateError) {
        console.error('Error updating medication log:', updateError);
        throw updateError;
      }

      console.log('Medication log updated successfully');

      // Create user notification
      await createUserNotification(schedule);

      // Send notifications to caregivers
      await notifyCaregivers(schedule);

      toast({
        title: "Medication taken!",
        description: `${schedule.medication_name} marked as taken.`,
      });

      fetchUpcomingMedications();
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast({
        title: "Error",
        description: "Failed to mark medication as taken.",
        variant: "destructive"
      });
    }
  };

  const createUserNotification = async (schedule: MedicationSchedule) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      const userNotification = {
        user_id: user?.id,
        title: 'Medication Taken',
        message: `You have successfully taken your ${schedule.medication_name} (${schedule.dosage}) at ${format(new Date(), 'h:mm a')}.`,
        type: 'medication_taken',
        scheduled_for: new Date().toISOString(),
        channels: JSON.stringify(['push'])
      };

      console.log('Creating user notification:', userNotification);

      const { error: userNotifError } = await supabase
        .from('notifications')
        .insert([userNotification]);

      if (userNotifError) {
        console.error('Error creating user notification:', userNotifError);
      } else {
        console.log('User notification created successfully');
      }
    } catch (error) {
      console.error('Error creating user notification:', error);
    }
  };

  const notifyCaregivers = async (schedule: MedicationSchedule) => {
    try {
      console.log('Notifying caregivers for medication:', schedule.medication_name);
      
      // Get caregivers with notifications enabled
      const { data: caregivers, error: caregiversError } = await supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('notifications_enabled', true);

      if (caregiversError) {
        console.error('Error fetching caregivers:', caregiversError);
        throw caregiversError;
      }

      console.log('Found caregivers:', caregivers?.length || 0);

      // Get user profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (caregivers && caregivers.length > 0) {
        const notificationMessage = `${profile?.full_name || profile?.email || 'Patient'} has taken their ${schedule.medication_name} (${schedule.dosage}) at ${format(new Date(), 'h:mm a')}.`;

        // Create notifications for each caregiver
        const notifications = caregivers.map(caregiver => ({
          user_id: user?.id,
          title: 'Medication Taken',
          message: notificationMessage,
          type: 'caregiver_notification',
          scheduled_for: new Date().toISOString(),
          channels: JSON.stringify(['push', 'email', 'sms']),
          caregiver_id: caregiver.id
        }));

        console.log('Creating caregiver notifications:', notifications.length);

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating caregiver notifications:', notifError);
        } else {
          console.log('Caregiver notifications created successfully');
          
          // Send notifications via our notification service
          await sendNotifications(notifications, caregivers);
        }
      } else {
        console.log('No caregivers with notifications enabled found');
      }
    } catch (error) {
      console.error('Error notifying caregivers:', error);
    }
  };

  const sendNotifications = async (notifications: any[], caregivers: any[]) => {
    try {
      console.log('Sending notifications via edge function');
      
      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: {
          notifications,
          caregivers
        }
      });

      if (error) {
        console.error('Error calling send-notifications function:', error);
      } else {
        console.log('Notifications sent successfully:', data);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const getTimeDisplay = (scheduledTime: string) => {
    const date = parseISO(scheduledTime);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isTomorrow(date)) {
      return `Tomorrow ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getStatusBadge = (schedule: MedicationSchedule) => {
    const now = new Date();
    const scheduledTime = parseISO(schedule.scheduled_time);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const minutesUntil = Math.floor(timeDiff / (1000 * 60));

    if (minutesUntil < 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">Overdue</Badge>;
    } else if (minutesUntil <= 30) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Due Soon</Badge>;
    } else {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Upcoming</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading upcoming medications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          <Clock className="h-6 w-6 text-blue-600" />
          Upcoming Medications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingMeds.length > 0 ? (
          <div className="space-y-4">
            {upcomingMeds.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                    <Pill className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{schedule.medication_name}</h3>
                    <p className="text-sm text-gray-600">{schedule.dosage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{getTimeDisplay(schedule.scheduled_time)}</p>
                    {getStatusBadge(schedule)}
                  </div>
                  <Button
                    onClick={() => markAsTaken(schedule)}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Take
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">No upcoming medications</p>
            <p className="text-gray-400">Your next doses will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMedications;
