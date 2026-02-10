import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ChartDataItem {
  name: string;
  value: number;
  key: string;
  fill: string;
}

interface HorizontalBarChartProps {
  title: string;
  data: ChartDataItem[];
  config: ChartConfig;
}

const BAR_HEIGHT = 28;
const CHART_PADDING = 24; // top/bottom for axes
const MAX_LABEL_CHARS = 18;
const CHAR_WIDTH = 6.5; // approx px per char at fontSize 11
const LABEL_PADDING = 8;
const MIN_LABEL_WIDTH = 40;

function truncate(text: string) {
  return text.length > MAX_LABEL_CHARS ? text.slice(0, MAX_LABEL_CHARS - 1) + '\u2026' : text;
}

function TruncatedTick({ x, y, payload }: { x: number; y: number; payload: { value: string } }) {
  const full = payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text x={0} y={0} dy={4} textAnchor="end" fontSize={11} fill="currentColor">
        {truncate(full)}
      </text>
    </g>
  );
}

export const HorizontalBarChart = React.memo(function HorizontalBarChart({
  title,
  data,
  config,
}: HorizontalBarChartProps) {
  const longestTruncated = data.reduce((max, d) => Math.max(max, truncate(d.name).length), 0);
  const yAxisWidth = Math.max(longestTruncated * CHAR_WIDTH + LABEL_PADDING, MIN_LABEL_WIDTH);
  const minHeight = data.length * BAR_HEIGHT + CHART_PADDING;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <ChartContainer config={config} className="h-full w-full" style={{ minHeight, aspectRatio: 'unset' }}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={TruncatedTick as never}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as ChartDataItem;
                const total = data.reduce((sum, d) => sum + d.value, 0);
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                return (
                  <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-xl">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.value} ({pct}%)
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
              activeBar={{ opacity: 0.8 }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
