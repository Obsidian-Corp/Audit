import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FileText, Download, Eye, Calendar, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
const reportsSummary = [
  { label: 'Reports Generated', value: 124, icon: FileText, trend: '+15%' },
  { label: 'Draft Reports', value: 18, icon: Calendar, trend: '+3' },
  { label: 'Distributed', value: 106, icon: Users, trend: '86%' },
  { label: 'Avg Generation Time', value: '4.2 hrs', icon: TrendingUp, trend: '-12%' },
];

const recentReports = [
  {
    id: 'RPT-2024-045',
    title: 'Q4 Financial Controls Audit Report',
    type: 'Financial Audit',
    status: 'published',
    opinion: 'qualified',
    generatedDate: '2024-01-10',
    author: 'Sarah Johnson',
    recipients: 12,
    downloads: 28,
  },
  {
    id: 'RPT-2024-044',
    title: 'IT Security Assessment',
    type: 'IT Audit',
    status: 'published',
    opinion: 'adverse',
    generatedDate: '2024-01-08',
    author: 'Mike Chen',
    recipients: 8,
    downloads: 15,
  },
  {
    id: 'RPT-2024-043',
    title: 'Procurement Process Review',
    type: 'Operational Audit',
    status: 'in-review',
    opinion: 'unqualified',
    generatedDate: '2024-01-05',
    author: 'Emily Davis',
    recipients: 5,
    downloads: 0,
  },
  {
    id: 'RPT-2024-042',
    title: 'Revenue Recognition Compliance',
    type: 'Compliance Audit',
    status: 'published',
    opinion: 'unqualified',
    generatedDate: '2024-01-03',
    author: 'John Smith',
    recipients: 15,
    downloads: 42,
  },
  {
    id: 'RPT-2024-041',
    title: 'Annual SOX 404 Assessment',
    type: 'Regulatory Audit',
    status: 'draft',
    opinion: 'qualified',
    generatedDate: '2024-01-02',
    author: 'Robert Wilson',
    recipients: 0,
    downloads: 0,
  },
  {
    id: 'RPT-2024-040',
    title: 'Inventory Management Audit',
    type: 'Operational Audit',
    status: 'published',
    opinion: 'unqualified',
    generatedDate: '2023-12-28',
    author: 'Lisa Anderson',
    recipients: 10,
    downloads: 22,
  },
];

const opinionDistribution = [
  { name: 'Unqualified', value: 68, fill: 'hsl(var(--success))' },
  { name: 'Qualified', value: 42, fill: 'hsl(var(--warning))' },
  { name: 'Adverse', value: 12, fill: 'hsl(var(--destructive))' },
  { name: 'Disclaimer', value: 2, fill: 'hsl(var(--muted))' },
];

const reportTypeDistribution = [
  { type: 'Financial Audit', count: 45 },
  { type: 'IT Audit', count: 28 },
  { type: 'Operational Audit', count: 32 },
  { type: 'Compliance Audit', count: 19 },
];

const generationTimeline = [
  { month: 'Jul', count: 18 },
  { month: 'Aug', count: 22 },
  { month: 'Sep', count: 16 },
  { month: 'Oct', count: 24 },
  { month: 'Nov', count: 20 },
  { month: 'Dec', count: 24 },
];

const distributionStatus = [
  { status: 'Delivered', count: 94, percentage: 88.7 },
  { status: 'Viewed', count: 78, percentage: 73.6 },
  { status: 'Downloaded', count: 64, percentage: 60.4 },
  { status: 'Acknowledged', count: 52, percentage: 49.1 },
];

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string }> = {
    published: { className: 'bg-success/20 text-success border-success' },
    'in-review': { className: 'bg-warning/20 text-warning border-warning' },
    draft: { className: 'bg-info/20 text-info border-info' },
  };
  const config = variants[status] || variants.draft;
  return <Badge variant="outline" className={config.className}>{status.replace('-', ' ').toUpperCase()}</Badge>;
};

const getOpinionBadge = (opinion: string) => {
  const variants: Record<string, { className: string }> = {
    unqualified: { className: 'bg-success/20 text-success border-success' },
    qualified: { className: 'bg-warning/20 text-warning border-warning' },
    adverse: { className: 'bg-destructive/20 text-destructive border-destructive' },
    disclaimer: { className: 'bg-muted/50 text-muted-foreground border-muted' },
  };
  const config = variants[opinion] || variants.unqualified;
  return <Badge variant="outline" className={config.className}>{opinion.toUpperCase()}</Badge>;
};

export function ReportsAnalytics() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportsSummary.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-success">{item.trend}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="opinion">Opinion Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Recent Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Audit Reports</CardTitle>
                  <CardDescription>Latest published and draft reports with distribution status</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="financial">Financial Audit</SelectItem>
                      <SelectItem value="it">IT Audit</SelectItem>
                      <SelectItem value="operational">Operational Audit</SelectItem>
                      <SelectItem value="compliance">Compliance Audit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export List
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
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Opinion</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Author</TableHead>
                      <TableHead className="font-semibold text-right">Recipients</TableHead>
                      <TableHead className="font-semibold text-right">Downloads</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReports.map((report) => (
                      <TableRow key={report.id} className="hover:bg-muted/20">
                        <TableCell className="font-mono text-xs">{report.id}</TableCell>
                        <TableCell className="font-medium max-w-xs">{report.title}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{report.type}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{getOpinionBadge(report.opinion)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{report.generatedDate}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{report.author}</TableCell>
                        <TableCell className="text-right font-semibold">{report.recipients}</TableCell>
                        <TableCell className="text-right font-semibold">{report.downloads}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opinion Analysis Tab */}
        <TabsContent value="opinion" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Audit Opinion Distribution</CardTitle>
                <CardDescription>Breakdown of audit opinions across all reports</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={opinionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {opinionDistribution.map((entry, index) => (
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
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Reports by Type</CardTitle>
                <CardDescription>Distribution of audit report types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportTypeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="type" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '11px' }}
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Distribution Status Tab */}
        <TabsContent value="distribution" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Report Distribution Status</CardTitle>
              <CardDescription>Tracking of report delivery and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributionStatus.map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{item.status}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.count} reports</span>
                        <span className="text-sm font-semibold text-foreground">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4">Distribution Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Delivery Rate</p>
                    <p className="text-2xl font-bold text-success">88.7%</p>
                  </div>
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Engagement Rate</p>
                    <p className="text-2xl font-bold text-warning">73.6%</p>
                  </div>
                  <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Acknowledgment Rate</p>
                    <p className="text-2xl font-bold text-info">49.1%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Report Generation Timeline</CardTitle>
              <CardDescription>Monthly report generation volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={generationTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Reports', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--data-secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}