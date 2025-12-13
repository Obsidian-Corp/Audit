import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DrillDownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  metric: string;
  data: any;
}

export function DrillDownDialog({ open, onOpenChange, title, metric, data }: DrillDownDialogProps) {
  // Mock detailed data - would be fetched based on metric
  const detailedData = {
    activeAudits: [
      { id: 'AUD-2024-001', name: 'Q4 Financial Controls', status: 'In Progress', progress: 65, team: 'Finance Team' },
      { id: 'AUD-2024-002', name: 'IT Security Assessment', status: 'Planning', progress: 20, team: 'IT Team' },
      { id: 'AUD-2024-003', name: 'Procurement Review', status: 'Fieldwork', progress: 80, team: 'Operations Team' },
    ],
    findings: [
      { id: 'F-001', title: 'Revenue Recognition Issues', severity: 'Critical', entity: 'Sales', age: 45 },
      { id: 'F-002', title: 'Access Control Weaknesses', severity: 'High', entity: 'IT', age: 32 },
      { id: 'F-003', title: 'Documentation Gaps', severity: 'Medium', entity: 'Finance', age: 18 },
    ],
  };

  const renderContent = () => {
    if (metric === 'activeAudits') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Audit Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Team</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailedData.activeAudits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="font-mono text-xs">{audit.id}</TableCell>
                <TableCell className="font-medium">{audit.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{audit.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${audit.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{audit.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{audit.team}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (metric === 'findings') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Age (Days)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailedData.findings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell className="font-mono text-xs">{finding.id}</TableCell>
                <TableCell className="font-medium">{finding.title}</TableCell>
                <TableCell>
                  <Badge 
                    variant={finding.severity === 'Critical' ? 'destructive' : 'default'}
                  >
                    {finding.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{finding.entity}</TableCell>
                <TableCell className="text-sm font-semibold">{finding.age}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{data.value}</p>
                <p className="text-sm text-muted-foreground">Current Value</p>
              </div>
              <div className="flex items-center gap-2">
                {data.trend > 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
                <span className={`text-lg font-semibold ${data.trend > 0 ? 'text-success' : 'text-destructive'}`}>
                  {data.trend > 0 ? '+' : ''}{data.trend}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Detailed breakdown and analysis
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Additional details and contextual information would be displayed here.
            </p>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Historical trend data and analytics would be displayed here.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
