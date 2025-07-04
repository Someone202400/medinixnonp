
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AdherenceData {
  date: string;
  taken: number;
  missed: number;
  total: number;
  percentage: number;
}

const MedicationAdherence = () => {
  const { user } = useAuth();
  const [adherenceData, setAdherenceData] = useState<AdherenceData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({
    totalDoses: 0,
    takenDoses: 0,
    missedDoses: 0,
    adherenceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdherenceData();
    }
  }, [user]);

  const fetchAdherenceData = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'MMM dd'),
          taken: 0,
          missed: 0,
          total: 0,
          percentage: 0
        };
      });

      // Get medication logs for the last 7 days (exclude archived)
      const startDate = startOfDay(subDays(new Date(), 6));
      const endDate = endOfDay(new Date());

      const { data: logs, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('scheduled_time', startDate.toISOString())
        .lte('scheduled_time', endDate.toISOString())
        .neq('status', 'archived');

      if (error) throw error;

      // Process logs by date
      const dataByDate: { [key: string]: { taken: number; missed: number; total: number } } = {};

      logs?.forEach(log => {
        const logDate = format(new Date(log.scheduled_time), 'yyyy-MM-dd');
        if (!dataByDate[logDate]) {
          dataByDate[logDate] = { taken: 0, missed: 0, total: 0 };
        }
        
        dataByDate[logDate].total++;
        if (log.status === 'taken') {
          dataByDate[logDate].taken++;
        } else if (log.status === 'missed') {
          dataByDate[logDate].missed++;
        }
      });

      // Update the last7Days array with actual data
      const processedData = last7Days.map(day => {
        const dayData = dataByDate[day.date] || { taken: 0, missed: 0, total: 0 };
        const percentage = dayData.total > 0 ? Math.round((dayData.taken / dayData.total) * 100) : 0;
        
        return {
          date: day.displayDate,
          taken: dayData.taken,
          missed: dayData.missed,
          total: dayData.total,
          percentage
        };
      });

      setAdherenceData(processedData);

      // Calculate weekly stats
      const totalDoses = processedData.reduce((sum, day) => sum + day.total, 0);
      const takenDoses = processedData.reduce((sum, day) => sum + day.taken, 0);
      const missedDoses = processedData.reduce((sum, day) => sum + day.missed, 0);
      const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

      setWeeklyStats({
        totalDoses,
        takenDoses,
        missedDoses,
        adherenceRate
      });

    } catch (error) {
      console.error('Error fetching adherence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    percentage: {
      label: "Adherence %",
      color: "#3b82f6",
    },
    taken: {
      label: "Taken",
      color: "#10b981",
    },
    missed: {
      label: "Missed",
      color: "#ef4444",
    },
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-xl border-2 border-emerald-200/30 shadow-2xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading adherence data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white/90 to-emerald-50/70 backdrop-blur-xl border-2 border-emerald-200/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
          Medication Adherence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weekly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Total Doses</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalDoses}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-800">Taken</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{weeklyStats.takenDoses}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-800">Missed</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">{weeklyStats.missedDoses}</p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Adherence</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">{weeklyStats.adherenceRate}%</p>
          </div>
        </div>

        {/* Adherence Line Chart */}
        {adherenceData.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">7-Day Adherence Trend</h3>
            <ChartContainer config={chartConfig} className="h-64">
              <LineChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  domain={[0, 100]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="var(--color-percentage)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-percentage)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "var(--color-percentage)", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>

            {/* Daily Breakdown Bar Chart */}
            <h3 className="text-lg font-semibold text-gray-800">Daily Breakdown</h3>
            <ChartContainer config={chartConfig} className="h-48">
              <BarChart data={adherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="taken" fill="var(--color-taken)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="missed" fill="var(--color-missed)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No adherence data yet</p>
            <p className="text-gray-400">Start taking your medications to see your adherence trends</p>
          </div>
        )}

        {/* Insights */}
        {weeklyStats.adherenceRate > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Insights</h3>
            {weeklyStats.adherenceRate >= 90 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">🎉 Excellent Adherence!</h4>
                <p className="text-green-700">You're maintaining excellent medication compliance. Keep up the great work!</p>
              </div>
            )}
            {weeklyStats.adherenceRate >= 70 && weeklyStats.adherenceRate < 90 && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Good Progress</h4>
                <p className="text-yellow-700">You're doing well, but there's room for improvement. Consider setting up reminders.</p>
              </div>
            )}
            {weeklyStats.adherenceRate < 70 && weeklyStats.adherenceRate > 0 && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">📊 Needs Attention</h4>
                <p className="text-red-700">Your adherence could be improved. Talk to your healthcare provider about strategies to help you stay on track.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicationAdherence;
