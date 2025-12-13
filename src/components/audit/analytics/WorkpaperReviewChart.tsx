import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { WorkpaperReviewMetrics } from '@/hooks/useProgramAnalytics';

interface WorkpaperReviewChartProps {
  data: WorkpaperReviewMetrics[];
}

const COLORS = {
  draft: 'hsl(var(--chart-5))',
  in_review: 'hsl(var(--chart-3))',
  approved: 'hsl(var(--chart-1))',
  rejected: 'hsl(var(--chart-4))',
};

const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function WorkpaperReviewChart({ data }: WorkpaperReviewChartProps) {
  const chartData = data.map(metric => ({
    name: STATUS_LABELS[metric.status as keyof typeof STATUS_LABELS] || metric.status,
    value: metric.count,
    avgDays: metric.avg_review_time_days,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workpaper Review Status</CardTitle>
        <CardDescription>Distribution of workpapers by review status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const status = data[index].status as keyof typeof COLORS;
                return <Cell key={`cell-${index}`} fill={COLORS[status] || 'hsl(var(--muted))'} />;
              })}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (props.payload.avgDays > 0) {
                  return [`${value} (Avg: ${props.payload.avgDays} days)`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
