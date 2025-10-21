import { ThemeProvider } from './contexts/ThemeContext';
import { LocationsProvider } from './contexts/LocationsContext';
import { EmailProvider } from './contexts/EmailContext';
import { WeatherDashboard } from './components/WeatherDashboard';

function App() {
  return (
    <ThemeProvider>
      <LocationsProvider>
        <EmailProvider>
          <WeatherDashboard />
        </EmailProvider>
      </LocationsProvider>
    </ThemeProvider>
  );
}

export default App;
