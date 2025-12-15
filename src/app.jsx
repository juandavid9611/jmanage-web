import 'src/global.css';

// ----------------------------------------------------------------------

import { Router } from 'src/routes/sections';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import { LocalizationProvider } from 'src/locales';
import { ThemeProvider } from 'src/theme/theme-provider';

import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/amplify';

import { Snackbar } from './components/snackbar';
import { CheckoutProvider } from './sections/checkout/context';
import { WorkspaceProvider } from './workspace/workspace-provider';

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <LocalizationProvider>
      <AuthProvider>
        <SettingsProvider settings={defaultSettings}>
          <WorkspaceProvider>
            <ThemeProvider>
              <MotionLazy>
                <CheckoutProvider>
                  <Snackbar />
                  <ProgressBar />
                  <SettingsDrawer />
                  <Router />
                </CheckoutProvider>
              </MotionLazy>
            </ThemeProvider>
          </WorkspaceProvider>
        </SettingsProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
}
