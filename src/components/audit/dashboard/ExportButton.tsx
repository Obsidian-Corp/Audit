import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Image, Table } from 'lucide-react';
import { exportChart } from '@/lib/chartExport';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  chartId: string;
  filename: string;
  data?: any[];
  chartTitle?: string;
}

export function ExportButton({ chartId, filename, data, chartTitle }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'png' | 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const chartElement = document.getElementById(chartId);
      
      await exportChart({
        format,
        filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
        data,
        chartElement: chartElement || undefined,
      });

      toast({
        title: 'Export successful',
        description: `${chartTitle || 'Chart'} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export chart',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('png')}>
          <Image className="w-4 h-4 mr-2" />
          Export as PNG
        </DropdownMenuItem>
        {data && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <Table className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <Table className="w-4 h-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
