-- CIMIS daily ET₀ data cache
-- Populated by the fetch-cimis-data edge function (called daily via GitHub Actions)
-- App reads from here instead of hitting CIMIS directly

CREATE TABLE IF NOT EXISTS public.cimis_et0_cache (
  id          BIGSERIAL PRIMARY KEY,
  station_id  TEXT        NOT NULL,
  date        DATE        NOT NULL,
  et0_inches  NUMERIC(6,4) NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (station_id, date)
);

-- Index for fast station+date range lookups
CREATE INDEX IF NOT EXISTS idx_cimis_et0_cache_station_date
  ON public.cimis_et0_cache (station_id, date DESC);

-- Allow anon/authenticated reads (app needs to read this)
ALTER TABLE public.cimis_et0_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cimis cache"
  ON public.cimis_et0_cache
  FOR SELECT
  USING (true);

-- Only service role can insert/update (edge function uses service role key)
CREATE POLICY "Service role write cimis cache"
  ON public.cimis_et0_cache
  FOR ALL
  USING (auth.role() = 'service_role');
