import { COMPREHENSIVE_CROP_DATABASE } from '../data/crops';

/**
 * Look up the precise Kc for a given date string (YYYY-MM-DD) from a crop's kcSchedule,
 * falling back to monthlyKc, then to a default of 1.0.
 * customKcValues (keyed by month 1-12) always takes highest priority.
 */
export function getKcForDate(
  dateStr: string | undefined | null,
  cropData: ReturnType<typeof COMPREHENSIVE_CROP_DATABASE.find>,
  customKcValues?: { [key: number]: number }
): number {
  if (!dateStr) return 1.0;
  const dateMonth = new Date(dateStr + 'T12:00:00').getMonth() + 1;

  // 1. Custom per-month override wins
  if (customKcValues?.[dateMonth] !== undefined) {
    return customKcValues[dateMonth];
  }

  // 2. Bi-monthly kcSchedule (most precise)
  if (cropData?.kcSchedule && cropData.kcSchedule.length > 0) {
    const mmdd = dateStr.slice(5); // "MM-DD"
    const entry = cropData.kcSchedule.find(s => mmdd >= s.startDate && mmdd <= s.endDate);
    if (entry !== undefined) {
      return entry.kc;
    }
  }

  // 3. Monthly average fallback
  if (cropData?.monthlyKc && cropData.monthlyKc.length > 0) {
    const monthData = cropData.monthlyKc.find(m => m.month === dateMonth);
    if (monthData?.kc !== undefined) return monthData.kc;
  }

  return 1.0;
}
