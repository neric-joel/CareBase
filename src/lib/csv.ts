// CSV export utilities.
// Used by the clients list page to export client data.

import type { DbClient, DbServiceEntry } from '@/types/database';

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(',');
}

/**
 * Convert a list of clients to a CSV string.
 */
export function clientsToCsv(clients: DbClient[]): string {
  const headers = [
    'Client ID',
    'First Name',
    'Last Name',
    'Date of Birth',
    'Phone',
    'Email',
    'Address',
    'Household Size',
    'Dietary Restrictions',
    'Language Preference',
    'Registered',
  ];

  const rows = clients.map((c) => {
    const cf = c.custom_fields as {
      household_size?: number | null;
      dietary_restrictions?: string | null;
      language_preference?: string | null;
    };
    return buildCsvRow([
      c.client_id,
      c.first_name,
      c.last_name,
      c.date_of_birth,
      c.phone,
      c.email,
      c.address,
      cf.household_size,
      cf.dietary_restrictions,
      cf.language_preference,
      c.created_at.split('T')[0],
    ]);
  });

  return [buildCsvRow(headers), ...rows].join('\n');
}

/**
 * Convert a list of service entries to a CSV string.
 */
export function serviceEntriesToCsv(entries: DbServiceEntry[]): string {
  const headers = [
    'Entry ID',
    'Client ID',
    'Service Date',
    'Service Type',
    'Notes',
    'Created',
  ];

  const rows = entries.map((e) =>
    buildCsvRow([
      e.id,
      e.client_id,
      e.service_date,
      e.service_type,
      e.notes,
      e.created_at.split('T')[0],
    ])
  );

  return [buildCsvRow(headers), ...rows].join('\n');
}

/**
 * Trigger a browser download of a CSV file.
 * Call this from a "use client" component.
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
