'use client';
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { Loader } from '../Loader';

const COLORS = ['#00C27C', '#242B42']; // Green = Completed, Dark = In Progress

export default function SessionPieChart() {
  const [data, setData] = useState([
    { name: 'Completed', value: 0 },
    { name: 'In Progress', value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionStats = async () => {
      setLoading(true);
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('is_active');

      if (error) {
        console.error('Failed to fetch session data:', error);
        setLoading(false);
        return;
      }

      const completedCount = sessions?.filter(s => !s.is_active).length || 0;
      const inProgressCount = sessions?.filter(s => s.is_active).length || 0;

      setData([
        { name: 'Completed', value: completedCount },
        { name: 'In Progress', value: inProgressCount },
      ]);

      setLoading(false);
    };

    fetchSessionStats();
  }, []);

  return (
    <div className="flex flex-col items-center h-full p-2">
      {/* Chart */}
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {loading ? (
        <div className="text-sm text-gray-500 mt-2">
          <Loader size="sm" />
        </div>
      ) : (
        <div className="flex flex-col gap-2 mt-4 w-full px-4">
          {data.map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center justify-between text-sm text-gray-700 font-medium"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span>
                  {entry.name === 'Completed'
                    ? 'Completed Sessions'
                    : 'In Progress Sessions'}
                </span>
              </div>
              <span>{entry.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
