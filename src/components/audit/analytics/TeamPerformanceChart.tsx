import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { TeamPerformance } from '@/hooks/useProgramAnalytics';

interface TeamPerformanceChartProps {
  data: TeamPerformance[];
}

export function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  const chartData = data.map(member => ({
    name: member.user_name.split(' ')[0],
    completed: member.completed,
    'in progress': member.in_progress,
    overdue: member.overdue,
    'completion rate': member.completion_rate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
        <CardDescription>Procedure completion and rates by team member</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="completed" fill="hsl(var(--chart-1))" stackId="a" />
            <Bar yAxisId="left" dataKey="in progress" fill="hsl(var(--chart-3))" stackId="a" />
            <Bar yAxisId="left" dataKey="overdue" fill="hsl(var(--chart-5))" stackId="a" />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="completion rate" 
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
