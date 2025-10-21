// Types for Open Meteo API responses
export interface DailyWeatherData {
  time: string[];
  precipitation_sum: number[];
  rain_sum: number[];
  et0_fao_evapotranspiration: number[];
  et0_fao_evapotranspiration_sum: number[];
}

export interface WeatherApiResponse {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily_units: {
    time: string;
    precipitation_sum: string;
    rain_sum: string;
    et0_fao_evapotranspiration: string;
    et0_fao_evapotranspiration_sum: string;
  };
  daily: DailyWeatherData;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name?: string;
}