function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'string' ? value : String(value);
  const needsQuote = /[",\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) lines.push(row.map(escapeCell).join(','));
  return '﻿' + lines.join('\r\n');
}

export function csvFilename(prefix: string): string {
  const d = new Date();
  const stamp = d.toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}
