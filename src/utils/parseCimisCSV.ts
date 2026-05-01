import { COMPREHENSIVE_CROP_DATABASE } from '../data/crops';
import { getKcForDate } from './kcUtils';

/**
 * A single parsed row from a CIMIS daily CSV export.
 * Columns (0-based):
 *   0  Stn Id
 *   1  Stn Name
 *   2  CIMIS Region
 *   3  Date          (M/D/YYYY)
 *   4  Jul           (day-of-year)
 *   5  ETo (in)
 *   6  qc  (ETo quality control)
 *   …  (Precip, Sol Rad, temps, humidity, etc. — not used here)
 */
export interface CimisCSVRow {
  stationId: string;     // e.g. "2"
  stationName: string;   // e.g. "FivePoints"
  region: string;
  date: string;          // YYYY-MM-DD
  et0Inches: number;     // ETo in inches (null rows excluded)
}

/**
 * Parse a raw CIMIS daily CSV string into structured rows.
 * Handles the multi-column, QC-interleaved format CIMIS exports.
 */
export function parseCimisCSV(csvText: string): CimisCSVRow[] {
  const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
  const rows: CimisCSVRow[] = [];

  for (const line of lines) {
    // Skip the header line
    if (line.startsWith('Stn Id')) continue;

    // Split on commas — CIMIS CSV has no quoted fields
    const cols = line.split(',');

    if (cols.length < 7) continue;

    const stationId = cols[0].trim();
    const stationName = cols[1].trim();
    const region = cols[2].trim();
    const rawDate = cols[3].trim();   // "M/D/YYYY"
    const rawEto = cols[5].trim();    // "ETo (in)"

    // Skip rows with no station id (blank lines / totals)
    if (!stationId || isNaN(Number(stationId))) continue;

    // Parse date M/D/YYYY → YYYY-MM-DD
    const dateParts = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!dateParts) continue;
    const [, m, d, y] = dateParts;
    const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    // Parse ET₀ — may be empty ("") when qc flag is "N" (no data)
    const et0 = parseFloat(rawEto);
    if (isNaN(et0)) continue; // Skip rows with missing ET₀

    rows.push({ stationId, stationName, region, date: isoDate, et0Inches: et0 });
  }

  return rows;
}

/**
 * Match a CIMIS station name/id to the closest location in the app.
 * Priority:
 *   1. Exact station ID match (location.cimisStationId / weatherstationID)
 *   2. Exact station name match (case-insensitive)
 *   3. Partial name overlap (station name contains location name or vice versa)
 */
function matchStation(
  stationId: string,
  stationName: string,
  locations: any[]
): any | null {
  // 1. Exact numeric ID
  const byId = locations.find(loc => {
    const locStation = String((loc as any).cimisStationId || loc.weatherstationID || '');
    return locStation === stationId;
  });
  if (byId) return byId;

  const stationLower = stationName.toLowerCase().replace(/\s+/g, '');

  // 2. Exact name
  const byExactName = locations.find(loc =>
    loc.name.toLowerCase().replace(/\s+/g, '') === stationLower
  );
  if (byExactName) return byExactName;

  // 3. Substring match either direction
  const byPartial = locations.find(loc => {
    const locLower = loc.name.toLowerCase().replace(/\s+/g, '');
    return locLower.includes(stationLower) || stationLower.includes(locLower);
  });
  return byPartial || null;
}

export interface CimisImportResult {
  /** manualCmisOverrides entries keyed by `${locationId}-${cropId}` */
  overrides: Map<string, { et0: string[]; etc: string[] }>;
  /** Human-readable summary for the toast / confirmation dialog */
  summary: {
    matched: { locationName: string; stationName: string; stationId: string; dateRange: string; et0Total: number }[];
    unmatched: { stationName: string; stationId: string }[];
  };
}

/**
 * Given parsed CIMIS rows, locations, crop instances and the actuals date window,
 * build a new manualCmisOverrides Map that can be merged into component state.
 *
 * actualsStart / actualsEnd: YYYY-MM-DD strings that bound the actuals period
 * (same window the table shows — 7 days before today by default).
 */
