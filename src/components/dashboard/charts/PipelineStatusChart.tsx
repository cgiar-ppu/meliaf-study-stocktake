import React from 'react';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PipelineData {
  planned: number;
  ongoing: number;
  complete: number;
  total: number;
}

interface PipelineStatusChartProps {
  title: string;
  data: PipelineData;
  config: ChartConfig;
}

const SEGMENT_COLORS = {
  planned: 'hsl(41, 65%, 55%)',
  ongoing: 'hsl(210, 80%, 45%)',
  complete: 'hsl(161, 100%, 20%)',
};

export const PipelineStatusChart = React.memo(function PipelineStatusChart({
  title,
  data,
  config,
}: PipelineStatusChartProps) {
  const chartData = [data];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ChartContainer config={config} className="w-full" style={{ height: 60, aspectRatio: 'unset' }}>
          <BarChart
            layout="vertical"
            data={chartData}
            stackOffset="expand"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="total" hide />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-xl">
                    {payload.map((p) => {
                      const key = p.dataKey as string;
                      const label = config[key]?.label ?? key;
                      const count = p.value as number;
                      const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(0) : '0';
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-[2px]"
                            style={{ backgroundColor: SEGMENT_COLORS[key as keyof typeof SEGMENT_COLORS] }}
                          />
                          <span>
                            {label}: {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="planned"
              stackId="pipeline"
              fill={SEGMENT_COLORS.planned}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
              radius={[4, 0, 0, 4]}
            />
            <Bar
              dataKey="ongoing"
              stackId="pipeline"
              fill={SEGMENT_COLORS.ongoing}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="complete"
              stackId="pipeline"
              fill={SEGMENT_COLORS.complete}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
          {(['planned', 'ongoing', 'complete'] as const).map((key) => {
            const count = data[key];
            if (count === 0) return null;
            const label = config[key]?.label ?? key;
            const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(0) : '0';
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: SEGMENT_COLORS[key] }}
                />
                <span className="text-muted-foreground">
                  {label}: {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
