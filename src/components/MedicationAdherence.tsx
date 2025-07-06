
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, Target, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, subWeeks, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AdherenceData {
  date: string;
  taken: number;
  total: number;
  percentage: number;
}

interface MedicationAdherenceProps {
  refreshTrigger?: number;
}

const MedicationAdherence = ({ refreshTrigger }: MedicationAdherenceProps) => {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState<AdherenceData[]>([]);
  const [yearlyData, setYearlyData] = useState<AdherenceData[]>([]);
  const [overallStats, setOverallStats] = useState({
    todayPercentage: 0,
    currentWeekPercentage: 0,
    lastWeekPercentage: 0,
    yearlyAverage: 0,
    totalTaken: 0,
    totalScheduled: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdherenceData();
    }
  }, [user, refreshTrigger]);

  const fetchAdherenceData = async () => {
    try {
      if (!user?.id) return;

      const today = new Date();
      const currentWeekStart = startOfWeek(today);
      const currentWeekEnd = endOfWeek(today);
      const lastWeekStart = startOfWeek(subWeeks(today, 1));
      const lastWeekEnd = endOfWeek(subWeeks(today, 1));
      const fourWeeksAgo = subWeeks(currentWeekStart, 3);
      const twelveMonthsAgo = subMonths(today, 12);

      // Get logs for the last 12 months
      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', twelveMonthsAgo.toISOString())
        .lte('scheduled_time', today.toISOString())
        .neq('status', 'archived')
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      // Process weekly data (last 4 weeks)
      const weeklyStats: AdherenceData[] = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = subWeeks(currentWeekStart, 3 - i);
        const weekEnd = endOfWeek(weekStart);
        
        const weekLogs = logs?.filter(log => {
          const logDate = new Date(log.scheduled_time);
          return logDate >= weekStart && logDate <= weekEnd;
        }) || [];

        const taken = weekLogs.filter(log => log.status === 'taken').length;
        const total = weekLogs.length;
        const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

        weeklyStats.push({
          date: format(weekStart, 'MMM d'),
          taken,
          total,
          percentage
        });
      }

      setWeeklyData(weeklyStats);

      // Process yearly data (last 12 months)
      const yearlyStats: AdherenceData[] = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = startOfMonth(subMonths(today, 11 - i));
        const monthEnd = endOfMonth(monthStart);
        
        const monthLogs = logs?.filter(log => {
          const logDate = new Date(log.scheduled_time);
          return logDate >= monthStart && logDate <= monthEnd;
        }) || [];

        if (monthLogs.length > 0) {
          const taken = monthLogs.filter(log => log.status === 'taken').length;
          const total = monthLogs.length;
          const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

          yearlyStats.push({
            date: format(monthStart, 'MMM'),
            taken,
            total,
            percentage
          });
        }
      }

      setYearlyData(yearlyStats);

      // Calculate today's adherence
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const todayLogs = logs?.filter(log => {
        const logDate = new Date(log.scheduled_time);
        return logDate >= todayStart && logDate <= todayEnd;
      }) || [];

      const todayTaken = todayLogs.filter(log => log.status === 'taken').length;
      const todayTotal = todayLogs.length;
      const todayPercentage = todayTotal > 0 ? Math.round((todayTaken / todayTotal) * 100) : 0;

      // Calculate weekly adherence
      const currentWeekLogs = logs?.filter(log => {
        const logDate = new Date(log.scheduled_time);
        return logDate >= currentWeekStart && logDate <= currentWeekEnd;
      }) || [];

      const lastWeekLogs = logs?.filter(log => {
        const logDate = new Date(log.scheduled_time);
        return logDate >= lastWeekStart && logDate <= lastWeekEnd;
      }) || [];

      const currentWeekTaken = currentWeekLogs.filter(log => log.status === 'taken').length;
      const currentWeekTotal = currentWeekLogs.length;
      const currentWeekPercentage = currentWeekTotal > 0 ? Math.round((currentWeekTaken / currentWeekTotal) * 100) : 0;

      const lastWeekTaken = lastWeekLogs.filter(log => log.status === 'taken').length;
      const lastWeekTotal = lastWeekLogs.length;
      const lastWeekPercentage = lastWeekTotal > 0 ? Math.round((lastWeekTaken / lastWeekTotal) * 100) : 0;

      const totalTaken = logs?.filter(log => log.status === 'taken').length || 0;
      const totalScheduled = logs?.length || 0;
      const yearlyAverage = yearlyStats.length > 0 ? Math.round(yearlyStats.reduce((sum, month) => sum + month.percentage, 0) / yearlyStats.length) : 0;

      // Calculate streak (consecutive days with 100% adherence)
      let streak = 0;
      const today_start = startOfDay(today);
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today_start);
        checkDate.setDate(checkDate.getDate() - i);
        const dayStart = startOfDay(checkDate);
        const dayEnd = endOfDay(checkDate);

        const dayLogs = logs?.filter(log => {
          const logDate = new Date(log.scheduled_time);
          return logDate >= dayStart && logDate <= dayEnd;
        }) || [];

        if (dayLogs.length === 0) continue;

        const dayTaken = dayLogs.filter(log => log.status === 'taken').length;
        const dayTotal = dayLogs.length;

        if (dayTaken === dayTotal) {
          streak++;
        } else {
          break;
        }
      }

      setOverallStats({
        todayPercentage,
        currentWeekPercentage,
        lastWeekPercentage,
        yearlyAverage,
        totalTaken,
        totalScheduled,
        streak
      });
    } catch (error) {
      console.error('Error fetching adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = () => {
    const diff = overallStats.currentWeekPercentage - overallStats.lastWeekPercentage;
    if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = () => {
    const diff = overallStats.currentWeekPercentage - overallStats.lastWeekPercentage;
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceBadge = (percentage: number) => {
    if (percentage >= 95) return <Badge className="bg-green-100 text-green-700 border-green-300">🏆 Excellent</Badge>;
    if (percentage >= 85) return <Badge className="bg-blue-100 text-blue-700 border-blue-300">👍 Good</Badge>;
    if (percentage >= 70) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">⚠️ Fair</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-300">⚡ Needs Improvement</Badge>;
  };

  const pieData = [
    { name: 'Taken', value: overallStats.totalTaken, color: '#10b981' },
    { name: 'Missed', value: overallStats.totalScheduled - overallStats.totalTaken, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-indigo-50/70 backdrop-blur-xl border-2 border-indigo-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading adherence data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-indigo-50/70 backdrop-blur-xl border-2 border-indigo-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <Target className="h-6 w-6 text-indigo-600" />
          Medication Adherence
          {getAdherenceBadge(overallStats.currentWeekPercentage)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Top Row Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-700 font-medium">Today's Adherence</span>
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
            <div className={`text-3xl font-bold mb-1 ${getAdherenceColor(overallStats.todayPercentage)}`}>
              {overallStats.todayPercentage}%
            </div>
            <div className="text-sm text-green-600">
              Current day progress
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-700 font-medium">Weekly Adherence</span>
              {getTrendIcon()}
            </div>
            <div className={`text-3xl font-bold mb-1 ${getAdherenceColor(overallStats.currentWeekPercentage)}`}>
              {overallStats.currentWeekPercentage}%
            </div>
            <div className={`text-sm ${getTrendColor()}`}>
              {overallStats.currentWeekPercentage > overallStats.lastWeekPercentage ? '+' : ''}
              {overallStats.currentWeekPercentage - overallStats.lastWeekPercentage}% from last week
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-700 font-medium">Yearly Average</span>
              <Award className="h-4 w-4 text-purple-600" />
            </div>
            <div className={`text-3xl font-bold mb-1 ${getAdherenceColor(overallStats.yearlyAverage)}`}>
              {overallStats.yearlyAverage}%
            </div>
            <div className="text-sm text-purple-600">
              Based on available data
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trend Line Chart */}
          <div>
            <h3 className="font-semibold text-indigo-800 mb-4">4-Week Adherence Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6366f1"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6366f1"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '2px solid #6366f1',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Adherence']}
                  />
                  <Line 
                    type="monotone"
                    dataKey="percentage" 
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#6366f1', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Yearly Trend Line Chart */}
          <div>
            <h3 className="font-semibold text-indigo-800 mb-4">12-Month Adherence Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#8b5cf6"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#8b5cf6"
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#f8fafc',
                      border: '2px solid #8b5cf6',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Adherence']}
                  />
                  <Line 
                    type="monotone"
                    dataKey="percentage" 
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row - Streak and Overall Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-orange-700 font-medium text-lg">Current Streak</span>
              <Award className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {overallStats.streak}
            </div>
            <div className="text-sm text-orange-600">
              {overallStats.streak === 1 ? 'day' : 'days'} of perfect adherence
            </div>
          </div>

          {/* Overall Progress Pie Chart */}
          <div>
            <h3 className="font-semibold text-indigo-800 mb-4">Overall Progress</h3>
            <div className="flex items-center justify-center">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Taken: {overallStats.totalTaken}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Missed: {overallStats.totalScheduled - overallStats.totalTaken}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicationAdherence;
