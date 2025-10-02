import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Pill, CheckCircle, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, parseISO, differenceInMinutes } from 'date-fns';

interface TodaysMedication {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  status: 'pending' | 'taken' | 'missed';
  taken_at?: string;
}

interface EnhancedTodaysMedicationsProps {
  onMedicationTaken?: () => void;
}

const EnhancedTodaysMedications = ({ onMedicationTaken }: EnhancedTodaysMedicationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todaysMeds, setTodaysMeds] = useState<TodaysMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadTodaysMedications();
      // Auto-refresh every minute for real-time updates
      const interval = setInterval(loadTodaysMedications, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadTodaysMedications = async (showRefreshLoader = false) => {
    if (!user?.id) return;

    if (showRefreshLoader) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // First, ensure we have medications scheduled for today
      await ensureTodayScheduleExists();

      // Fetch today's medication logs (without joins to avoid FK dependency)
      const { data: logs, error: logsError } = await supabase
        .from('medication_logs')
        .select('id, medication_id, scheduled_time, status, taken_at')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString())
        .order('scheduled_time', { ascending: true });

      if (logsError) throw logsError;

      const medicationIds = Array.from(new Set((logs || []).map(l => l.medication_id)));
      let medsMap: Record<string, { name: string; dosage: string }> = {};

      if (medicationIds.length > 0) {
        const { data: meds, error: medsError } = await supabase
          .from('medications')
          .select('id, name, dosage')
          .in('id', medicationIds);
        if (medsError) throw medsError;
        medsMap = (meds || []).reduce((acc, m) => {
          acc[m.id] = { name: m.name, dosage: m.dosage } as any;
          return acc;
        }, {} as Record<string, { name: string; dosage: string }>);
      }

      const medications = (logs || []).map((log: any) => ({
        id: log.id,
        medication_id: log.medication_id,
        medication_name: medsMap[log.medication_id]?.name || 'Unknown Medication',
        dosage: medsMap[log.medication_id]?.dosage || '',
        scheduled_time: log.scheduled_time,
        status: log.status as 'pending' | 'taken' | 'missed',
        taken_at: log.taken_at
      }));

      setTodaysMeds(medications);
    } catch (error) {
      console.error('Error loading medications:', error);
      setError("Couldn't load today's medications. Please try again.");
      toast({
        title: "Loading Error",
        description: "Could not load today's medications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const ensureTodayScheduleExists = async () => {
    if (!user?.id) return;

    try {
      // Get active medications
      const { data: medications } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true);

      if (!medications?.length) return;

      // Check if we have logs for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: existingLogs } = await supabase
        .from('medication_logs')
        .select('medication_id')
        .eq('user_id', user.id)
        .gte('scheduled_time', today.toISOString())
        .lt('scheduled_time', tomorrow.toISOString());

      const existingMedIds = existingLogs?.map(log => log.medication_id) || [];

      // Create logs for medications that don't have them today
      for (const med of medications) {
        if (!existingMedIds.includes(med.id)) {
          const times = Array.isArray(med.times) ? med.times : 
                      typeof med.times === 'string' ? [med.times] : [];
          
          for (const timeStr of times) {
            if (typeof timeStr === 'string') {
              const [hours, minutes] = timeStr.split(':').map(Number);
              const scheduledDateTime = new Date(today);
              scheduledDateTime.setHours(hours, minutes, 0, 0);

              await supabase
                .from('medication_logs')
                .insert({
                  user_id: user.id,
                  medication_id: med.id,
                  scheduled_time: scheduledDateTime.toISOString(),
                  status: 'pending'
                });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring schedule exists:', error);
    }
  };

  const markAsTaken = async (medication: TodaysMedication) => {
    try {
      const now = new Date();
      
      const { error } = await supabase
        .from('medication_logs')
        .update({
          status: 'taken',
          taken_at: now.toISOString()
        })
        .eq('id', medication.id);

      if (error) throw error;

      toast({
        title: "Medication Taken! 💊",
        description: `${medication.medication_name} recorded successfully.`,
      });

      // Play success sound
      playSuccessSound();

      // Refresh the list and notify parent
      await loadTodaysMedications();
      onMedicationTaken?.();

    } catch (error) {
      console.error('Error marking medication as taken:', error);
      toast({
        title: "Error",
        description: "Failed to record medication. Please try again.",
        variant: "destructive"
      });
    }
  };

  const playSuccessSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiN2/LNeSsFJHbE8d2UQgwaXbXq66hWFAlFnt/yv2UdBzl+1vLLfCwGI3zE7+OZRAY7gdf0xH4xBiV+yOvXfzIIIYDJ7+CWQAofWaTg7qtqMgAucK');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore audio errors
    } catch {
      // Ignore audio errors
    }
  };

  const getTimeDisplay = (scheduledTime: string) => {
    try {
      return format(parseISO(scheduledTime), 'h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const getStatusInfo = (med: TodaysMedication) => {
    if (med.status === 'taken') {
      return {
        badge: <Badge className="bg-green-100 text-green-800 border-green-300">✅ Taken</Badge>,
        overdue: false
      };
    }

    const now = new Date();
    const scheduledTime = parseISO(med.scheduled_time);
    const minutesDiff = differenceInMinutes(now, scheduledTime);

    if (minutesDiff > 30) {
      return {
        badge: <Badge variant="destructive">⚠️ Overdue</Badge>,
        overdue: true
      };
    } else if (minutesDiff > 0) {
      return {
        badge: <Badge className="bg-orange-100 text-orange-800 border-orange-300">⏰ Due Now</Badge>,
        overdue: false
      };
    } else if (minutesDiff > -30) {
      return {
        badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">🔔 Due Soon</Badge>,
        overdue: false
      };
    } else {
      return {
        badge: <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">📅 Upcoming</Badge>,
        overdue: false
      };
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/90 backdrop-blur-xl border-2 border-success/30 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-success border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground text-lg">Loading your medications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/90 backdrop-blur-xl border-2 border-destructive/30 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive text-lg">{error}</p>
            <Button variant="outline" onClick={() => loadTodaysMedications(true)}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingMeds = todaysMeds.filter(med => med.status === 'pending');
  const takenMeds = todaysMeds.filter(med => med.status === 'taken');

  return (
    <Card className="bg-card/90 backdrop-blur-xl border-2 border-success/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-success to-success/80 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">
                Today's Medications
              </h2>
              <p className="text-sm text-muted-foreground">
                {pendingMeds.length} pending • {takenMeds.length} completed
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTodaysMedications(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingMeds.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" />
              Pending ({pendingMeds.length})
            </h3>
            {pendingMeds.map((med) => {
              const statusInfo = getStatusInfo(med);
              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    statusInfo.overdue 
                      ? 'bg-destructive/5 border-destructive/30 shadow-lg' 
                      : 'bg-success/5 border-success/30 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        statusInfo.overdue 
                          ? 'bg-gradient-to-br from-destructive to-destructive/80' 
                          : 'bg-gradient-to-br from-success to-success/80'
                      }`}>
                        <Pill className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-lg">{med.medication_name}</h4>
                        <p className="text-muted-foreground">{med.dosage}</p>
                        <p className="text-sm font-medium text-foreground">{getTimeDisplay(med.scheduled_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusInfo.badge}
                      <Button
                        onClick={() => markAsTaken(med)}
                        className="bg-gradient-to-r from-success to-success/80 hover:from-success/80 hover:to-success/60 text-white shadow-lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Taken
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {takenMeds.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({takenMeds.length})
            </h3>
            {takenMeds.map((med) => (
              <div key={med.id} className="p-3 bg-muted/30 rounded-lg border border-muted opacity-75">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{med.medication_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage} • Taken at {med.taken_at ? format(parseISO(med.taken_at), 'h:mm a') : 'Unknown time'}
                    </p>
                  </div>
                  <Badge className="bg-success/20 text-success">✅ Complete</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {todaysMeds.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No medications scheduled today</h3>
            <p className="text-muted-foreground mb-4">Add medications to see your daily schedule here</p>
            <Link to="/add-medication">
              <Button variant="outline">Add Medication</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTodaysMedications;