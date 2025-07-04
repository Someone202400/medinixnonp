
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, isToday, isTomorrow, parseISO } from 'date-fns';

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
      const interval = setInterval(fetchUpcomingMedications, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUpcomingMedications = async () => {
    try {
      // Get active medications
      const { data: medications, error: medError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true);

      if (medError) throw medError;

      // Generate upcoming schedules for next 24 hours
      const schedules: MedicationSchedule[] = [];
      const now = new Date();
      const next24Hours = addMinutes(now, 24 * 60);

      medications?.forEach((med) => {
        const times = med.times as string[];
        times.forEach((time) => {
          const [hours, minutes] = time.split(':').map(Number);
          
          // Create schedule for today
          const todaySchedule = new Date();
          todaySchedule.setHours(hours, minutes, 0, 0);
          
          if (todaySchedule > now && todaySchedule <= next24Hours) {
            schedules.push({
              id: `${med.id}-${time}-today`,
              medication_id: med.id,
              medication_name: med.name,
              dosage: med.dosage,
              scheduled_time: todaySchedule.toISOString(),
              status: 'pending',
              next_dose: todaySchedule
            });
          }
          
          // Create schedule for tomorrow if within 24 hours
          const tomorrowSchedule = new Date();
          tomorrowSchedule.setDate(tomorrowSchedule.getDate() + 1);
          tomorrowSchedule.setHours(hours, minutes, 0, 0);
          
          if (tomorrowSchedule <= next24Hours) {
            schedules.push({
              id: `${med.id}-${time}-tomorrow`,
              medication_id: med.id,
              medication_name: med.name,
              dosage: med.dosage,
              scheduled_time: tomorrowSchedule.toISOString(),
              status: 'pending',
              next_dose: tomorrowSchedule
            });
          }
        });
      });

      // Sort by scheduled time
      schedules.sort((a, b) => 
        new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
      );

      setUpcomingMeds(schedules.slice(0, 10)); // Show next 10 medications
    } catch (error) {
      console.error('Error fetching upcoming medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (schedule: MedicationSchedule) => {
    try {
      // Create medication log entry
      const { error } = await supabase
        .from('medication_logs')
        .insert({
          medication_id: schedule.medication_id,
          user_id: user?.id,
          scheduled_time: schedule.scheduled_time,
          taken_at: new Date().toISOString(),
          status: 'taken'
        });

      if (error) throw error;

      // Send notifications to caregivers
      await notifyCaregivers(schedule);

      toast({
        title: "Medication taken!",
        description: `${schedule.medication_name} marked as taken.`,
      });

      // Refresh the list
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

  const notifyCaregivers = async (schedule: MedicationSchedule) => {
    try {
      // Get caregivers with notifications enabled
      const { data: caregivers, error } = await supabase
        .from('caregivers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('notifications_enabled', true);

      if (error) throw error;

      // Get user profile for notification preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (caregivers && caregivers.length > 0) {
        const notificationMessage = `${profile?.full_name || 'Patient'} has taken their ${schedule.medication_name} (${schedule.dosage}) at ${format(new Date(), 'h:mm a')}.`;

        // Create notifications for each caregiver
        const notifications = caregivers.map(caregiver => ({
          user_id: user?.id,
          title: 'Medication Taken',
          message: notificationMessage,
          type: 'medication_taken',
          scheduled_for: new Date().toISOString(),
          channels: ['push', 'email', 'sms']
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying caregivers:', error);
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
