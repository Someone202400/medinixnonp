import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO } from 'date-fns';
import { generateDailyMedicationSchedule } from '@/utils/medicationScheduler';
import { notifyMedicationTaken } from '@/utils/notificationService';

interface TodaysMedication {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  status: 'pending' | 'taken' | 'missed';
}

interface TodaysMedicationsProps {
  onMedicationTaken?: () => void;
}

const TodaysMedications = ({ onMedicationTaken }: TodaysMedicationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todaysMeds, setTodaysMeds] = useState<TodaysMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchWithTimeout = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Set 8-second timeout for data fetching
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Loading timeout')), 8000)
          );
          
          const fetchPromise = fetchTodaysMedications();
          
          await Promise.race([fetchPromise, timeoutPromise]);
        } catch (error) {
          console.error('Error loading today\'s medications:', error);
          setError('Unable to load medications');
        } finally {
          setLoading(false);
        }
      };
      
      fetchWithTimeout();
      // Shorter refresh interval for better UX
      const interval = setInterval(fetchWithTimeout, 30 * 1000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTodaysMedications = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      console.log('Fetching medications for user:', user.id);
      
      // Don't block UI on schedule generation - run it in background
      generateDailyMedicationSchedule(user.id, new Date()).catch(error => 
        console.warn('Schedule generation failed (non-blocking):', error)
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select(`
          *,
          medications (name, dosage)
        `)
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .in('status', ['pending', 'taken'])
        .order('scheduled_time', { ascending: true });

      if (error) throw new Error(`Database Error: ${error.message}`);

      console.log('Retrieved medication logs:', logs?.length || 0);

      const medications: TodaysMedication[] = logs?.map(log => {
        const medName = log.medications?.name && typeof log.medications.name === 'string' 
          ? log.medications.name 
          : 'Unknown Medication';
        const dosage = log.medications?.dosage && typeof log.medications.dosage === 'string' 
          ? log.medications.dosage 
          : '';
        
        return {
          id: log.id,
          medication_id: log.medication_id,
          medication_name: medName,
          dosage: dosage,
          scheduled_time: log.scheduled_time,
          status: log.status as 'pending' | 'taken' | 'missed'
        };
      }) || [];

      setTodaysMeds(medications);
      setError(null);
    } catch (error) {
      console.error('Error fetching today\'s medications:', error);
      setError('Failed to load medications. Please try again.');
      setTodaysMeds([]);
    }
  };

  const markAsTaken = async (medication: TodaysMedication) => {
    try {
      console.log('Marking medication as taken:', medication.id);
      
      const takenAt = new Date();
      
      const { error: updateError } = await supabase
        .from('medication_logs')
        .update({
          status: 'taken',
          taken_at: takenAt.toISOString()
        })
        .eq('id', medication.id);

      if (updateError) throw updateError;

      await notifyMedicationTaken(
        user?.id!,
        medication.medication_name,
        medication.dosage,
        takenAt
      );

      playNotificationSound();

      toast({
        title: "Medication taken! 💊",
        description: `${medication.medication_name} marked as taken successfully.`,
      });

      fetchTodaysMedications();
      onMedicationTaken?.();
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast({
        title: "Error",
        description: "Failed to mark medication as taken.",
        variant: "destructive"
      });
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiN2/LNeSsFJHbE8d2UQgwaXbXq66hWFAlFnt/yv2UdBzl+1vLLfCwGI3zE7+OZRAY7gdf0xH4xBiV+yOvXfzIIIYDJ7+CWQAofWaTg7qtqMgAucK');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const getTimeDisplay = (scheduledTime: string) => {
    try {
      const date = parseISO(scheduledTime);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const getStatusBadge = (medication: TodaysMedication) => {
    const now = new Date();
    try {
      const scheduledTime = parseISO(medication.scheduled_time);

      if (medication.status === 'taken') {
        return <Badge className="bg-green-100 text-green-700 border-green-300">✓ Taken</Badge>;
      }

      const timeDiff = scheduledTime.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));

      if (minutesUntil < -30) {
        return <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300">⚠ Overdue</Badge>;
      } else if (minutesUntil < 0) {
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">⏰ Due Now</Badge>;
      } else if (minutesUntil <= 30) {
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">🔔 Due Soon</Badge>;
      } else {
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">📅 Scheduled</Badge>;
      }
    } catch (error) {
      console.error('Error getting status badge:', error);
      return <Badge variant="outline">Status Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-xl border-2 border-green-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading today's medications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-red-50/70 backdrop-blur-xl border-2 border-red-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingMeds = todaysMeds.filter(med => med.status === 'pending');
  const takenMeds = todaysMeds.filter(med => med.status === 'taken');

  return (
    <Card className="bg-gradient-to-br from-white/90 to-green-50/70 backdrop-blur-xl border-2 border-green-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          <Calendar className="h-6 w-6 text-green-600" />
          Today's Medications
          <Badge className="ml-2 bg-green-100 text-green-700">
            {pendingMeds.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingMeds.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-green-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Medications
            </h3>
            {pendingMeds.map((medication) => (
              <div key={medication.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <Pill className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{medication.medication_name}</h3>
                    <p className="text-sm text-gray-600">{medication.dosage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{getTimeDisplay(medication.scheduled_time)}</p>
                    {getStatusBadge(medication)}
                  </div>
                  <Button
                    onClick={() => markAsTaken(medication)}
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
        )}

        {takenMeds.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Today
            </h3>
            {takenMeds.map((medication) => (
              <div key={medication.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg border border-gray-200 opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">{medication.medication_name}</h3>
                    <p className="text-sm text-gray-500">{medication.dosage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{getTimeDisplay(medication.scheduled_time)}</p>
                  <Badge className="bg-green-100 text-green-700 border-green-300">✓ Completed</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {todaysMeds.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-medium">No medications scheduled for today</p>
            <p className="text-gray-400">Add medications to see them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysMedications;
