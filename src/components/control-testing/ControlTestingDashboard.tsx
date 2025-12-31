/**
 * ControlTestingDashboard Component
 * Main dashboard for managing control testing activities
 *
 * Implements requirements from:
 * - AU-C 330: Performing Audit Procedures in Response to Assessed Risks
 */

import React, { useState } from 'react';
import {
  useControls,
  useControlDeficiencies,
  useControlTestingSummary,
} from '@/hooks/useControlTesting';
import {
  Control,
  ControlEffectiveness,
  getControlTypeLabel,
  getControlNatureLabel,
  getControlFrequencyLabel,
  getDeficiencyClassificationLabel,
} from '@/lib/control-testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Shield,
  Plus,
  Search,
  Filter,
  FileText,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlTestingDashboardProps {
  engagementId: string;
}

const EFFECTIVENESS_CONFIG: Record<
  ControlEffectiveness,
  { label: string; icon: React.ElementType; color: string }
> = {
  effective: { label: 'Effective', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  effective_with_exceptions: {
    label: 'Effective w/ Exceptions',
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-50',
  },
  ineffective: { label: 'Ineffective', icon: XCircle, color: 'text-red-600 bg-red-50' },
};

export function ControlTestingDashboard({ engagementId }: ControlTestingDashboardProps) {
  const { controls, isLoading: controlsLoading, createControl } = useControls(engagementId);
  const { deficiencies, summary: deficiencySummary } = useControlDeficiencies(engagementId);
  const { summary } = useControlTestingSummary(engagementId);

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Filter controls
  const filteredControls = controls?.filter((control) => {
    const matchesSearch =
      control.controlName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.controlNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || control.testingStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (controlsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalControls || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.keyControls || 0} key controls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testing Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.totalControls
                ? Math.round((summary.controlsTested / summary.totalControls) * 100)
                : 0}
              %
            </div>
            <Progress
              value={
                summary?.totalControls
                  ? (summary.controlsTested / summary.totalControls) * 100
                  : 0
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effective Controls</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.effectiveControls || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.effectiveWithExceptions || 0} with exceptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deficiencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {deficiencySummary?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {deficiencySummary?.materialWeaknesses || 0} material weaknesses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="deficiencies">Deficiencies</TabsTrigger>
          <TabsTrigger value="itgc">IT General Controls</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Testing Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Status Summary</CardTitle>
              <CardDescription>Overview of control testing progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* By Testing Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">By Testing Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Tested</span>
                      </div>
                      <span className="font-medium">{summary?.controlsTested || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-medium">{summary?.controlsInProgress || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Not Started</span>
                      </div>
                      <span className="font-medium">{summary?.controlsNotTested || 0}</span>
                    </div>
                  </div>
                </div>

                {/* By Effectiveness */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">By Effectiveness</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Effective</span>
                      </div>
                      <span className="font-medium">{summary?.effectiveControls || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">With Exceptions</span>
                      </div>
                      <span className="font-medium">
                        {summary?.effectiveWithExceptions || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Ineffective</span>
                      </div>
                      <span className="font-medium">{summary?.ineffectiveControls || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Deficiency Summary */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Deficiencies</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Control Deficiencies</span>
                      <span className="font-medium">
                        {deficiencySummary?.controlDeficiencies || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Significant Deficiencies</span>
                      <span className="font-medium text-yellow-600">
                        {deficiencySummary?.significantDeficiencies || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Material Weaknesses</span>
                      <span className="font-medium text-red-600">
                        {deficiencySummary?.materialWeaknesses || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Controls to Test */}
          <Card>
            <CardHeader>
              <CardTitle>Key Controls Requiring Attention</CardTitle>
              <CardDescription>
                Key controls that have not yet been tested or have issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {controls
                ?.filter(
                  (c) =>
                    c.isKeyControl &&
                    (c.testingStatus !== 'tested' ||
                      c.testingConclusion === 'ineffective' ||
                      c.testingConclusion === 'effective_with_exceptions')
                )
                .slice(0, 5)
                .map((control) => (
                  <div
                    key={control.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">
                        {control.controlNumber}: {control.controlName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getControlTypeLabel(control.type)} •{' '}
                        {getControlFrequencyLabel(control.frequency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Key Control</Badge>
                      {control.testingStatus === 'not_tested' && (
                        <Badge variant="outline" className="bg-gray-50">
                          Not Started
                        </Badge>
                      )}
                      {control.testingConclusion && (
                        <Badge
                          className={EFFECTIVENESS_CONFIG[control.testingConclusion].color}
                        >
                          {EFFECTIVENESS_CONFIG[control.testingConclusion].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

              {(!controls ||
                controls.filter(
                  (c) =>
                    c.isKeyControl &&
                    (c.testingStatus !== 'tested' ||
                      c.testingConclusion === 'ineffective')
                ).length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  All key controls have been tested and are effective
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_tested">Not Tested</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="tested">Tested</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Control
            </Button>
          </div>

          {/* Controls Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Conclusion</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredControls?.map((control) => (
                  <TableRow key={control.id}>
                    <TableCell className="font-mono">{control.controlNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {control.controlName}
                        {control.isKeyControl && (
                          <Badge variant="outline" className="text-xs">
                            Key
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getControlTypeLabel(control.type)}</TableCell>
                    <TableCell>{getControlNatureLabel(control.nature)}</TableCell>
                    <TableCell>{getControlFrequencyLabel(control.frequency)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          control.testingStatus === 'tested' &&
                            'bg-green-50 border-green-500 text-green-700',
                          control.testingStatus === 'in_progress' &&
                            'bg-blue-50 border-blue-500 text-blue-700',
                          control.testingStatus === 'not_tested' &&
                            'bg-gray-50 border-gray-300 text-gray-700'
                        )}
                      >
                        {control.testingStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {control.testingConclusion && (
                        <Badge
                          className={EFFECTIVENESS_CONFIG[control.testingConclusion].color}
                        >
                          {EFFECTIVENESS_CONFIG[control.testingConclusion].label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!filteredControls || filteredControls.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                No controls found. Add controls to begin testing.
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Deficiencies Tab */}
        <TabsContent value="deficiencies" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Control Deficiencies</h3>
              <p className="text-sm text-muted-foreground">
                Track and communicate identified control deficiencies
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Document Deficiency
            </Button>
          </div>

          {/* Deficiency Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {deficiencySummary?.controlDeficiencies || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Control Deficiencies</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-300 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-700">
                    {deficiencySummary?.significantDeficiencies || 0}
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">Significant Deficiencies</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-700">
                    {deficiencySummary?.materialWeaknesses || 0}
                  </div>
                  <p className="text-sm text-red-700 mt-1">Material Weaknesses</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deficiencies List */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Communication</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deficiencies?.map((deficiency) => (
                  <TableRow key={deficiency.id}>
                    <TableCell className="font-mono">
                      {deficiency.deficiencyNumber}
                    </TableCell>
                    <TableCell>{deficiency.deficiencyTitle}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          deficiency.classification === 'control_deficiency' &&
                            'bg-gray-100 text-gray-800',
                          deficiency.classification === 'significant_deficiency' &&
                            'bg-yellow-100 text-yellow-800',
                          deficiency.classification === 'material_weakness' &&
                            'bg-red-100 text-red-800'
                        )}
                      >
                        {getDeficiencyClassificationLabel(deficiency.classification)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{deficiency.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {deficiency.communicatedToManagementAt && (
                          <Badge variant="outline" className="text-xs">
                            Mgmt
                          </Badge>
                        )}
                        {deficiency.communicatedToTCWGAt && (
                          <Badge variant="outline" className="text-xs">
                            TCWG
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {(!deficiencies || deficiencies.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                No deficiencies documented
              </div>
            )}
          </Card>
        </TabsContent>

        {/* IT General Controls Tab */}
        <TabsContent value="itgc" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">IT General Controls</h3>
              <p className="text-sm text-muted-foreground">
                Assess IT general controls that support application controls
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add ITGC
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {['access_security', 'change_management', 'computer_operations', 'program_development'].map(
              (domain) => (
                <Card key={domain}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {domain.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-gray-50">
                        Not Tested
                      </Badge>
                      <span className="text-sm text-muted-foreground">0 controls</span>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">
                IT General Controls assessment will be implemented here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Control Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Control</DialogTitle>
            <DialogDescription>
              Document a new control for testing
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Control creation form will be implemented here
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ControlTestingDashboard;
