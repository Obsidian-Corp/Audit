import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  filename: string;
  format: 'pdf' | 'png' | 'csv' | 'excel';
  data?: any[];
  chartElement?: HTMLElement;
}

/**
 * Export chart as PDF
 */
export async function exportChartAsPDF(element: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF');
  }
}

/**
 * Export chart as PNG
 */
export async function exportChartAsPNG(element: HTMLElement, filename: string) {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#000000',
      scale: 2,
    });
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error exporting PNG:', error);
    throw new Error('Failed to export PNG');
  }
}

/**
 * Export data as CSV
 */
export function exportDataAsCSV(data: any[], filename: string) {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export CSV');
  }
}

/**
 * Export data as Excel (using CSV format with .xlsx extension)
 */
export function exportDataAsExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join('\t'),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes('\t')) {
            return `"${value}"`;
          }
          return value;
        }).join('\t')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw new Error('Failed to export Excel');
  }
}

/**
 * Generic export function that routes to specific export methods
 */
export async function exportChart(options: ExportOptions) {
  const { format, filename, data, chartElement } = options;

  switch (format) {
    case 'pdf':
      if (!chartElement) throw new Error('Chart element required for PDF export');
      return exportChartAsPDF(chartElement, filename);
    
    case 'png':
      if (!chartElement) throw new Error('Chart element required for PNG export');
      return exportChartAsPNG(chartElement, filename);
    
    case 'csv':
      if (!data) throw new Error('Data required for CSV export');
      return exportDataAsCSV(data, filename);
    
    case 'excel':
      if (!data) throw new Error('Data required for Excel export');
      return exportDataAsExcel(data, filename);
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
