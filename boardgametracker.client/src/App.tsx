import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { AxiosError } from 'axios';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useToast } from './providers/BgtToastProvider';
import { SettingsRoutes } from './pages/Settings/SettingsRoutes';
import { SessionRoutes } from './pages/Sessions/SessionRoutes';
import { PlayerRoutes } from './pages/Players/PlayerRoutes';
import { LocationRoutes } from './pages/Locations/LocationRoutes';
import { GameRoutes } from './pages/Games/GameRoutes';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { FailResult } from './models';
import { useSettings } from './hooks/useSettings';
import BgtMenuBar from './components/BgtLayout/BgtMenuBar';
import { BgtHeader } from './components/BgtHeader/BgtHeader';

function AppContainer() {
  const { showErrorToast } = useToast();

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 60 * 60 * 1000, // 1 hour
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (_error, query) => {
        const error = query.state.error as AxiosError<FailResult>;
        const reason = error.response?.data.reason ?? 'common.unknown-error';
        showErrorToast(reason);
      },
    }),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

function App() {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(settings.data?.uiLanguage ?? 'en-US');
  }, [i18n, settings.data?.uiLanguage]);

  if (settings.isLoading || settings.isError) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen text-white">
      <BgtMenuBar />
      <div className="flex-1 bg-custom-gradient flex flex-col">
        <BgtHeader />
        <Routes>
          <Route element={<GameRoutes />} path="/games/*" />
          <Route element={<PlayerRoutes />} path="/players/*" />
          <Route element={<SessionRoutes />} path="/sessions/*" />
          <Route element={<SettingsRoutes />} path="/settings/*" />
          <Route element={<LocationRoutes />} path="/locations/*" />
          <Route element={<DashboardPage />} path="*" />
        </Routes>
      </div>
    </div>
  );
}

export default AppContainer;
