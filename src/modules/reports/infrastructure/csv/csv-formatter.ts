export function escapeCsvValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function formatCsvRow(
  values: Array<string | number | boolean | null | undefined>,
): string {
  return values.map(escapeCsvValue).join(',');
}

export function formatCsvDate(value: Date | null | undefined): string {
  return value ? value.toISOString() : '';
}
