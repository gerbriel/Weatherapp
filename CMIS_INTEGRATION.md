# CMIS API Integration

This document explains how to configure the California Irrigation Management Information System (CMIS) API integration for real ETC data.

## Overview

The CMIS service (`src/services/cmisService.ts`) provides actual evapotranspiration data to compare with projected ET₀ values in the weather reports.

## Current Status

**Demo Mode**: The integration currently uses realistic mock data that simulates CMIS API responses.

## Setting Up Real CMIS API

To use real CMIS data, you'll need to:

### 1. Get API Access
- Register for a CMIS API key at: https://cimis.water.ca.gov/WSNReportCriteria.aspx
- Follow their API documentation for authentication

### 2. Environment Configuration
Add your API key to `.env.local`:
```
REACT_APP_CMIS_API_KEY=your_api_key_here
```

### 3. Update Service Configuration
In `src/services/cmisService.ts`:
- Uncomment the real API call section in `getETCData()`
- Comment out the mock data generation
- Test with actual CMIS endpoints

## API Features

### Station Discovery
- Automatically finds the nearest CMIS weather station for each location
- Uses coordinates to calculate distance
- Currently includes 5 Central Valley stations

### Data Retrieval
- Fetches 14-day historical ETC data
- Converts units to match ET₀ format (inches/day)
- Handles API errors gracefully

### Integration Points
- **Reports View**: Shows ETC actual vs ET₀ projected comparison
- **Today's Cards**: Displays current day ETC actual value
- **14-Day Table**: Side-by-side comparison of projected vs actual

## Mock Data Details

Current mock data generates realistic ETC values:
- Range: 0.11 - 0.19 inches/day (typical for Central Valley agriculture)
- Variation: ±0.04 inches from base value
- Station mapping: Matches real CMIS station IDs and locations

## Troubleshooting

### No ETC Data Showing
1. Check browser console for API errors
2. Verify location coordinates are valid
3. Ensure CMIS service is responding

### API Rate Limiting
- CMIS may have rate limits
- Consider caching responses
- Implement retry logic with backoff

## Future Enhancements

1. **Crop-Specific ETC**: Match ETC data to specific crop types
2. **Historical Analysis**: Compare trends over time
3. **Alerts**: Notify when actual vs projected diverge significantly
4. **Station Selection**: Allow manual weather station selection

## Data Sources

- **CMIS Stations**: California Department of Water Resources
- **Coverage**: Statewide network with focus on agricultural regions
- **Update Frequency**: Daily measurements
- **Historical Data**: Available for trend analysis