export function buildCimisOverrides(
  rows: CimisCSVRow[],
  locations: any[],
  cropInstances: any[],
  actualsStart: string,
  actualsEnd: string
): CimisImportResult {
  const overrides = new Map<string, { et0: string[]; etc: string[] }>();
  const matched: CimisImportResult['summary']['matched'] = [];
  const unmatchedMap = new Map<string, { stationName: string; stationId: string }>();

  // Group CSV rows by stationId
  const byStation = new Map<string, CimisCSVRow[]>();
  for (const row of rows) {
    if (row.date < actualsStart || row.date > actualsEnd) continue;
    if (!byStation.has(row.stationId)) byStation.set(row.stationId, []);
    byStation.get(row.stationId)!.push(row);
  }

  for (const [stationId, stationRows] of byStation.entries()) {
    const stationName = stationRows[0].stationName;
    const location = matchStation(stationId, stationName, locations);

    if (!location) {
      unmatchedMap.set(stationId, { stationName, stationId });
      continue;
    }

    // Sort rows by date
    stationRows.sort((a, b) => a.date.localeCompare(b.date));

    const et0Total = stationRows.reduce((s, r) => s + r.et0Inches, 0);
    const dateRange = stationRows.length > 0
      ? `${stationRows[0].date} – ${stationRows[stationRows.length - 1].date}`
      : '';

    matched.push({ locationName: location.name, stationName, stationId, dateRange, et0Total });

    // Find all crop instances for this location
    const locCropInstances = cropInstances.filter(ci => ci.locationId === location.id);
    const uniqueCropIds = [...new Set(locCropInstances.map(ci => ci.cropId))];

    for (const cropId of uniqueCropIds) {
      const cropInstance = locCropInstances.find(ci => ci.cropId === cropId);
      if (!cropInstance) continue;

      const cropData = COMPREHENSIVE_CROP_DATABASE.find(c => c.id === cropId);

      // Compute per-Kc-period sums
      const etcByKc = new Map<number, number>();
      const et0ByKc = new Map<number, number>();

      for (const row of stationRows) {
        let kc = getKcForDate(row.date, cropData, cropInstance.customKcValues);
        if (!cropData?.kcSchedule?.length && !cropData?.monthlyKc?.length) {
          kc = cropInstance.currentStage === 2 ? 1.15 :
               cropInstance.currentStage === 1 ? 0.70 : 0.50;
        }
        etcByKc.set(kc, (etcByKc.get(kc) || 0) + row.et0Inches * kc);
        et0ByKc.set(kc, (et0ByKc.get(kc) || 0) + row.et0Inches);
      }

      const sortedKcs = Array.from(etcByKc.keys()).sort((a, b) => a - b);

      // If a single Kc period, store as a single-element array
      // If multiple Kc periods, store one value per period (matches stacked row UI)
      const et0Values = sortedKcs.map(kc => (et0ByKc.get(kc) || 0).toFixed(2));
      const etcValues = sortedKcs.map(kc => (etcByKc.get(kc) || 0).toFixed(2));

      const key = `${location.id}-${cropId}`;
      overrides.set(key, { et0: et0Values, etc: etcValues });
    }
  }

  return {
    overrides,
    summary: {
      matched,
      unmatched: Array.from(unmatchedMap.values())
    }
  };
}

/**
 * Compute the actuals window that matches the table header
 * (7 days before today, ending yesterday — same as CIMIS fetch logic).
 */
export function getActualsWindow(reportMode: string, futureStartDate: string): { start: string; end: string } {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (reportMode === 'future' && futureStartDate) {
    // For future mode, actuals = 7 days before the future start date
    const ref = new Date(futureStartDate + 'T12:00:00');
    const start = new Date(ref);
    start.setDate(start.getDate() - 7);
    return {
      start: start.toISOString().split('T')[0],
      end: new Date(ref.getTime() - 86400000).toISOString().split('T')[0]
    };
  }

  // Current / historical: actuals = past 7 days (not including today)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    start: weekAgo.toISOString().split('T')[0],
    end: yesterday.toISOString().split('T')[0]
  };
}
