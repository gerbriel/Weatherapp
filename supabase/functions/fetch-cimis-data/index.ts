/**
 * fetch-cimis-data
 * Called daily by GitHub Actions to populate the cimis_et0_cache table.
 * Fetches the last 14 days of ET₀ data for all known stations in one
 * batched CIMIS request, then upserts into Supabase.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// All station IDs used by the app (gathered from defaultLocations.ts)
const ALL_STATIONS = [
  '6','13','43','47','70','77','80','83','84','90','91','103','106',
  '125','131','139','140','222','224','225','236','244','250','259',
  '260','261','263','264','267','268','272',
];

// CIMIS accepts up to ~50 targets in one request
const BATCH_SIZE = 30;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  // Allow manual GET trigger as well as scheduled POST
  const apiKey   = Deno.env.get('VITE_CMIS_API_KEY');
  const sbUrl    = Deno.env.get('SUPABASE_URL')!;
  const sbKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // auto-injected by Supabase

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'VITE_CMIS_API_KEY not set' }), { status: 500 });
  }

  const supabase = createClient(sbUrl, sbKey);

  // Fetch last 14 days (covers any weekend/holiday gaps)
  const endDate   = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14);
  const start = toDateStr(startDate);
  const end   = toDateStr(endDate);

  const batches = chunkArray(ALL_STATIONS, BATCH_SIZE);
  const results: { inserted: number; errors: string[] } = { inserted: 0, errors: [] };

  for (const batch of batches) {
    const stationNbrs = batch.join(',');
    // New CIMIS REST API: key in header, stationNbrs param, fixed endpoint
    const url = `https://et.water.ca.gov/StationWeb/GetDataByStationNumber?stationNbrs=${stationNbrs}&startDate=${start}&endDate=${end}&isHourly=false&dataItems=day-asce-eto&unitOfMeasure=E`;

    try {
      const res = await fetch(url, {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'WeatherApp-Cron/1.0',
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        const text = await res.text();
        results.errors.push(`Batch [${stationNbrs}] non-JSON: ${text.substring(0, 200)}`);
        continue;
      }

      const json = await res.json();

      // Build rows by iterating providers first so each record retains its station ID.
      // flatMap loses the provider-level StationNbr, making r.Station undefined.
      const rows: { station_id: string; date: string; et0_inches: number; fetched_at: string }[] = [];
      for (const p of json?.Data?.Providers ?? []) {
        const stationId = String(p.StationNbr ?? p.Station ?? 'unknown');
        for (const r of p.Records ?? []) {
          if (r.DayAsceEto?.Value != null) {
            rows.push({
              station_id: stationId,
              date:       r.Date,
              et0_inches: parseFloat(r.DayAsceEto.Value),
              fetched_at: new Date().toISOString(),
            });
          }
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from('cimis_et0_cache')
          .upsert(rows, { onConflict: 'station_id,date' });

        if (error) {
          results.errors.push(`Upsert error: ${error.message}`);
        } else {
          results.inserted += rows.length;
        }
      }

      // Brief pause between batches to be polite to CIMIS
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      results.errors.push(`Fetch error: ${(err as Error).message}`);
    }
  }

  console.log('CIMIS fetch complete:', results);
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
    status: results.errors.length > 0 ? 207 : 200,
  });
});
