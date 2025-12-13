import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ProgramMetrics } from '@/hooks/useProgramAnalytics';

interface ProgramCompletionChartProps {
  data: ProgramMetrics[];
}

const COLORS = {
  completed: 'hsl(var(--chart-1))',
  in_progress: 'hsl(var(--chart-3))',
  not_started: 'hsl(var(--chart-5))',
};

export function ProgramCompletionChart({ data }: ProgramCompletionChartProps) {
  const chartData = data.map(program => ({
    name: program.program_name.length > 20 
      ? program.program_name.substring(0, 20) + '...'
      : program.program_name,
    completed: program.completed_procedures,
    'in progress': program.in_progress_procedures,
    'not started': program.not_started_procedures,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Completion Status</CardTitle>
        <CardDescription>Procedure status across engagement programs</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="completed" fill={COLORS.completed} stackId="a" />
            <Bar dataKey="in progress" fill={COLORS.in_progress} stackId="a" />
            <Bar dataKey="not started" fill={COLORS.not_started} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
