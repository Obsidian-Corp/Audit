/**
 * ==================================================================
 * TRIAL BALANCE IMPORTER
 * ==================================================================
 * Multi-step wizard for importing trial balance from Excel
 * ==================================================================
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Download,
} from 'lucide-react';
import { useTrialBalanceImport } from '@/hooks/useExcelImport';

interface TrialBalanceImporterProps {
  engagementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const REQUIRED_COLUMNS = [
  { key: 'accountNumber', label: 'Account Number', required: true },
  { key: 'accountName', label: 'Account Name', required: true },
  { key: 'debit', label: 'Debit', required: true },
  { key: 'credit', label: 'Credit', required: true },
];

const OPTIONAL_COLUMNS = [
  { key: 'balance', label: 'Balance' },
  { key: 'accountType', label: 'Account Type' },
  { key: 'fsCaption', label: 'FS Caption' },
];

export function TrialBalanceImporter({
  engagementId,
  open,
  onOpenChange,
  onImportComplete,
}: TrialBalanceImporterProps) {
  const {
    state,
    setFile,
    setSelectedSheet,
    setMapping,
    startImport,
    isImporting,
    reset,
  } = useTrialBalanceImport(engagementId);

  const [dragOver, setDragOver] = useState(false);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    reset();
    setColumnMappings({});
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
        setFile(file);
      }
    },
    [setFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFile(file);
      }
    },
    [setFile]
  );

  const handleMappingChange = useCallback((columnKey: string, headerValue: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [columnKey]: headerValue,
    }));
  }, []);

  const handleStartImport = useCallback(() => {
    // Convert column mappings to indices
    if (state.preview) {
      const mapping: Record<string, number> = {};
      Object.entries(columnMappings).forEach(([key, headerName]) => {
        const idx = state.preview!.headers.findIndex(
          (h) => h.toLowerCase() === headerName.toLowerCase()
        );
        if (idx !== -1) {
          mapping[key] = idx;
        }
      });
      setMapping(mapping);
    }
    startImport();
  }, [columnMappings, state.preview, setMapping, startImport]);

  const handleComplete = useCallback(() => {
    onImportComplete?.();
    handleClose();
  }, [onImportComplete, handleClose]);

  const getStepProgress = () => {
    switch (state.step) {
      case 'upload':
        return 0;
      case 'preview':
        return 25;
      case 'mapping':
        return 50;
      case 'importing':
        return 75;
      case 'complete':
        return 100;
      case 'error':
        return state.result ? 100 : 50;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Trial Balance
          </DialogTitle>
          <DialogDescription>
            Import trial balance data from an Excel or CSV file
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Upload</span>
            <span>Preview</span>
            <span>Map Columns</span>
            <span>Import</span>
            <span>Complete</span>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </div>

        <Separator />

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Upload Step */}
          {state.step === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Drop your Excel file here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Supports .xlsx, .xls, and .csv files
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>

              <div className="mt-8 pt-8 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Need a template?
                </p>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Preview/Mapping Step */}
          {state.step === 'mapping' && state.preview && (
            <div className="space-y-6">
              {/* Sheet Selection */}
              {state.preview.sheets.length > 1 && (
                <div className="flex items-center gap-4">
                  <Label>Select Sheet:</Label>
                  <Select
                    value={state.selectedSheet || undefined}
                    onValueChange={setSelectedSheet}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.preview.sheets.map((sheet) => (
                        <SelectItem key={sheet} value={sheet}>
                          {sheet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Column Mapping */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Map Columns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {REQUIRED_COLUMNS.map((col) => (
                      <div key={col.key} className="flex items-center gap-2">
                        <Label className="min-w-[120px]">
                          {col.label}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <Select
                          value={columnMappings[col.key] || ''}
                          onValueChange={(v) => handleMappingChange(col.key, v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {state.preview.headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    {OPTIONAL_COLUMNS.map((col) => (
                      <div key={col.key} className="flex items-center gap-2">
                        <Label className="min-w-[120px]">{col.label}</Label>
                        <Select
                          value={columnMappings[col.key] || ''}
                          onValueChange={(v) => handleMappingChange(col.key, v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select column (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {state.preview.headers.map((header) => (
                              <SelectItem key={header} value={header}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {state.preview.headers.map((header, i) => (
                            <TableHead key={i} className="whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.preview.rows.slice(0, 5).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {(row as unknown[]).map((cell, cellIndex) => (
                              <TableCell key={cellIndex} className="whitespace-nowrap">
                                {String(cell ?? '')}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Importing Step */}
          {state.step === 'importing' && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium">Importing Data...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your file
              </p>
            </div>
          )}

          {/* Complete Step */}
          {state.step === 'complete' && state.result && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Complete!</h3>
              <div className="flex gap-4 mb-6">
                <Badge variant="secondary">
                  {state.result.summary.totalRows} total rows
                </Badge>
                <Badge variant="default" className="bg-green-500">
                  {state.result.summary.successfulRows} imported
                </Badge>
                {state.result.summary.failedRows > 0 && (
                  <Badge variant="destructive">
                    {state.result.summary.failedRows} failed
                  </Badge>
                )}
                {state.result.summary.skippedRows > 0 && (
                  <Badge variant="outline">
                    {state.result.summary.skippedRows} skipped
                  </Badge>
                )}
              </div>
              {state.result.warnings.length > 0 && (
                <Card className="w-full max-w-lg">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {state.result.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Error Step */}
          {state.step === 'error' && (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Import Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{state.error}</p>

              {state.result && state.result.errors.length > 0 && (
                <Card className="w-full max-w-lg">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Error Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <ul className="text-sm space-y-2">
                        {state.result.errors.slice(0, 10).map((error, i) => (
                          <li key={i} className="text-destructive">
                            Row {error.row}: {error.message}
                          </li>
                        ))}
                        {state.result.errors.length > 10 && (
                          <li className="text-muted-foreground">
                            ... and {state.result.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          {state.step === 'mapping' && (
            <>
              <Button variant="outline" onClick={reset}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartImport}
                disabled={
                  !columnMappings.accountNumber ||
                  !columnMappings.accountName ||
                  !columnMappings.debit ||
                  !columnMappings.credit ||
                  isImporting
                }
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Start Import
              </Button>
            </>
          )}

          {(state.step === 'complete' || state.step === 'error') && (
            <Button onClick={handleComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TrialBalanceImporter;
