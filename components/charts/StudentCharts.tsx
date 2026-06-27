"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useEffect, useState } from "react";

// Hook to detect dark mode for recharts styling
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

interface RadarData {
  topic: string;
  score: number; // percentage 0-100
  fullMark: number; // usually 100
}

export function StudentRadarChart({ data }: { data: RadarData[] }) {
  const isDark = useIsDark();
  const textColor = isDark ? "hsl(var(--text-muted))" : "hsl(var(--text-secondary))";
  const gridColor = isDark ? "hsl(var(--border))" : "hsl(var(--border))";
  const brandColor = "hsl(var(--brand))";
  const brandLight = isDark ? "hsla(var(--brand), 0.3)" : "hsl(var(--brand-light))";

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--text-muted))]">
        Not enough data yet. Complete tests across different topics to see your skill mastery.
      </div>
    );
  }

  // Ensure we have at least 3 points for a radar chart
  let chartData = [...data];
  while (chartData.length > 0 && chartData.length < 3) {
    chartData.push({ topic: `Empty ${chartData.length}`, score: 0, fullMark: 100 });
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke={gridColor} />
          <PolarAngleAxis 
            dataKey="topic" 
            tick={{ fill: textColor, fontSize: 12, fontWeight: 500 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score %"
            dataKey="score"
            stroke={brandColor}
            fill={brandLight}
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? 'hsl(var(--surface))' : 'white',
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? 'white' : 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendData {
  name: string; // Test name or Date
  score: number; // percentage
}

export function StudentTrendChart({ data }: { data: TrendData[] }) {
  const isDark = useIsDark();
  const textColor = isDark ? "hsl(var(--text-muted))" : "hsl(var(--text-secondary))";
  const gridColor = isDark ? "hsl(var(--border))" : "hsl(var(--border))";
  const brandColor = "hsl(var(--brand))";

  if (!data || data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[hsl(var(--text-muted))]">
        Complete at least 2 tests to see your performance trend over time.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
            tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
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
            contentStyle={{ 
              backgroundColor: isDark ? 'hsl(var(--surface))' : 'white',
              borderColor: gridColor,
              borderRadius: '8px',
              color: isDark ? 'white' : 'black',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Score %"
            stroke={brandColor}
            strokeWidth={3}
            dot={{ r: 4, fill: brandColor, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: brandColor, stroke: 'white', strokeWidth: 2 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
