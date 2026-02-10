import React from 'react';
import { PieChart, Pie, Cell, Label, Sector } from 'recharts';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DonutDataItem {
  name: string;
  value: number;
  key: string;
  fill: string;
}

interface DonutChartProps {
  title: string;
  data: DonutDataItem[];
  config: ChartConfig;
}

export const DonutChart = React.memo(function DonutChart({
  title,
  data,
  config,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ChartContainer config={config} className="mx-auto" style={{ height: 200, aspectRatio: 'unset' }}>
          <PieChart>
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as DonutDataItem;
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
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              isAnimationActive
              animationDuration={400}
              animationBegin={0}
              activeShape={(props: PieSectorDataItem) => (
                <Sector
                  {...props}
                  outerRadius={(props.outerRadius ?? 80) + 4}
                  opacity={0.9}
                />
              )}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-1">
          {data.map((item) => (
            <div key={item.key} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
