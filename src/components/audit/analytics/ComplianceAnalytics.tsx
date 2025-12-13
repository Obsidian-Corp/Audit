import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { Shield, AlertTriangle, CheckCircle, Calendar, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useComplianceAnalytics } from "@/hooks/useComplianceAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

// Keep mock data that was removed for now
const complianceStandards_OLD = [
  { 
    name: 'SOX (Sarbanes-Oxley)', 
    score: 92, 
    status: 'compliant',
    lastAudit: '2024-01-05',
    nextAudit: '2024-04-05',
    violations: 2,
    controls: 145
  },
  { 
    name: 'IFRS (Financial Reporting)', 
    score: 88, 
    status: 'compliant',
    lastAudit: '2023-12-20',
    nextAudit: '2024-03-20',
    violations: 3,
    controls: 98
  },
  { 
    name: 'GAAP (US Standards)', 
    score: 94, 
    status: 'compliant',
    lastAudit: '2024-01-10',
    nextAudit: '2024-04-10',
    violations: 1,
    controls: 112
  },
  { 
    name: 'GDPR (Data Privacy)', 
    score: 78, 
    status: 'partially-compliant',
    lastAudit: '2023-12-15',
    nextAudit: '2024-03-15',
    violations: 8,
    controls: 76
  },
  { 
    name: 'ISO 27001 (Security)', 
    score: 85, 
    status: 'compliant',
    lastAudit: '2024-01-08',
    nextAudit: '2024-04-08',
    violations: 5,
    controls: 114
  },
];

const overallScore = {
  current: 87.4,
  previous: 84.2,
  change: +3.2,
  trend: 'improving'
};

const violationsLog = [
  {
    id: 'VIO-2024-012',
    standard: 'GDPR',
    severity: 'high',
    description: 'Data retention policy not enforced',
    discoveredDate: '2024-01-08',
    dueDate: '2024-02-08',
    status: 'open',
    owner: 'Sarah Johnson'
  },
  {
    id: 'VIO-2024-011',
    standard: 'SOX',
    severity: 'medium',
    description: 'Missing segregation of duties documentation',
    discoveredDate: '2024-01-05',
    dueDate: '2024-02-05',
    status: 'in-progress',
    owner: 'Mike Chen'
  },
  {
    id: 'VIO-2024-010',
    standard: 'ISO 27001',
    severity: 'high',
    description: 'Incomplete access control review',
    discoveredDate: '2024-01-03',
    dueDate: '2024-01-31',
    status: 'in-progress',
    owner: 'Emily Davis'
  },
  {
    id: 'VIO-2024-009',
    standard: 'IFRS',
    severity: 'low',
    description: 'Minor disclosure omissions',
    discoveredDate: '2023-12-28',
    dueDate: '2024-01-28',
    status: 'resolved',
    owner: 'John Smith'
  },
  {
    id: 'VIO-2024-008',
    standard: 'GDPR',
    severity: 'critical',
    description: 'Unauthorized data transfer detected',
    discoveredDate: '2023-12-20',
    dueDate: '2024-01-20',
    status: 'overdue',
    owner: 'Robert Wilson'
  },
];

const regulatoryDeadlines = [
  { name: 'SOX 404 Assessment', dueDate: '2024-03-31', daysLeft: 79, priority: 'high' },
  { name: 'GDPR Annual Report', dueDate: '2024-05-25', daysLeft: 134, priority: 'medium' },
  { name: 'ISO 27001 Recertification', dueDate: '2024-06-15', daysLeft: 155, priority: 'high' },
  { name: 'IFRS Quarterly Filing', dueDate: '2024-02-15', daysLeft: 34, priority: 'critical' },
  { name: 'GAAP Disclosure Update', dueDate: '2024-03-15', daysLeft: 63, priority: 'medium' },
];

const controlsEffectiveness = [
  { category: 'Access Controls', score: 92 },
  { category: 'Data Protection', score: 78 },
  { category: 'Financial Controls', score: 94 },
  { category: 'Operational Controls', score: 88 },
  { category: 'IT Controls', score: 85 },
  { category: 'Compliance Monitoring', score: 90 },
];

const radarData = [
  { subject: 'SOX', A: 92, fullMark: 100 },
  { subject: 'IFRS', A: 88, fullMark: 100 },
  { subject: 'GAAP', A: 94, fullMark: 100 },
  { subject: 'GDPR', A: 78, fullMark: 100 },
  { subject: 'ISO 27001', A: 85, fullMark: 100 },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string }> = {
    compliant: { className: 'bg-success/20 text-success border-success' },
    'partially-compliant': { className: 'bg-warning/20 text-warning border-warning' },
    'non-compliant': { className: 'bg-destructive/20 text-destructive border-destructive' },
  };
  const config = variants[status] || variants.compliant;
  return <Badge variant="outline" className={config.className}>{status.toUpperCase().replace('-', ' ')}</Badge>;
};

const getSeverityBadge = (severity: string) => {
  const variants: Record<string, { className: string }> = {
    critical: { className: 'bg-destructive/20 text-destructive border-destructive' },
    high: { className: 'bg-warning/20 text-warning border-warning' },
    medium: { className: 'bg-info/20 text-info border-info' },
    low: { className: 'bg-success/20 text-success border-success' },
  };
  const config = variants[severity] || variants.low;
  return <Badge variant="outline" className={config.className}>{severity.toUpperCase()}</Badge>;
};

