'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Completed', value: 65 },
  { name: 'In Progress', value: 35 },
];

const COLORS = ['#00C27C', '#242B42'];

export default function SessionPieChart() {
  return (
    <div className="flex flex-col items-center h-full p-2">
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}  // Reduced inner radius for thicker bars
              outerRadius={90}  // Increased outer radius for thicker bars
              paddingAngle={0}   // Removed padding for more continuous look
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke="none"  // Removed stroke for cleaner look
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex gap-4 mt-2">  {/* Changed to horizontal layout */}
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"  // Slightly larger dots
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-xs text-gray-600 whitespace-nowrap">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}