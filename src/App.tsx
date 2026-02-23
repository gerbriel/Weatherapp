import { ThemeProvider } from './contexts/ThemeContext';
import { LocationsProvider } from './contexts/LocationsContext';
import { EmailProvider } from './contexts/EmailContext';
import { AuthProvider } from './contexts/AuthContextSimple';
import { TrialProvider } from './contexts/TrialContext';
import { AppRouter } from './components/AppRouter';

function App() {
  return (
    <ThemeProvider>
      <TrialProvider>
        <AuthProvider>
          <LocationsProvider>
            <EmailProvider>
              <AppRouter />
            </EmailProvider>
          </LocationsProvider>
        </AuthProvider>
      </TrialProvider>
    </ThemeProvider>
  );
}

export default App;