const getViolationStatusBadge = (status: string) => {
  const variants: Record<string, { className: string }> = {
    open: { className: 'bg-info/20 text-info border-info' },
    'in-progress': { className: 'bg-warning/20 text-warning border-warning' },
    overdue: { className: 'bg-destructive/20 text-destructive border-destructive' },
    resolved: { className: 'bg-success/20 text-success border-success' },
  };
  const config = variants[status] || variants.open;
  return <Badge variant="outline" className={config.className}>{status.replace('-', ' ').toUpperCase()}</Badge>;
};

const getPriorityBadge = (priority: string) => {
  const variants: Record<string, { className: string }> = {
    critical: { className: 'bg-destructive/20 text-destructive border-destructive' },
    high: { className: 'bg-warning/20 text-warning border-warning' },
    medium: { className: 'bg-info/20 text-info border-info' },
    low: { className: 'bg-success/20 text-success border-success' },
  };
  const config = variants[priority] || variants.medium;
  return <Badge variant="outline" className={config.className}>{priority.toUpperCase()}</Badge>;
};

export function ComplianceAnalytics() {
  const { standards, violations, deadlines, controlEffectiveness, overallScore, isLoading } = useComplianceAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const radarData = standards.map(s => ({
    subject: s.name.split(' ')[0],
    A: s.score,
    fullMark: 100,
  }));

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className="border-border bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Overall Compliance Score</p>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-bold text-foreground">{overallScore.current}%</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <span className="text-lg font-semibold text-success">+{overallScore.change}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Compared to previous quarter</p>
            </div>
            <div className="p-4 bg-success/10 rounded-full">
              <Shield className="w-16 h-16 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scorecard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        {/* Scorecard Tab */}
        <TabsContent value="scorecard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Compliance Standards Table */}
            <Card className="border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Standards Compliance Scorecard</CardTitle>
                <CardDescription>Current compliance status across all regulatory standards</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Standard</TableHead>
                      <TableHead className="font-semibold">Score</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Controls</TableHead>
                      <TableHead className="font-semibold">Violations</TableHead>
                      <TableHead className="font-semibold">Last Audit</TableHead>
                      <TableHead className="font-semibold">Next Audit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standards.map((standard) => (
                      <TableRow key={standard.name} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{standard.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={standard.score} className="w-20 h-2" />
                            <span className="text-sm font-semibold">{standard.score}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(standard.status)}</TableCell>
                        <TableCell className="text-center font-semibold">{standard.controls}</TableCell>
                        <TableCell className="text-center">
                          {standard.violations > 0 ? (
                            <Badge variant="destructive" className="font-semibold">{standard.violations}</Badge>
                          ) : (
                            <CheckCircle className="w-5 h-5 text-success mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{standard.lastAudit}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{standard.nextAudit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Compliance Radar</CardTitle>
                <CardDescription>Visual representation of compliance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '10px' }}
                    />
                    <Radar 
                      name="Compliance Score" 
                      dataKey="A" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Compliance Summary</CardTitle>
                <CardDescription>Key compliance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-sm font-medium">Fully Compliant</span>
                    </div>
                    <span className="text-xl font-bold text-success">
                      {standards.filter(s => s.status === 'compliant').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      <span className="text-sm font-medium">Partially Compliant</span>
                    </div>
                    <span className="text-xl font-bold text-warning">
                      {standards.filter(s => s.status === 'partially-compliant').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <span className="text-sm font-medium">Total Violations</span>
                    </div>
                    <span className="text-xl font-bold text-destructive">
                      {standards.reduce((sum, s) => sum + s.violations, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-info/10 border border-info/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-info" />
                      <span className="text-sm font-medium">Active Controls</span>
                    </div>
                    <span className="text-xl font-bold text-info">
                      {standards.reduce((sum, s) => sum + s.controls, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Compliance Violations Log</CardTitle>
              <CardDescription>Active and resolved compliance violations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Standard</TableHead>
                    <TableHead className="font-semibold">Severity</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Discovered</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Owner</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow key={violation.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs">{violation.id}</TableCell>
                      <TableCell className="font-medium">{violation.standard}</TableCell>
                      <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                      <TableCell className="max-w-xs">{violation.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{violation.discoveredDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{violation.dueDate}</TableCell>
                      <TableCell>{getViolationStatusBadge(violation.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{violation.owner}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Regulatory Deadlines Tracker</CardTitle>
              <CardDescription>Upcoming compliance deadlines and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deadlines.map((deadline) => (
                  <div 
                    key={deadline.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{deadline.name}</p>
                        <p className="text-sm text-muted-foreground">Due: {deadline.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{deadline.daysLeft}</p>
                        <p className="text-xs text-muted-foreground">days left</p>
                      </div>
                      {getPriorityBadge(deadline.priority)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Controls Effectiveness Dashboard</CardTitle>
              <CardDescription>Effectiveness scores across control categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={controlsEffectiveness} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="category" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Effectiveness']}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}