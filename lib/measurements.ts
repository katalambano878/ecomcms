// Shared definitions for the made-to-measure / custom-fit feature.
// Framework-agnostic so it can be used in client components AND server code
// (e.g. email notifications). Do NOT import React here.

export type MeasurementUnit = 'in' | 'cm';

export interface CustomMeasurements {
  unit: MeasurementUnit;
  /** keyed by MEASUREMENT_FIELDS[].id, value is a free-form number-as-string */
  values: Record<string, string>;
  /** optional free-text for any extra instructions / measurements */
  note?: string;
}

export interface MeasurementField {
  id: string;
  label: string;
  /** short helper shown under the input */
  hint?: string;
  /** required fields must be filled before a custom-fit item can be added */
  required?: boolean;
}

// The standard set of measurements we collect for ready-to-wear / African
// print outfits. `note` covers "any other necessary measurements".
export const MEASUREMENT_FIELDS: MeasurementField[] = [
  { id: 'bust', label: 'Bust / Chest', hint: 'Around the fullest part', required: true },
  { id: 'waist', label: 'Waist', hint: 'Around the natural waistline', required: true },
  { id: 'hips', label: 'Hips', hint: 'Around the fullest part', required: true },
  { id: 'shoulder', label: 'Shoulder width', hint: 'Seam to seam across the back' },
  { id: 'height', label: 'Height', hint: 'Head to toe', required: true },
  { id: 'dressLength', label: 'Dress / Outfit length', hint: 'Shoulder to desired hem' },
  { id: 'sleeveLength', label: 'Sleeve length', hint: 'Shoulder to wrist' },
];

const FIELD_LABELS: Record<string, string> = MEASUREMENT_FIELDS.reduce(
  (acc, f) => ({ ...acc, [f.id]: f.label }),
  {} as Record<string, string>
);

/** Whether a measurements object actually carries any data worth showing. */
export function hasMeasurements(m?: CustomMeasurements | null): boolean {
  if (!m) return false;
  const anyValue = Object.values(m.values || {}).some((v) => v != null && String(v).trim() !== '');
  return anyValue || !!(m.note && m.note.trim());
}

export interface MeasurementLine {
  label: string;
  value: string;
}

/** Returns label/value pairs (with unit appended) for display, including the note. */
export function measurementLines(m?: CustomMeasurements | null): MeasurementLine[] {
  if (!m) return [];
  const unit = m.unit || 'in';
  const lines: MeasurementLine[] = [];
  for (const field of MEASUREMENT_FIELDS) {
    const raw = m.values?.[field.id];
    if (raw != null && String(raw).trim() !== '') {
      lines.push({ label: field.label, value: `${String(raw).trim()} ${unit}` });
    }
  }
  // Any extra keys not in the standard list (forward-compatible)
  for (const [key, raw] of Object.entries(m.values || {})) {
    if (FIELD_LABELS[key]) continue;
    if (raw != null && String(raw).trim() !== '') {
      lines.push({ label: key, value: `${String(raw).trim()} ${unit}` });
    }
  }
  if (m.note && m.note.trim()) {
    lines.push({ label: 'Notes', value: m.note.trim() });
  }
  return lines;
}

/** Compact one-line summary, e.g. "Bust 36 in · Waist 28 in · Hips 40 in". */
export function summarizeMeasurements(m?: CustomMeasurements | null): string {
  return measurementLines(m)
    .filter((l) => l.label !== 'Notes')
    .map((l) => `${l.label} ${l.value}`)
    .join(' · ');
}
