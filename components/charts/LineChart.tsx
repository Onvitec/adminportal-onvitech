'use client';
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../../lib/supabase';

interface SessionData {
  month: string;
  linear: number;
  selection: number;
  interactive: number;
}

interface DatabaseSession {
  created_at: string;
  session_type: 'linear' | 'selection' | 'interactive';
}

export default function CleanBarChart() {
  const [data, setData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        const { data: sessions, error: fetchError } = await supabase
          .from('sessions')
          .select('created_at, session_type')
          .gte('created_at', startOfYear.toISOString());

        if (fetchError) throw fetchError;
        if (!sessions) throw new Error('No session data found');

        const processed = processSessionData(sessions as DatabaseSession[]);
        setData(processed);
      } catch (err) {
        console.error('Error fetching session data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, []);

  const processSessionData = (sessions: DatabaseSession[]): SessionData[] => {
    // Initialize all 12 months
    const months: SessionData[] = monthNames.map((month) => ({
      month,
      linear: 0,
      selection: 0,
      interactive: 0
    }));

    sessions.forEach((session) => {
      const sessionDate = new Date(session.created_at);
      const monthIndex = sessionDate.getMonth(); // 0 = Jan
      if (session.session_type === 'linear') months[monthIndex].linear += 1;
      if (session.session_type === 'selection') months[monthIndex].selection += 1;
      if (session.session_type === 'interactive') months[monthIndex].interactive += 1;
    });

    return months;
  };

  const maxValue = Math.max(...data.flatMap(item => [item.linear, item.selection, item.interactive]));
  const yTicks = maxValue <= 5 ? [0, 1, 2, 3, 4, 5,6,7,8,9,10,11,12] : Array.from({ length: 6 }, (_, i) => Math.ceil((maxValue / 5) * i));

  if (loading) {
    return (
      <div className="w-full md:h-[450px] h-[300px] flex items-center justify-center">
        <div className="text-gray-500">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[450px] flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          barGap={4}
          barCategoryGap={15}
        >
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            interval={0}
          />
          <YAxis
            ticks={yTicks}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            width={40}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: '6px',
              padding: '8px'
            }}
          />
          <Bar
            dataKey="linear"
            name="Linear Session"
            fill="#00BA47"
            barSize={15}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="selection"
            name="Selection Flow"
            fill="#6D59F3"
            barSize={15}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="interactive"
            name="Interactive"
            fill="#217FD7"
            barSize={15}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center items-center gap-3 mt-2 px-2">
        <LegendItem color="#00BA47" label="Linear" />
        <LegendItem color="#6D59F3" label="Selection" />
        <LegendItem color="#217FD7" label="Interactive" />
      </div>
    </div>
  );
}

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-[10px] h-[10px] rounded-[3px]" style={{ backgroundColor: color }}></div>
    <span className="text-xs sm:text-sm text-gray-600">{label}</span>
  </div>
);
