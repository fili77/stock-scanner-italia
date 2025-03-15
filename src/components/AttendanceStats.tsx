
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type AttendanceStatProps = {
  date: string;
  count: number;
  percentage: number;
};

type AttendanceStatsProps = {
  courseId: string;
  courseName: string;
  stats: AttendanceStatProps[];
};

const AttendanceStats = ({ courseId, courseName, stats }: AttendanceStatsProps) => {
  const chartData = stats.map(stat => ({
    date: stat.date,
    attendance: stat.percentage,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{courseName} Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 0,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <YAxis 
                tickFormatter={(value) => `${value}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={40}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Attendance']}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                }}
              />
              <Bar 
                dataKey="attendance" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                barSize={24}
                animationDuration={500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceStats;
