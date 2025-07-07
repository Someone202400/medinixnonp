
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, parseISO, subDays } from 'date-fns';

interface AdherenceData {
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  adherencePercentage: number;
  weeklyAdherence: number;
  monthlyAdherence: number;
  streak: number;
  todayScheduled: number;
  todayTaken: number;
  todayMissed: number;
}

interface MedicationAdherenceProps {
  refreshTrigger?: number;
}

const MedicationAdherence = ({ refreshTrigger }: MedicationAdherenceProps) => {
  const { user } = useAuth();
  const [adherenceData, setAdherenceData] = useState<AdherenceData>({
    totalScheduled: 0,
    totalTaken: 0,
    totalMissed: 0,
    adherencePercentage: 0,
    weeklyAdherence: 0,
    monthlyAdherence: 0,
    streak: 0,
    todayScheduled: 0,
    todayTaken: 0,
    todayMissed: 0
  });
  const [loading, setLoading] = useState(true);

  const calculateAdherence = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Get all medication logs for the user (only past scheduled times to avoid counting future medications)
      const { data: allLogs, error: allLogsError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .lt('scheduled_time', now.toISOString()) // Only past medications
        .order('scheduled_time', { ascending: false })
        .limit(1000); // Add reasonable limit to prevent performance issues

      if (allLogsError) {
        console.error('Error fetching all logs:', allLogsError);
        throw allLogsError;
      }

      // Get today's logs (only past scheduled times)
      const { data: todayLogs, error: todayError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', todayStart.toISOString())
        .lt('scheduled_time', now.toISOString()) // Only past medications for today
        .lte('scheduled_time', todayEnd.toISOString());

      if (todayError) {
        console.error('Error fetching today logs:', todayError);
        throw todayError;
      }

      // Get weekly logs (only past scheduled times)
      const { data: weeklyLogs, error: weeklyError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', weekStart.toISOString())
        .lt('scheduled_time', now.toISOString()) // Only past medications this week
        .lte('scheduled_time', weekEnd.toISOString());

      if (weeklyError) {
        console.error('Error fetching weekly logs:', weeklyError);
        throw weeklyError;
      }

      // Get monthly logs (only past scheduled times)
      const { data: monthlyLogs, error: monthlyError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', monthStart.toISOString())
        .lt('scheduled_time', now.toISOString()) // Only past medications this month
        .lte('scheduled_time', monthEnd.toISOString());

      if (monthlyError) {
        console.error('Error fetching monthly logs:', monthlyError);
        throw monthlyError;
      }

      // Calculate metrics - only count medications that were scheduled in the past
      const totalScheduled = allLogs?.length || 0;
      const totalTaken = allLogs?.filter(log => log.status === 'taken').length || 0;
      const totalMissed = allLogs?.filter(log => log.status === 'missed').length || 0;
      const adherencePercentage = totalScheduled > 0 ? Math.round((totalTaken / totalScheduled) * 100) : 100;

      const weeklyScheduled = weeklyLogs?.length || 0;
      const weeklyTaken = weeklyLogs?.filter(log => log.status === 'taken').length || 0;
      const weeklyAdherence = weeklyScheduled > 0 ? Math.round((weeklyTaken / weeklyScheduled) * 100) : 100;

      const monthlyScheduled = monthlyLogs?.length || 0;
      const monthlyTaken = monthlyLogs?.filter(log => log.status === 'taken').length || 0;
      const monthlyAdherence = monthlyScheduled > 0 ? Math.round((monthlyTaken / monthlyScheduled) * 100) : 100;

      const todayScheduled = todayLogs?.length || 0;
      const todayTaken = todayLogs?.filter(log => log.status === 'taken').length || 0;
      const todayMissed = todayLogs?.filter(log => log.status === 'missed').length || 0;

      // Calculate streak (consecutive days with 100% adherence) - Fixed to prevent infinite loop
      let streak = 0;
      const sortedLogs = allLogs?.sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()) || [];
      
      // Start from yesterday to avoid counting today if it's not complete
      let currentDate = subDays(new Date(), 1);
      const maxDaysToCheck = 30; // Limit to prevent infinite loops
      
      for (let dayCount = 0; dayCount < maxDaysToCheck; dayCount++) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayLogs = sortedLogs.filter(log => {
          const logDate = new Date(log.scheduled_time);
          return logDate >= dayStart && logDate <= dayEnd;
        });
        
        if (dayLogs.length === 0) {
          // No medications scheduled for this day, continue to previous day
          currentDate = subDays(currentDate, 1);
          continue;
        }
        
        const dayTaken = dayLogs.filter(log => log.status === 'taken').length;
        const dayAdherence = dayLogs.length > 0 ? (dayTaken / dayLogs.length) : 0;
        
        if (dayAdherence === 1) {
          streak++;
        } else {
          break; // Streak is broken
        }
        
        currentDate = subDays(currentDate, 1);
      }

      setAdherenceData({
        totalScheduled,
        totalTaken,
        totalMissed,
        adherencePercentage,
        weeklyAdherence,
        monthlyAdherence,
        streak,
        todayScheduled,
        todayTaken,
        todayMissed
      });

    } catch (error) {
      console.error('Error calculating adherence:', error);
      // Set safe default values on error
      setAdherenceData({
        totalScheduled: 0,
        totalTaken: 0,
        totalMissed: 0,
        adherencePercentage: 0,
        weeklyAdherence: 0,
        monthlyAdherence: 0,
        streak: 0,
        todayScheduled: 0,
        todayTaken: 0,
        todayMissed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      calculateAdherence();
    }
  }, [user, refreshTrigger]);

  // Set up real-time subscription for immediate updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('medication-adherence-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medication_logs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Medication log changed, updating adherence...');
          calculateAdherence();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Medication changed, updating adherence...');
          calculateAdherence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const getAdherenceStatus = (percentage: number) => {
    if (percentage >= 95) return { label: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (percentage >= 85) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700' };
    if (percentage >= 70) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { label: 'Needs Improvement', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const todayAdherence = adherenceData.todayScheduled > 0 ? Math.round((adherenceData.todayTaken / adherenceData.todayScheduled) * 100) : 100;
  const status = getAdherenceStatus(adherenceData.adherencePercentage);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Calculating adherence...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-blue-50/70 backdrop-blur-xl border-2 border-blue-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          Medication Adherence
          <Badge className={`ml-2 ${status.textColor} bg-opacity-20`}>
            {status.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Adherence */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-700">Overall Adherence</span>
            <span className="text-2xl font-bold text-blue-600">{adherenceData.adherencePercentage}%</span>
          </div>
          <Progress 
            value={adherenceData.adherencePercentage} 
            className="h-3"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{adherenceData.totalTaken} taken</span>
            <span>{adherenceData.totalMissed} missed</span>
            <span>{adherenceData.totalScheduled} total</span>
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Today's Progress</span>
            </div>
            <span className="text-xl font-bold text-green-600">{todayAdherence}%</span>
          </div>
          <Progress value={todayAdherence} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-green-700">
            <span>{adherenceData.todayTaken} taken</span>
            <span>{adherenceData.todayMissed} missed</span>
            <span>{adherenceData.todayScheduled} scheduled</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">This Week</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{adherenceData.weeklyAdherence}%</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">This Month</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{adherenceData.monthlyAdherence}%</div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Current Streak</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-600">{adherenceData.streak}</div>
              <div className="text-sm text-yellow-700">days</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {adherenceData.adherencePercentage < 85 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">Recommendations</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Set up medication reminders 15 minutes before each dose</li>
              <li>• Consider using a pill organizer for weekly preparation</li>
              <li>• Talk to your healthcare provider about any challenges</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationAdherence;
