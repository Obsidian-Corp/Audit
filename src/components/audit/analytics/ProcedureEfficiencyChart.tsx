import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ProcedureEfficiency } from '@/hooks/useProgramAnalytics';

interface ProcedureEfficiencyChartProps {
  data: ProcedureEfficiency[];
}

export function ProcedureEfficiencyChart({ data }: ProcedureEfficiencyChartProps) {
  const chartData = data
    .slice(0, 10)
    .map(proc => ({
      name: proc.procedure_name.length > 25 
        ? proc.procedure_name.substring(0, 25) + '...'
        : proc.procedure_name,
      variance: proc.variance_percentage,
      estimated: proc.estimated_hours,
      actual: proc.actual_hours,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procedure Efficiency</CardTitle>
        <CardDescription>Actual vs estimated hours variance (%)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              width={150}
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'variance') return [`${value}%`, 'Variance'];
                return [value, name];
              }}
            />
            <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Bar 
              dataKey="variance" 
              fill="hsl(var(--chart-2))"
              background={{ fill: 'hsl(var(--muted))' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
