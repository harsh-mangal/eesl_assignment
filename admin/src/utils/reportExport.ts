import type { jsPDF as JsPdfType } from 'jspdf';
import type { ReportColumn, ReportFormat, ReportResult } from '../types/api';

function displayValue(value: string | number | null | undefined, format: ReportFormat = 'text') {
  if (value === null || value === undefined || value === '') return '—';
  if (format === 'currency') return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  if (format === 'number') return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  if (format === 'percent') return `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
  if (format === 'date' || format === 'datetime') {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return format === 'date' ? date.toLocaleDateString('en-IN') : date.toLocaleString('en-IN');
  }
  return String(value);
}

function fileName(report: ReportResult, extension: 'csv' | 'pdf') {
  const date = new Date().toISOString().slice(0, 10);
  return `${report.reportType.toLowerCase().replaceAll('_', '-')}-${date}.${extension}`;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportReportCsv(report: ReportResult) {
  const summaryRows = report.summary.map((item) => [item.label, displayValue(item.value, item.format)]);
  const header = report.columns.map((column) => column.label);
  const body = report.rows.map((row) => report.columns.map((column) => displayValue(row[column.key], column.format)));
  const lines = [
    [report.title],
    [report.description],
    [`Generated`, new Date(report.generatedAt).toLocaleString('en-IN')],
    ...(report.dateRange.from || report.dateRange.to
      ? [[`Date range`, `${report.dateRange.from ?? 'Beginning'} to ${report.dateRange.to ?? 'Today'}`]]
      : []),
    [],
    ...summaryRows,
    [],
    header,
    ...body,
  ];
  const csv = `\uFEFF${lines.map((row) => row.map((value) => csvCell(String(value))).join(',')).join('\r\n')}`;
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName(report, 'csv'));
}

export async function exportReportPdf(report: ReportResult) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const autoTable = autoTableModule.default;
  const orientation = report.columns.length > 7 ? 'landscape' : 'portrait';
  const document = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = document.internal.pageSize.getWidth();

  document.setFontSize(17);
  document.setFont('helvetica', 'bold');
  document.text(report.title, 14, 16);
  document.setFontSize(9);
  document.setFont('helvetica', 'normal');
  const description = document.splitTextToSize(report.description, pageWidth - 28);
  document.text(description, 14, 23);
  const descriptionEnd = 23 + Math.max(4, description.length * 4);
  document.text(`Generated: ${new Date(report.generatedAt).toLocaleString('en-IN')}`, 14, descriptionEnd + 2);
  if (report.dateRange.from || report.dateRange.to) {
    document.text(`Date range: ${report.dateRange.from ?? 'Beginning'} to ${report.dateRange.to ?? 'Today'}`, 14, descriptionEnd + 7);
  }

  const summaryStart = descriptionEnd + (report.dateRange.from || report.dateRange.to ? 13 : 8);
  autoTable(document, {
    startY: summaryStart,
    head: [['Summary', 'Value']],
    body: report.summary.map((item) => [item.label, displayValue(item.value, item.format)]),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 24, 40] },
    margin: { left: 14, right: 14 },
    tableWidth: Math.min(100, pageWidth - 28),
  });

  const lastTable = document as JsPdfType & { lastAutoTable?: { finalY: number } };
  autoTable(document, {
    startY: (lastTable.lastAutoTable?.finalY ?? summaryStart) + 7,
    head: [report.columns.map((column) => column.label)],
    body: report.rows.map((row) => report.columns.map((column: ReportColumn) => displayValue(row[column.key], column.format))),
    theme: 'striped',
    styles: { fontSize: report.columns.length > 8 ? 6.2 : 7.2, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [23, 92, 211] },
    margin: { left: 8, right: 8 },
    didDrawPage: (data) => {
      document.setFontSize(7);
      document.setTextColor(110);
      document.text(`Integrated Member Services · ${report.title}`, 8, document.internal.pageSize.getHeight() - 5);
      document.text(`Page ${data.pageNumber}`, document.internal.pageSize.getWidth() - 20, document.internal.pageSize.getHeight() - 5);
    },
  });

  document.save(fileName(report, 'pdf'));
}

export { displayValue as formatReportValue };
