import { ThemeProvider } from './contexts/ThemeContext';
import { WeatherDashboard } from './components/WeatherDashboard';

function App() {
  return (
    <ThemeProvider>
      <WeatherDashboard />
    </ThemeProvider>
  );
}

export default App;
