
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, isToday, isTomorrow, parseISO, addDays } from 'date-fns';
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

interface UpcomingMedicationsProps {
  refreshTrigger?: number;
}

const UpcomingMedications = ({ refreshTrigger }: UpcomingMedicationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingMeds, setUpcomingMeds] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingMedications();
      // Reduce frequency to prevent excessive API calls
      const interval = setInterval(fetchUpcomingMedications, 5 * 60 * 1000); // 5 minutes instead of 1 minute
      return () => clearInterval(interval);
    }
  }, [user, refreshTrigger]);

  const fetchUpcomingMedications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Generate schedules for next few days
      for (let i = 0; i < 3; i++) {
        const targetDate = addDays(new Date(), i);
        await generateDailyMedicationSchedule(user.id, targetDate);
      }

      const now = new Date();
      const nextThreeDays = addDays(now, 3);

      // Get upcoming medications (future only, not today's)
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          medications (name, dosage)
        `)
        .eq('user_id', user.id)
        .gte('scheduled_time', tomorrow.toISOString())
        .lte('scheduled_time', nextThreeDays.toISOString())
        .eq('status', 'pending')
        .order('scheduled_time', { ascending: true })
        .limit(15);

      if (error) {
        console.error('Error fetching upcoming medications:', error);
        throw error;
      }

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
      // Set empty array on error to prevent crashes
      setUpcomingMeds([]);
    } finally {
      setLoading(false);
    }
  };

  const getTimeDisplay = (scheduledTime: string) => {
    try {
      const date = parseISO(scheduledTime);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isTomorrow(date)) {
        return `Tomorrow ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const getDateGroup = (scheduledTime: string) => {
    try {
      const date = parseISO(scheduledTime);
      if (isTomorrow(date)) {
        return 'Tomorrow';
      } else {
        return format(date, 'EEEE, MMM d');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Group medications by date
  const groupedMeds = upcomingMeds.reduce((groups, med) => {
    try {
      const dateGroup = getDateGroup(med.scheduled_time);
      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(med);
    } catch (error) {
      console.error('Error grouping medication:', error);
    }
    return groups;
  }, {} as Record<string, MedicationSchedule[]>);

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
          <Badge className="ml-2 bg-blue-100 text-blue-700">
            {upcomingMeds.length} scheduled
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedMeds).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedMeds).map(([dateGroup, medications]) => (
              <div key={dateGroup} className="space-y-3">
                <h3 className="font-semibold text-blue-800 text-lg border-b border-blue-200 pb-2">
                  📅 {dateGroup}
                </h3>
                <div className="space-y-3">
                  {medications.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{schedule.medication_name}</h4>
                          <p className="text-sm text-gray-600">{schedule.dosage}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">
                          {format(parseISO(schedule.scheduled_time), 'h:mm a')}
                        </p>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                          📅 Scheduled
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">No upcoming medications</p>
            <p className="text-gray-400">Your future doses will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingMedications;
