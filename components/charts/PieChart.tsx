'use client';
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';

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
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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

      {loading ? (
        <div className="text-sm text-gray-500 mt-2">Loading...</div>
      ) : (
        <div className="flex gap-4 mt-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
