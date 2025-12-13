import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkline } from "@/components/ui/sparkline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFindingsAnalytics } from "@/hooks/useFindingsAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

// Repeat findings data - this would ideally come from the backend
const repeatFindings = [
  { entity: 'Sales Operations', count: 8, trend: 'increasing' as const },
  { entity: 'Finance', count: 5, trend: 'stable' as const },
  { entity: 'IT Systems', count: 12, trend: 'increasing' as const },
  { entity: 'Procurement', count: 3, trend: 'decreasing' as const },
  { entity: 'Warehouse', count: 6, trend: 'stable' as const },
];

// Resolution rate data - this would ideally come from the backend
const resolutionRateData = [
  { month: 'Jul', rate: 78 },
  { month: 'Aug', rate: 82 },
  { month: 'Sep', rate: 75 },
  { month: 'Oct', rate: 88 },
  { month: 'Nov', rate: 85 },
  { month: 'Dec', rate: 92 },
];

const getSeverityBadge = (severity: string) => {
  const variants: Record<string, { variant: any; className: string }> = {
    critical: { variant: 'destructive', className: 'bg-destructive/20 text-destructive border-destructive' },
    high: { variant: 'default', className: 'bg-warning/20 text-warning border-warning' },
    medium: { variant: 'secondary', className: 'bg-info/20 text-info border-info' },
    low: { variant: 'outline', className: 'bg-success/20 text-success border-success' },
  };
  const config = variants[severity] || variants.low;
  return <Badge variant={config.variant} className={config.className}>{severity.toUpperCase()}</Badge>;
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string }> = {
    open: { className: 'bg-info/20 text-info border-info' },
    'in-progress': { className: 'bg-warning/20 text-warning border-warning' },
    overdue: { className: 'bg-destructive/20 text-destructive border-destructive' },
    resolved: { className: 'bg-success/20 text-success border-success' },
  };
  const config = variants[status] || variants.open;
  return <Badge variant="outline" className={config.className}>{status.replace('-', ' ').toUpperCase()}</Badge>;
};

export function FindingsAnalytics() {
  const { findings, summary, agingData, severityDistribution, isLoading } = useFindingsAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item) => (
          <Card key={item.label} className="bg-card/50 border-border">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  {item.change !== 0 && (
                    <span className={`text-xs font-medium ${item.change > 0 ? 'text-warning' : 'text-success'}`}>
                      {item.change > 0 ? '+' : ''}{item.change}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="aging">Aging Analysis</TabsTrigger>
          <TabsTrigger value="repeat">Repeat Findings</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Rate</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Active Findings</CardTitle>
                  <CardDescription>Real-time findings tracker with drill-down capability</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severity</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">ID</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold">Entity</TableHead>
                      <TableHead className="font-semibold">Severity</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Age (Days)</TableHead>
                      <TableHead className="font-semibold">Owner</TableHead>
                      <TableHead className="font-semibold">Due Date</TableHead>
                      <TableHead className="font-semibold">Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No findings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      findings.map((finding) => (
                        <TableRow key={finding.id} className="hover:bg-muted/20 cursor-pointer">
                          <TableCell className="font-mono text-xs">{finding.id}</TableCell>
                          <TableCell className="font-medium max-w-xs">{finding.title}</TableCell>
                          <TableCell className="text-muted-foreground">{finding.entity}</TableCell>
                          <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                          <TableCell>{getStatusBadge(finding.status)}</TableCell>
                          <TableCell className="text-right font-semibold">{finding.age}</TableCell>
                          <TableCell className="text-muted-foreground">{finding.owner}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{finding.dueDate}</TableCell>
                          <TableCell>
                            {finding.trend.some(v => v > 0) && (
                              <Sparkline
                                data={finding.trend}
                                height={30}
                                color={finding.trend[finding.trend.length - 1] > finding.trend[0] ? 'hsl(var(--warning))' : 'hsl(var(--success))'}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Severity Distribution Chart */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4">Severity Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={severityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {severityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-4">Key Metrics</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Critical Findings</span>
                      <span className="text-lg font-bold text-destructive">
                        {severityDistribution.find(s => s.name === 'Critical')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">High Priority</span>
                      <span className="text-lg font-bold text-warning">
                        {severityDistribution.find(s => s.name === 'High')?.value || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Open &gt; 30 Days</span>
                      <span className="text-lg font-bold text-warning">
                        {agingData.filter(a => a.range.includes('31-60') || a.range.includes('60+')).reduce((sum, a) => sum + a.count, 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Findings</span>
                      <span className="text-lg font-bold text-success">
                        {severityDistribution.reduce((sum, s) => sum + s.value, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aging Analysis Tab */}
        <TabsContent value="aging" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Findings Aging Analysis</CardTitle>
              <CardDescription>Distribution of open findings by age</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={agingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="range" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Repeat Findings Tab */}
        <TabsContent value="repeat" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Repeat Findings Tracker</CardTitle>
              <CardDescription>Recurring issues by entity with trend indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Entity</TableHead>
                    <TableHead className="font-semibold text-right">Repeat Count</TableHead>
                    <TableHead className="font-semibold">Trend</TableHead>
                    <TableHead className="font-semibold text-right">Action Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repeatFindings.map((item) => (
                    <TableRow key={item.entity} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{item.entity}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="font-semibold">
                          {item.count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.trend === 'increasing' && (
                          <div className="flex items-center gap-1 text-destructive">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Increasing</span>
                          </div>
                        )}
                        {item.trend === 'stable' && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-sm font-medium">Stable</span>
                          </div>
                        )}
                        {item.trend === 'decreasing' && (
                          <div className="flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4 rotate-180" />
                            <span className="text-sm font-medium">Decreasing</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resolution Rate Tab */}
        <TabsContent value="resolution" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Finding Resolution Rate</CardTitle>
              <CardDescription>Monthly resolution performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={resolutionRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Resolution Rate']}
                  />
                  <Bar dataKey="rate" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}