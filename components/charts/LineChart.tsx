'use client';
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { month: 'Jan', linear: 400, selection: 300, interaction: 200 },
  { month: 'Feb', linear: 300, selection: 500, interaction: 400 },
  { month: 'Mar', linear: 600, selection: 400, interaction: 500 },
  { month: 'Apr', linear: 800, selection: 600, interaction: 700 },
  { month: 'May', linear: 500, selection: 800, interaction: 600 },
  { month: 'Jun', linear: 900, selection: 700, interaction: 800 },
  { month: 'Jul', linear: 1000, selection: 900, interaction: 950 },
  { month: 'Aug', linear: 750, selection: 1000, interaction: 850 },
  { month: 'Sep', linear: 850, selection: 750, interaction: 900 },
  { month: 'Oct', linear: 950, selection: 850, interaction: 1000 },
  { month: 'Nov', linear: 700, selection: 950, interaction: 800 },
  { month: 'Dec', linear: 800, selection: 700, interaction: 750 },
];

export default function CleanBarChart() {
  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barGap={4}
          barCategoryGap={15}
        >
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            ticks={[0, 250, 500, 750, 1000]} 
            axisLine={false} 
            tickLine={false} 
          />
          
          <Tooltip />
          
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
            dataKey="interaction" 
            name="Interactive" 
            fill="#217FD7" 
            barSize={15} 
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Custom Legend */}
      <div className="flex justify-center items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-[10px] h-[10px] rounded-[3px] bg-[#00BA47]"></div>
          <span className="text-sm text-gray-600">Linear Session</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[10px] h-[10px] rounded-[3px] bg-[#6D59F3]"></div>
          <span className="text-sm text-gray-600">Selection Flow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[10px] h-[10px] rounded-[3px] bg-[#217FD7]"></div>
          <span className="text-sm text-gray-600">Interactive</span>
        </div>
      </div>
    </div>
  );
}