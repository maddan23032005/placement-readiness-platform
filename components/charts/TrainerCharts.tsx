"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useEffect, useState } from "react";

function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");
    setIsDark(checkDark());
    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

interface BatchData {
  name: string;
  score: number;
}

export function TrainerBatchChart({ data }: { data: BatchData[] }) {
  const isDark = useIsDark();
  const textColor = isDark ? "hsl(var(--text-muted))" : "hsl(var(--text-secondary))";
  const gridColor = isDark ? "hsl(var(--border))" : "hsl(var(--border))";
  const brandColor = "hsl(var(--brand))";
  const brandLight = isDark ? "hsla(var(--brand), 0.3)" : "hsl(var(--brand-light))";

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--text-muted))]">
        No batch performance data available yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
          />
          <YAxis 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip
            cursor={{ fill: brandLight }}
            contentStyle={{ 
              backgroundColor: isDark ? 'hsl(var(--surface))' : 'white',
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? 'white' : 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar 
            dataKey="score" 
            name="Avg Score %"
            fill={brandColor} 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface QuestionData {
  name: string;
  value: number;
}

const COLORS = [
  'hsl(var(--brand))', 
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b'  // slate
];

export function TrainerQuestionChart({ data }: { data: QuestionData[] }) {
  const isDark = useIsDark();
  const gridColor = isDark ? "hsl(var(--border))" : "hsl(var(--border))";

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--text-muted))]">
        No questions in the question bank yet.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'hsl(var(--surface))' : 'white',
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? 'white' : 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className={isDark ? "text-[hsl(var(--text-muted))]" : "text-[hsl(var(--text-secondary))]"}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
