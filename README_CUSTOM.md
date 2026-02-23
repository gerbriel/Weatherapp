# Weather & ET Dashboard

A modern React TypeScript web application that displays weather data including precipitation and evapotranspiration (ET₀) from the Open Meteo API. Features a responsive design with dark mode support and interactive data visualizations.

## Features

- 🌦️ **Real-time Weather Data**: Fetches 14-day forecast data from Open Meteo API
- 🌧️ **Precipitation Tracking**: Displays total precipitation and rain amounts
- 🌱 **Evapotranspiration Monitoring**: Shows daily and cumulative ET₀ values
- 🌓 **Dark Mode Support**: Toggle between light and dark themes
- 📊 **Interactive Charts**: Visualize weather trends with responsive charts
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🗺️ **Location Detection**: Automatically detects user location or defaults to Los Angeles

## Data Sources

This application uses the [Open Meteo API](https://open-meteo.com/) to fetch weather data with the following parameters:

- **Daily Data**: precipitation_sum, rain_sum, et0_fao_evapotranspiration, et0_fao_evapotranspiration_sum
- **Forecast Period**: 14 days
- **Model**: GFS Seamless
- **Timezone**: America/Los_Angeles
- **Units**: Fahrenheit (temperature), MPH (wind), Inches (precipitation)

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling and responsive design
- **Recharts** for data visualization
- **Axios** for API requests
- **Lucide React** for icons
- **Context API** for theme management

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd weather-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── WeatherCard.tsx     # Individual weather data card
│   ├── WeatherCharts.tsx   # Chart components for data visualization
│   ├── WeatherDashboard.tsx # Main dashboard component
│   └── ThemeToggle.tsx     # Dark/light mode toggle
├── contexts/            # React contexts
│   └── ThemeContext.tsx    # Theme management context
├── services/            # API services
│   └── weatherService.ts   # Open Meteo API integration
├── types/               # TypeScript type definitions
│   └── weather.ts          # Weather data types
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles with Tailwind
```

## API Configuration

The application is pre-configured with the following Open Meteo API parameters that match your original request:

- **Location**: Auto-detected or defaults to Los Angeles (34.0522, -118.2437)
- **Daily Variables**: precipitation_sum, rain_sum, et0_fao_evapotranspiration, et0_fao_evapotranspiration_sum
- **Forecast Days**: 14
- **Model**: gfs_seamless
- **Timezone**: America/Los_Angeles
- **Temperature Unit**: Fahrenheit
- **Wind Speed Unit**: MPH
- **Precipitation Unit**: Inches

## Features Breakdown

### Weather Cards
- Display current day's precipitation, rain, and ET₀ values
- Responsive grid layout
- Icon-based visual indicators

### Data Table
- Complete 14-day forecast in tabular format
- Hover effects for better UX

### Interactive Charts
- Bar chart for precipitation data
- Line chart for evapotranspiration trends
- Responsive and theme-aware
- Tooltips with detailed information

### Dark Mode
- System preference detection
- Manual toggle option
- Persistent user preference storage
- Smooth transitions between themes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Acknowledgments

- [Open Meteo](https://open-meteo.com/) for providing free weather API
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Recharts](https://recharts.org/) for beautiful React charts
- [Lucide](https://lucide.dev/) for the icon library